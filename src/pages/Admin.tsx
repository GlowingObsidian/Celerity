import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Loader, Pencil, Trash } from "lucide-react";
import { Doc, Id } from "convex/_generated/dataModel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label as ChartLabel, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSettingValue } from "@/lib/utils";

type OperationStatus = "IDLE" | "PROCESSING" | "SUCCESS" | "ERROR";

const Admin = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const events = useQuery(api.functions.getEvents);

  const screens = [
    { title: "Dashboard", component: <Dashboard /> },
    { title: "New Event", component: <NewEvent /> },
    { title: "All Events", component: <AllEvents events={events || []} /> },
  ];

  return (
    <div className="container mx-auto">
      <div className="flex justify-evenly p-5 gap-x-2 *:text-base *:text-center *:md:text-xl  *:p-1 *:rounded-none *:cursor-pointer">
        {screens.map((screen, index) => (
          <Button
            key={index}
            variant="ghost"
            className={`${currentScreen === index ? "border-b-2" : ""}`}
            onClick={() => setCurrentScreen(index)}
          >
            {screen.title}
          </Button>
        ))}
      </div>
      <div className="px-5">{screens[currentScreen].component}</div>
    </div>
  );
};

export default Admin;

interface ChartDataPoint {
  label: string;
  value: number;
  fill: string;
}

interface ChartConfigItem {
  label: string;
  color: string;
}

type ChartConfig = Record<string, ChartConfigItem>;

const Dashboard = () => {
  const updateSetting = useMutation(api.functions.updateSettings);
  const events = useQuery(api.functions.getEvents);
  const totalMoney = useQuery(api.functions.totalMoneyCollected);
  const settings = useQuery(api.functions.getSettings);
  const deleteRegistration = useMutation(api.functions.deleteRegistration);
  const registrations = useQuery(api.functions.getAllRegistrations);
  const [upi, setUpi] = useState<string>("");

  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#00A36C",
    "#C9CBCF",
    "#F67019",
    "#8E5EA2",
  ];

  const chartConfig: ChartConfig = {
    registrations: { label: "registrations", color: "" },
    ...Object.fromEntries(
      (events || []).map((event, index) => [
        event.name,
        { label: event.name, color: colors[index % colors.length] },
      ]),
    ),
  };

  const chartData: ChartDataPoint[] | undefined = events?.map(
    (event, index) => ({
      label: event.name,
      value: event.registrations.length,
      fill: colors[index % colors.length],
    }),
  );

  const handleUpdateUpi = async (): Promise<void> => {
    await updateSetting({ name: "upi", value: upi });
  };

  const handleDeleteRegistration = async (
    id: Id<"registration">,
  ): Promise<void> => {
    await deleteRegistration({ id });
  };

  return (
    <div className="space-y-6">
      <div className="border-2 rounded p-5 space-y-2">
        <p className="text-lg font-bold">Total money collected from events</p>
        <p className="text-3xl">₹{totalMoney}</p>
      </div>

      {registrations && registrations.length > 0 ? (
        <div className="border-2 rounded px-5">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px] p-1"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius={60}
                strokeWidth={5}
                labelLine={false}
                label={({ payload, ...props }) => (
                  <text
                    cx={props.cx}
                    cy={props.cy}
                    x={props.x}
                    y={props.y}
                    textAnchor={props.textAnchor}
                    dominantBaseline={props.dominantBaseline}
                    fill="var(--foreground)"
                  >
                    {payload.value}
                  </text>
                )}
              >
                <ChartLabel
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {registrations?.length.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Registrations
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      ) : (
        <div className="p-5 border-2 rounded">No data to create chart.</div>
      )}

      <EventsTable events={events} />

      {settings && (
        <div className="border-2 rounded px-5 space-y-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="settings">
              <AccordionTrigger>
                <p className="text-xl font-bold">Settings </p>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <div className="w-full space-y-2">
                    <Label>Default UPI Address</Label>
                    <Input
                      defaultValue={getSettingValue(settings, "upi")}
                      placeholder="Enter default address for UPI Payments"
                      className="border-2-foreground"
                      onChange={(e) => setUpi(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => void handleUpdateUpi()}>
                    Set UPI Address
                  </Button>
                </div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="danger">
                    <AccordionTrigger className="text-lg font-bold text-destructive">
                      DANGER ZONE
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader className="bg-secondary">
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                No Registrations.
                              </TableCell>
                            </TableRow>
                          )}
                          {registrations?.map((registration) => (
                            <TableRow key={registration._id}>
                              <TableCell>{registration.name}</TableCell>
                              <TableCell>{registration.email}</TableCell>
                              <TableCell>
                                {new Date(registration._creationTime)
                                  .toLocaleTimeString("en-IN")
                                  .toUpperCase()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() =>
                                    void handleDeleteRegistration(
                                      registration._id,
                                    )
                                  }
                                >
                                  <Trash />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
};

const EventsTable = ({ events }: { events: Doc<"event">[] | undefined }) => {
  if (!events || events.length === 0) {
    return <div className="border-2 rounded p-5">No events added.</div>;
  }

  return (
    <Table>
      <TableHeader className="bg-secondary">
        <TableRow>
          <TableHead className="hidden md:table-cell">SL.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Managed By</TableHead>
          <TableHead>Fee</TableHead>
          <TableHead className="hidden md:table-cell">Registrations</TableHead>
          <TableHead className="md:hidden">Regs.</TableHead>
          <TableHead>Link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event, index) => (
          <TableRow key={index}>
            <TableCell className="hidden md:table-cell">{index + 1}</TableCell>
            <TableCell>{event.name}</TableCell>
            <TableCell>{event.cc}</TableCell>
            <TableCell>₹{event.fee}</TableCell>
            <TableCell>{event.registrations.length}</TableCell>
            <TableCell>
              <a
                href={`/event/${event.link}`}
                target="_blank"
                className="text-primary"
              >
                Visit
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const eventSchema = z.object({
  name: z.string().nonempty("Name is required"),
  cc: z.string().nonempty("Core committee name(s) is/are required"),
  fee: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() === "") return undefined;
      return Number(val);
    },
    z
      .number({
        invalid_type_error: "Fee must be a number",
        required_error: "Fee is required",
      })
      .min(1, "Fee must be greater than 0"),
  ),
  room: z.string().nonempty("Room is required"),
});

type EventFormData = {
  name: string;
  cc: string;
  fee: string;
  room: string;
};

type ValidatedEventData = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: EventFormData;
  onSubmit: (data: ValidatedEventData) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  status: OperationStatus;
}

const EventForm = ({
  initialData = { name: "", cc: "", fee: "", room: "" },
  onSubmit,
  submitLabel,
  isSubmitting,
  status,
}: EventFormProps) => {
  const [formData, setFormData] = useState<EventFormData>(initialData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EventFormData, string>>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = eventSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof EventFormData, string>> = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path[0] as keyof EventFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
    } else {
      await onSubmit(parsed.data);
    }
  };

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Event Name"
          value={formData.name}
          onChange={handleChange}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cc">Core Committee</Label>
        <Input
          id="cc"
          name="cc"
          placeholder="Managing core committee name"
          value={formData.cc}
          onChange={handleChange}
        />
        {errors.cc && <p className="text-sm text-destructive">{errors.cc}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="fee">Fee</Label>
        <Input
          id="fee"
          name="fee"
          placeholder="Event registration fee"
          value={formData.fee}
          onChange={handleChange}
        />
        {errors.fee && <p className="text-sm text-destructive">{errors.fee}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="room">Room</Label>
        <Input
          id="room"
          name="room"
          placeholder="Event room"
          value={formData.room}
          onChange={handleChange}
        />
        {errors.room && (
          <p className="text-sm text-destructive">{errors.room}</p>
        )}
      </div>
      <div className="flex gap-x-6 items-center">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader className="animate-spin" /> : submitLabel}
        </Button>
        {status === "SUCCESS" && (
          <p className="text-primary">Operation completed successfully!</p>
        )}
        {status === "ERROR" && (
          <p className="text-destructive">There was an error.</p>
        )}
      </div>
    </form>
  );
};

const NewEvent = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<OperationStatus>("IDLE");
  const createEvent = useMutation(api.functions.createEvent);

  const handleSubmit = async (data: ValidatedEventData) => {
    const event = {
      ...data,
      registrations: [],
      link: `${data.name.toLowerCase().split(" ").join("-")}`,
    };
    setIsSubmitting(true);
    const newEvent = await createEvent(event);
    setStatus(newEvent ? "SUCCESS" : "ERROR");
    setIsSubmitting(false);
    setTimeout(() => setStatus("IDLE"), 2000);
  };

  return (
    <div className="border-2 rounded p-5 space-y-6">
      <EventForm
        onSubmit={handleSubmit}
        submitLabel="Create Event"
        isSubmitting={isSubmitting}
        status={status}
      />
    </div>
  );
};

const AllEvents = ({ events }: { events: Doc<"event">[] }) => {
  const deleteEvent = useMutation(api.functions.deleteEvent);
  const [selectedEvent, setSelectedEvent] = useState<Doc<"event"> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<OperationStatus>("IDLE");

  const handleUpdate = async (data: ValidatedEventData) => {
    if (!selectedEvent) return;
    setIsSubmitting(true);
    console.log(data);
    setStatus("SUCCESS");
    setTimeout(() => {
      setStatus("IDLE");
      setIsDialogOpen(false);
    }, 1500);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: Id<"event">) => await deleteEvent({ id });

  return (
    <>
      <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-1 border-2 rounded p-5 gap-6">
        {events && events.length > 0 ? (
          events.map((event) => (
            <div
              key={event._id}
              className="p-5 border-2 rounded-md space-y-2 w-full"
            >
              <div className="flex text-current justify-between">
                <p className="text-2xl font-black">{event.name}</p>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(event._id)}
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <p>Managing CC: {event.cc}</p>
              <p>Fee: ₹{event.fee}</p>
              <p>Room: {event.room}</p>
            </div>
          ))
        ) : (
          <p>No events added yet.</p>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventForm
              initialData={{
                name: selectedEvent.name,
                cc: selectedEvent.cc,
                fee: selectedEvent.fee.toString(),
                room: selectedEvent.room,
              }}
              onSubmit={handleUpdate}
              submitLabel="Update Event"
              isSubmitting={isSubmitting}
              status={status}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

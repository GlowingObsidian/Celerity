import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { CheckIcon, Loader2, PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { Doc } from "convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { z } from "zod";
import { createTableBody, getSettingValue } from "@/lib/utils";

const nameSchema = z.string().min(1, "Name is required");
const collegeNameSchema = z.string().min(1, "College name is required");
const otherCollegeNameSchema = z
  .string()
  .min(1, "Other college name is required");
const emailSchema = z.string().email("Enter a valid email address");
const phoneSchema = z
  .string()
  .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number");
const eventsSchema = z.array(z.number()).min(1, "Select at least one event");

function Registration() {
  const events = useQuery(api.functions.getEvents);
  const createRegistration = useMutation(api.functions.createRegistration);
  const settings = useQuery(api.functions.getSettings);
  const sendMail = useAction(api.actions.sendMail);

  const [name, setName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [otherCollegeName, setOtherCollegeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [selectedFlashEvents, setSelectedFlashEvents] = useState<number[]>([]);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("CASH");

  const [registrationStage, setRegistrationStage] = useState<
    "IDLE" | "PAYMENT" | "EMAIL" | "COMPLETE"
  >("IDLE");
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState<{
    name: string;
    value: number;
  } | null>(null);
  const [registration, setRegistration] = useState<Doc<"registration">>();
  const [isLoading, setIsLoading] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [collegeNameError, setCollegeNameError] = useState<string | null>(null);
  const [otherCollegeNameError, setOtherCollegeNameError] = useState<
    string | null
  >(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    try {
      nameSchema.parse(name);
      setNameError(null);
    } catch (error) {
      if (error instanceof z.ZodError) setNameError(error.errors[0].message);
    }
  }, [name]);

  useEffect(() => {
    try {
      collegeNameSchema.parse(collegeName);
      setCollegeNameError(null);
    } catch (error) {
      if (error instanceof z.ZodError)
        setCollegeNameError(error.errors[0].message);
    }
  }, [collegeName]);

  useEffect(() => {
    if (collegeName === "Other") {
      try {
        otherCollegeNameSchema.parse(otherCollegeName);
        setOtherCollegeNameError(null);
      } catch (error) {
        if (error instanceof z.ZodError)
          setOtherCollegeNameError(error.errors[0].message);
      }
    } else setOtherCollegeNameError(null);
  }, [otherCollegeName, collegeName]);

  useEffect(() => {
    try {
      emailSchema.parse(email);
      setEmailError(null);
    } catch (error) {
      if (error instanceof z.ZodError) setEmailError(error.errors[0].message);
    }
  }, [email]);

  useEffect(() => {
    try {
      phoneSchema.parse(phone);
      setPhoneError(null);
    } catch (error) {
      if (error instanceof z.ZodError) setPhoneError(error.errors[0].message);
    }
  }, [phone]);

  useEffect(() => {
    try {
      eventsSchema.parse([...selectedEvents, ...selectedFlashEvents]);
      setEventsError(null);
    } catch (error) {
      if (error instanceof z.ZodError) setEventsError(error.errors[0].message);
    }
    if (selectedFlashEvents.length >= 3) {
      switch (selectedFlashEvents.length) {
        case 3:
          setDiscount({ name: "COMBO3", value: 10 });
          break;
        case 4:
          setDiscount({ name: "COMBO4", value: 20 });
          break;
        case 5:
          setDiscount({ name: "COMBO5", value: 30 });
          break;
      }
    } else setDiscount(null);
  }, [selectedEvents, selectedFlashEvents]);

  useEffect(() => {
    const isValid =
      !nameError &&
      name.trim() !== "" &&
      !collegeNameError &&
      collegeName !== "" &&
      !(
        collegeName === "Other" &&
        (otherCollegeNameError || otherCollegeName.trim() === "")
      ) &&
      !emailError &&
      email !== "" &&
      !phoneError &&
      phone !== "" &&
      !eventsError &&
      (selectedEvents.length > 0 || selectedFlashEvents.length > 0);
    setIsFormValid(isValid);
  }, [
    nameError,
    name,
    collegeNameError,
    collegeName,
    otherCollegeNameError,
    otherCollegeName,
    emailError,
    email,
    phoneError,
    phone,
    eventsError,
    selectedEvents,
    selectedFlashEvents,
  ]);

  const handlePaymentComplete = async () => {
    if (!events || !isFormValid) return null;

    const finalEvents = [...selectedEvents, ...selectedFlashEvents].map(
      (index) => {
        const event = events[index];
        return event._id;
      },
    );

    setIsLoading(true);
    try {
      const result = await createRegistration({
        name,
        college: collegeName === "Other" ? otherCollegeName : collegeName,
        email,
        phone,
        events: finalEvents,
        amount: total - (discount?.value || 0),
        mode: paymentMode,
      });

      if (result) {
        setRegistration(result);
        setRegistrationStage("EMAIL");
      }
    } catch (error) {
      console.error("Error creating registration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!events) return null;
    const finalEvents = [...selectedEvents, ...selectedFlashEvents].map(
      (index) => {
        const event = events[index];
        return {
          name: event.name,
          fee: event.fee,
          room: event.room,
        };
      },
    );
    const eventsTableBody = createTableBody(finalEvents);
    const params = {
      first_name: name.split(" ")[0],
      name,
      date: new Date(registration?._creationTime || "")
        .toLocaleString("en-IN")
        .toUpperCase(),
      college: collegeName === "Other" ? otherCollegeName : collegeName,
      total: total - (discount?.value || 0),
      email,
      phone,
      events: eventsTableBody,
    };

    setIsLoading(true);
    try {
      const result = await sendMail({ ...params });
      if (result.status === 200) setRegistrationStage("COMPLETE");
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="border-2 rounded m-5 p-5 space-y-6">
        <p className="text-2xl text-center">Register Participant</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Participant name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>College Name</Label>
            <Select
              value={collegeName}
              onValueChange={(value) => setCollegeName(value)}
            >
              <SelectTrigger className="w-full border-2 border-foreground">
                <SelectValue placeholder="Choose college name" />
              </SelectTrigger>
              <SelectContent className="border-2 font-semibold">
                <SelectItem value="FIEM">FIEM</SelectItem>
                <SelectItem value="FIT">FIT</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {collegeNameError && (
              <p className="text-sm text-destructive">{collegeNameError}</p>
            )}
            {collegeName === "Other" && (
              <>
                <Input
                  value={otherCollegeName}
                  name="other"
                  placeholder="Enter college name if chosen other"
                  onChange={(e) => setOtherCollegeName(e.target.value)}
                />
                {otherCollegeNameError && (
                  <p className="text-sm text-destructive">
                    {otherCollegeNameError}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label>E-Mail</Label>
            <Input
              value={email}
              placeholder="Participant email"
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={phone}
              placeholder="Participant phone number"
              onChange={(e) => setPhone(e.target.value)}
            />
            {phoneError && (
              <p className="text-sm text-destructive">{phoneError}</p>
            )}
          </div>
        </form>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-2 gap-x-4 gap-y-4">
              {events?.map(
                (event, index) =>
                  event.type === "EVENT" && (
                    <div
                      key={index}
                      className={`${selectedEvents.includes(index) && "bg-primary text-white"} relative aspect-square p-2 text-xl md:aspect-video cursor-pointer rounded-md border-2 border-foreground flex flex-col justify-center items-center`}
                      onClick={() => {
                        if (selectedEvents.includes(index)) {
                          setSelectedEvents(
                            selectedEvents.filter((idx) => idx !== index),
                          );
                          setTotal(total - events[index].fee);
                        } else {
                          setSelectedEvents([...selectedEvents, index]);
                          setTotal(total + events[index].fee);
                        }
                      }}
                    >
                      {selectedEvents.includes(index) ? (
                        <CheckIcon className="absolute top-2 right-2 w-4 h-4" />
                      ) : (
                        <PlusIcon className="absolute top-2 right-2 w-4 h-4" />
                      )}
                      <p className="text-center">{event.name}</p>
                      <p>₹{event.fee}</p>
                    </div>
                  ),
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Flash Events</Label>
            <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-2 gap-x-4 gap-y-4">
              {events?.map(
                (event, index) =>
                  event.type === "FLASH" && (
                    <div
                      key={index}
                      className={`${selectedFlashEvents.includes(index) && "bg-primary text-white"} relative aspect-square p-2 text-xl md:aspect-video cursor-pointer rounded-md border-2 border-foreground flex flex-col justify-center items-center`}
                      onClick={() => {
                        if (selectedFlashEvents.includes(index)) {
                          setSelectedFlashEvents(
                            selectedFlashEvents.filter((idx) => idx !== index),
                          );
                          setTotal(total - events[index].fee);
                        } else {
                          setSelectedFlashEvents([
                            ...selectedFlashEvents,
                            index,
                          ]);
                          setTotal(total + events[index].fee);
                        }
                      }}
                    >
                      {selectedFlashEvents.includes(index) ? (
                        <CheckIcon className="absolute top-2 right-2 w-4 h-4" />
                      ) : (
                        <PlusIcon className="absolute top-2 right-2 w-4 h-4" />
                      )}
                      <p className="text-center">{event.name}</p>
                      <p>₹{event.fee}</p>
                    </div>
                  ),
              )}
            </div>
          </div>
          {eventsError && (
            <p className="text-sm text-destructive">{eventsError}</p>
          )}
        </div>
        {isFormValid && (
          <div className="space-y-2">
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="flex justify-between gap-x-2 *:w-1/2 *:text-lg *:cursor-pointer">
                <Button
                  variant={paymentMode === "CASH" ? "default" : "secondary"}
                  onClick={() => setPaymentMode("CASH")}
                >
                  Cash
                </Button>
                <Button
                  variant={paymentMode === "UPI" ? "default" : "secondary"}
                  onClick={() => setPaymentMode("UPI")}
                >
                  UPI
                </Button>
              </div>
            </div>
            <p className="text-center">Invoice</p>
            <div className="md:max-w-3/5 mx-auto border-2 rounded p-2 space-y-4">
              <div className="text-sm">
                <p className="text-lg">{name}</p>
                <p>{email}</p>
                <p>
                  {collegeName === "Other" ? otherCollegeName : collegeName}
                </p>
                <p>{phone}</p>
              </div>
              {events &&
                (selectedEvents.length !== 0 ||
                  selectedFlashEvents.length !== 0) && (
                  <>
                    <Table>
                      <TableHeader className="bg-secondary">
                        <TableRow>
                          <TableHead>SL.</TableHead>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Fee</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...selectedEvents, ...selectedFlashEvents]
                          .sort()
                          .map((eventIdx, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>{events[eventIdx].name}</TableCell>
                              <TableCell>₹{events[eventIdx].fee}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <div className="mt-2 pt-2 border-t-2 border-dashed">
                      <div className="flex justify-between">
                        <p>Sub Total</p>
                        <p className="font-bold">₹{total}</p>
                      </div>
                      <div className="flex justify-between">
                        <p>Discount {discount ? `(${discount.name})` : ""}</p>
                        <p className="font-bold">
                          {discount ? `-₹${discount.value}` : "₹0"}
                        </p>
                      </div>
                      <div className="mt-3 text-3xl flex justify-between">
                        <p>Total ({paymentMode})</p>
                        <p className="font-bold">
                          ₹{total - (discount?.value || 0)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
            </div>
            <div className="w-full flex justify-center">
              <Dialog
                open={
                  registrationStage == "PAYMENT" ||
                  registrationStage === "EMAIL" ||
                  registrationStage === "COMPLETE"
                }
              >
                {total > 0 && (
                  <DialogTrigger asChild>
                    <Button
                      className="text-lg cursor-pointer"
                      onClick={() => setRegistrationStage("PAYMENT")}
                    >
                      Proceed to Payment
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="border-2 lg:w-2/3">
                  <DialogHeader>
                    <DialogTitle className="text-center">
                      {registrationStage === "PAYMENT" &&
                        "Waiting for Confirmation"}
                      {registrationStage === "EMAIL" && ""}
                      {registrationStage === "COMPLETE" &&
                        "Registration Complete"}
                    </DialogTitle>
                    <DialogDescription />
                  </DialogHeader>
                  {registrationStage === "PAYMENT" && (
                    <>
                      <div className="flex flex-col gap-y-2 h-full justify-center items-center">
                        {paymentMode === "CASH" && (
                          <p className="border-2 rounded-md aspect-square max-w-2/3 text-4xl md:text-5xl font-extrabold flex items-center justify-center text-center p-2">
                            Please pay ₹{total - (discount?.value || 0)} in Cash
                          </p>
                        )}
                        {paymentMode === "UPI" && (
                          <>
                            <p className="text-lg font-extrabold">
                              Scan to pay ₹{total - (discount?.value || 0)} via
                              UPI
                            </p>
                            <QRCode
                              value={`upi://pay?pa=${getSettingValue(settings, "upi")}&am=${total - (discount?.value || 0)}&cu=INR&tn=Celluloid`}
                              className="bg-white p-1 mb-4"
                            />
                          </>
                        )}
                      </div>
                      <div className="flex gap-x-2 *:w-1/2 *:cursor-pointer">
                        <Button
                          disabled={isLoading}
                          variant="destructive"
                          className="w-1/2"
                          onClick={() => setRegistrationStage("IDLE")}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={isLoading}
                          onClick={() => void handlePaymentComplete()}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Mark As Complete"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  {registrationStage === "EMAIL" && (
                    <>
                      <div className="md:aspect-video flex flex-col justify-center items-center gap-y-4">
                        <CheckIcon className="w-16 h-16" />
                        <p className="text-4xl font-extrabold flex items-center justify-center text-center">
                          <span>Payment Completed</span>
                        </p>
                        <p className="text-center">
                          Send bill to participant at {email}
                        </p>
                      </div>
                      <div className="flex gap-x-2 *:w-1/2 *:cursor-pointer">
                        <Button
                          variant="secondary"
                          onClick={() => setRegistrationStage("COMPLETE")}
                          className="bg-yellow-500"
                        >
                          Skip
                        </Button>
                        <Button
                          disabled={isLoading}
                          onClick={() => void handleSendEmail()}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send bill"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  {registrationStage === "COMPLETE" && (
                    <>
                      <div className="md:aspect-video flex flex-col justify-center items-center gap-y-4">
                        <CheckIcon className="w-16 h-16" />
                        <p className="text-4xl font-extrabold flex items-center justify-center text-center">
                          <span>Bill Sent to Participant</span>
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setName("");
                          setCollegeName("");
                          setOtherCollegeName("");
                          setEmail("");
                          setPhone("");
                          setSelectedEvents([]);
                          setSelectedFlashEvents([]);
                          setTotal(0);
                          setDiscount(null);
                          setPaymentMode("CASH");
                          setRegistrationStage("IDLE");
                          // Clear all errors
                          setNameError(null);
                          setCollegeNameError(null);
                          setOtherCollegeNameError(null);
                          setEmailError(null);
                          setPhoneError(null);
                          setEventsError(null);
                          setIsFormValid(false);
                        }}
                        className="cursor-pointer"
                      >
                        Proceed to next registration
                      </Button>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Registration;

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { z } from "zod";
import { getSettingValue } from "@/lib/utils";
import { CheckIcon, Loader } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { get } from "http";

const nameSchema = z.string().min(1, "Name is required");
const serviceSchema = z
  .array(
    z.object({
      service: z
        .literal("tattoo")
        .or(z.literal("nail"))
        .or(z.literal("caricature")),
      count: z.number(),
    }),
  )
  .min(1, "Select at least one service");

const Service = () => {
  const settings = useQuery(api.functions.getSettings);
  const createServiceRecord = useMutation(api.functions.createServiceRecord);

  const [name, setName] = useState<string>("");
  const [tattoo, setTattoo] = useState<number>(0);
  const [nail, setNail] = useState<number>(0);
  const [caricature, setCaricature] = useState<number>(0);
  const [isCaricatureCouple, setIsCaricatureCouple] = useState(false);

  const [isFormValid, setIsFormValid] = useState(false);

  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("CASH");

  const [nameError, setNameError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [caricatureError, setCaricatureError] = useState<string | null>(null);

  const [paymentState, setPaymentState] = useState<"pending" | "completed">(
    "pending",
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      nameSchema.parse(name);
      setNameError(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setNameError(error.errors[0].message);
      }
    }
  }, [name]);

  useEffect(() => {
    try {
      const services = [
        tattoo > 0 && { service: "tattoo", count: tattoo },
        nail > 0 && { service: "nail", count: nail },
        caricature > 0 && { service: "caricature", count: caricature },
      ].filter(Boolean);
      serviceSchema.parse(services);
      setServicesError(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setServicesError(error.errors[0].message);
      }
    }
  }, [tattoo, nail, caricature]);

  useEffect(() => {
    const isValid = !nameError && !servicesError;
    setIsFormValid(isValid);
  }, [nameError, servicesError]);

  const getTotalPrice = () =>
    tattoo * 30 + nail * 30 + caricature * (isCaricatureCouple ? 100 : 80);

  const handlePayment = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const services = [
        tattoo > 0 && {
          service: "tattoo" as "tattoo" | "nail" | "caricature",
          count: tattoo,
          price: 30,
        },
        nail > 0 && {
          service: "nail" as "tattoo" | "nail" | "caricature",
          count: nail,
          price: 30,
        },
        caricature > 0 && {
          service: "caricature" as "tattoo" | "nail" | "caricature",
          count: caricature,
          price: isCaricatureCouple ? 100 : 80,
        },
      ].filter((record) => record !== false);

      await createServiceRecord({
        name,
        services,
        total: getTotalPrice(),
        mode: paymentMode,
      });

      setPaymentState("completed");
    } catch (error) {
      console.error("Error creating service record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="border-2 rounded m-5 p-5 space-y-6">
        <p className="text-2xl text-center">New Service Record</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tattoo</Label>
            <div className="flex items-center space-x-2">
              <Button
                disabled={tattoo === 0}
                onClick={() => setTattoo(tattoo - 1)}
              >
                -
              </Button>
              <p>{tattoo}</p>
              <Button onClick={() => setTattoo(tattoo + 1)}>+</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Caricature</Label>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button
                  disabled={caricature === 0}
                  onClick={() => setCaricature(caricature - 1)}
                >
                  -
                </Button>
                <p>{caricature}</p>
                <Button onClick={() => setCaricature(caricature + 1)}>+</Button>
              </div>
              <div className="flex items-center space-x-2">
                <Label>Couple</Label>
                <Switch
                  checked={isCaricatureCouple}
                  onCheckedChange={setIsCaricatureCouple}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nail Art</Label>
            <Select
              value={String(nail)}
              onValueChange={(value) => setNail(Number(value))}
            >
              <SelectTrigger className="w-full border-2 border-foreground">
                <SelectValue placeholder="Hand count" />
              </SelectTrigger>
              <SelectContent className="border-2 border-foreground font-semibold">
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="1">One Hand</SelectItem>
                <SelectItem value="2">Both Hands</SelectItem>
              </SelectContent>
            </Select>
            {servicesError && (
              <p className="text-sm text-destructive">{servicesError}</p>
            )}
          </div>
        </form>
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
              <p className="text-lg">Client: {name}</p>
              <Table>
                <TableHeader className="bg-secondary">
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tattoo > 0 && (
                    <TableRow>
                      <TableCell>Tattoo</TableCell>
                      <TableCell>{tattoo}</TableCell>
                      <TableCell>₹30</TableCell>
                      <TableCell>₹{tattoo * 30}</TableCell>
                    </TableRow>
                  )}
                  {caricature > 0 && (
                    <TableRow>
                      <TableCell>Caricature</TableCell>
                      <TableCell>{caricature}</TableCell>
                      <TableCell>₹{isCaricatureCouple ? 100 : 80}</TableCell>
                      <TableCell>
                        ₹{caricature * (isCaricatureCouple ? 100 : 80)}
                      </TableCell>
                    </TableRow>
                  )}
                  {nail > 0 && (
                    <TableRow>
                      <TableCell>Nail Art</TableCell>
                      <TableCell>{nail}</TableCell>
                      <TableCell>₹30</TableCell>
                      <TableCell>₹{nail * 30}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="pt-2 border-t-2 border-dashed">
                <div className="text-2xl flex justify-between">
                  <p>Total ({paymentMode})</p>
                  <p className="font-bold">₹{getTotalPrice()}</p>
                </div>
              </div>
            </div>
            <Dialog open={paymentDialogOpen}>
              <DialogTrigger
                className="w-full"
                onClick={() => setPaymentDialogOpen(true)}
              >
                <Button className="mx-auto text-lg cursor-pointer">
                  Proceed to Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 lg:w-2/3">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    {paymentState === "pending"
                      ? "Waiting for payment"
                      : "Payment Completed"}
                  </DialogTitle>
                  <DialogDescription />
                  {paymentState === "pending" ? (
                    <>
                      <div className="flex flex-col gap-y-2 h-full justify-center items-center">
                        {paymentMode === "CASH" ? (
                          <p className="border-2 rounded-md aspect-square max-w-2/3 text-4xl md:text-5xl font-extrabold flex items-center justify-center text-center p-2">
                            Please pay ₹{getTotalPrice()} in Cash
                          </p>
                        ) : (
                          <>
                            <p className="text-lg font-extrabold">
                              Scan to pay ₹{getTotalPrice()} via UPI
                            </p>
                            <QRCode
                              value={`upi://pay?pa=${getSettingValue(settings, "upi")}&am=${getTotalPrice()}&cu=INR&tn=Celluloid`}
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
                          onClick={() => setPaymentDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={isLoading}
                          onClick={() => void handlePayment()}
                        >
                          {isLoading ? (
                            <Loader className="animate-spin" />
                          ) : (
                            "Mark as Complete"
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:aspect-video flex flex-col justify-center items-center gap-y-4">
                        <CheckIcon className="w-16 h-16" />
                        <p className="text-4xl font-extrabold flex items-center justify-center text-center">
                          <span>Service Recorded</span>
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setName("");
                          setTattoo(0);
                          setNail(0);
                          setCaricature(0);
                          setNameError(null);
                          setServicesError(null);
                          setPaymentState("pending");
                          setPaymentDialogOpen(false);
                          setIsFormValid(false);
                        }}
                        className="cursor-pointer"
                      >
                        Proceed to next record
                      </Button>
                    </>
                  )}
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default Service;

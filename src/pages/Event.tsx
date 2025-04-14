import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Event = () => {
  const { name } = useParams();
  const event = useQuery(api.functions.getEventByLink, { link: name || "" });
  const registrations = useQuery(
    api.functions.getRegistrations,
    event ? { registrations: event.registrations } : "skip",
  );

  return (
    <div className="p-5 space-y-6">
      {event && (
        <>
          <p className="text-center text-3xl font-bold">
            {event.name} Registrations
          </p>
          <div className="border-2 rounded p-5 space-y-2">
            <p className="text-xl">
              Managing CC(s):{" "}
              <span className="font-bold">
                {event.cc.split(" ").join(", ")}
              </span>
            </p>
            <p className="text-lg">Event Fee: ₹{event.fee}</p>
            <p className="text-lg">
              Registration Count: {event.registrations.length}
            </p>
          </div>
          <div>
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow>
                  <TableHead className="hidden md:table-cell">SL</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations &&
                  registrations.map((registration, index) => (
                    <TableRow key={index}>
                      <TableCell className="hidden md:table-cell">
                        {index + 1}
                      </TableCell>
                      <TableCell>{registration.name}</TableCell>
                      <TableCell>{registration.email}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.college}</TableCell>
                      <TableCell>
                        {new Date(registration._creationTime)
                          .toLocaleTimeString()
                          .toUpperCase()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {registrations && registrations.length === 0 && (
              <p className="w-full text-center border border-t-0">
                No Registrations Yet
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Event;

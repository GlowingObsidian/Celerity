import { getSettingValue } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { ReactNode, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const Authenticate = ({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const settings = useQuery(api.functions.getSettings);
  const passwordRef = useRef<HTMLInputElement>(null);

  if (settings === undefined)
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  if (settings === null)
    return (
      <div className="h-full flex items-center justify-center">
        Settings not found
      </div>
    );

  const password = getSettingValue(settings, name);

  return (
    <>
      {authenticated ? (
        children
      ) : (
        <div className="h-full flex flex-col items-center justify-center">
          <div className="max-w-md border-2 rounded p-5 flex flex-col items-center space-y-4">
            <h1 className="text-2xl font-bold">Login</h1>
            <Input type="password" placeholder="Enter key" ref={passwordRef} />
            <Button
              className="w-full"
              onClick={() => {
                if (passwordRef.current?.value === password) {
                  setAuthenticated(true);
                } else {
                  alert("Incorrect password");
                }
              }}
            >
              Authenticate
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Authenticate;

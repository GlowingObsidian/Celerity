import { SunIcon, MoonIcon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

function Header() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex border-b-2 p-2 bg-violet-500 justify-between items-center">
      <div className="flex gap-x-2 items-center">
        <img src="/logo.png" className="w-16 h-16" />
        <p className="text-5xl font-light">Celerity</p>
      </div>
      <Button
        variant="ghost"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? <SunIcon /> : <MoonIcon />}
      </Button>
    </div>
  );
}

export default Header;

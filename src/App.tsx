import Admin from "./pages/Admin";
import Registration from "./pages/Registration";
import Event from "./pages/Event";
import { ThemeProvider } from "./components/theme-provider";
import Header from "./components/Header";
import { Button } from "./components/ui/button";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Service from "./pages/Service";
import Authenticate from "./components/Authenticate";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="h-dvh flex flex-col font-semibold">
        <Header />
        <div className="flex-1">
          <Router>
            <Routes>
              <Route
                path="/"
                element={
                  <div className="h-full flex items-center justify-center">
                    <div className="max-w-md border-2 rounded p-5 space-y-6 *:max-w-sm *:mx-auto *:block *:text-center">
                      <p className="text-3xl">Welcome to Celerity</p>
                      <Button asChild>
                        <a href="/admin"> Go To Admin</a>
                      </Button>
                      <Button asChild>
                        <a href="/registration"> Go To Registration</a>
                      </Button>
                      <Button asChild>
                        <a href="/service"> Go To Services</a>
                      </Button>
                    </div>
                  </div>
                }
              />
              <Route
                path="/admin"
                element={
                  <Authenticate name="adminKey">
                    <Admin />
                  </Authenticate>
                }
              />
              <Route
                path="/registration"
                element={
                  <Authenticate name="registrationKey">
                    <Registration />
                  </Authenticate>
                }
              />
              <Route path="/service" element={<Service />} />
              <Route path="/event/:name" element={<Event />} />
            </Routes>
          </Router>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

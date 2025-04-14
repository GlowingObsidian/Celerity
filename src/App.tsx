import Admin from "./pages/Admin";
import Registration from "./pages/Registration";
import Event from "./pages/Event";
import { ThemeProvider } from "./components/theme-provider";
import Header from "./components/Header";
import { Button } from "./components/ui/button";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="h-screen font-semibold">
        <Header />
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <div className="container mx-auto">
                  <div className="max-w-md border-2 rounded mx-auto my-5 p-5 space-y-6 *:max-w-sm *:mx-auto *:block *:text-center">
                    <p className="text-3xl">Welcome to Celerity</p>
                    <Button asChild>
                      <a href="/admin"> Go To Admin</a>
                    </Button>
                    <Button asChild>
                      <a href="/registration"> Go To Registration</a>
                    </Button>
                  </div>
                </div>
              }
            />
            <Route path="/admin" element={<Admin />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/event/:name" element={<Event />} />
          </Routes>
        </Router>
        <div className="text-background">Dummy</div>
      </div>
    </ThemeProvider>
  );
}

export default App;

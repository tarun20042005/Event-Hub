import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventDetails from "./pages/EventDetails";
import MyBookings from "./pages/attendee/MyBookings";
import Dashboard from "./pages/organizer/Dashboard";
import EventForm from "./pages/organizer/EventForm";
import EventBookings from "./pages/organizer/EventBookings";
import ScanQR from "./pages/organizer/ScanQR";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry automatically, especially for auth checks
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public / Attendee Routes */}
      <Route path="/" component={Home} />
      <Route path="/events" component={Home} />
      <Route path="/events/:id" component={EventDetails} />
      
      {/* Auth */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Attendee Only */}
      <Route path="/my-bookings" component={MyBookings} />

      {/* Organizer Only */}
      <Route path="/organizer/dashboard" component={Dashboard} />
      <Route path="/organizer/events/new" component={EventForm} />
      <Route path="/organizer/events/:id/edit" component={EventForm} />
      <Route path="/organizer/events/:id/bookings" component={EventBookings} />
      <Route path="/organizer/scan" component={ScanQR} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

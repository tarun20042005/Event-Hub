import { useGetEvent, useCreateBooking, useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation, Link } from "wouter";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Clock, Users, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function EventDetails() {
  const [match, params] = useRoute("/events/:id");
  const eventId = match ? parseInt(params.id, 10) : 0;
  const [_, setLocation] = useLocation();
  const [ticketCount, setTicketCount] = useState(1);

  const { data: user } = useGetCurrentUser({ query: { retry: false } });
  const { data: event, isLoading, isError } = useGetEvent(eventId, { query: { enabled: !!eventId } });

  const bookMutation = useCreateBooking({
    mutation: {
      onSuccess: () => {
        toast({ title: "Booking successful! Redirecting..." });
        setLocation("/my-bookings");
      },
      onError: (error) => {
        if (error.error === "Not authenticated") {
          toast({ title: "Please login to book tickets", variant: "destructive" });
          setLocation("/login");
        } else {
          toast({ title: "Booking failed", description: error.error, variant: "destructive" });
        }
      }
    }
  });

  if (isLoading) return (
    <Layout>
      <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
    </Layout>
  );

  if (isError || !event) return (
    <Layout>
      <div className="text-center py-32">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Event Not Found</h2>
        <Button variant="outline" className="mt-6" onClick={() => setLocation("/events")}>Back to Events</Button>
      </div>
    </Layout>
  );

  const handleBook = () => {
    if (!user) {
      toast({ title: "Please login as an attendee to book tickets" });
      setLocation("/login");
      return;
    }
    if (user.role === "organizer") {
      toast({ title: "Organizers cannot book tickets", variant: "destructive" });
      return;
    }
    bookMutation.mutate({ data: { eventId: event.id, ticketCount } });
  };

  return (
    <Layout>
      <Button variant="ghost-muted" onClick={() => window.history.back()} className="mb-6 -ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden relative shadow-lg">
            {/* abstract placeholder banner */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 glass" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=60')] opacity-50 mix-blend-overlay bg-cover bg-center" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary font-semibold rounded-full text-sm">
                Event
              </span>
              <span className="text-muted-foreground font-medium">By {event.organizerName}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground leading-tight mb-6">
              {event.title}
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card rounded-3xl p-6 md:p-8 sticky top-28">
            <h3 className="text-2xl font-bold mb-6">Event Details</h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{format(new Date(event.date), 'EEEE, MMMM do, yyyy')}</p>
                  <p className="text-muted-foreground">{event.time}</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Location</p>
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Price per ticket</p>
                  <p className="text-2xl font-bold text-primary">{event.price > 0 ? formatCurrency(event.price) : 'Free'}</p>
                </div>
              </div>
            </div>

            <hr className="border-border my-6" />

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Number of Tickets</label>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                  >-</Button>
                  <span className="w-12 text-center font-bold text-xl">{ticketCount}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setTicketCount(ticketCount + 1)}
                  >+</Button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-muted p-4 rounded-xl">
                <span className="font-medium text-muted-foreground">Total Total</span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(event.price * ticketCount)}
                </span>
              </div>

              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                onClick={handleBook}
                isLoading={bookMutation.isPending}
                disabled={user?.role === "organizer"}
              >
                Book {ticketCount} Ticket{ticketCount > 1 ? 's' : ''}
              </Button>
              {user?.role === "organizer" && (
                <p className="text-sm text-center text-destructive mt-2">Organizers cannot book tickets.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

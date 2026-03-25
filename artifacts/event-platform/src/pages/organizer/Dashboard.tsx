import { useListMyEvents, useDeleteEvent, useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Edit, Trash2, Users, PlusCircle, Loader2, Ticket, TrendingUp, LayoutGrid } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useGetCurrentUser({ query: { retry: false } });
  const { data: events, isLoading } = useListMyEvents();

  const deleteMutation = useDeleteEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/events/my"] });
        toast({ title: "Event deleted successfully" });
      }
    }
  });

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "organizer")) {
      setLocation("/");
    }
  }, [user, userLoading, setLocation]);

  if (!userLoading && (!user || user.role !== "organizer")) {
    return null;
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      deleteMutation.mutate({ eventId: id });
    }
  };

  const totalEvents = events?.length ?? 0;
  const upcomingEvents = events?.filter(e => new Date(e.date) >= new Date()).length ?? 0;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-primary mb-1">Organizer Dashboard</p>
          <h1 className="text-3xl font-display font-bold">
            {user ? `Welcome, ${user.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your events.</p>
        </div>
        <Link href="/organizer/events/new">
          <Button size="lg" className="shadow-lg shadow-primary/20">
            <PlusCircle className="w-5 h-5 mr-2" /> Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          {
            label: "Total Events",
            value: isLoading ? "—" : totalEvents,
            icon: LayoutGrid,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Upcoming Events",
            value: isLoading ? "—" : upcomingEvents,
            icon: TrendingUp,
            color: "bg-green-500/10 text-green-600",
          },
          {
            label: "Past Events",
            value: isLoading ? "—" : totalEvents - upcomingEvents,
            icon: Calendar,
            color: "bg-amber-500/10 text-amber-600",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Your Events</h2>
        {totalEvents > 0 && (
          <span className="text-sm text-muted-foreground">{totalEvents} event{totalEvents !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-dashed">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Ticket className="w-10 h-10 text-primary opacity-60" />
          </div>
          <h3 className="text-xl font-bold">No events created yet</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
            Host your first event and start selling tickets to attendees.
          </p>
          <Link href="/organizer/events/new">
            <Button>Create Your First Event</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {events?.map((event, i) => {
            const isPast = new Date(event.date) < new Date();
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex flex-col sm:flex-row"
              >
                {/* Image or Color Strip */}
                {event.imageUrl ? (
                  <div className="sm:w-36 h-40 sm:h-auto shrink-0 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`sm:w-2 h-1 sm:h-auto shrink-0 ${isPast ? 'bg-muted' : 'bg-gradient-to-b from-primary to-accent'}`} />
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isPast
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {isPast ? 'Past' : 'Upcoming'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold leading-snug line-clamp-2">{event.title}</h3>
                    </div>
                    <p className="font-bold text-primary shrink-0 mt-1">
                      {event.price > 0 ? formatCurrency(event.price) : 'Free'}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{format(new Date(event.date), 'MMM do, yyyy')} · {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50">
                    <Link href={`/organizer/events/${event.id}/bookings`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        <Users className="w-3.5 h-3.5 mr-1.5" /> Bookings
                      </Button>
                    </Link>
                    <Link href={`/organizer/events/${event.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      isLoading={deleteMutation.isPending && deleteMutation.variables?.eventId === event.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

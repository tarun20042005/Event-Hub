import { useListMyEvents, useDeleteEvent, useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Edit, Trash2, Users, PlusCircle, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

  if (!userLoading && (!user || user.role !== "organizer")) {
    setLocation("/");
    return null;
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      deleteMutation.mutate({ eventId: id });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold">Organizer Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your events and track bookings.</p>
        </div>
        <Link href="/organizer/events/new">
          <Button size="lg"><PlusCircle className="w-5 h-5 mr-2" /> Create Event</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : events?.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-dashed">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No events created yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">Host your first event and start selling tickets.</p>
          <Link href="/organizer/events/new">
            <Button>Create Your First Event</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events?.map((event) => (
            <div key={event.id} className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row gap-6 hover:border-primary/30 transition-colors">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">{event.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {format(new Date(event.date), 'MMM do, yyyy')} at {event.time}</div>
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> <span className="truncate">{event.location}</span></div>
                  <div className="flex items-center font-medium text-foreground"><TicketIcon className="w-4 h-4 mr-2 text-primary" /> {event.price > 0 ? formatCurrency(event.price) : 'Free'}</div>
                </div>
                <Link href={`/organizer/events/${event.id}/bookings`}>
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                    <Users className="w-4 h-4 mr-2" /> View Bookings
                  </Button>
                </Link>
              </div>
              <div className="flex sm:flex-col justify-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                <Link href={`/organizer/events/${event.id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full"><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                </Link>
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleDelete(event.id)}
                  isLoading={deleteMutation.isPending && deleteMutation.variables?.eventId === event.id}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function TicketIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <path d="M13 5v2"/>
      <path d="M13 17v2"/>
      <path d="M13 11v2"/>
    </svg>
  );
}

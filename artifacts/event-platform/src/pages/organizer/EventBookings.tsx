import { useGetEventBookings, useGetEvent } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useRoute, Link } from "wouter";
import { ArrowLeft, CheckCircle2, AlertCircle, Ticket, Mail, User } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function EventBookings() {
  const [match, params] = useRoute("/organizer/events/:id/bookings");
  const eventId = match ? parseInt(params.id, 10) : 0;

  const { data: event } = useGetEvent(eventId, { query: { enabled: !!eventId } });
  const { data: bookings, isLoading } = useGetEventBookings(eventId, { query: { enabled: !!eventId } });

  const totalTicketsSold = bookings?.reduce((acc, b) => acc + b.ticketCount, 0) || 0;
  const totalRevenue = bookings?.filter(b => b.paymentStatus === 'Paid').reduce((acc, b) => acc + b.totalPrice, 0) || 0;

  return (
    <Layout>
      <Link href="/organizer/dashboard">
        <Button variant="ghost-muted" className="mb-6 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Event Bookings</h1>
        <p className="text-muted-foreground">{event?.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="glass-card rounded-2xl p-6 flex items-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mr-5">
            <Ticket className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Tickets Sold</p>
            <p className="text-3xl font-bold">{totalTicketsSold}</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 flex items-center">
          <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mr-5">
            <span className="text-2xl font-bold text-green-600">₹</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Revenue (Paid)</p>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Booking ID</th>
                <th className="px-6 py-4 font-semibold">Attendee</th>
                <th className="px-6 py-4 font-semibold">Tickets</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading bookings...</td></tr>
              ) : bookings?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No bookings found for this event.</td></tr>
              ) : (
                bookings?.map((booking) => (
                  <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0">
                    <td className="px-6 py-4 font-mono">#{booking.id.toString().padStart(6, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center"><User className="w-3 h-3 mr-1"/>{booking.userName}</span>
                        <span className="text-muted-foreground text-xs flex items-center mt-1"><Mail className="w-3 h-3 mr-1"/>{booking.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{booking.ticketCount}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(booking.totalPrice)}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        booking.paymentStatus === 'Paid' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {booking.paymentStatus === 'Paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {booking.paymentStatus}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

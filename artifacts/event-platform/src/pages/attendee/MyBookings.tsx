import { useListMyBookings, useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Ticket, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function MyBookings() {
  const [_, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetCurrentUser({ query: { retry: false } });
  const { data: bookings, isLoading } = useListMyBookings();

  if (!userLoading && (!user || user.role !== "attendee")) {
    setLocation("/");
    return null;
  }

  return (
    <Layout>
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold">My Tickets</h1>
        <p className="text-muted-foreground mt-2">View and manage your event bookings.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No bookings yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">You haven't booked any events yet.</p>
          <Button onClick={() => setLocation("/events")}>Browse Events</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bookings?.map((booking, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={booking.id}
              className="glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row relative group"
            >
              {/* Event Info Side */}
              <div className="p-6 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-border/50 border-dashed">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-4 ${
                  booking.paymentStatus === 'Paid' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {booking.paymentStatus === 'Paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {booking.paymentStatus}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 line-clamp-2">{booking.event.title}</h3>
                
                <div className="space-y-3 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-3 text-primary shrink-0" />
                    <span>{format(new Date(booking.event.date), 'MMM do, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-3 text-primary shrink-0" />
                    <span>{booking.event.time}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-3 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{booking.event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-3 text-primary shrink-0" />
                    <span>{booking.ticketCount} Ticket{booking.ticketCount > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Paid/Due</p>
                    <p className="font-bold text-lg text-primary">{formatCurrency(booking.totalPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Ticket QR Side */}
              <div className="p-6 md:p-8 w-full md:w-64 flex flex-col items-center justify-center bg-primary/5">
                <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                  {booking.qrCodeData ? (
                    <img src={booking.qrCodeData} alt="Ticket QR Code" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-muted flex items-center justify-center text-xs text-muted-foreground">No QR</div>
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground mb-4">ID: #{booking.id.toString().padStart(6, '0')}</p>
                
                {booking.paymentStatus === 'Pending' && (
                  <div className="mt-auto bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-center text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                      Please pay {formatCurrency(booking.totalPrice)} at the event venue counter using this QR code and collect your physical ticket.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Cutouts for ticket effect */}
              <div className="hidden md:block absolute top-0 bottom-0 left-[calc(100%-16rem)] -translate-x-1/2 w-8">
                <div className="absolute top-[-1rem] left-0 w-8 h-8 bg-background rounded-full shadow-inner" />
                <div className="absolute bottom-[-1rem] left-0 w-8 h-8 bg-background rounded-full shadow-inner" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}

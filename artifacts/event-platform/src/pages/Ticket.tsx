import { useRoute, useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Clock, MapPin, User, Mail, Ticket, Download, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface BookingData {
  id: number;
  ticketCount: number;
  totalPrice: number;
  paymentStatus: string;
  userName: string;
  userEmail: string;
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
    price: number;
    organizerName: string;
  };
}

export default function TicketPage() {
  const [match, params] = useRoute("/ticket/:id");
  const [_, setLocation] = useLocation();
  const bookingId = match ? parseInt(params.id, 10) : 0;
  
  const { data: user, isLoading: userLoading } = useGetCurrentUser({ query: { retry: false } });
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) {
          setError("Ticket not found");
          return;
        }
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        setError("Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !booking) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ticket Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "Unable to load this ticket"}</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mb-6">
        <button 
          onClick={() => setLocation("/my-bookings")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Tickets
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Print Button */}
        <div className="flex justify-end mb-6 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Print Ticket
          </Button>
        </div>

        {/* Ticket Card - Clean & Simple */}
        <div className="bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border-4 border-green-500/40 print:shadow-none">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-12 md:p-16 text-white text-center">
            <div className="mb-4">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Registration Confirmed</h1>
            <p className="text-white/90 text-lg">You're all set for the event!</p>
          </div>

          {/* Content */}
          <div className="p-10 md:p-14">
            {/* Booking Reference */}
            <div className="text-center mb-12 pb-8 border-b-2 border-border">
              <p className="text-muted-foreground text-sm mb-2">Your Booking Reference</p>
              <p className="text-5xl font-bold font-mono text-primary">#{booking.id.toString().padStart(6, '0')}</p>
            </div>

            {/* Event Title */}
            <h2 className="text-3xl font-bold mb-8 text-center">{booking.event.title}</h2>

            {/* Essential Event Info */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <Calendar className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-bold text-lg">{format(new Date(booking.event.date), 'EEEE, MMMM do, yyyy')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <Clock className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-bold text-lg">{booking.event.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <MapPin className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-bold text-lg">{booking.event.location}</p>
                </div>
              </div>
            </div>

            {/* Attendee Name */}
            <div className="mb-12 text-center p-6 bg-primary/5 rounded-2xl border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Registered Attendee</p>
              <p className="text-3xl font-bold">{booking.userName}</p>
              <p className="text-sm text-muted-foreground mt-2">{booking.userEmail}</p>
            </div>

            {/* Ticket Count */}
            <div className="text-center mb-12">
              <p className="text-muted-foreground text-sm mb-2">Tickets Registered</p>
              <p className="text-5xl font-bold text-primary">{booking.ticketCount}</p>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-2xl p-8 text-center">
              <h3 className="font-bold text-xl mb-3">Show This at Event Entry</h3>
              <p className="text-muted-foreground mb-4">
                When you arrive at the event, show this ticket to venue staff to receive your physical ticket.
              </p>
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl inline-block">
                <p className="text-sm font-mono text-primary">Scan QR code or show this page</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
              <p>Save or print this confirmation for event entry</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </Layout>
  );
}

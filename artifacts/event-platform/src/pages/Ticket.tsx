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

        {/* Ticket Card */}
        <div className="bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-border print:shadow-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-8 md:p-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-white/80 text-sm font-medium">Booking ID</p>
                <p className="text-white text-2xl font-bold font-mono">#{booking.id.toString().padStart(6, '0')}</p>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                booking.paymentStatus === 'Paid'
                  ? 'bg-green-500/20 text-green-100'
                  : 'bg-amber-500/20 text-amber-100'
              }`}>
                {booking.paymentStatus === 'Paid' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {booking.paymentStatus}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {booking.event.title}
            </h1>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            {/* Event Details Section */}
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Event Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {format(new Date(booking.event.date), 'EEEE, MMMM do, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {booking.event.time}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Venue</p>
                  <p className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {booking.event.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendee Details Section */}
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Attendee Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-semibold">{booking.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {booking.userEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tickets</p>
                  <p className="font-semibold text-lg">{booking.ticketCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Organizer</p>
                  <p className="font-semibold">{booking.event.organizerName}</p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-muted/50 rounded-2xl p-6 mb-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-muted-foreground">Price per ticket:</span>
                <span className="font-semibold">{formatCurrency(booking.event.price)}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-semibold">{booking.ticketCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(booking.totalPrice)}</span>
              </div>
            </div>

            {/* Important Note */}
            {booking.paymentStatus === 'Pending' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-10">
                <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">Payment Instructions</h3>
                <p className="text-amber-900 dark:text-amber-300 text-sm">
                  Please bring this ticket to the event and pay <strong>{formatCurrency(booking.totalPrice)}</strong> at the venue counter. 
                  Present this ticket (scan the QR code or show this page) to collect your physical ticket.
                </p>
              </div>
            )}

            {booking.paymentStatus === 'Paid' && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 mb-10">
                <h3 className="font-bold text-green-900 dark:text-green-200 mb-2">Payment Confirmed</h3>
                <p className="text-green-900 dark:text-green-300 text-sm">
                  Your payment has been received. Please bring this ticket to the event to collect your physical ticket at the counter.
                </p>
              </div>
            )}

            {/* Footer Note */}
            <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border">
              <p>Please keep this ticket safe and bring it to the event.</p>
              <p className="mt-1">Booking ID: #{booking.id.toString().padStart(6, '0')}</p>
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

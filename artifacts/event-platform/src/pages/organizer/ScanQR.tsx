import { useScanBooking, useGetBooking } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ScanLine, CheckCircle, AlertCircle, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ScanQR() {
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);

  const { data: booking, isLoading, isError, error } = useGetBooking(activeBookingId!, { 
    query: { enabled: !!activeBookingId, retry: false } 
  });

  const scanMutation = useScanBooking({
    mutation: {
      onSuccess: () => {
        toast({ title: "Payment marked as Paid!" });
        // Force re-fetch by triggering a re-render or just relying on mutation cache invalidation if setup
        setActiveBookingId(null);
        setTimeout(() => setActiveBookingId(Number(bookingIdInput)), 100);
      },
      onError: (err) => {
        toast({ title: "Failed to update", description: err.error, variant: "destructive" });
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(bookingIdInput, 10);
    if (isNaN(id)) {
      toast({ title: "Invalid Booking ID", variant: "destructive" });
      return;
    }
    setActiveBookingId(id);
  };

  const handleMarkPaid = () => {
    if (activeBookingId) {
      scanMutation.mutate({ bookingId: activeBookingId });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ScanLine className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">QR Scanner Simulation</h1>
          <p className="text-muted-foreground">Enter a Booking ID manually to simulate scanning a ticket QR code at the venue.</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-xl mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                value={bookingIdInput}
                onChange={(e) => setBookingIdInput(e.target.value)}
                placeholder="Enter Booking ID (e.g. 1)" 
                className="pl-12 h-14 text-lg"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8" isLoading={isLoading}>
              Look Up
            </Button>
          </form>
        </div>

        {isError && (
          <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-6 text-center text-destructive">
            <AlertCircle className="w-10 h-10 mx-auto mb-2" />
            <p className="font-bold text-lg">Booking not found</p>
            <p className="text-sm opacity-80">{(error as any)?.error || "Please check the ID and try again."}</p>
          </div>
        )}

        {booking && (
          <div className="glass-card border-2 border-primary/20 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-border/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-bold text-primary mb-1 uppercase tracking-wider">Booking #{booking.id}</p>
                  <h3 className="text-2xl font-bold">{booking.event.title}</h3>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center ${
                  booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {booking.paymentStatus === 'Paid' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  {booking.paymentStatus}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-muted/50 p-6 rounded-2xl">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Attendee Name</p>
                  <p className="font-semibold text-lg">{booking.userName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Due</p>
                  <p className="font-semibold text-lg">{formatCurrency(booking.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tickets</p>
                  <p className="font-semibold text-lg">{booking.ticketCount}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-primary/5 flex justify-end">
              {booking.paymentStatus === 'Pending' ? (
                <Button 
                  size="lg" 
                  className="w-full md:w-auto h-14 px-10 text-lg" 
                  onClick={handleMarkPaid}
                  isLoading={scanMutation.isPending}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Collect {formatCurrency(booking.totalPrice)} & Mark Paid
                </Button>
              ) : (
                <div className="w-full text-center p-3 text-green-600 font-bold flex justify-center items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Ticket is fully paid and valid.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

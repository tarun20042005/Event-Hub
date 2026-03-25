import { useListEvents, useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Search, Ticket, Users, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [_, setLocation] = useLocation();
  
  const { data: user, isLoading: userLoading } = useGetCurrentUser({ query: { retry: false } });
  
  const { data: events, isLoading } = useListEvents(
    { search: search || undefined, date: date || undefined },
    { query: { keepPreviousData: true } }
  );

  useEffect(() => {
    if (!userLoading && user?.role === "organizer") {
      setLocation("/organizer/dashboard");
    }
  }, [user, userLoading, setLocation]);

  if (!userLoading && user?.role === "organizer") {
    return null;
  }

  return (
    <Layout>
      {!user && (
        <div className="relative rounded-3xl overflow-hidden mb-16 shadow-2xl">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-abstract.png`} 
            alt="Hero background" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-transparent" />
          <div className="relative z-10 p-10 md:p-16 lg:p-20 max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white leading-tight mb-6">
              Discover & Experience <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Amazing Events</span>
            </h1>
            <p className="text-lg text-zinc-300 mb-8 max-w-xl leading-relaxed">
              Join thousands of people discovering local events, workshops, and concerts. Book your tickets instantly and get your digital QR pass.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Start Exploring
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/20 hover:bg-white/10 hover:border-white/40">
                  Organizer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upcoming Events</h2>
          <p className="text-muted-foreground mt-2">Find and book your next unforgettable experience.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search events..." 
              className="pl-10 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Input 
              type="date" 
              className="h-12"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card rounded-2xl h-80 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No events found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search filters.</p>
          {(search || date) && (
            <Button variant="outline" className="mt-6" onClick={() => { setSearch(""); setDate(""); }}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events?.map((event, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={event.id}
            >
              <Link href={`/events/${event.id}`}>
                <div className="group h-full glass-card hover:bg-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 border border-border/50 hover:border-primary/20 flex flex-col">
                  {/* Decorative placeholder image area */}
                  {event.imageUrl ? (
                    <div className="h-48 relative overflow-hidden flex-shrink-0">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover rounded-t-xl" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-primary shadow-sm">
                        {event.price > 0 ? formatCurrency(event.price) : 'Free'}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden flex-shrink-0">
                      {/* Abstract placeholder elements */}
                      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                        <Ticket className="w-24 h-24 transform -rotate-12" />
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-primary shadow-sm">
                        {event.price > 0 ? formatCurrency(event.price) : 'Free'}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2.5 mt-auto text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2.5 text-primary" />
                        <span>{format(new Date(event.date), 'EEEE, MMMM do, yyyy')} • {event.time}</span>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-2.5 text-primary mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2.5 text-primary" />
                        <span>By {event.organizerName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}

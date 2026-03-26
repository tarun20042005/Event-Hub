import { useListEvents, useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Search, Ticket, Users, ArrowRight, Clock } from "lucide-react";
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

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">Explore & Book</p>
          <h2 className="text-4xl font-bold tracking-tight">Upcoming Events</h2>
          <p className="text-muted-foreground mt-3 text-base">Discover amazing events happening near you. Book your tickets and get instant QR codes.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <div className="relative flex-1 sm:flex-none sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by event name, location..." 
              className="pl-12 h-12 text-sm rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input 
              type="date" 
              className="pl-12 h-12 text-sm rounded-xl"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {(search || date) && (
            <button
              onClick={() => { setSearch(""); setDate(""); }}
              className="h-12 px-4 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card rounded-2xl h-80 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-24 rounded-3xl border-2 border-dashed border-border">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-primary opacity-60" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No Events Found</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {search || date ? 'No events match your filters. Try adjusting your search.' : 'Check back soon for upcoming events!'}
          </p>
          {(search || date) && (
            <Button onClick={() => { setSearch(""); setDate(""); }}>
              Clear Filters & Show All
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              key={event.id}
            >
              <Link href={`/events/${event.id}`}>
                <div className="group h-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/15 hover:-translate-y-2 border border-border/50 hover:border-primary/30 flex flex-col bg-background">
                  {/* Image Section */}
                  <div className="relative overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/5 to-accent/5">
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title} 
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-56 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Ticket className="w-20 h-20 text-primary/30" />
                      </div>
                    )}
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-primary shadow-lg">
                      {event.price > 0 ? formatCurrency(event.price) : 'Free'}
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-3 text-sm text-muted-foreground mb-5">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm">{format(new Date(event.date), 'MMM do, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm">{event.time}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm">{event.organizerName}</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button className="mt-auto w-full py-3 px-4 bg-primary/8 hover:bg-primary/15 text-primary font-semibold rounded-xl transition-colors">
                      View Event
                    </button>
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

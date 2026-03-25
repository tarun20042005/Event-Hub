import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetCurrentUser, useLogoutUser } from "@workspace/api-client-react";
import { Ticket, LogOut, PlusCircle, ScanLine, Calendar, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetCurrentUser({ query: { retry: false } });

  const logout = useLogoutUser({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/";
      },
      onError: () => toast({ title: "Failed to logout", variant: "destructive" })
    }
  });

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: any }) => {
    const isActive = location === href || location.startsWith(`${href}/`);
    return (
      <Link href={href} className="group relative">
        <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-colors ${
          isActive ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}>
          <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
          <span>{children}</span>
        </div>
        {isActive && (
          <motion.div 
            layoutId="nav-pill" 
            className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-t-full" 
          />
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Ticket className="w-6 h-6 text-white transform -rotate-12" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              EventFlow
            </span>
          </Link>

          {!isLoading && user && (
            <nav className="hidden md:flex items-center space-x-1">
              {user.role === "attendee" ? (
                <>
                  <NavLink href="/events" icon={Calendar}>Explore Events</NavLink>
                  <NavLink href="/my-bookings" icon={Ticket}>My Tickets</NavLink>
                </>
              ) : (
                <>
                  <NavLink href="/organizer/dashboard" icon={Calendar}>Dashboard</NavLink>
                  <NavLink href="/organizer/events/new" icon={PlusCircle}>Create Event</NavLink>
                  <NavLink href="/organizer/scan" icon={ScanLine}>Scan QR</NavLink>
                </>
              )}
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {!isLoading && (
              user ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost-muted" 
                    size="icon" 
                    onClick={() => logout.mutate()}
                    title="Logout"
                    className="hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

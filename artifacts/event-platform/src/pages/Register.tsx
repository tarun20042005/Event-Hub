import { useRegisterUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ticket, Mail, Lock, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["attendee", "organizer"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "attendee" }
  });

  const role = watch("role");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({ title: "Account created successfully!" });
        setLocation(data.user.role === "organizer" ? "/organizer/dashboard" : "/events");
      },
      onError: (error) => {
        toast({ 
          title: "Registration failed", 
          description: error.error || "An error occurred", 
          variant: "destructive" 
        });
      }
    }
  });

  return (
    <Layout>
      <div className="max-w-md mx-auto w-full pt-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-10 rounded-3xl"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-center mb-2">Create Account</h1>
          <p className="text-center text-muted-foreground mb-8">Join the platform to discover or host events</p>

          <div className="flex p-1 bg-muted rounded-xl mb-8">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === "attendee" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setValue("role", "attendee")}
            >
              I want to attend
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === "organizer" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setValue("role", "organizer")}
            >
              I want to host
            </button>
          </div>

          <form onSubmit={handleSubmit((data) => registerMutation.mutate({ data }))} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  {...register("name")} 
                  placeholder="John Doe" 
                  className="pl-11"
                  error={errors.name?.message} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  {...register("email")} 
                  type="email" 
                  placeholder="you@example.com" 
                  className="pl-11"
                  error={errors.email?.message} 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  {...register("password")} 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-11"
                  error={errors.password?.message} 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-1">Must be at least 6 characters long.</p>
            </div>

            <Button type="submit" className="w-full mt-4" size="lg" isLoading={registerMutation.isPending}>
              Create Account
            </Button>
          </form>

          <p className="text-center mt-8 text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}

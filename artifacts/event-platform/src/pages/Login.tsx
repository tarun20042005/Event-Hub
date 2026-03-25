import { useLoginUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ticket, Mail, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["attendee", "organizer"]),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: "attendee" }
  });

  const role = watch("role");

  const login = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({ title: `Welcome back, ${data.user.name}!` });
        setLocation(data.user.role === "organizer" ? "/organizer/dashboard" : "/events");
      },
      onError: (error) => {
        toast({ 
          title: "Login failed", 
          description: error.error || "Invalid credentials", 
          variant: "destructive" 
        });
      }
    }
  });

  return (
    <Layout>
      <div className="max-w-md mx-auto w-full pt-10 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 md:p-10 rounded-3xl"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-center text-muted-foreground mb-8">Sign in to your account to continue</p>

          <div className="flex p-1 bg-muted rounded-xl mb-8">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === "attendee" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setValue("role", "attendee")}
            >
              Attendee
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === "organizer" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setValue("role", "organizer")}
            >
              Organizer
            </button>
          </div>

          <form onSubmit={handleSubmit((data) => login.mutate({ data }))} className="space-y-5">
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
            </div>

            <Button type="submit" className="w-full mt-4" size="lg" isLoading={login.isPending}>
              Sign In as {role === 'attendee' ? 'Attendee' : 'Organizer'}
            </Button>
          </form>

          <p className="text-center mt-8 text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}

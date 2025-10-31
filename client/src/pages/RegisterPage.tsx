import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/GlassCard";
import { Logo } from "@/components/Logo";
import { Link } from "wouter";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(username, password, inviteCode);
    } catch (error: any) {
      const errorMessage = error.message || "Registration failed. Please try again.";
      
      if (errorMessage.includes("invite")) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo className="justify-center mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join with your exclusive invite code</p>
        </div>

        <GlassCard glowColor="accent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reg-username" className="text-foreground">Username</Label>
              <Input
                id="reg-username"
                data-testid="input-register-username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input/50 border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-foreground">Password</Label>
              <Input
                id="reg-password"
                data-testid="input-register-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input/50 border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-code" className="text-foreground">Invite Code</Label>
              <motion.div
                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Input
                  id="invite-code"
                  data-testid="input-invite-code"
                  type="text"
                  placeholder="Enter your invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className={`bg-input/50 border-border focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono ${
                    shake ? "border-destructive" : ""
                  }`}
                  required
                />
              </motion.div>
            </div>

            <Button 
              type="submit" 
              data-testid="button-register"
              variant="secondary"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <UserPlus className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link 
                href="/login" 
                data-testid="link-login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  glowColor?: "primary" | "accent";
}

export function GlassCard({ 
  children, 
  title, 
  description, 
  footer, 
  className,
  glowColor = "primary" 
}: GlassCardProps) {
  const glowClass = glowColor === "accent" 
    ? "shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
    : "shadow-[0_0_15px_rgba(102,252,241,0.15)]";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "backdrop-blur-sm bg-card/80 border-card-border hover-elevate",
        glowClass,
        className
      )}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle className="text-card-foreground">{title}</CardTitle>}
            {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
          </CardHeader>
        )}
        {children && <CardContent>{children}</CardContent>}
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    </motion.div>
  );
}

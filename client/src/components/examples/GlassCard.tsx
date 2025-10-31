import { GlassCard } from '../GlassCard';

export default function GlassCardExample() {
  return (
    <div className="p-8 space-y-6">
      <GlassCard 
        title="Primary Glow Card" 
        description="This is a glass card with primary color glow"
        glowColor="primary"
      >
        <p className="text-sm text-muted-foreground">Card content goes here</p>
      </GlassCard>
      
      <GlassCard 
        title="Accent Glow Card" 
        description="This is a glass card with accent color glow"
        glowColor="accent"
      >
        <p className="text-sm text-muted-foreground">Card content goes here</p>
      </GlassCard>
    </div>
  );
}

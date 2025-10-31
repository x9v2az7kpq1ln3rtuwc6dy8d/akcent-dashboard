export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="text-2xl font-bold font-heading text-primary animate-pulse-glow">
          AKCENT
        </div>
      </div>
    </div>
  );
}

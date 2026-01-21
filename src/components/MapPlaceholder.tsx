import { MapPin, Satellite, Layers } from "lucide-react";

export function MapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* Simulated satellite texture overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, hsl(var(--success) / 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, hsl(var(--success) / 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 40% 80%, hsl(var(--accent) / 0.1) 0%, transparent 45%)
          `,
        }}
      />
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
          <div className="relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border">
            <Satellite className="w-12 h-12 text-primary mx-auto mb-3" />
            <Layers className="w-6 h-6 text-muted-foreground absolute -bottom-1 -right-1" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Satellite View Loading
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Configure your Google Maps API key to enable the interactive satellite map
        </p>
        
        {/* Fake map markers */}
        <div className="absolute top-1/4 left-1/4 animate-pulse">
          <MapPin className="w-5 h-5 text-primary/50" />
        </div>
        <div className="absolute top-1/3 right-1/3 animate-pulse delay-300">
          <MapPin className="w-4 h-4 text-primary/40" />
        </div>
        <div className="absolute bottom-1/3 left-1/2 animate-pulse delay-500">
          <MapPin className="w-6 h-6 text-primary/30" />
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { FieldSidebar } from "@/components/FieldSidebar";
import { LeafletMap } from "@/components/LeafletMap";
import { Compass, Signal } from "lucide-react";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

const Index = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const handleFieldSelect = useCallback((field: Field) => {
    setSelectedField(field);
  }, []);

  const handleFieldsChange = useCallback((newFields: Field[]) => {
    setFields(newFields);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <FieldSidebar 
        fields={fields}
        selectedField={selectedField}
        onFieldSelect={handleFieldSelect}
      />

      {/* Main Map Area */}
      <main className="relative flex-1 overflow-hidden">
        {/* Map Container */}
        <div className="absolute inset-0">
          <LeafletMap 
            onFieldSelect={handleFieldSelect}
            onFieldsChange={handleFieldsChange}
          />
        </div>

        {/* Top Bar - Coordinates & Status */}
        <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
          <div className="surface-glass rounded-xl px-4 py-2.5 flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-foreground">
                Esri World Imagery
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
          <div className="surface-glass rounded-xl px-4 py-2.5 flex items-center gap-3 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {fields.length > 0 
                ? `${fields.length} field${fields.length > 1 ? 's' : ''} mapped • Total: ${fields.reduce((sum, f) => sum + Number(f.area_acres), 0).toFixed(2)} acres`
                : "Ready to map • Use polygon tool to draw fields"
              }
            </span>
          </div>
        </div>

        {/* Scale Indicator */}
        <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
          <div className="surface-glass rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
            <div className="w-12 h-0.5 bg-foreground rounded-full" />
            <span className="text-xs text-muted-foreground">1 km</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

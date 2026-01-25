import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
}

interface FieldSelectorProps {
  fields: Field[];
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string | null) => void;
}

export function FieldSelector({ fields, selectedFieldId, onFieldSelect }: FieldSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <MapPin className="w-4 h-4 text-muted-foreground" />
      <Select 
        value={selectedFieldId || "all"} 
        onValueChange={(value) => onFieldSelect(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[200px] bg-background/50">
          <SelectValue placeholder="Select a field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Fields (Aggregate)</SelectItem>
          {fields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              {field.name} ({field.area_acres.toFixed(1)} acres)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

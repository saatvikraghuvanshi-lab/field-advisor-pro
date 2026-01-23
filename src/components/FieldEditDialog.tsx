import { useState, useEffect } from "react";
import { Pencil, Trash2, Palette, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

interface FieldEditDialogProps {
  field: Field | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldUpdated: () => void;
  onFieldDeleted: () => void;
}

const FIELD_COLORS = [
  "#fbbf24", // amber
  "#22c55e", // green
  "#3b82f6", // blue
  "#ef4444", // red
  "#8b5cf6", // purple
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
];

export function FieldEditDialog({
  field,
  open,
  onOpenChange,
  onFieldUpdated,
  onFieldDeleted,
}: FieldEditDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#fbbf24");
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (field) {
      setName(field.name);
      setColor(field.color || "#fbbf24");
    }
  }, [field]);

  const handleSave = async () => {
    if (!field || !name.trim()) {
      toast.error("Please enter a field name");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("fields")
        .update({ name: name.trim(), color })
        .eq("id", field.id);

      if (error) throw error;

      toast.success("Field updated successfully");
      onFieldUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error("Failed to update field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!field) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("fields").delete().eq("id", field.id);

      if (error) throw error;

      toast.success("Field deleted successfully");
      onFieldDeleted();
      onOpenChange(false);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Failed to delete field");
    } finally {
      setDeleting(false);
    }
  };

  if (!field) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Edit Field
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Field Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter field name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Field Color
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELD_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color === c
                        ? "border-foreground scale-110"
                        : "border-transparent hover:border-muted-foreground"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Area:</span> {field.area_acres} acres
              </p>
              {field.ndvi_score !== null && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">NDVI Score:</span> {field.ndvi_score}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="sm:mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Field
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{field.name}"? This action cannot be undone.
              All field data including telemetry history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState, useCallback } from "react";
import { Download, FileImage, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

interface ExportPanelProps {
  mapContainerSelector?: string;
  fields?: Field[];
  className?: string;
}

export function ExportPanel({
  mapContainerSelector = ".leaflet-container",
  fields = [],
  className,
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "pdf">("png");
  const [reportTitle, setReportTitle] = useState("TerraPulse Field Report");

  const captureMap = async (): Promise<HTMLCanvasElement | null> => {
    const mapElement = document.querySelector(mapContainerSelector) as HTMLElement;
    if (!mapElement) {
      toast.error("Map container not found");
      return null;
    }

    try {
      // Wait for tiles to load
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0f172a",
        scale: 2,
        logging: false,
      });
      
      return canvas;
    } catch (error) {
      console.error("Map capture error:", error);
      toast.error("Failed to capture map");
      return null;
    }
  };

  const exportAsPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureMap();
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = `terrapulse-map-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Map exported as PNG");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureMap();
      if (!canvas) {
        setIsExporting(false);
        return;
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 20, "F");
      
      pdf.setTextColor(251, 191, 36);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(reportTitle, 10, 13);

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 60, 13);

      // Map Image
      const imgData = canvas.toDataURL("image/png");
      const mapWidth = pageWidth - 20;
      const mapHeight = (canvas.height / canvas.width) * mapWidth;
      const maxMapHeight = pageHeight - 70;
      
      const finalMapHeight = Math.min(mapHeight, maxMapHeight);
      const finalMapWidth = (finalMapHeight / mapHeight) * mapWidth;
      
      pdf.addImage(
        imgData,
        "PNG",
        10,
        25,
        finalMapWidth,
        finalMapHeight
      );

      // Field Summary Table
      if (fields.length > 0) {
        const tableTop = 30 + finalMapHeight + 5;
        
        pdf.setFillColor(30, 41, 59);
        pdf.rect(10, tableTop, pageWidth - 20, 8, "F");
        
        pdf.setTextColor(251, 191, 36);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("Field Summary", 15, tableTop + 5.5);

        const headers = ["Field Name", "Area (acres)", "NDVI Score", "Status"];
        const colWidths = [60, 40, 40, 40];
        let x = 15;
        
        pdf.setFillColor(51, 65, 85);
        pdf.rect(10, tableTop + 10, pageWidth - 20, 7, "F");
        
        pdf.setTextColor(226, 232, 240);
        pdf.setFontSize(9);
        headers.forEach((header, i) => {
          pdf.text(header, x, tableTop + 15);
          x += colWidths[i];
        });

        // Data rows
        pdf.setTextColor(148, 163, 184);
        pdf.setFont("helvetica", "normal");
        
        fields.slice(0, 5).forEach((field, index) => {
          const rowY = tableTop + 22 + index * 7;
          x = 15;

          if (index % 2 === 0) {
            pdf.setFillColor(30, 41, 59);
            pdf.rect(10, rowY - 4, pageWidth - 20, 7, "F");
          }

          const getNdviStatus = (score: number | null) => {
            if (score === null) return "No data";
            if (score >= 0.6) return "Healthy";
            if (score >= 0.3) return "Moderate";
            return "Poor";
          };

          pdf.text(field.name, x, rowY);
          x += colWidths[0];
          pdf.text(field.area_acres.toString(), x, rowY);
          x += colWidths[1];
          pdf.text(field.ndvi_score?.toString() || "N/A", x, rowY);
          x += colWidths[2];
          pdf.text(getNdviStatus(field.ndvi_score), x, rowY);
        });

        if (fields.length > 5) {
          pdf.setTextColor(100, 116, 139);
          pdf.text(`... and ${fields.length - 5} more fields`, 15, tableTop + 22 + 5 * 7 + 5);
        }
      }

      // Footer
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(8);
      pdf.text("TerraPulse GIS Dashboard • Powered by Lovable", 10, pageHeight - 5);
      pdf.text(`Total Fields: ${fields.length} • Total Area: ${fields.reduce((sum, f) => sum + f.area_acres, 0).toFixed(2)} acres`, pageWidth - 80, pageHeight - 5);

      pdf.save(`terrapulse-report-${Date.now()}.pdf`);
      toast.success("Report exported as PDF");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("PDF export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === "png") {
      exportAsPNG();
    } else {
      exportAsPDF();
    }
  };

  return (
    <div className={cn("surface-glass rounded-xl p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Download className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Export</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Report Title
          </label>
          <Input
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Enter report title..."
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Format
          </label>
          <Select
            value={exportFormat}
            onValueChange={(v) => setExportFormat(v as "png" | "pdf")}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">
                <div className="flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  PNG Image
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF Report
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="sm"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

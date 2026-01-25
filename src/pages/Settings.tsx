import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Palette,
  Settings as SettingsIcon,
  Wheat,
  Monitor,
  Smartphone,
  Layout
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ViewMode = "desktop" | "mobile";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("terrapulse-view-mode");
    return (saved as ViewMode) || "desktop";
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("terrapulse-view-mode", mode);
    toast.success(`View mode changed to ${mode}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-sidebar/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Account Section */}
        <section className="surface-glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email || "Not signed in"}</p>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="surface-glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <div>
                <Label htmlFor="theme-toggle" className="text-sm font-medium text-foreground">
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "High-contrast earth theme" : "Light theme for daytime use"}
                </p>
              </div>
            </div>
            <Switch 
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>

          {/* View Mode Toggle - Moved from main page */}
          <div className="py-3">
            <div className="flex items-center gap-3 mb-3">
              <Layout className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">View Mode</p>
                <p className="text-xs text-muted-foreground">
                  Choose between desktop and mobile layout
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant={viewMode === "desktop" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleViewModeChange("desktop")}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </Button>
              <Button
                variant={viewMode === "mobile" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleViewModeChange("mobile")}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="surface-glass rounded-xl p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wheat className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gradient-primary">TerraPulse</h2>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Precision farming powered by satellite imagery and AI-driven insights.
          </p>
        </section>
      </main>
    </div>
  );
}

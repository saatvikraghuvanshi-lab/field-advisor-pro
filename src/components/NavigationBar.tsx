import { useNavigate, useLocation } from "react-router-dom";
import { Map, BarChart3, Settings, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationBarProps {
  className?: string;
}

export function NavigationBar({ className }: NavigationBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Map", icon: Map },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={cn("surface-glass rounded-xl p-2 flex items-center gap-1", className)}>
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mr-2">
        <Wheat className="w-4 h-4 text-primary" />
      </div>
      {navItems.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2",
            location.pathname === item.path && "bg-primary/20 text-primary"
          )}
          onClick={() => navigate(item.path)}
        >
          <item.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}

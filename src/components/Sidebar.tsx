import { BarChart3, Users, Settings, Info } from "lucide-react";
import logoImage from "../assets/logo.png";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "仪表盘", icon: BarChart3 },
  { id: "accounts", label: "账号管理", icon: Users },
  { id: "settings", label: "设置", icon: Settings },
  { id: "about", label: "关于", icon: Info },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="h-8 w-8 overflow-hidden rounded-lg">
          <img src={logoImage} alt="Logo" className="h-full w-full object-cover" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Trae Account Manager</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <span className="text-xs text-muted-foreground">v1.0.0</span>
      </div>
    </aside>
  );
}

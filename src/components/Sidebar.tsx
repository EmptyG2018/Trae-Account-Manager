import { BarChart3, Users, Settings, Info, Minus, Square, X } from "lucide-react";
import logoImage from "../assets/logo.png";
import { cn } from "@/lib/utils";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  osType: string;
}

const menuItems = [
  { id: "dashboard", label: "仪表盘", icon: BarChart3 },
  { id: "accounts", label: "账号管理", icon: Users },
  { id: "settings", label: "设置", icon: Settings },
  { id: "about", label: "关于", icon: Info },
];

export function Sidebar({ currentPage, onNavigate, osType }: SidebarProps) {
  const isMac = osType === "macos";

  return (
    <aside className="flex h-screen w-[232px] flex-col border-r border-sidebar-border bg-sidebar">
      {/* Mac: traffic lights */}
      {isMac && (
        <div
          data-tauri-drag-region
          onMouseDown={(e) => { if (e.buttons === 1) appWindow.startDragging(); }}
          className="group/trl flex items-center pl-5 pt-3.5 pb-1"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={() => appWindow.close()}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#FF5F57] transition-colors hover:brightness-90"
            >
              <X className="h-[7px] w-[7px] text-[#4A0002] opacity-0 group-hover/trl:opacity-100" />
            </button>
            <button
              onClick={() => appWindow.minimize()}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#FEBC2E] transition-colors hover:brightness-90"
            >
              <Minus className="h-[7px] w-[7px] text-[#5A3E00] opacity-0 group-hover/trl:opacity-100" />
            </button>
            <button
              onClick={() => appWindow.toggleMaximize()}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#28C840] transition-colors hover:brightness-90"
            >
              <Square className="h-[7px] w-[7px] text-[#0A4A00] opacity-0 group-hover/trl:opacity-100" />
            </button>
          </div>
        </div>
      )}

      {/* Logo + TAM */}
      <div
        className={cn("flex items-center gap-3 px-5", isMac ? "pt-2 pb-5" : "pt-5 pb-5")}
        {...(isMac ? {} : { "data-tauri-drag-region": true, onMouseDown: (e: React.MouseEvent) => { if (e.buttons === 1) appWindow.startDragging(); } })}
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-xl shadow-sm">
          <img src={logoImage} alt="Logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">TAM</span>
          <span className="ml-1.5 text-[10px] font-medium text-sidebar-primary/60">v1.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              onClick={() => onNavigate(item.id)}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
              )}
              <Icon className={cn("h-[18px] w-[18px] transition-colors", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70")} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Version */}
      <div className="border-t border-sidebar-border px-5 py-3">
        <span className="text-[11px] font-medium text-sidebar-foreground/30">v1.0.0</span>
      </div>
    </aside>
  );
}

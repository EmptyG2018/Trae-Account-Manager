import { Minus, Square, X, Copy } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect } from "react";

const appWindow = getCurrentWindow();

interface TitleBarProps {
  osType: string;
}

export function TitleBar({ osType }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };
    checkMaximized();

    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Mac: traffic lights are in the sidebar, no separate title bar
  if (osType === "macos") return null;

  // Windows: minimal title bar with window controls
  return (
    <div
      data-tauri-drag-region
      onMouseDown={(e) => { if (e.buttons === 1) appWindow.startDragging(); }}
      className="flex h-9 select-none items-center justify-end bg-background"
    >
      <div className="flex h-full">
        <button
          onClick={() => appWindow.minimize()}
          className="flex h-full w-[46px] items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/5"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-full w-[46px] items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/5"
        >
          {isMaximized ? (
            <Copy className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
        </button>
        <button
          onClick={() => appWindow.close()}
          className="flex h-full w-[46px] items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

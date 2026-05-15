import { Minus, Square, X, Copy } from "lucide-react";
import logoImage from "../assets/logo.png";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect } from "react";
import * as api from "../api";

const appWindow = getCurrentWindow();

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [osType, setOsType] = useState<string>("unknown");

  useEffect(() => {
    const checkMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };
    checkMaximized();

    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    api.getOsType().then(setOsType);

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();
  const handleDragStart = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      appWindow.startDragging();
    }
  };

  const isMac = osType === "macos";

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleDragStart}
      className="flex h-9 select-none items-center justify-between border-b border-border bg-card px-3"
    >
      {isMac ? (
        <div className="flex h-full items-center gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={handleClose}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600"
            >
              <X className="h-2 w-2 text-red-900/50 opacity-0 hover:opacity-100" />
            </button>
            <button
              onClick={handleMinimize}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500 transition-colors hover:bg-yellow-600"
            >
              <Minus className="h-2 w-2 text-yellow-900/50 opacity-0 hover:opacity-100" />
            </button>
            <button
              onClick={handleMaximize}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-green-500 transition-colors hover:bg-green-600"
            >
              {isMaximized ? (
                <Copy className="h-2 w-2 text-green-900/50 opacity-0 hover:opacity-100" />
              ) : (
                <Square className="h-2 w-2 text-green-900/50 opacity-0 hover:opacity-100" />
              )}
            </button>
          </div>
          <div className="ml-2 flex items-center gap-2">
            <div className="h-4 w-4 overflow-hidden rounded">
              <img src={logoImage} alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xs font-medium">Trae Account Manager</span>
          </div>
        </div>
      ) : (
        <>
          <div data-tauri-drag-region className="flex items-center gap-2">
            <div className="h-5 w-5 overflow-hidden rounded">
              <img src={logoImage} alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xs font-medium">Trae Account Manager</span>
          </div>

          <div className="flex h-full">
            <button
              onClick={handleMinimize}
              className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {isMaximized ? (
                <Copy className="h-3 w-3" />
              ) : (
                <Square className="h-3 w-3" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
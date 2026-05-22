import { useEffect, useState } from "react";
import { Check, X, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

const iconMap = {
  success: Check,
  error: X,
  info: Info,
  warning: AlertTriangle,
};

const iconBgMap = {
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2.5">
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ message, onRemove }: { message: ToastMessage; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = message.duration || 3000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(message.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(message.id), 300);
  };

  const Icon = iconMap[message.type];

  return (
    <div
      className={cn(
        "flex min-w-[280px] items-center gap-3 rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-xl backdrop-blur-xl transition-all duration-300",
        isExiting ? "translate-x-[400px] opacity-0" : "translate-x-0 opacity-100"
      )}
    >
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconBgMap[message.type])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1 text-sm font-medium">{message.message}</span>
      <button
        onClick={handleClose}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

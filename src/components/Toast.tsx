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

const typeStyles = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
};

export function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2">
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
        "flex min-w-[280px] items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300",
        typeStyles[message.type],
        isExiting ? "translate-x-[400px] opacity-0" : "translate-x-0 opacity-100"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-sm">{message.message}</span>
      <button
        onClick={handleClose}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

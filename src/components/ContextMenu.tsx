import { useEffect, useRef } from "react";
import {
  Eye,
  RefreshCw,
  KeyRound,
  Key,
  Shuffle,
  Gift,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onViewDetail: () => void;
  onRefresh: () => void;
  onUpdateToken: () => void;
  onCopyToken: () => void;
  onSwitchAccount: () => void;
  onClaimGift: () => void;
  onDelete: () => void;
  isCurrent?: boolean;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onViewDetail,
  onRefresh,
  onUpdateToken,
  onCopyToken,
  onSwitchAccount,
  onClaimGift,
  onDelete,
  isCurrent = false,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();

      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const items: (MenuItem | "divider")[] = [
    { label: "查看详情", icon: Eye, onClick: onViewDetail },
    { label: "刷新数据", icon: RefreshCw, onClick: onRefresh },
    { label: "更新 Token", icon: KeyRound, onClick: onUpdateToken },
    { label: "复制 Token", icon: Key, onClick: onCopyToken },
    {
      label: isCurrent ? "当前使用中" : "切换账号",
      icon: isCurrent ? Check : Shuffle,
      onClick: isCurrent ? undefined : onSwitchAccount,
      disabled: isCurrent,
    },
    { label: "获取礼包", icon: Gift, onClick: onClaimGift },
    "divider",
    { label: "删除账号", icon: Trash2, onClick: onDelete, danger: true },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-[9999] min-w-[160px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
        style={{ left: x, top: y }}
      >
        {items.map((item, i) => {
          if (item === "divider") {
            return <div key={`divider-${i}`} className="my-1 h-px bg-border" />;
          }
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                item.disabled
                  ? "text-muted-foreground cursor-default"
                  : item.danger
                    ? "text-destructive hover:bg-destructive/10"
                    : "hover:bg-accent"
              )}
              onClick={item.disabled ? undefined : item.onClick}
              title={item.disabled ? "当前已是此账号" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

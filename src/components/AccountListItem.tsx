import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UsageSummary } from "../types";

interface AccountListItemProps {
  account: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    plan_type: string;
    created_at: number;
    token_expired_at?: string | null;
  };
  usage: UsageSummary | null;
  selected: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const statusConfig = {
  normal: { label: "正常", dot: "bg-emerald-500" },
  expiring: { label: "即将过期", dot: "bg-amber-500" },
  expired: { label: "过期", dot: "bg-red-500" },
  unknown: { label: "未知", dot: "bg-muted-foreground/50" },
};

export function AccountListItem({ account, usage, selected, onSelect, onContextMenu }: AccountListItemProps) {
  const totalUsed = usage ? usage.fast_request_used + usage.extra_fast_request_used : 0;
  const totalLimit = usage ? usage.fast_request_limit + usage.extra_fast_request_limit : 0;
  const totalLeft = usage ? usage.fast_request_left + usage.extra_fast_request_left : 0;
  const usagePercent = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

  const formatCreatedDate = (timestamp: number) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };

  const getTokenStatus = (): "normal" | "expiring" | "expired" | "unknown" => {
    if (!account.token_expired_at) return "unknown";
    const expiry = new Date(account.token_expired_at).getTime();
    if (isNaN(expiry)) return "unknown";
    const now = Date.now();
    if (expiry < now) return "expired";
    if (expiry - now < 3600000) return "expiring";
    return "normal";
  };

  const tokenStatus = getTokenStatus();

  return (
    <div
      className={cn(
        "grid cursor-pointer items-center gap-4 border-b border-border/50 px-4 py-3 transition-colors hover:bg-muted/30",
        "grid-cols-[auto_auto_1fr_auto_auto_auto_auto]",
        selected && "bg-primary/[0.04]"
      )}
      onClick={() => onSelect(account.id)}
      onContextMenu={(e) => onContextMenu(e, account.id)}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(account.id)}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
        {account.avatar_url ? (
          <img src={account.avatar_url} alt={account.name} className="h-full w-full rounded-lg object-cover" />
        ) : (
          (account.email || account.name).charAt(0).toUpperCase()
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{account.email || account.name}</div>
        <div className="text-xs text-muted-foreground">Trae 账号</div>
      </div>

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[11px]">{usage?.plan_type || account.plan_type || "Free"}</Badge>
        {usage && usage.extra_fast_request_limit > 0 && (
          <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-600 dark:text-amber-400">礼包</Badge>
        )}
      </div>

      <div className="w-32">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground"><strong className="font-semibold text-foreground">{Math.round(totalUsed)}</strong> / {totalLimit}</span>
          <span className="text-muted-foreground">剩余 {Math.round(totalLeft)}</span>
        </div>
        <Progress value={usagePercent} className="h-1.5" />
      </div>

      <div className="text-center text-[11px] text-muted-foreground">
        <div className="opacity-60">添加时间</div>
        <div className="font-medium text-foreground">{formatCreatedDate(account.created_at)}</div>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className={cn("h-2 w-2 rounded-full", statusConfig[tokenStatus].dot)} />
        <span className="text-muted-foreground">{statusConfig[tokenStatus].label}</span>
      </div>

      <button
        className="rounded-md p-1.5 transition-colors hover:bg-muted"
        title="更多操作"
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e, account.id);
        }}
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

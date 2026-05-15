import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  normal: { label: "正常", dot: "bg-green-500" },
  expiring: { label: "即将过期", dot: "bg-yellow-500" },
  expired: { label: "过期", dot: "bg-red-500" },
  unknown: { label: "未知", dot: "bg-gray-400" },
};

export function AccountListItem({ account, usage, selected, onSelect, onContextMenu }: AccountListItemProps) {
  const totalUsed = usage ? usage.fast_request_used + usage.extra_fast_request_used : 0;
  const totalLimit = usage ? usage.fast_request_limit + usage.extra_fast_request_limit : 0;
  const totalLeft = usage ? usage.fast_request_left + usage.extra_fast_request_left : 0;
  const usagePercent = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

  const getUsageColor = () => {
    if (usagePercent >= 80) return "bg-red-500";
    if (usagePercent >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

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
        "grid cursor-pointer items-center gap-4 rounded-lg border-b px-4 py-3 transition-colors hover:bg-accent/50",
        "grid-cols-[auto_auto_1fr_auto_auto_auto_auto]",
        selected && "bg-primary/5"
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

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {account.avatar_url ? (
          <img src={account.avatar_url} alt={account.name} className="h-full w-full rounded-full object-cover" />
        ) : (
          (account.email || account.name).charAt(0).toUpperCase()
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{account.email || account.name}</div>
        <div className="text-xs text-muted-foreground">Trae 账号</div>
      </div>

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-xs">{usage?.plan_type || account.plan_type || "Free"}</Badge>
        {usage && usage.extra_fast_request_limit > 0 && (
          <Badge variant="outline" className="text-xs">礼包</Badge>
        )}
      </div>

      <div className="w-32">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground"><strong className="text-foreground">{Math.round(totalUsed)}</strong> / {totalLimit}</span>
          <span className="text-muted-foreground">剩余 {Math.round(totalLeft)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className={cn("h-full rounded-full transition-all", getUsageColor())} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <div>添加时间</div>
        <div className="font-medium text-foreground">{formatCreatedDate(account.created_at)}</div>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className={cn("h-2 w-2 rounded-full", statusConfig[tokenStatus].dot)} />
        <span className="text-muted-foreground">{statusConfig[tokenStatus].label}</span>
      </div>

      <button
        className="rounded-md p-1 transition-colors hover:bg-accent"
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

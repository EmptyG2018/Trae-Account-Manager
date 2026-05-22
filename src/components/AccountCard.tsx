import { Copy, Calendar, RefreshCw, ArrowUpCircle, Check, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UsageSummary } from "../types";

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    plan_type: string;
    created_at: number;
    is_current?: boolean;
    token_expired_at?: string | null;
  };
  usage: UsageSummary | null;
  selected: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const statusConfig = {
  normal: { label: "正常", className: "bg-green-100 text-green-700" },
  expiring: { label: "即将过期", className: "bg-yellow-100 text-yellow-700" },
  expired: { label: "已过期", className: "bg-red-100 text-red-700" },
  unknown: { label: "未知", className: "bg-gray-100 text-gray-500" },
};

export function AccountCard({ account, usage, selected, onSelect, onContextMenu }: AccountCardProps) {
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
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
  const totalUsed = usage ? usage.fast_request_used + usage.extra_fast_request_used : 0;
  const totalLimit = usage ? usage.fast_request_limit + usage.extra_fast_request_limit : 0;
  const totalLeft = usage ? usage.fast_request_left + usage.extra_fast_request_left : 0;
  const usagePercent = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account.email || account.name);
  };

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border bg-card p-4 transition-all",
        selected && "ring-2 ring-primary",
        account.is_current && "ring-1 ring-primary/20 bg-primary/5"
      )}
      onClick={() => onSelect(account.id)}
      onContextMenu={(e) => onContextMenu(e, account.id)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(account.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {account.avatar_url ? (
            <img src={account.avatar_url} alt={account.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            (account.email || account.name).charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{account.email || account.name}</span>
            <button onClick={handleCopy} title="复制邮箱" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">Trae 账号</span>
        </div>

        <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig[tokenStatus].className)}>
          {statusConfig[tokenStatus].label}
        </Badge>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-xs">{usage?.plan_type || account.plan_type || "Free"}</Badge>
        {usage && usage.extra_fast_request_limit > 0 && (
          <Badge variant="outline" className="gap-1 text-xs">
            <ArrowUpCircle className="h-3 w-3" />
            礼包
          </Badge>
        )}
        {account.is_current && (
          <Badge className="gap-1 text-xs">
            <Check className="h-3 w-3" />
            当前使用
          </Badge>
        )}
      </div>

      {/* Usage */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Fast Requests</span>
          <span className={cn("font-medium", usagePercent >= 80 ? "text-red-500" : usagePercent >= 50 ? "text-yellow-500" : "text-green-500")}>
            {usagePercent}%
          </span>
        </div>
        <Progress value={usagePercent} className="h-1.5" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span><strong className="text-foreground">{Math.round(totalUsed)}</strong> / {totalLimit}</span>
          <span>剩余 {Math.round(totalLeft)}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          添加于 {formatCreatedDate(account.created_at)}
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          重置 {usage ? formatDate(usage.reset_time) : "-"}
        </span>
        {usage && usage.extra_expire_time > 0 && (
          <span className="flex items-center gap-1 text-yellow-600">
            <ArrowUpCircle className="h-3 w-3" />
            礼包到期 {formatDate(usage.extra_expire_time)}
          </span>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <MoreVertical className="h-3 w-3" />
        右键查看更多操作
      </div>
    </div>
  );
}

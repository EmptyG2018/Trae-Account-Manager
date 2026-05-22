import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { UsageSummary } from "../types";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    plan_type: string;
    cookies?: string;
    jwt_token?: string | null;
  } | null;
  usage: UsageSummary | null;
}

export function DetailModal({ isOpen, onClose, account, usage }: DetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";
    return new Date(timestamp * 1000).toLocaleString("zh-CN");
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>账号详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Section title="基本信息">
            <Row label="用户名" value={account.name} />
            <Row label="邮箱" value={account.email || "-"} />
            <Row label="套餐类型" value={usage?.plan_type || account.plan_type || "Free"} />
            <Row label="重置时间" value={usage ? formatDate(usage.reset_time) : "-"} />
          </Section>

          {account.jwt_token && (
            <Section title="Token">
              <CopyRow
                text={account.jwt_token}
                field="token"
                copiedField={copiedField}
                onCopy={handleCopy}
              />
            </Section>
          )}

          {account.cookies && (
            <Section title="Cookies">
              <CopyRow
                text={account.cookies}
                field="cookies"
                copiedField={copiedField}
                onCopy={handleCopy}
              />
            </Section>
          )}

          {usage && (
            <>
              <Section title="Fast Request">
                <Row label="已使用" value={formatNumber(usage.fast_request_used)} />
                <Row label="总配额" value={formatNumber(usage.fast_request_limit)} />
                <Row label="剩余" value={formatNumber(usage.fast_request_left)} highlight />
              </Section>

              {usage.extra_fast_request_limit > 0 && (
                <Section title={`额外礼包 ${usage.extra_package_name ? `(${usage.extra_package_name})` : ""}`}>
                  <Row label="已使用" value={formatNumber(usage.extra_fast_request_used)} />
                  <Row label="总配额" value={formatNumber(usage.extra_fast_request_limit)} />
                  <Row label="剩余" value={formatNumber(usage.extra_fast_request_left)} highlight />
                  <Row label="过期时间" value={formatDate(usage.extra_expire_time)} />
                </Section>
              )}

              <Section title="其他配额">
                <Row label="Slow Request" value={`${formatNumber(usage.slow_request_used)} / ${formatNumber(usage.slow_request_limit)}`} />
                <Row label="Advanced Model" value={`${formatNumber(usage.advanced_model_used)} / ${formatNumber(usage.advanced_model_limit)}`} />
                <Row label="Autocomplete" value={`${formatNumber(usage.autocomplete_used)} / ${formatNumber(usage.autocomplete_limit)}`} />
              </Section>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            关闭
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-medium text-green-600" : "font-medium"}>{value}</span>
    </div>
  );
}

function CopyRow({ text, field, copiedField, onCopy }: { text: string; field: string; copiedField: string | null; onCopy: (text: string, field: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">{text}</code>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onCopy(text, field)}
        title={copiedField === field ? "已复制" : "复制"}
      >
        {copiedField === field ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

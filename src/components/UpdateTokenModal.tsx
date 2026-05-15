import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface UpdateTokenModalProps {
  isOpen: boolean;
  accountId: string;
  accountName: string;
  onClose: () => void;
  onUpdate: (accountId: string, token: string) => Promise<void>;
}

export function UpdateTokenModal({
  isOpen,
  accountId,
  accountName,
  onClose,
  onUpdate,
}: UpdateTokenModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extractToken = (input: string): string | null => {
    const trimmed = input.trim();

    if (trimmed.startsWith("eyJ")) {
      return trimmed;
    }

    try {
      const json = JSON.parse(trimmed);
      if (json.Result?.Token) return json.Result.Token;
      if (json.token) return json.token;
      if (json.Token) return json.Token;
    } catch {
      // not JSON
    }

    const tokenMatch = trimmed.match(/"Token"\s*:\s*"(eyJ[^"]+)"/);
    if (tokenMatch) return tokenMatch[1];

    const jwtMatch = trimmed.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (jwtMatch) return jwtMatch[0];

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError("请输入新的 Token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = extractToken(inputValue);

      if (!token) {
        setError("无法识别 Token，请确保输入正确的 Token 或 GetUserToken 接口响应");
        setLoading(false);
        return;
      }

      await onUpdate(accountId, token);
      setInputValue("");
      onClose();
    } catch (err: any) {
      setError(err.message || "更新 Token 失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setInputValue("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更新 Token</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          为账号 <strong>{accountName}</strong> 更新 Token。
          <br />
          请确保新 Token 属于同一个用户，否则更新会失败。
        </p>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            如何获取新 Token？
          </summary>
          <ol className="mt-2 space-y-1 pl-4 text-muted-foreground [&_li]:list-decimal">
            <li>打开 <a href="https://www.trae.ai/account-setting#usage" target="_blank" rel="noopener noreferrer" className="text-primary underline">trae.ai 账号设置页面</a> 并登录</li>
            <li>按 <kbd className="rounded bg-muted px-1 py-0.5 text-xs">F12</kbd> 打开开发者工具，切换到 <strong>Network</strong> 标签</li>
            <li>刷新页面，在请求列表中找到 <code className="rounded bg-muted px-1 text-xs">GetUserToken</code></li>
            <li>点击该请求，在右侧 <strong>Response</strong> 标签中复制整个响应内容</li>
          </ol>
        </details>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="粘贴新的 Token 或 API 响应..."
            rows={6}
            disabled={loading}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" onClick={handleClose} disabled={loading} />}>
              取消
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "更新中..." : "更新 Token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

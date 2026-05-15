import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Box, Globe, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import * as api from "../api";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (token: string, cookies?: string) => Promise<void>;
  onToast?: (type: "success" | "error" | "warning" | "info", message: string) => void;
  onAccountAdded?: () => void;
}

type AddMode = "manual" | "trae-ide" | "browser";

export function AddAccountModal({ isOpen, onClose, onAdd, onToast, onAccountAdded }: AddAccountModalProps) {
  const [mode, setMode] = useState<AddMode>("trae-ide");
  const [tokenInput, setTokenInput] = useState("");
  const [cookiesInput, setCookiesInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [browserLoginStarted, setBrowserLoginStarted] = useState(false);

  useEffect(() => {
    const unlistenSuccess = listen<string>("login-success", (event) => {
      onToast?.("success", `浏览器登录成功: ${event.payload}`);
      onAccountAdded?.();
      setBrowserLoginStarted(false);
      handleCloseInternal();
    });

    const unlistenFailed = listen<string>("login-failed", (event) => {
      setError(event.payload || "登录失败");
      setBrowserLoginStarted(false);
    });

    const unlistenCancelled = listen("login-cancelled", () => {
      setBrowserLoginStarted(false);
    });

    return () => {
      unlistenSuccess.then((fn) => fn());
      unlistenFailed.then((fn) => fn());
      unlistenCancelled.then((fn) => fn());
    };
  }, []);

  const extractToken = (input: string): string | null => {
    const trimmed = input.trim().replace(/[\r\n\t]/g, '');

    if (trimmed.startsWith("eyJ")) {
      const parts = trimmed.split('.');
      if (parts.length === 3 && parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) {
        return trimmed;
      }
    }

    try {
      const json = JSON.parse(trimmed);
      if (json.Result?.Token && typeof json.Result.Token === 'string') {
        return validateAndCleanToken(json.Result.Token);
      }
      if (json.token && typeof json.token === 'string') {
        return validateAndCleanToken(json.token);
      }
      if (json.Token && typeof json.Token === 'string') {
        return validateAndCleanToken(json.Token);
      }
    } catch {
      // not JSON
    }

    const tokenMatch = trimmed.match(/"Token"\s*:\s*"(eyJ[^"]+)"/);
    if (tokenMatch && tokenMatch[1]) {
      return validateAndCleanToken(tokenMatch[1]);
    }

    const jwtMatch = trimmed.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (jwtMatch && jwtMatch[0]) {
      return validateAndCleanToken(jwtMatch[0]);
    }

    return null;
  };

  const validateAndCleanToken = (token: string): string | null => {
    const cleaned = token.trim();
    const parts = cleaned.split('.');
    if (parts.length !== 3) return null;
    if (!parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return null;
    return cleaned;
  };

  const handleReadTraeAccount = async () => {
    setLoading(true);
    setError("");

    try {
      const account = await api.readTraeAccount();
      if (account) {
        onToast?.("success", `成功从 Trae IDE 读取账号: ${account.email}`);
        onAccountAdded?.();
        handleCloseInternal();
      } else {
        setError("未找到 Trae IDE 登录账号或账号已存在");
      }
    } catch (err: any) {
      setError(err.message || "读取 Trae IDE 账号失败");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!tokenInput.trim()) {
      setError("请输入 Token 或 API 响应");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = extractToken(tokenInput);
      if (!token) {
        setError("无法识别 Token，请确保输入正确的 Token 或 GetUserToken 接口响应");
        setLoading(false);
        return;
      }

      const cookies = cookiesInput.trim() || undefined;
      await onAdd(token, cookies);
      setTokenInput("");
      setCookiesInput("");
      onClose();
    } catch (err: any) {
      setError(err.message || "添加账号失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBrowserLogin = async () => {
    setLoading(true);
    setError("");
    setBrowserLoginStarted(true);

    try {
      await api.startBrowserLogin();
    } catch (err: any) {
      setError(err.message || "打开登录窗口失败");
      setBrowserLoginStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseInternal = () => {
    setError("");
    setTokenInput("");
    setCookiesInput("");
    setBrowserLoginStarted(false);
    setMode("trae-ide");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseInternal()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加账号</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as AddMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="trae-ide" className="flex-1" disabled={loading}>
              <Box className="mr-1.5 h-4 w-4" />
              从 Trae IDE 读取
            </TabsTrigger>
            <TabsTrigger value="browser" className="flex-1" disabled={loading}>
              <Globe className="mr-1.5 h-4 w-4" />
              浏览器登录
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1" disabled={loading}>
              <Pencil className="mr-1.5 h-4 w-4" />
              手动输入
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trae-ide" className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Box className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-base font-medium">自动读取本地 Trae IDE 账号</h3>
              <p className="text-sm text-muted-foreground">
                系统将自动读取本地 Trae IDE 客户端当前登录的账号信息
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </TabsContent>

          <TabsContent value="browser" className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Globe className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-base font-medium">浏览器授权登录</h3>
              <p className="text-sm text-muted-foreground">
                将打开一个登录窗口，在其中登录 trae.ai 账号，系统将自动提取 Cookies 并添加账号
              </p>
              {browserLoginStarted && (
                <p className="text-sm text-yellow-600">
                  登录窗口已打开，请在窗口中完成登录...
                </p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Token <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="粘贴 Token 或 GetUserToken 接口响应..."
                rows={4}
                disabled={loading}
              />
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  如何获取 Token？
                </summary>
                <ol className="mt-2 space-y-1 pl-4 text-muted-foreground [&_li]:list-decimal">
                  <li>打开 <a href="https://www.trae.ai/account-setting#usage" target="_blank" rel="noopener noreferrer" className="text-primary underline">trae.ai 账号设置页面</a> 并登录</li>
                  <li>按 <kbd className="rounded bg-muted px-1 py-0.5 text-xs">F12</kbd> 打开开发者工具，切换到 <strong>Network</strong> 标签</li>
                  <li>刷新页面，在请求列表中找到 <code className="rounded bg-muted px-1 text-xs">GetUserToken</code></li>
                  <li>点击该请求，在右侧 <strong>Response</strong> 标签中复制整个响应内容</li>
                </ol>
              </details>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Cookies <span className="text-muted-foreground">（可选）</span>
              </label>
              <Textarea
                value={cookiesInput}
                onChange={(e) => setCookiesInput(e.target.value)}
                placeholder="粘贴 Cookie 值（可选）..."
                rows={3}
                disabled={loading}
              />
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  如何获取 Cookies？
                </summary>
                <ol className="mt-2 space-y-1 pl-4 text-muted-foreground [&_li]:list-decimal">
                  <li>在上面获取 Token 的同一个页面</li>
                  <li>在 <strong>Network</strong> 标签中点击任意请求</li>
                  <li>在右侧 <strong>Headers</strong> 中找到 <code className="rounded bg-muted px-1 text-xs">Cookie</code> 字段</li>
                  <li>复制整个 Cookie 值</li>
                </ol>
              </details>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCloseInternal} disabled={loading}>
            取消
          </Button>
          {mode === "trae-ide" ? (
            <Button onClick={handleReadTraeAccount} disabled={loading}>
              {loading ? "读取中..." : "读取本地账号"}
            </Button>
          ) : mode === "browser" ? (
            <Button onClick={handleBrowserLogin} disabled={loading || browserLoginStarted}>
              {browserLoginStarted ? "等待登录中..." : loading ? "打开中..." : "打开登录窗口"}
            </Button>
          ) : (
            <Button onClick={handleManualSubmit} disabled={loading}>
              {loading ? "添加中..." : "添加账号"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

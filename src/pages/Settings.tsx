import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Layers, RefreshCw, Copy, Trash2, Search, Pencil, Folder, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as api from "../api";

interface SettingsProps {
  onToast?: (type: "success" | "error" | "warning" | "info", message: string) => void;
}

export function Settings({ onToast }: SettingsProps) {
  const [traeMachineId, setTraeMachineId] = useState<string>("");
  const [traeRefreshing, setTraeRefreshing] = useState(false);
  const [clearingTrae, setClearingTrae] = useState(false);
  const [traePath, setTraePath] = useState<string>("");
  const [traePathLoading, setTraePathLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const loadTraeMachineId = async () => {
    setTraeRefreshing(true);
    try {
      const id = await api.getTraeMachineId();
      setTraeMachineId(id);
    } catch (err: any) {
      console.error("获取 Trae IDE 机器码失败:", err);
      setTraeMachineId("未找到");
    } finally {
      setTraeRefreshing(false);
    }
  };

  const loadTraePath = async () => {
    setTraePathLoading(true);
    try {
      const path = await api.getTraePath();
      setTraePath(path);
    } catch (err: any) {
      console.error("获取 Trae IDE 路径失败:", err);
      setTraePath("");
    } finally {
      setTraePathLoading(false);
    }
  };

  useEffect(() => {
    loadTraeMachineId();
    loadTraePath();
  }, []);

  const handleCopyTraeMachineId = async () => {
    try {
      await navigator.clipboard.writeText(traeMachineId);
      onToast?.("success", "Trae IDE 机器码已复制到剪贴板");
    } catch {
      onToast?.("error", "复制失败");
    }
  };

  const handleClearTraeLoginState = async () => {
    if (!confirm("确定要清除 Trae IDE 登录状态吗？\n\n这将：\n• 重置 Trae IDE 机器码\n• 清除所有登录信息\n• 删除本地缓存数据\n\n操作后 Trae IDE 将变成全新安装状态，需要重新登录。\n\n请确保 Trae IDE 已关闭！")) {
      return;
    }

    setClearingTrae(true);
    try {
      await api.clearTraeLoginState();
      await loadTraeMachineId();
      onToast?.("success", "Trae IDE 登录状态已清除，请重新打开 Trae IDE 登录");
    } catch (err: any) {
      onToast?.("error", err.message || "清除失败");
    } finally {
      setClearingTrae(false);
    }
  };

  const handleScanTraePath = async () => {
    setScanning(true);
    try {
      const path = await api.scanTraePath();
      setTraePath(path);
      onToast?.("success", "已找到 Trae IDE: " + path);
    } catch (err: any) {
      onToast?.("error", err.message || "未找到 Trae IDE，请手动设置路径");
    } finally {
      setScanning(false);
    }
  };

  const handleSetTraePath = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Trae IDE", extensions: ["exe"] }],
        title: "选择 Trae.exe 文件",
      });

      if (selected) {
        const path = selected as string;
        await api.setTraePath(path);
        setTraePath(path);
        onToast?.("success", "Trae IDE 路径已保存");
      }
    } catch (err: any) {
      onToast?.("error", err.message || "选择文件失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* 机器码 */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">机器码</h3>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">MachineId</div>
              <div className="text-xs text-muted-foreground">客户端唯一标识符</div>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-muted px-3 py-2">
            <code className="text-sm break-all">{traeRefreshing ? "加载中..." : traeMachineId}</code>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadTraeMachineId} disabled={traeRefreshing}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyTraeMachineId} disabled={!traeMachineId || traeRefreshing || traeMachineId === "未找到"}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              复制
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearTraeLoginState} disabled={clearingTrae || traeRefreshing}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {clearingTrae ? "清除中..." : "清除登录状态"}
            </Button>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>清除登录状态会重置机器码并删除所有登录信息，客户端将需要重新登录。请先关闭客户端。</span>
          </div>
        </div>
      </div>

      {/* 路径设置 */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">客户端路径</h3>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">安装路径</div>
              <div className="text-xs text-muted-foreground">用于自动打开客户端</div>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-muted px-3 py-2">
            <code className="text-sm break-all">{traePathLoading ? "加载中..." : (traePath || "未设置")}</code>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleScanTraePath} disabled={scanning}>
              <Search className="mr-1.5 h-3.5 w-3.5" />
              {scanning ? "扫描中..." : "自动扫描"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSetTraePath}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              手动设置
            </Button>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border bg-blue-50 p-3 text-xs text-blue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>切换账号后会自动打开客户端。如果自动扫描找不到，请手动设置 Trae.exe 的完整路径。</span>
          </div>
        </div>
      </div>

      {/* 通用设置 */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">通用设置</h3>
        <div className="rounded-xl border bg-card divide-y">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-medium">自动刷新</div>
              <div className="text-xs text-muted-foreground">定时自动刷新账号使用量数据</div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-medium">刷新间隔</div>
              <div className="text-xs text-muted-foreground">自动刷新的时间间隔（分钟）</div>
            </div>
            <Select defaultValue="5">
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 分钟</SelectItem>
                <SelectItem value="10">10 分钟</SelectItem>
                <SelectItem value="30">30 分钟</SelectItem>
                <SelectItem value="60">60 分钟</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">数据管理</h3>
        <div className="rounded-xl border bg-card divide-y">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-medium">导出数据</div>
              <div className="text-xs text-muted-foreground">导出所有账号数据为 JSON 文件</div>
            </div>
            <Button variant="outline" size="sm">导出</Button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-medium">导入数据</div>
              <div className="text-xs text-muted-foreground">从 JSON 文件导入账号数据</div>
            </div>
            <Button variant="outline" size="sm">导入</Button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-medium text-destructive">清空数据</div>
              <div className="text-xs text-muted-foreground">删除所有账号数据（不可恢复）</div>
            </div>
            <Button variant="destructive" size="sm">清空</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

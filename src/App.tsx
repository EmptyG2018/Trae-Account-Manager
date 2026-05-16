import { useState, useEffect, useCallback } from "react";
import { Trash2, Upload, Download, RefreshCw, LayoutGrid, List, Plus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { AccountCard } from "./components/AccountCard";
import { AccountListItem } from "./components/AccountListItem";
import { AddAccountModal } from "./components/AddAccountModal";
import { ContextMenu } from "./components/ContextMenu";
import { DetailModal } from "./components/DetailModal";
import { Toast } from "./components/Toast";
import { ConfirmModal } from "./components/ConfirmModal";
import { InfoModal } from "./components/InfoModal";
import { UpdateTokenModal } from "./components/UpdateTokenModal";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";
import { useToast } from "./hooks/useToast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as api from "./api";
import type { AccountBrief, UsageSummary } from "./types";

interface AccountWithUsage extends AccountBrief {
  usage?: UsageSummary | null;
}

type ViewMode = "grid" | "list";

function App() {
  const [accounts, setAccounts] = useState<AccountWithUsage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [osType, setOsType] = useState<string>("unknown");

  const { toasts, addToast, removeToast } = useToast();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    accountId: string;
  } | null>(null);

  const [detailAccount, setDetailAccount] = useState<AccountWithUsage | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());

  const [updateTokenModal, setUpdateTokenModal] = useState<{
    accountId: string;
    accountName: string;
  } | null>(null);

  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    icon: string;
    sections: Array<{ title?: string; content: string; type?: "text" | "code" | "list" }>;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getAccounts();
      setAccounts(list.map((account) => ({ ...account, usage: undefined })));
      setLoading(false);

      if (list.length > 0) {
        const usageResults = await Promise.allSettled(
          list.map((account) => api.getAccountUsage(account.id))
        );
        setAccounts((prev) =>
          prev.map((account, index) => {
            const result = usageResults[index];
            return { ...account, usage: result.status === 'fulfilled' ? result.value : null };
          })
        );
      }
    } catch (err: any) {
      setError(err.message || "加载账号失败");
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { api.getOsType().then(setOsType); }, []);

  useEffect(() => {
    api.refreshAllTokens().then((refreshed) => {
      if (refreshed.length > 0) {
        console.log(`[INFO] 启动时自动刷新了 ${refreshed.length} 个 Token`);
        loadAccounts();
      }
    }).catch(console.error);

    const interval = setInterval(() => {
      api.refreshAllTokens().then((refreshed) => {
        if (refreshed.length > 0) {
          console.log(`[INFO] 定时自动刷新了 ${refreshed.length} 个 Token`);
          loadAccounts();
        }
      }).catch(console.error);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadAccounts]);

  const handleAddAccount = async (token: string, cookies?: string) => {
    await api.addAccountByToken(token, cookies);
    addToast("success", "账号添加成功");
    await loadAccounts();
  };

  const handleDeleteAccount = async (accountId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "删除账号",
      message: "确定要删除此账号吗？删除后无法恢复。",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.removeAccount(accountId);
          setSelectedIds((prev) => { const next = new Set(prev); next.delete(accountId); return next; });
          addToast("success", "账号已删除");
          await loadAccounts();
        } catch (err: any) {
          addToast("error", err.message || "删除账号失败");
        }
        setConfirmModal(null);
      },
    });
  };

  const handleRefreshAccount = async (accountId: string) => {
    if (refreshingIds.has(accountId)) return;
    setRefreshingIds((prev) => new Set(prev).add(accountId));
    try {
      const usage = await api.getAccountUsage(accountId);
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, usage } : a)));
      addToast("success", "数据刷新成功");
    } catch (err: any) {
      addToast("error", err.message || "刷新失败");
    } finally {
      setRefreshingIds((prev) => { const next = new Set(prev); next.delete(accountId); return next; });
    }
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === accounts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(accounts.map((a) => a.id)));
  };

  const handleContextMenu = (e: React.MouseEvent, accountId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, accountId });
  };

  const handleCopyToken = async (accountId: string) => {
    try {
      const account = await api.getAccount(accountId);
      if (account.jwt_token) {
        await navigator.clipboard.writeText(account.jwt_token);
        addToast("success", "Token 已复制到剪贴板");
      } else {
        addToast("warning", "该账号没有有效的 Token");
      }
    } catch (err: any) {
      addToast("error", err.message || "获取 Token 失败");
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    setConfirmModal({
      isOpen: true,
      title: "切换账号",
      message: `确定要切换到账号 "${account.email || account.name}" 吗？\n\n系统将自动关闭 Trae IDE 并切换登录信息。`,
      type: "warning",
      onConfirm: async () => {
        setConfirmModal(null);
        addToast("info", "正在切换账号，请稍候...");
        try {
          await api.switchAccount(accountId);
          await loadAccounts();
          addToast("success", "账号切换成功，请重新打开 Trae IDE");
        } catch (err: any) {
          addToast("error", err.message || "切换账号失败");
        }
      },
    });
  };

  const handleViewDetail = async (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      try {
        const fullAccount = await api.getAccount(accountId);
        setDetailAccount({ ...account, ...fullAccount });
      } catch (err: any) {
        addToast("error", "获取账号详情失败");
      }
    }
  };

  const handleUpdateToken = async (accountId: string, token: string) => {
    try {
      const usage = await api.updateAccountToken(accountId, token);
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, usage } : a)));
      addToast("success", "Token 更新成功，数据已刷新");
    } catch (err: any) {
      throw err;
    }
  };

  const handleOpenUpdateToken = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      setUpdateTokenModal({ accountId, accountName: account.email || account.name });
    }
  };

  const handleClaimGift = async (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    setConfirmModal({
      isOpen: true,
      title: "获取礼包",
      message: `确定要为账号 "${account.email || account.name}" 领取周年礼包吗？\n\n领取后将自动刷新账号额度。`,
      type: "info",
      onConfirm: async () => {
        setConfirmModal(null);
        addToast("info", "正在领取礼包，请稍候...");
        try {
          await api.claimGift(accountId);
          await handleRefreshAccount(accountId);
          addToast("success", "礼包领取成功！额度已更新");
        } catch (err: any) {
          addToast("error", err.message || "领取礼包失败");
        }
      },
    });
  };

  const handleShowExportInfo = () => {
    if (accounts.length === 0) { addToast("warning", "没有账号可以导出"); return; }
    setInfoModal({
      isOpen: true,
      title: "导出账号说明",
      icon: "📤",
      sections: [
        { title: "导出格式", content: "JSON 文件 (.json)", type: "text" },
        { title: "保存位置", content: "浏览器默认下载文件夹\n文件名格式：trae-accounts-YYYY-MM-DD.json", type: "text" },
        { title: "文件内容", content: "<ul><li>所有账号的完整信息</li><li>Token 和 Cookies 数据</li><li>使用量统计信息</li><li>账号创建和更新时间</li></ul>", type: "list" },
        { title: "导出后可以", content: "<ul><li>备份账号数据</li><li>迁移到其他设备</li><li>恢复误删的账号</li><li>分享给其他设备使用</li></ul>", type: "list" },
        { title: "安全提示", content: "<ul><li><strong>导出文件包含敏感信息</strong></li><li><strong>请妥善保管导出的文件</strong></li><li><strong>不要分享给他人</strong></li><li>建议加密存储导出文件</li></ul>", type: "list" },
        { content: `当前将导出 ${accounts.length} 个账号`, type: "text" },
      ],
      confirmText: "开始导出",
      onConfirm: () => { setInfoModal(null); handleExportAccounts(); },
    });
  };

  const handleExportAccounts = async () => {
    try {
      const data = await api.exportAccounts();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = `trae-accounts-${new Date().toISOString().split("T")[0]}.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("success", `已导出 ${accounts.length} 个账号到下载文件夹：${fileName}`);
    } catch (err: any) {
      addToast("error", err.message || "导出失败");
    }
  };

  const handleShowImportInfo = () => {
    setInfoModal({
      isOpen: true,
      title: "导入账号说明",
      icon: "📥",
      sections: [
        { title: "文件格式", content: "JSON 文件 (.json)", type: "text" },
        { title: "文件结构示例", content: `{\n  "accounts": [\n    {\n      "id": "账号ID",\n      "name": "用户名",\n      "email": "邮箱地址",\n      "jwt_token": "Token字符串",\n      "cookies": "Cookies字符串",\n      "plan_type": "套餐类型",\n      "created_at": 时间戳,\n      "is_active": true\n    }\n  ],\n  "active_account_id": "当前活跃账号ID",\n  "current_account_id": "当前使用账号ID"\n}`, type: "code" },
        { title: "导入步骤", content: "<ul><li>确认后选择 JSON 文件</li><li>系统自动验证格式</li><li>导入所有有效账号</li></ul>", type: "list" },
        { title: "注意事项", content: "<ul><li>仅支持本应用导出的格式</li><li>导入会自动跳过重复账号</li><li>建议定期备份账号数据</li></ul>", type: "list" },
      ],
      confirmText: "选择文件",
      onConfirm: () => { setInfoModal(null); handleImportAccounts(); },
    });
  };

  const handleImportAccounts = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const count = await api.importAccounts(text);
        addToast("success", `成功导入 ${count} 个账号`);
        await loadAccounts();
      } catch (err: any) {
        addToast("error", err.message || "导入失败");
      }
    };
    input.click();
  };

  const handleBatchRefresh = async () => {
    if (selectedIds.size === 0) { addToast("warning", "请先选择要刷新的账号"); return; }
    const ids = Array.from(selectedIds);
    addToast("info", `正在刷新 ${ids.length} 个账号...`);
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const usage = await api.getAccountUsage(id);
          setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, usage } : a)));
          return { id, success: true };
        } catch (err: any) {
          return { id, success: false, error: err.message };
        }
      })
    );
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failCount = ids.length - successCount;
    if (failCount === 0) addToast("success", `成功刷新 ${successCount} 个账号`);
    else addToast("warning", `刷新完成：${successCount} 成功，${failCount} 失败`);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) { addToast("warning", "请先选择要删除的账号"); return; }
    const ids = Array.from(selectedIds);
    setConfirmModal({
      isOpen: true,
      title: "批量删除",
      message: `确定要删除选中的 ${ids.length} 个账号吗？此操作无法撤销。`,
      type: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        addToast("info", `正在删除 ${ids.length} 个账号...`);
        const results = await Promise.allSettled(ids.map((id) => api.removeAccount(id)));
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const failCount = ids.length - successCount;
        setSelectedIds(new Set());
        await loadAccounts();
        if (failCount === 0) addToast("success", `成功删除 ${successCount} 个账号`);
        else addToast("warning", `删除完成：${successCount} 成功，${failCount} 失败`);
      },
    });
  };

  const handleDeleteExpiredAccounts = () => {
    const expiredAccounts = accounts.filter((account) => {
      if (!account.token_expired_at) return false;
      const expiry = new Date(account.token_expired_at).getTime();
      if (isNaN(expiry)) return false;
      return expiry < Date.now();
    });
    if (expiredAccounts.length === 0) { addToast("info", "没有找到过期或失效的账号"); return; }
    setConfirmModal({
      isOpen: true,
      title: "删除过期账号",
      message: `检测到 ${expiredAccounts.length} 个过期账号，确定要删除吗？此操作无法撤销。`,
      type: "warning",
      onConfirm: async () => {
        setConfirmModal(null);
        addToast("info", `正在删除 ${expiredAccounts.length} 个过期账号...`);
        const results = await Promise.allSettled(expiredAccounts.map((account) => api.removeAccount(account.id)));
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const failCount = expiredAccounts.length - successCount;
        setSelectedIds(new Set());
        await loadAccounts();
        if (failCount === 0) addToast("success", `成功删除 ${successCount} 个过期账号`);
        else addToast("warning", `删除完成：${successCount} 成功，${failCount} 失败`);
      },
    });
  };

  const expiredCount = accounts.filter((account) => {
    if (!account.token_expired_at) return false;
    const expiry = new Date(account.token_expired_at).getTime();
    if (isNaN(expiry)) return false;
    return expiry < Date.now();
  }).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TitleBar osType={osType} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} osType={osType} />

        <div className="flex flex-1 flex-col overflow-hidden">
        {error && (
          <div className="flex items-center justify-between bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {currentPage === "dashboard" && (
          <div
            className="flex-1 overflow-y-auto p-6"
            {...(osType === "macos" ? { "data-tauri-drag-region": true, onMouseDown: (e: React.MouseEvent) => { if (e.buttons === 1) getCurrentWindow().startDragging(); } } : {})}
          >
            <Dashboard accounts={accounts} />
          </div>
        )}

        {currentPage === "accounts" && (
          <>
            <header
              className="flex items-center justify-between px-6 py-4"
              {...(osType === "macos" ? { "data-tauri-drag-region": true, onMouseDown: (e: React.MouseEvent) => { if (e.buttons === 1) getCurrentWindow().startDragging(); } } : {})}
            >
              <div>
                <h2 className="text-lg font-semibold tracking-tight">账号管理</h2>
                <p className="mt-0.5 text-sm text-muted-foreground/70">管理您的账号</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">共 {accounts.length} 个账号</span>
                <Button variant="outline" size="sm" className="text-destructive" onClick={handleDeleteExpiredAccounts} disabled={accounts.length === 0}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  删除过期
                  {expiredCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">{expiredCount}</span>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShowImportInfo}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  导入
                </Button>
                <Button variant="outline" size="sm" onClick={handleShowExportInfo} disabled={accounts.length === 0}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  导出
                </Button>
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  添加账号
                </Button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
              {accounts.length > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-card px-4 py-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === accounts.length && accounts.length > 0}
                        onChange={handleSelectAll}
                      />
                      全选 ({selectedIds.size}/{accounts.length})
                    </label>
                    {selectedIds.size > 0 && (
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={handleBatchRefresh}>
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />
                          刷新
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          删除
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex rounded-lg bg-muted p-0.5">
                    <button
                      className={cn("rounded-md p-1.5 transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                      onClick={() => setViewMode("grid")}
                      title="卡片视图"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      className={cn("rounded-md p-1.5 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                      onClick={() => setViewMode("list")}
                      title="列表视图"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <div className="text-4xl">📋</div>
                  <h3 className="text-lg font-medium">暂无账号</h3>
                  <p className="text-sm text-muted-foreground">点击上方按钮添加账号，或导入已有账号</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAddModal(true)}>添加账号</Button>
                    <Button variant="outline" onClick={handleImportAccounts}>导入账号</Button>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
                  {accounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      usage={account.usage || null}
                      selected={selectedIds.has(account.id)}
                      onSelect={handleSelectAccount}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-card">
                  <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] items-center gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
                    <div className="w-5" />
                    <div className="w-8" />
                    <div>账号信息</div>
                    <div>套餐</div>
                    <div className="w-32">使用量</div>
                    <div className="text-center">添加时间</div>
                    <div>状态</div>
                    <div className="w-8" />
                  </div>
                  {accounts.map((account) => (
                    <AccountListItem
                      key={account.id}
                      account={account}
                      usage={account.usage || null}
                      selected={selectedIds.has(account.id)}
                      onSelect={handleSelectAccount}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </div>
              )}
            </main>
          </>
        )}

        {currentPage === "settings" && (
          <>
            <header
              className="px-6 py-4"
              {...(osType === "macos" ? { "data-tauri-drag-region": true, onMouseDown: (e: React.MouseEvent) => { if (e.buttons === 1) getCurrentWindow().startDragging(); } } : {})}
            >
              <h2 className="text-lg font-semibold tracking-tight">设置</h2>
              <p className="mt-0.5 text-sm text-muted-foreground/70">配置应用程序选项</p>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <Settings onToast={addToast} />
            </div>
          </>
        )}

        {currentPage === "about" && (
          <>
            <header
              className="px-6 py-4"
              {...(osType === "macos" ? { "data-tauri-drag-region": true, onMouseDown: (e: React.MouseEvent) => { if (e.buttons === 1) getCurrentWindow().startDragging(); } } : {})}
            >
              <h2 className="text-lg font-semibold tracking-tight">关于</h2>
              <p className="mt-0.5 text-sm text-muted-foreground/70">应用程序信息</p>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <About />
            </div>
          </>
        )}
        </div>
      </div>

      <Toast messages={toasts} onRemove={removeToast} />

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText="确定"
          cancelText="取消"
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {infoModal && (
        <InfoModal
          isOpen={infoModal.isOpen}
          title={infoModal.title}
          icon={infoModal.icon}
          sections={infoModal.sections}
          confirmText={infoModal.confirmText}
          onConfirm={infoModal.onConfirm}
          onCancel={() => setInfoModal(null)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onViewDetail={() => { handleViewDetail(contextMenu.accountId); setContextMenu(null); }}
          onRefresh={() => { handleRefreshAccount(contextMenu.accountId); setContextMenu(null); }}
          onUpdateToken={() => { handleOpenUpdateToken(contextMenu.accountId); setContextMenu(null); }}
          onCopyToken={() => { handleCopyToken(contextMenu.accountId); setContextMenu(null); }}
          onSwitchAccount={() => { handleSwitchAccount(contextMenu.accountId); setContextMenu(null); }}
          onClaimGift={() => { handleClaimGift(contextMenu.accountId); setContextMenu(null); }}
          onDelete={() => { handleDeleteAccount(contextMenu.accountId); setContextMenu(null); }}
          isCurrent={accounts.find(a => a.id === contextMenu.accountId)?.is_current || false}
        />
      )}

      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
        onToast={addToast}
        onAccountAdded={loadAccounts}
      />

      <DetailModal
        isOpen={!!detailAccount}
        onClose={() => setDetailAccount(null)}
        account={detailAccount}
        usage={detailAccount?.usage || null}
      />

      <UpdateTokenModal
        isOpen={!!updateTokenModal}
        accountId={updateTokenModal?.accountId || ""}
        accountName={updateTokenModal?.accountName || ""}
        onClose={() => setUpdateTokenModal(null)}
        onUpdate={handleUpdateToken}
      />
    </div>
  );
}

export default App;

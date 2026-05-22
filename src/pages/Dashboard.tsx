import { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers, Activity, Check, Clock, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UsageSummary } from "../types";
import { UsageEvents } from "../components/UsageEvents";

interface DashboardProps {
  accounts: Array<{
    id: string;
    name: string;
    email: string;
    usage?: UsageSummary | null;
    is_current?: boolean;
  }>;
}

const statCards = [
  { key: 'totalLimit', label: '总配额', sublabel: 'Fast Requests', icon: Layers, colorClass: 'bg-primary/10 text-primary', iconBg: 'bg-primary' },
  { key: 'totalUsed', label: '已使用', sublabel: 'usagePercent', icon: Activity, colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', iconBg: 'bg-sky-500' },
  { key: 'totalLeft', label: '剩余可用', sublabel: 'remainingPercent', icon: Check, colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500' },
  { key: 'avgUsed', label: '平均使用', sublabel: '每账号', icon: Clock, colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-500' },
];

export const Dashboard = memo(function Dashboard({ accounts }: DashboardProps) {
  const totalAccounts = accounts.length;

  const stats = accounts.reduce((acc, a) => {
    if (a.usage) {
      if (a.usage.fast_request_left > 0) acc.activeAccounts++;
      acc.totalUsed += a.usage.fast_request_used + a.usage.extra_fast_request_used;
      acc.totalLimit += a.usage.fast_request_limit + a.usage.extra_fast_request_limit;
      acc.totalLeft += a.usage.fast_request_left + a.usage.extra_fast_request_left;
      const planType = a.usage.plan_type || 'Free';
      acc.quotaMap.set(planType, (acc.quotaMap.get(planType) || 0) + 1);
    }
    return acc;
  }, {
    activeAccounts: 0,
    totalUsed: 0,
    totalLimit: 0,
    totalLeft: 0,
    quotaMap: new Map<string, number>()
  });

  const { activeAccounts, totalUsed, totalLimit, totalLeft, quotaMap } = stats;
  const usagePercent = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

  const pieData = [
    { name: '已使用', value: totalUsed, color: 'var(--primary)' },
    { name: '剩余', value: totalLeft, color: 'var(--muted)' },
  ];

  const quotaData = Array.from(quotaMap.entries()).map(([name, value]) => ({ name, value }));
  const CHART_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];

  const statValues: Record<string, number> = {
    totalLimit,
    totalUsed: Math.round(totalUsed),
    totalLeft: Math.round(totalLeft),
    avgUsed: totalAccounts > 0 ? Math.round(totalUsed / totalAccounts) : 0,
  };

  const statSublabels: Record<string, string> = {
    totalLimit: 'Fast Requests',
    totalUsed: `${usagePercent}% 使用率`,
    totalLeft: `${100 - usagePercent}% 剩余`,
    avgUsed: '每账号',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">欢迎回来</h1>
          <p className="mt-1 text-sm text-muted-foreground">账号使用概览</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums tracking-tight">{totalAccounts}</div>
            <div className="text-xs text-muted-foreground">账号总数</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums tracking-tight text-primary">{activeAccounts}</div>
            <div className="text-xs text-muted-foreground">可用账号</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
                  <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{statValues[card.key]}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground/70">{statSublabels[card.key]}</div>
                </div>
                <div className={cn("stat-icon text-white", card.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">使用量分布</h3>
            <Badge variant="secondary" className="font-mono">{usagePercent}%</Badge>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{Math.round(totalLeft)}</span>
              <span className="text-xs text-muted-foreground">剩余</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              已使用 ({Math.round(totalUsed)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
              剩余 ({Math.round(totalLeft)})
            </span>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold tracking-tight">套餐分布</h3>
          {quotaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={quotaData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {quotaData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-muted-foreground">
              <Zap className="h-8 w-8 opacity-30" />
              <span className="text-sm">暂无数据</span>
            </div>
          )}
        </div>
      </div>

      {accounts.length > 0 && (
        <>
          <UsageEvents accountId={accounts.find(a => a.is_current)?.id || accounts[0]?.id || ''} />

          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight">账号概览</h3>
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {accounts.length} 个账号
              </Badge>
            </div>
            <div className="space-y-1">
              {accounts.slice(0, 4).map((account) => {
                const used = account.usage ? account.usage.fast_request_used + account.usage.extra_fast_request_used : 0;
                const limit = account.usage ? account.usage.fast_request_limit + account.usage.extra_fast_request_limit : 0;
                const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;

                return (
                  <div key={account.id} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {(account.email || account.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{account.email || account.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{account.usage?.plan_type || 'Free'}</div>
                    </div>
                    <div className="flex w-36 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            percent > 80 ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-primary'
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-medium tabular-nums text-muted-foreground">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {accounts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">暂无账号数据</h3>
          <p className="text-sm text-muted-foreground">请先在"账号管理"中添加账号</p>
        </div>
      )}
    </div>
  );
});

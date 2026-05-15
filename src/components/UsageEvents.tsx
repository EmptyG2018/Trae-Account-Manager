import { useState, useEffect } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UsageEvent } from '../types';
import { getUsageEvents } from '../api';

interface UsageEventsProps {
  accountId: string;
  onError?: (error: string) => void;
}

type TimeFilter = 'today' | '7days' | '30days' | 'custom';

export function UsageEvents({ accountId, onError }: UsageEventsProps) {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [total, setTotal] = useState(0);

  const getTimeRange = (filter: TimeFilter): { startTime: number; endTime: number } => {
    const now = new Date();
    const endTime = Math.floor(now.getTime() / 1000);
    let startTime = 0;

    switch (filter) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startTime = Math.floor(todayStart.getTime() / 1000);
        break;
      case '7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        startTime = Math.floor(sevenDaysAgo.getTime() / 1000);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startTime = Math.floor(thirtyDaysAgo.getTime() / 1000);
        break;
      case 'custom':
        if (startDate) {
          startTime = Math.floor(new Date(startDate).getTime() / 1000);
        }
        if (endDate) {
          const customEndDate = new Date(endDate);
          customEndDate.setHours(23, 59, 59, 999);
          return { startTime, endTime: Math.floor(customEndDate.getTime() / 1000) };
        }
        break;
    }

    return { startTime, endTime };
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const loadEvents = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const { startTime, endTime } = getTimeRange(timeFilter);
      const response = await getUsageEvents(accountId, startTime, endTime, 1, 20);
      setEvents(response.user_usage_group_by_sessions || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load usage events:', error);
      onError?.('加载使用事件失败');
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [accountId, timeFilter, startDate, endDate]);

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    if (filter !== 'custom') {
      setShowDatePicker(false);
    }
  };

  const formatDateRange = () => {
    if (timeFilter === 'custom' && startDate && endDate) {
      return `${startDate} - ${endDate}`;
    }
    const { startTime, endTime } = getTimeRange(timeFilter);
    const start = new Date(startTime * 1000).toISOString().split('T')[0];
    const end = new Date(endTime * 1000).toISOString().split('T')[0];
    return `${start} - ${end}`;
  };

  const filters: { key: TimeFilter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7days', label: '7 days' },
    { key: '30days', label: '30 days' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">账号使用情况</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {filters.map((f) => (
              <button
                key={f.key}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  timeFilter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleTimeFilterChange(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowDatePicker(!showDatePicker)}>
            <span>{formatDateRange()}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showDatePicker && (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          />
          <Button
            size="sm"
            onClick={() => {
              setTimeFilter('custom');
              setShowDatePicker(false);
            }}
          >
            应用
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">加载中...</div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">暂无使用记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Mode</th>
                <th className="px-4 py-2.5">Model</th>
                <th className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    Bill (USD)
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </th>
                <th className="px-4 py-2.5">Request Cost</th>
                <th className="px-4 py-2.5">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.session_id} className="border-b last:border-0">
                  <td className="px-4 py-2.5">{formatTimestamp(event.usage_time)}</td>
                  <td className="px-4 py-2.5">{event.mode || '-'}</td>
                  <td className="px-4 py-2.5">{event.model_name}</td>
                  <td className="px-4 py-2.5">{event.cost_money_float > 0 ? `$${event.cost_money_float.toFixed(4)}` : 'N/A'}</td>
                  <td className="px-4 py-2.5">{event.amount_float}</td>
                  <td className="px-4 py-2.5">
                    {event.extra_info.input_token + event.extra_info.output_token}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({event.extra_info.input_token}↑ {event.extra_info.output_token}↓)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div className="text-right text-sm text-muted-foreground">共 {total} 条记录</div>
      )}
    </div>
  );
}

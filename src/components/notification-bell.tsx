'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck, AlertTriangle, TrendingUp, UserCheck, AlertCircle, Zap } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatDistanceToNow } from 'date-fns'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; colour: string }> = {
  APPETITE_BREACH:    { icon: AlertTriangle,  colour: 'text-amber-500' },
  KRI_RED:            { icon: AlertCircle,    colour: 'text-red-500' },
  KRI_AMBER:          { icon: AlertTriangle,  colour: 'text-amber-400' },
  RISK_ASSIGNED:      { icon: UserCheck,      colour: 'text-teal-500' },
  INCIDENT_CREATED:   { icon: AlertTriangle,  colour: 'text-orange-500' },
  ACTION_OVERDUE:     { icon: TrendingUp,     colour: 'text-red-400' },
  ASSESSMENT_COMPLETE:{ icon: TrendingUp,     colour: 'text-green-500' },
  SYSTEM:             { icon: Zap,            colour: 'text-slate-400' },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const utils = trpc.useUtils()
  const { data: countData } = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  })
  const { data: notifications } = trpc.notification.list.useQuery(
    { limit: 20 },
    { enabled: open }
  )
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate()
      utils.notification.list.invalidate()
    },
  })
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate()
      utils.notification.list.invalidate()
    },
  })

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const unread = countData?.count ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {!notifications || notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM
                const Icon = cfg.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate({ id: n.id })}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 ${!n.read ? 'bg-teal-50/40 dark:bg-teal-900/10' : ''}`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${cfg.colour}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${n.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useDroppable } from '@dnd-kit/core'

interface KanbanColumnProps {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({
  id,
  title,
  icon,
  color,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 flex flex-col bg-slate-800/50 rounded-xl border transition-colors ${
        isOver ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <h3 className="font-medium text-white">{title}</h3>
        </div>
        <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full">
          {count}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {children}
        {count === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No risks in this stage
          </div>
        )}
      </div>
    </div>
  )
}

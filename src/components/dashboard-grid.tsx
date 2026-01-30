'use client'

import { useState, useEffect } from 'react'
import { Lock, Unlock, RotateCcw } from 'lucide-react'

// Layout item interface
export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

interface DashboardWidget {
  id: string
  title: string
  component: React.ReactNode
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

interface DashboardGridProps {
  widgets: DashboardWidget[]
  defaultLayout: LayoutItem[]
  storageKey?: string
}

const STORAGE_KEY = 'vytl-dashboard-layout'

export function DashboardGrid({
  widgets,
  defaultLayout,
  storageKey = STORAGE_KEY,
}: DashboardGridProps) {
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout)
  const [isLocked, setIsLocked] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Load saved layout from localStorage
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as LayoutItem[]
        // Validate that all widget IDs exist in saved layout
        const widgetIds = new Set(widgets.map((w) => w.id))
        const validLayout = parsed.filter((l) => widgetIds.has(l.i))
        // Add any missing widgets from default layout
        const savedIds = new Set(validLayout.map((l) => l.i))
        for (const def of defaultLayout) {
          if (!savedIds.has(def.i)) {
            validLayout.push(def)
          }
        }
        setLayout(validLayout)
      }
    } catch {
      // Use default layout on error
    }
  }, [storageKey, widgets, defaultLayout])

  const resetLayout = () => {
    setLayout(defaultLayout)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage errors
    }
  }

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-slate-800 rounded-lg"></div>
          <div className="h-32 bg-slate-800 rounded-lg"></div>
          <div className="h-32 bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    )
  }

  // Sort widgets by layout position (y then x)
  const sortedWidgets = [...widgets].sort((a, b) => {
    const layoutA = layout.find((l) => l.i === a.id)
    const layoutB = layout.find((l) => l.i === b.id)
    if (!layoutA || !layoutB) return 0
    if (layoutA.y !== layoutB.y) return layoutA.y - layoutB.y
    return layoutA.x - layoutB.x
  })

  return (
    <div className="relative">
      {/* Grid Controls */}
      <div className="absolute -top-8 right-0 flex items-center gap-2 z-10">
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            isLocked
              ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
          }`}
          title={isLocked ? 'Layout locked' : 'Layout editable'}
        >
          {isLocked ? (
            <>
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3" />
              <span>Editing</span>
            </>
          )}
        </button>
        {!isLocked && (
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-2 py-1 text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 rounded transition-colors"
            title="Reset to default layout"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* CSS Grid Layout */}
      <div className="grid grid-cols-12 gap-3 auto-rows-[80px]">
        {sortedWidgets.map((widget) => {
          const layoutItem = layout.find((l) => l.i === widget.id)
          if (!layoutItem) return null

          return (
            <div
              key={widget.id}
              className={`bg-slate-800 rounded-lg border overflow-hidden transition-all ${
                isLocked ? 'border-slate-700' : 'border-teal-500/30 shadow-lg shadow-teal-500/5'
              }`}
              style={{
                gridColumn: `span ${layoutItem.w}`,
                gridRow: `span ${layoutItem.h}`,
              }}
            >
              {widget.component}
            </div>
          )
        })}
      </div>

      {/* Edit mode hint */}
      {!isLocked && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-teal-500/30 text-teal-400 px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          Layout customization coming soon • Click Lock to save
        </div>
      )}
    </div>
  )
}

// Widget wrapper component for consistent styling
export function DashboardWidget({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`h-full p-3 ${className}`}>{children}</div>
}

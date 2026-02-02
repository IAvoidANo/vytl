'use client'

import { useRef, useState, useEffect, createContext, useContext, ReactNode } from 'react'

// Context for widget dimensions
interface WidgetDimensions {
  width: number
  height: number
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const WidgetContext = createContext<WidgetDimensions>({
  width: 300,
  height: 200,
  size: 'md',
})

export function useWidgetSize() {
  return useContext(WidgetContext)
}

// Calculate size category based on dimensions
function getSizeCategory(width: number, height: number): WidgetDimensions['size'] {
  const area = width * height
  if (area < 30000) return 'xs'
  if (area < 60000) return 'sm'
  if (area < 120000) return 'md'
  if (area < 200000) return 'lg'
  return 'xl'
}

interface WidgetWrapperProps {
  children: ReactNode
  className?: string
  title?: string
  padding?: boolean
}

export function WidgetWrapper({ children, className = '', title, padding = true }: WidgetWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<WidgetDimensions>({
    width: 300,
    height: 200,
    size: 'md',
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({
          width,
          height,
          size: getSizeCategory(width, height),
        })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <WidgetContext.Provider value={dimensions}>
      <div ref={containerRef} className={`h-full flex flex-col ${className}`}>
        {title && (
          <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/30 flex-shrink-0">
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
          </div>
        )}
        <div className={`flex-1 min-h-0 overflow-hidden ${padding ? 'p-4' : ''}`}>
          {children}
        </div>
      </div>
    </WidgetContext.Provider>
  )
}

// Utility hook for responsive values based on widget size
export function useResponsiveValue<T>(values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T }, defaultValue: T): T {
  const { size } = useWidgetSize()

  const sizes: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'> = ['xs', 'sm', 'md', 'lg', 'xl']
  const currentIndex = sizes.indexOf(size)

  // Find the closest defined value at or below current size
  for (let i = currentIndex; i >= 0; i--) {
    const key = sizes[i]
    if (values[key] !== undefined) {
      return values[key] as T
    }
  }

  // Find the closest defined value above current size
  for (let i = currentIndex + 1; i < sizes.length; i++) {
    const key = sizes[i]
    if (values[key] !== undefined) {
      return values[key] as T
    }
  }

  return defaultValue
}

// Helper to calculate visible rows based on height
export function useVisibleRows(baseRowHeight: number = 40, minRows: number = 3): number {
  const { height } = useWidgetSize()
  const availableHeight = height - 60 // Account for header/padding
  const calculatedRows = Math.floor(availableHeight / baseRowHeight)
  return Math.max(minRows, calculatedRows)
}

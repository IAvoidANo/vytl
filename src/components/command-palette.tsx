'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  Users,
  Settings,
  Plus,
  Search,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { getRecentItems, RecentItem } from '@/lib/recent-items'

interface CommandPaletteProps {
  isAdmin?: boolean
}

export function CommandPalette({ isAdmin = false }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const router = useRouter()

  // Fetch risks for search
  const { data: risks } = trpc.risk.list.useQuery(undefined, {
    enabled: open && search.length > 0,
  })

  // Load recent items when opening
  useEffect(() => {
    if (open) {
      setRecentItems(getRecentItems())
    }
  }, [open])

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    setSearch('')
    command()
  }, [])

  // Filter risks based on search
  const filteredRisks = risks?.filter(risk =>
    risk.title.toLowerCase().includes(search.toLowerCase()) ||
    risk.refCode.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5) || []

  return (
    <>
      {/* Trigger button for mobile/discoverability */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-slate-300 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-600 rounded">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command Palette"
        className="fixed inset-0 z-50"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Dialog */}
        <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 border-b border-slate-700">
              <Search className="w-5 h-5 text-slate-500" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Type a command or search..."
                className="flex-1 py-4 bg-transparent text-white placeholder-slate-500 outline-none text-base"
              />
              <kbd className="px-2 py-1 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded">
                ESC
              </kbd>
            </div>

            {/* Content */}
            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-slate-500">
                No results found.
              </Command.Empty>

              {/* Quick Actions */}
              <Command.Group heading="Quick Actions" className="mb-2">
                <CommandItem
                  onSelect={() => runCommand(() => {
                    // Dispatch custom event to open risk form
                    window.dispatchEvent(new CustomEvent('vytl:create-risk'))
                    router.push('/risks')
                  })}
                >
                  <Plus className="w-4 h-4 text-teal-400" />
                  <span>Create New Risk</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-600" />
                </CommandItem>

                <CommandItem
                  onSelect={() => runCommand(() => {
                    window.dispatchEvent(new CustomEvent('vytl:create-kri'))
                    router.push('/kris')
                  })}
                >
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Create New KRI</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-600" />
                </CommandItem>

                <CommandItem
                  onSelect={() => runCommand(() => {
                    window.dispatchEvent(new CustomEvent('vytl:import-risks'))
                    router.push('/risks')
                  })}
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Import Risks from File</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-600" />
                </CommandItem>
              </Command.Group>

              {/* Navigation */}
              <Command.Group heading="Navigation" className="mb-2">
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Dashboard</span>
                </CommandItem>

                <CommandItem onSelect={() => runCommand(() => router.push('/risks'))}>
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  <span>Risk Register</span>
                </CommandItem>

                <CommandItem onSelect={() => runCommand(() => router.push('/kris'))}>
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>KRI Monitoring</span>
                </CommandItem>

                {isAdmin && (
                  <CommandItem onSelect={() => runCommand(() => router.push('/users'))}>
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Team Management</span>
                  </CommandItem>
                )}

                <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </CommandItem>
              </Command.Group>

              {/* Recent Items */}
              {recentItems.length > 0 && !search && (
                <Command.Group heading="Recent" className="mb-2">
                  {recentItems.map((item) => (
                    <CommandItem
                      key={`${item.type}-${item.id}`}
                      onSelect={() => runCommand(() => {
                        if (item.type === 'risk') {
                          router.push(`/risks/${item.id}`)
                        } else {
                          router.push('/kris')
                        }
                      })}
                    >
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="truncate">
                        {item.refCode && (
                          <span className="text-slate-500 mr-2">{item.refCode}</span>
                        )}
                        {item.title}
                      </span>
                    </CommandItem>
                  ))}
                </Command.Group>
              )}

              {/* Search Results */}
              {search && filteredRisks.length > 0 && (
                <Command.Group heading="Risks" className="mb-2">
                  {filteredRisks.map((risk) => (
                    <CommandItem
                      key={risk.id}
                      onSelect={() => runCommand(() => router.push(`/risks/${risk.id}`))}
                    >
                      <AlertTriangle className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 mr-2">{risk.refCode}</span>
                      <span className="truncate">{risk.title}</span>
                      <span className={`ml-auto px-1.5 py-0.5 text-xs rounded ${
                        risk.residualScore >= 15 ? 'bg-red-500/20 text-red-400' :
                        risk.residualScore >= 8 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {risk.residualScore}
                      </span>
                    </CommandItem>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded">esc</kbd>
                  close
                </span>
              </div>
              <span className="text-teal-400">Vytl</span>
            </div>
          </div>
        </div>
      </Command.Dialog>
    </>
  )
}

function CommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-300 data-[selected=true]:bg-slate-800 data-[selected=true]:text-white"
    >
      {children}
    </Command.Item>
  )
}

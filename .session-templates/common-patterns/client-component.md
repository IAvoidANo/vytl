# Client Component Pattern

## Basic tRPC Data Fetching

```tsx
'use client'

import { trpc } from '@/lib/trpc-client'
import { useState } from 'react'

export function ExampleList() {
  const { data: items, isLoading, error } = trpc.example.list.useQuery()
  const utils = trpc.useUtils()

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>
  }

  return (
    <div>
      {items?.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  )
}
```

## Mutation with Optimistic Update

```tsx
'use client'

import { trpc } from '@/lib/trpc-client'
import { useState } from 'react'

export function ExampleForm() {
  const [title, setTitle] = useState('')
  const utils = trpc.useUtils()

  const createMutation = trpc.example.create.useMutation({
    onSuccess: () => {
      utils.example.list.invalidate()  // Refetch list
      setTitle('')
    },
    onError: (error) => {
      console.error('Failed to create:', error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ title })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded px-3 py-2"
        disabled={createMutation.isPending}
      />
      <button
        type="submit"
        disabled={createMutation.isPending}
        className="bg-teal-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {createMutation.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

## Modal Pattern

```tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Usage:
function ParentComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Item">
        <ExampleForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </>
  )
}
```

## Table with Sorting

```tsx
'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type SortField = 'title' | 'createdAt' | 'status'
type SortDirection = 'asc' | 'desc'

export function SortableTable({ items }: { items: Item[] }) {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const modifier = sortDirection === 'asc' ? 1 : -1
      return aVal < bVal ? -1 * modifier : aVal > bVal ? 1 * modifier : 0
    })
  }, [items, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th onClick={() => handleSort('title')} className="cursor-pointer">
            Title <SortIcon field="title" />
          </th>
          {/* ... */}
        </tr>
      </thead>
      <tbody>
        {sortedItems.map((item) => (
          <tr key={item.id}>{/* ... */}</tr>
        ))}
      </tbody>
    </table>
  )
}
```

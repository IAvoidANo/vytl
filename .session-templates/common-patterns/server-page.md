# Server Page Pattern

## Protected Page with Data Fetching

```tsx
// src/app/example/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AppLayout } from '@/components/app-layout'
import { ExampleClient } from './example-client'

export default async function ExamplePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Server-side data fetching for initial data
  const initialData = await db.example.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <AppLayout>
      <ExampleClient
        userId={session.user.id}
        orgId={session.user.orgId}
        initialData={initialData}
      />
    </AppLayout>
  )
}
```

## Client Component for Interactive Features

```tsx
// src/app/example/example-client.tsx
'use client'

import { trpc } from '@/lib/trpc-client'

interface ExampleClientProps {
  userId: string
  orgId: string
  initialData: Example[]
}

export function ExampleClient({ userId, orgId, initialData }: ExampleClientProps) {
  // Use initialData for hydration, then tRPC takes over
  const { data: items } = trpc.example.list.useQuery(undefined, {
    initialData,
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Examples</h1>
      {/* Interactive content here */}
    </div>
  )
}
```

## Detail Page with Dynamic Route

```tsx
// src/app/example/[id]/page.tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { AppLayout } from '@/components/app-layout'
import { ExampleDetailClient } from './example-detail-client'

interface Props {
  params: { id: string }
}

export default async function ExampleDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const item = await db.example.findFirst({
    where: {
      id: params.id,
      orgId: session.user.orgId,  // Security: org scope
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  if (!item) {
    notFound()
  }

  return (
    <AppLayout>
      <ExampleDetailClient item={item} />
    </AppLayout>
  )
}
```

## Page with Tabs

```tsx
// src/app/example/[id]/example-detail-client.tsx
'use client'

import { useState } from 'react'

type TabId = 'overview' | 'history' | 'settings'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

export function ExampleDetailClient({ item }: { item: Example }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div>
      {/* Header */}
      <div className="border-b border-slate-700 mb-6">
        <h1 className="text-xl font-bold text-white mb-4">{item.title}</h1>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg p-6">
        {activeTab === 'overview' && <OverviewTab item={item} />}
        {activeTab === 'history' && <HistoryTab itemId={item.id} />}
        {activeTab === 'settings' && <SettingsTab item={item} />}
      </div>
    </div>
  )
}
```

## Styling Conventions

```tsx
// Dark theme base classes
const containerClasses = "bg-slate-900 text-white min-h-screen"
const cardClasses = "bg-slate-800 rounded-xl border border-slate-700 p-4"
const buttonPrimary = "bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
const buttonSecondary = "bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg"
const inputClasses = "bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
```

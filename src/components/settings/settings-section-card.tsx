interface SettingsSectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  badge?: string
}

export function SettingsSectionCard({ title, description, children, badge }: SettingsSectionCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {badge && (
          <span className="bg-secondary/10 text-secondary text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

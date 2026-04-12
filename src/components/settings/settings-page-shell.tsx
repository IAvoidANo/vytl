interface SettingsPageShellProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function SettingsPageShell({ title, description, action, children }: SettingsPageShellProps) {
  return (
    <div>
      <div className="flex items-start justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold font-heading text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
      {children}
    </div>
  )
}

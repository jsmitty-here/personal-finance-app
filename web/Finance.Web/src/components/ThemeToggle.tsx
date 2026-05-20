import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/context/useTheme'
import type { Theme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  collapsed?: boolean
}

const OPTIONS: { value: Theme; Icon: React.ElementType; label: string }[] = [
  { value: 'light', Icon: Sun, label: 'Light' },
  { value: 'dark', Icon: Moon, label: 'Dark' },
  { value: 'system', Icon: Monitor, label: 'System' },
]

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  if (collapsed) {
    const currentIndex = OPTIONS.findIndex(o => o.value === theme)
    const next = OPTIONS[(currentIndex + 1) % OPTIONS.length]
    const { Icon } = OPTIONS[currentIndex] ?? OPTIONS[0]
    return (
      <button
        type="button"
        onClick={() => setTheme(next.value)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={`Theme: ${theme}. Click to switch to ${next.label}`}
        title={`Theme: ${theme}`}
      >
        <Icon size={16} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="text-xs text-muted-foreground flex-1">Theme</span>
      {OPTIONS.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            theme === value
              ? 'bg-primary-subtle text-primary-subtle-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          aria-label={label}
          title={label}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

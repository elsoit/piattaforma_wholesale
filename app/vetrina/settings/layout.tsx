'use client'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Settings, Building2, Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const sidebarNavItems = [
  {
    title: 'Account',
    href: '/vetrina/settings/account',
    icon: Settings,
  },
  {
    title: 'Company',
    href: '/vetrina/settings/company',
    icon: Building2,
  },
  {
    title: 'Notifications',
    href: '/vetrina/settings/notifications',
    icon: Bell,
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header mobile */}
      <div className="fixed top-14 left-0 right-0 z-30 bg-background border-b md:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 py-3 sm:px-6 bg-background">
            <h2 className="text-lg font-semibold md:text-2xl md:font-bold tracking-tight">Settings</h2>
          </div>
          <ScrollArea className="w-full whitespace-nowrap bg-background scrollbar-hide">
            <div className="flex w-max space-x-4 px-4 pb-2">
              {sidebarNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    pathname === item.href
                      ? "bg-muted hover:bg-muted"
                      : "hover:bg-transparent hover:underline",
                    "justify-start"
                  )}
                >
                  <item.icon className="mr-2 h-3.5 w-3.5" />
                  {item.title}
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="flex flex-col md:flex-row px-4 sm:px-6 lg:px-8 pt-24 md:pt-28">
        {/* Desktop Navigation */}
        <aside className="hidden md:block w-[240px] flex-shrink-0">
          <div className="fixed">
            <div className="pb-6">
              <h2 className="text-xl font-bold">Settings</h2>
            </div>
            <nav className="grid gap-1">
              {sidebarNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    pathname === item.href
                      ? "bg-muted hover:bg-muted"
                      : "hover:bg-transparent hover:underline",
                    "justify-start"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 
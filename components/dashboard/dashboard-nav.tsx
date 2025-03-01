'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  {
    href: '/dashboard/products',
    label: 'Prodotts'
  },
  {
    href: '/dashboard/brands',
    label: 'Brand'
  },
  {
    href: '/dashboard/sizes',
    label: 'Taglie'
  },
  {
    href: '/dashboard/size-groups',
    label: 'Gruppi Taglie'
  },
  {
    href: '/dashboard/users',
    label: 'Utenti'
  },
  {
    href: '/dashboard/parametri',
    label: 'Parametri'
  }
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 border-b">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href
                    ? 'text-black dark:text-white border-b-2 border-primary pb-2'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/vetrina"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Vetrina
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 
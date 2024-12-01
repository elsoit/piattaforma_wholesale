'use client'

import Link from 'next/link'
import { Settings, Building2, Bell, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from '@/components/auth/logout-button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  userName?: string;
}

export function Header({ userName = 'User Name' }: HeaderProps) {
  const initials = userName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo e navigazione desktop */}
          <div className="flex items-center gap-6">
            <Logo className="h-8 w-auto" />
            <nav className="hidden md:flex gap-6">
              <Link 
                href="/vetrina/brands" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Brands
              </Link>
            </nav>
          </div>

          {/* Azioni desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-transparent"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative flex items-center gap-2 hover:bg-transparent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <Link href="/vetrina/account-settings">Account Settings</Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="flex items-center cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Company Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="flex items-center cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Menu mobile */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-base font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userName}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-4">
                  <Link 
                    href="/vetrina/brands" 
                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    Brands
                  </Link>
                </nav>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/vetrina/account-settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/company-settings" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Settings
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/notifications" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </Link>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      <LogoutButton />
                    </div>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

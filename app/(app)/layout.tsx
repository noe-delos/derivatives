'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { cn } from '@/lib/utils'

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isCollapsed, isHovered, setIsHovered } = useSidebar()

  const shouldExpand = !isCollapsed || isHovered

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex md:flex-col transition-all duration-300 relative z-20",
          shouldExpand ? "md:w-56" : "md:w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header showMenuButton onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  )
}
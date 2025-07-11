'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { BackofficeSidebar } from './sidebar'

interface MobileBackofficeSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileBackofficeSidebar({ open, onOpenChange }: MobileBackofficeSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-72">
        <BackofficeSidebar />
      </SheetContent>
    </Sheet>
  )
}
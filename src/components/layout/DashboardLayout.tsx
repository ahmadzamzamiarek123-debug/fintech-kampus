'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import Image from 'next/image'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-30 lg:hidden bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-outline p-2"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <Image 
              src="/logo-usg.png" 
              alt="USG Logo" 
              width={28} 
              height={28}
              className="object-contain"
            />
            <span className="font-semibold text-[var(--text-primary)]">Fintech USG</span>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop Theme Toggle */}
      <div className="hidden lg:block fixed top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

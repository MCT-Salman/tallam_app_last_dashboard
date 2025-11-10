// src\components\layout\DashboardLayout.jsx
import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          "sm:mt-20 lg:mt-0",
          sidebarCollapsed ? "lg:mr-24 md:mr-24 sm:mr-0" : "lg:mr-64 md:mr-64 sm:mr-0"
        )}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto pt-6">{children}</main>
      </div>
    </div>
  )
}

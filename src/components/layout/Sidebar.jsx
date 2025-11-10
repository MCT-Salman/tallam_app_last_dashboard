// src\components\layout\Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { LogOut, X, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { singleItems, sidebarGroups, mainItems } from "@/data/sidebarItems"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { useAuth } from "@/hooks/useAuth"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

// إضافة الـ CSS للمحتوى الرئيسي في الشاشات الصغيرة
const styles = `
  @media (max-width: 767px) {
    .mobile-sidebar-padding {
      padding-bottom: 70px !important;
    }
    
    /* تأكيد أن المحتوى الرئيسي لا يختفي خلف الشريط السفلي */
    main, .main-content, #root > div {
      padding-bottom: 5px;
    }
  }
`

// إضافة الـ styles للـ head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  if (!document.head.querySelector('[data-sidebar-mobile-styles]')) {
    styleElement.setAttribute('data-sidebar-mobile-styles', 'true')
    document.head.appendChild(styleElement)
  }
}

export function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({})
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    toast("هل أنت متأكد من تسجيل الخروج؟", {
      action: {
        label: "تسجيل الخروج",
        onClick: () => {
          logout()
          navigate("/login")
        },
      },
      cancel: {
        label: "إلغاء",
        onClick: () => {},
      },
    })
  }

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  // توسيع المجموعة التي تحتوي على العنصر النشط تلقائياً
  useEffect(() => {
    const activeGroup = sidebarGroups.find(group => 
      group.items.some(item => item.href === location.pathname)
    )
    if (activeGroup) {
      setExpandedGroups(prev => ({
        ...prev,
        [activeGroup.id]: true
      }))
    }
  }, [location.pathname])

  // إضافة class للـ body في الشاشات الصغيرة لإضافة padding-bottom
  useEffect(() => {
    const body = document.body
    const isMobile = window.innerWidth < 768
    
    if (isMobile) {
      body.classList.add('mobile-sidebar-padding')
    } else {
      body.classList.remove('mobile-sidebar-padding')
    }

    return () => {
      body.classList.remove('mobile-sidebar-padding')
    }
  }, [])

  // إضافة مستمع لتغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      const body = document.body
      const isMobile = window.innerWidth < 768
      
      if (isMobile) {
        body.classList.add('mobile-sidebar-padding')
      } else {
        body.classList.remove('mobile-sidebar-padding')
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <TooltipProvider>
      <>
        {/* Desktop Sidebar */}
        <div
          className={cn(
            "bg-card border-l border-border transition-all duration-300 flex flex-col fixed top-0 right-0 h-screen z-20 overflow-hidden",
            "hidden md:flex",
            collapsed ? "w-24" : "w-64"
          )}
          // style={{ zIndex: 60 }}
        >
          {/* Header - Fixed */}
          <div className={cn(
            "border-b border-border flex-shrink-0",
            collapsed ? "p-2" : "p-3"
          )}>
            <div className="flex items-center justify-between">
              <div className={cn(
                "flex items-center",
                collapsed ? "justify-center w-full" : "gap-3"
              )}>
                {!collapsed && (
                  <>
                    <img
                      src="/tallaam_logo2.png"
                      alt="تعلّم"
                      className="w-10 h-10 object-contain"
                    />
                    <span className="font-bold text-xl text-primary block">تعلّم</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className={cn(
                  "hover:bg-accent transition-colors flex items-center justify-center",
                  collapsed ? "w-95 h-14 !mx-auto p-0" : ""
                )}
              >
                {collapsed ? (
                  <img
                    src="/tallaam_logo2.png"
                    alt="تعلّم"
                    className="w-95 h-14 object-contain"
                  />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-primary max-h-[calc(100vh-150px)]">
            {/* العناصر المفردة (خارج الأكورديون) */}
            {singleItems.map(item => {
              const isActive = location.pathname === item.href
              const Icon = item.icon

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm font-medium",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent",
                        collapsed && "justify-center p-3 w-12 h-12 mx-auto rounded-lg"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="block">{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="left">
                      <p>{item.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}

            {/* العناصر المجمعة (داخل الأكورديون) */}
            {sidebarGroups.map(group => {
              const hasActiveItem = group.items.some(item => location.pathname === item.href)
              const isGroupExpanded = expandedGroups[group.id] || hasActiveItem

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group Header */}
                  {!collapsed && (
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        hasActiveItem 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="flex items-center gap-2">
                        <group.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{group.title}</span>
                      </div>
                      {isGroupExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  {/* Group Items */}
                  {(isGroupExpanded || collapsed) && group.items.map(item => {
                    const isActive = location.pathname === item.href
                    const Icon = item.icon

                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent",
                              collapsed && "justify-center p-2 w-10 h-10 mx-auto rounded-lg",
                              !collapsed && "mr-4"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {!collapsed && <span className="block text-xs">{item.title}</span>}
                          </Link>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="left">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Footer - Fixed */}
          <div className={cn(
            "border-t border-border flex-shrink-0",
            collapsed ? "p-2" : "p-4"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "cursor-pointer bg-secondary text-white hover:text-foreground hover:bg-accent rounded-lg transition-colors",
                    collapsed ? "w-12 h-12 mx-auto p-3 flex items-center justify-center" : "w-full flex items-center gap-3 px-3 py-3"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>تسجيل الخروج</span>}
                </div>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="left">
                  <p>تسجيل الخروج</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-around px-2 py-2.5">
            {mainItems.map(item => {
              const isActive = location.pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.title}</span>
                </Link>
              )
            })}
            
            {/* More Items Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="flex flex-col items-center gap-1 p-2 h-auto hover:bg-accent"
            >
              {mobileExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
              <span className="text-xs">المزيد</span>
            </Button>
          </div>

          {/* Expanded Menu */}
          {mobileExpanded && (
            <div className="border-t border-border bg-card max-h-80 overflow-y-auto">
              <div className="p-4">
                {/* Logo and Title */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                  <img
                    src="/tallaam_logo2.png"
                    alt="تعلّم"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="font-bold text-lg text-primary">تعلّم</span>
                </div>

                {/* All Menu Items */}
                <div className="space-y-2">
                  {/* العناصر المفردة أولاً */}
                  {singleItems.map(item => {
                    const isActive = location.pathname === item.href
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileExpanded(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm font-medium",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    )
                  })}

                  {/* العناصر المجمعة */}
                  {sidebarGroups.map(group => (
                    <div key={group.id} className="space-y-1">
                      {/* Group Header */}
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-accent cursor-pointer"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <div className="flex items-center gap-2">
                          <group.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{group.title}</span>
                        </div>
                        {expandedGroups[group.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>

                      {/* Group Items */}
                      {expandedGroups[group.id] && group.items.map(item => {
                        const isActive = location.pathname === item.href
                        const Icon = item.icon

                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileExpanded(false)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        )
                      })}
                    </div>
                  ))}

                  {/* Logout Button */}
                  <LogoutButton 
                    variant="ghost" 
                    className="flex cursor-pointer items-center gap-3 px-3 py-3 text-sm font-medium bg-secondary text-white hover:text-foreground hover:bg-accent justify-start mt-4"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Overlay */}
        {mobileExpanded && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileExpanded(false)}
          />
        )}
      </>
    </TooltipProvider>
  )
}
// src\components\layout\Header.jsx
import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import React from "react"
import { LogoutButton } from "@/components/auth/LogoutButton"

// إضافة الـ CSS للمحتوى الرئيسي لتجنب التغطية
const headerStyles = `
  /* مساحة للهيدر الثابت في الشاشات الكبيرة */
  @media (min-width: 768px) {
    .header-padding {
      padding-top: 80px !important;
    }
    
    main, .main-content, .content-wrapper {
      padding-top: 5px;
    }
  }
  
  /* مساحة مخففة للهيدر في الشاشات الصغيرة */
  @media (max-width: 767px) {
    .header-padding {
      padding-top: 70px !important;
    }
    
    main, .main-content, .content-wrapper {
      padding-top: 5px;
      /* مساحة مخففة للشريط السفلي في الموبايل */
      padding-bottom: 20px;
    }
  }
`

// إضافة الـ styles للـ head
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style')
    styleElement.textContent = headerStyles
    if (!document.head.querySelector('[data-header-fixed-styles]')) {
        styleElement.setAttribute('data-header-fixed-styles', 'true')
        document.head.appendChild(styleElement)
    }
}



export function Header({ sidebarCollapsed = false }) {
    // إضافة class للـ body لضمان المساحة الصحيحة
    React.useEffect(() => {
        const body = document.body
        body.classList.add('header-padding')

        // تنظيف عند إزالة المكون
        return () => {
            body.classList.remove('header-padding')
        }
    }, [])

    return (
        <header className={`bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 fixed top-0 left-0 right-0 z-50 shadow-sm
                      transition-all duration-300
                      ${sidebarCollapsed
                ? 'md:mr-24 lg:mr-24'
                : 'md:mr-64 lg:mr-64'
            }`}>
            <div className="flex items-center justify-between max-w-full">
                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="البحث..."
                            className="pr-10 bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-secondary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                            3
                        </span>
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-10 w-10 rounded-full hover:bg-accent"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src="/avatar-placeholder.png" alt="المستخدم" />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        <User className="w-5 h-5" />
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">أحمد محمد</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        ahmed@taalam.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer hover:bg-accent">
                                الملف الشخصي
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-accent">
                                الإعدادات
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-accent">
                                المساعدة
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer hover:bg-destructive/10">
                                <LogoutButton 
                                    variant="ghost" 
                                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium bg-secondary text-white cursor-pointer hover:text-foreground hover:bg-accent justify-start w-full h-auto"
                                />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
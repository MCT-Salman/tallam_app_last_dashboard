// src\components\layout\Header.jsx
import { User, Settings, FileText, HelpCircle, CreditCard, BookOpen, Bell, DollarSign, Percent, User as UserIcon, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import React, { useContext } from "react"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { AuthContext } from "@/contexts/AuthContext"

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
    const { user } = useContext(AuthContext)
    
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
            <div className="flex items-center justify-end max-w-full">
                {/* Search */}
                {/* <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="البحث..."
                            className="pr-10 bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div> */}

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    {/* <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-secondary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                            3
                        </span>
                    </Button> */}

                    {/* User Menu */}
                    <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-10 w-10 rounded-full hover:bg-accent"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user?.avatar || "/avatar-placeholder.png"} alt={user?.name || "المستخدم"} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user?.name ? 
                                            user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                                            <User className="w-5 h-5" />
                                        }
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 p-2 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800" align="end">
                            <DropdownMenuLabel className="p-3 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user?.avatar} alt={user?.name} />
                                        <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20">
                                            {user?.name ? 
                                                user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                                                <User className="w-4 h-4" />
                                            }
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {user?.name || 'مستخدم'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {user?.role === 'ADMIN' ? 'مدير النظام' : 'مستخدم'}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuGroup className="py-1">
                                {/* <DropdownMenuItem asChild>
                                    <Link to="/accounts" className="w-full flex items-center gap-2 cursor-pointer hover:bg-accent">
                                        <UserIcon className="w-4 h-4" />
                                        <span>حسابي</span>
                                    </Link>
                                </DropdownMenuItem> */}

                                <DropdownMenuItem asChild>
                                    <Link to="/courses" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">الدورات</span>
                                    </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem asChild>
                                    <Link to="/accesscode" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">أكواد الشراء</span>
                                    </Link>
                                </DropdownMenuItem>
                                
                                
                                
                                <DropdownMenuItem asChild>
                                    <Link to="/notifications" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="relative">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                                <Bell className="w-4 h-4" />
                                            </div>
                                            {/* <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                                                3
                                            </span> */}
                                        </div>
                                        <div className="flex items-center justify-between flex-1">
                                            <span className="font-medium">الإشعارات</span>
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                                
                                {user?.role === 'admin' && (
                                    <DropdownMenuItem asChild>
                                        <Link to="/admin-accounts" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">لوحة التحكم</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem asChild>
                                    <Link to="/settings" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            <Settings className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">الإعدادات</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            
                            <div className="p-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <LogoutButton 
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                />
                            </div>
                            
                            {/* <DropdownMenuItem className="p-0 m-0">
                                <LogoutButton 
                                    variant="ghost" 
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium w-full h-auto justify-end hover:bg-destructive/10 hover:text-destructive"
                                />
                            </DropdownMenuItem> */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
// src\data\sidebarItems.js
import { 
  Home, 
  BookOpen, 
  Users, 
  Settings, 
  User, 
  BarChart3, 
  Bell, 
  DollarSign, 
  Megaphone, 
  Ticket, 
  Percent, 
  UserCheck, 
  MessageSquare, 
  Link as LinkIcon, 
  Image, 
  FolderOpen, 
  Star, 
  User2, 
  CreditCard, 
  Book,
  Shield,
  FileText
} from "lucide-react"

// العناصر الفردية (خارج الأكورديون)
export const singleItems = [
  {
    title: "الرئيسية",
    href: "/dashboard",
    icon: Home
  }
]

// العناصر المجمعة (داخل الأكورديون)
export const sidebarGroups = [
   {
    id: "courses",
    title: "إدارة المحتوى",
    icon: Book,
    items: [
      {
        title: "إدارة الدورات",
        href: "/courses",
        icon: BookOpen
      },
      {
        title: "القصص والإعلانات",
        href: "/stories",
        icon: Image
      },
      {
        title: "الإشعارات",
        href: "/notifications",
        icon: Bell
      },
    ]
  },
  {
    id: "sales",
    title: "المبيعات والخصومات",
    icon: DollarSign,
    items: [
      {
        title: "أكواد الشراء",
        href: "/accesscode",
        icon: Ticket
      },
      {
        title: "كوبونات الخصم",
        href: "/coupons",
        icon: Percent
      }
    ]
  },
  {
    id: "reports",
    title: "التقارير والاستعلامات",
    icon: BarChart3,
    items: [
      {
        title: "المعاملات المالية",
        href: "/transactions",
        icon: CreditCard
      },
      {
        title: "مشتركو المستويات",
        href: "/reports/level-subscribers",
        icon: Users
      },
      {
        title: "تقرير المدرسين",
        href: "/reports/teacher",
        icon: FileText
      },
      {
        title: "التقييمات",
        href: "/reviews",
        icon: Star
      }
    ]
  },
  {
    id: "app-management",
    title: "إدارة التطبيق",
    icon: Settings,
    items: [
      {
        title: "حسابات الطلاب",
        href: "/accounts",
        icon: User2
      },
      {
        title: "حسابات المدراء",
        href: "/admin-accounts",
        icon: Shield
      },
      {
        title: "الإعدادات",
        href: "/settings",
        icon: Settings
      }
    ]
  },
]

// العناصر الأساسية للعرض في الشاشات الصغيرة
export const mainItems = [
  { title: "الرئيسية", href: "/dashboard", icon: Home },
  { title: "الحسابات", href: "/accounts", icon: Users },
  { title: "الدورات", href: "/courses", icon: BookOpen },
  { title: "التقارير", href: "/transactions", icon: BarChart3 }
]

// حفظ البيانات القديمة للتوافق
export const sidebarItems = [...singleItems, ...sidebarGroups.flatMap(group => group.items)]
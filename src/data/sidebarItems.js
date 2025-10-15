// src\data\sidebarItems.js
// src\data\sidebarItems.js
import { Home, BookOpen, Users, Settings, User, BarChart3, Bell, DollarSign, Megaphone,Ticket, Percent, UserCheck, MessageSquare, Link as LinkIcon, Image, FolderOpen, Star} from "lucide-react"

export const sidebarItems = [
  {
    title: "الرئيسية",
    href: "/dashboard",
    icon: Home
  },
    {
    title: "إدارة الحسابات",
    href: "/accounts",
    icon: Users
  },
  {
    title: "إدارة الدورات",
    href: "/courses",
    icon: BookOpen
  },
  {
    title: "أكواد الشراء",
    href: "/accesscode",
    icon: Ticket
  },
    {
    title: "كوبونات الخصم",
    href: "/coupons",
    icon: Percent
  },
  // {
  //   title: "إدارة الاختبارات",
  //   href: "/quizzes",
  //   icon: MessageSquare
  // },
  // {
  //   title: "إدارة الملفات",
  //   href: "/files",
  //   icon: FolderOpen
  // },
  {
    title: "إدارة المعاملات",
    href: "/transactions",
    icon: DollarSign
  },
  {
    title: "الإدارة المالية",
    href: "/financial",
    icon: BarChart3
  },
  // {
  //   title: "إدارة الإعلانات",
  //   href: "/ads",
  //   icon: Megaphone
  // },
  {
    title: "إدارة القصص",
    href: "/stories",
    icon: Image
  },
    {
    title: "الإشعارات",
    href: "/notifications",
    icon: Bell
  },
  // {
  //   title: "المدراء الفرعيين",
  //   href: "/sub-admins",
  //   icon: UserCheck
  // },
  {
    title: "التقييمات",
    href: "/reviews",
    icon: Star
  },
  // {
  //   title: "المقترحات",
  //   href: "/suggestions",
  //   icon: MessageSquare
  // },
  // {
  //   title: "التحقق من الروابط",
  //   href: "/link-verification",
  //   icon: LinkIcon
  // },

  // {
  //   title: "إعدادات الإدارة",
  //   href: "/settings",
  //   icon: Settings
  // },
  // {
  //   title: "الملف الشخصي",
  //   href: "/profile",
  //   icon: User
  // },
  {
    title: "الإعدادات",
    href: "/settings",
    icon: Settings
  }
]

// العناصر الأساسية للعرض في الشاشات الصغيرة
export const mainItems = [
  { title: "الرئيسية", href: "/dashboard", icon: Home },
  { title: "الدورات", href: "/courses", icon: BookOpen },
  { title: "الطلاب والمستخدمين", href: "/users", icon: Users },
  { title: "المعاملات", href: "/transactions", icon: DollarSign }
]
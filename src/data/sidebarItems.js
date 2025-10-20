// // src\data\sidebarItems.js
// // src\data\sidebarItems.js
// import { Home, BookOpen, Users, Settings, User, BarChart3, Bell, DollarSign, Megaphone,Ticket, Percent, UserCheck, MessageSquare, Link as LinkIcon, Image, FolderOpen, Star, User2} from "lucide-react"

// export const sidebarItems = [
//   {
//     title: "الرئيسية",
//     href: "/dashboard",
//     icon: Home
//   },
//     {
//     title: "إدارة الحسابات",
//     href: "/accounts",
//     icon: User2
//   },
//     {
//     title: "إدارة حسابات المدراء",
//     href: "/admin-accounts",
//     icon: Users
//   },
//   {
//     title: "إدارة الدورات",
//     href: "/courses",
//     icon: BookOpen
//   },
//   {
//     title: "أكواد الشراء",
//     href: "/accesscode",
//     icon: Ticket
//   },
//     {
//     title: "كوبونات الخصم",
//     href: "/coupons",
//     icon: Percent
//   },
//   // {
//   //   title: "إدارة الاختبارات",
//   //   href: "/quizzes",
//   //   icon: MessageSquare
//   // },
//   // {
//   //   title: "إدارة الملفات",
//   //   href: "/files",
//   //   icon: FolderOpen
//   // },
//   {
//     title: "إدارة المعاملات المالية",
//     href: "/transactions",
//     icon: DollarSign
//   },
//   // {
//   //   title: "الإدارة المالية",
//   //   href: "/financial",
//   //   icon: BarChart3
//   // },
//   // {
//   //   title: "إدارة الإعلانات",
//   //   href: "/ads",
//   //   icon: Megaphone
//   // },
//   {
//     title: "إدارة القصص",
//     href: "/stories",
//     icon: Image
//   },
//     {
//     title: "الإشعارات",
//     href: "/notifications",
//     icon: Bell
//   },
//   // {
//   //   title: "المدراء الفرعيين",
//   //   href: "/sub-admins",
//   //   icon: UserCheck
//   // },
//   {
//     title: "التقييمات",
//     href: "/reviews",
//     icon: Star
//   },
//   // {
//   //   title: "المقترحات",
//   //   href: "/suggestions",
//   //   icon: MessageSquare
//   // },
//   // {
//   //   title: "التحقق من الروابط",
//   //   href: "/link-verification",
//   //   icon: LinkIcon
//   // },

//   // {
//   //   title: "إعدادات الإدارة",
//   //   href: "/settings",
//   //   icon: Settings
//   // },
//   // {
//   //   title: "الملف الشخصي",
//   //   href: "/profile",
//   //   icon: User
//   // },
//   {
//     title: "الإعدادات",
//     href: "/settings",
//     icon: Settings
//   }
// ]

// // العناصر الأساسية للعرض في الشاشات الصغيرة
// export const mainItems = [
//   { title: "الرئيسية", href: "/dashboard", icon: Home },
//   { title: "الدورات", href: "/courses", icon: BookOpen },
//   { title: "الطلاب والمستخدمين", href: "/users", icon: Users },
//   { title: "المعاملات", href: "/transactions", icon: DollarSign }
// ]



// src\data\sidebarItems.js
import { 
  Home, BookOpen, Users, Settings, DollarSign, 
  Ticket, Percent, Image, Bell, Star, User2, Shield,
  CreditCard, BarChart3, Book
} from "lucide-react"

// العناصر المفردة (خارج الأكورديون)
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
        title: "القصص",
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
        title: "التقييمات",
        href: "/reviews",
        icon: Star
      }
    ]
  }
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
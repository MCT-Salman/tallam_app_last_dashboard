// import * as React from "react"
// import * as TabsPrimitive from "@radix-ui/react-tabs"

// import { cn } from "@/lib/utils"

// const Tabs = TabsPrimitive.Root

// const TabsList = React.forwardRef(({ className, ...props }, ref) => (
//   <TabsPrimitive.List
//     ref={ref}
//     className={cn(
//       "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
//       className
//     )}
//     dir="rtl"
//     {...props}
//   />
// ))
// TabsList.displayName = TabsPrimitive.List.displayName

// const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
//   <TabsPrimitive.Trigger
//     ref={ref}
//     className={cn(
//       "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
//       className
//     )}
//     dir="rtl"
//     {...props}
//   />
// ))
// TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
//   <TabsPrimitive.Content
//     ref={ref}
//     className={cn(
//       "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
//       className
//     )}
//     dir="rtl"
//     {...props}
//   />
// ))
// TabsContent.displayName = TabsPrimitive.Content.displayName

// export { Tabs, TabsList, TabsTrigger, TabsContent }


import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // التصميم الأساسي المعدل
      "inline-flex h-14 items-center justify-center rounded-2xl p-2 w-full",
      // خلفية شفافة بدون تأثيرات مبالغ فيها
      "bg-background/80 backdrop-blur-md border border-border/50",
      // ظلال بسيطة
      "shadow-lg shadow-black/5",
      // تدرج خفيف
      "bg-gradient-to-br from-background/90 to-muted/30",
      className
    )}
    dir="rtl"
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // التصميم الأساسي المعدل
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold flex-1",
      // الانتقالات
      "transition-all duration-300 ease-in-out",
      // الألوان في الحالة العادية
      "text-muted-foreground/80 hover:text-foreground hover:bg-muted/60",
      // الحالة النشطة - تصميم واضح
      "data-[state=active]:bg-background data-[state=active]:text-foreground",
      "data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/30",
      // تأثير بسيط في الحالة النشطة
      "data-[state=active]:scale-[1.02]",
      // حدود سفلية متحركة
      "relative after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 after:content-['']",
      "data-[state=active]:after:w-4/5 data-[state=active]:after:left-1/10",
      // التركيز
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      // التعطيل
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    dir="rtl"
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // التصميم الأساسي المعدل
      "mt-4 p-6 rounded-xl w-full",
      // خلفية عادية بدون تأثيرات معقدة
      "bg-background border border-border/30",
      // ظلال بسيطة
      "shadow-sm",
      // رسوم متحركة خفيفة
      "animate-in fade-in-50 duration-300",
      // التركيز
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    dir="rtl"
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
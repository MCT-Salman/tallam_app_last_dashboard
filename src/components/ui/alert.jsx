// import * as React from "react"
// import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

// import { cn } from "@/lib/utils"
// import { buttonVariants } from "@/components/ui/button"

// const AlertDialog = AlertDialogPrimitive.Root

// const AlertDialogTrigger = AlertDialogPrimitive.Trigger

// const AlertDialogPortal = AlertDialogPrimitive.Portal

// const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
//   <AlertDialogPrimitive.Overlay
//     className={cn(
//       "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
//       className
//     )}
//     {...props}
//     ref={ref}
//   />
// ))
// AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

// const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
//   <AlertDialogPortal>
//     <AlertDialogOverlay />
//     <AlertDialogPrimitive.Content
//       ref={ref}
//       className={cn(
//         "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
//         className
//       )}
//       {...props}
//     />
//   </AlertDialogPortal>
// ))
// AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

// const AlertDialogHeader = ({ className, ...props }) => (
//   <div
//     className={cn(
//       "flex flex-col space-y-2 text-center sm:text-left",
//       className
//     )}
//     {...props}
//   />
// )
// AlertDialogHeader.displayName = "AlertDialogHeader"

// const AlertDialogFooter = ({ className, ...props }) => (
//   <div
//     className={cn(
//       "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
//       className
//     )}
//     {...props}
//   />
// )
// AlertDialogFooter.displayName = "AlertDialogFooter"

// const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
//   <AlertDialogPrimitive.Title
//     ref={ref}
//     className={cn("text-lg font-semibold", className)}
//     {...props}
//   />
// ))
// AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

// const AlertDialogDescription = React.forwardRef(
//   ({ className, ...props }, ref) => (
//     <AlertDialogPrimitive.Description
//       ref={ref}
//       className={cn("text-sm text-muted-foreground", className)}
//       {...props}
//     />
//   )
// )
// AlertDialogDescription.displayName =
//   AlertDialogPrimitive.Description.displayName

// const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
//   <AlertDialogPrimitive.Action
//     ref={ref}
//     className={cn(buttonVariants(), className)}
//     {...props}
//   />
// ))
// AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

// const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
//   <AlertDialogPrimitive.Cancel
//     ref={ref}
//     className={cn(
//       buttonVariants({ variant: "outline" }),
//       "mt-2 sm:mt-0",
//       className
//     )}
//     {...props}
//   />
// ))
// AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

// export {
//   AlertDialog,
//   AlertDialogPortal,
//   AlertDialogOverlay,
//   AlertDialogTrigger,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogFooter,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogAction,
//   AlertDialogCancel
// }


import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-gradient-to-br from-black/90 via-purple-900/20 to-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef(({ 
  className, 
  variant = "default",
  showIcon = false,
  icon: IconComponent,
  ...props 
}, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-0 bg-white p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-purple-800/5 before:via-transparent before:to-yellow-800/5 before:content-['']",
        className
      )}
      {...props}
    >
      {/* Animated Border */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-800 to-yellow-800 opacity-20" />
      
      {/* Header Icon */}
      {showIcon && IconComponent && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <div className="p-3 rounded-full bg-white shadow-2xl border border-gray-200">
            <IconComponent className={cn(
              "h-6 w-6",
              variant === "warning" && "text-yellow-600",
              variant === "error" && "text-red-600",
              variant === "success" && "text-green-600",
              variant === "info" && "text-blue-600",
              variant === "default" && "text-purple-600"
            )} />
          </div>
        </div>
      )}
      
      <div className="relative z-10 p-8">
        {props.children}
      </div>
      
      {/* Close Button */}
      <AlertDialogPrimitive.Cancel className="absolute left-4 top-4 rounded-full bg-gray-100 p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4 text-gray-700" />
        <span className="sr-only">Close</span>
      </AlertDialogPrimitive.Cancel>
    </AlertDialogPrimitive.Content>
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-3 text-center sm:text-left pb-4",
      "border-b border-gray-100",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 sm:space-x-reverse pt-4",
      "border-t border-gray-100",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-bold text-center",
      "bg-gradient-to-r from-purple-800 to-yellow-800 bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn(
        "text-lg text-gray-700 text-center leading-relaxed", 
        className
      )}
      {...props}
    />
  )
)
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef(({ 
  className, 
  variant = "default",
  ...props 
}, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      buttonVariants({ 
        variant: variant === "destructive" ? "destructive" : "default" 
      }),
      "min-w-24",
      className
    )}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "min-w-24 border-2 border-gray-300 text-gray-700 hover:bg-gray-50",
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

// Helper components for different alert types
const AlertDialogWarning = React.forwardRef(({ children, ...props }, ref) => (
  <AlertDialogContent 
    ref={ref} 
    variant="warning" 
    showIcon 
    icon={AlertTriangle}
    {...props}
  >
    {children}
  </AlertDialogContent>
))

const AlertDialogError = React.forwardRef(({ children, ...props }, ref) => (
  <AlertDialogContent 
    ref={ref} 
    variant="error" 
    showIcon 
    icon={AlertCircle}
    {...props}
  >
    {children}
  </AlertDialogContent>
))

const AlertDialogSuccess = React.forwardRef(({ children, ...props }, ref) => (
  <AlertDialogContent 
    ref={ref} 
    variant="success" 
    showIcon 
    icon={CheckCircle}
    {...props}
  >
    {children}
  </AlertDialogContent>
))

const AlertDialogInfo = React.forwardRef(({ children, ...props }, ref) => (
  <AlertDialogContent 
    ref={ref} 
    variant="info" 
    showIcon 
    icon={Info}
    {...props}
  >
    {children}
  </AlertDialogContent>
))

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogWarning,
  AlertDialogError,
  AlertDialogSuccess,
  AlertDialogInfo
}
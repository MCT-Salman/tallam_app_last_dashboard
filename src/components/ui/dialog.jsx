// import * as React from "react"
// import * as DialogPrimitive from "@radix-ui/react-dialog"
// import { X } from "lucide-react"

// import { cn } from "@/lib/utils"

// const Dialog = DialogPrimitive.Root

// const DialogTrigger = DialogPrimitive.Trigger

// const DialogPortal = DialogPrimitive.Portal

// const DialogClose = DialogPrimitive.Close

// const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
//   <DialogPrimitive.Overlay
//     ref={ref}
//     className={cn(
//       "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
//       className
//     )}
//     dir="rtl"
//     {...props}
//   />
// ))
// DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// const DialogContent = React.forwardRef(
//   ({ className, children, ...props }, ref) => (
//     <DialogPortal>
//       <DialogOverlay />
//       <DialogPrimitive.Content
//         ref={ref}
//         className={cn(
//           "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
//           className
//         )}
//         dir="rtl"
//         {...props}
//       >
//         {children}
//         <DialogPrimitive.Close className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
//           <X className="h-4 w-4" />
//           <span className="sr-only">Close</span>
//         </DialogPrimitive.Close>
//       </DialogPrimitive.Content>
//     </DialogPortal>
//   )
// )
// DialogContent.displayName = DialogPrimitive.Content.displayName

// const DialogHeader = ({ className, ...props }) => (
//   <div
//     className={cn(
//       "flex flex-col space-y-1.5 text-center sm:text-left",
//       className
//     )}
//     dir="rtl"
//     {...props}
//   />
// )
// DialogHeader.displayName = "DialogHeader"

// const DialogFooter = ({ className, ...props }) => (
//   <div
//     className={cn(
//       "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
//       className
//     )}
//     dir="rtl"
//     {...props}
//   />
// )
// DialogFooter.displayName = "DialogFooter"

// const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
//   <DialogPrimitive.Title
//     ref={ref}
//     className={cn(
//       "text-lg font-semibold leading-none tracking-tight",
//       className
//     )}
//     dir="rtl"
//     {...props}
//   />
// ))
// DialogTitle.displayName = DialogPrimitive.Title.displayName

// const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
//   <DialogPrimitive.Description
//     ref={ref}
//     className={cn("text-sm text-muted-foreground", className)}
//     dir="rtl"
//     {...props}
//   />
// ))
// DialogDescription.displayName = DialogPrimitive.Description.displayName

// export {
//   Dialog,
//   DialogPortal,
//   DialogOverlay,
//   DialogClose,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogFooter,
//   DialogTitle,
//   DialogDescription
// }


import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-gradient-to-br from-yellow-500/70 via-black/20 to-purple-800/70  backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    dir="rtl"
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-0 bg-gradient-to-br from-white via-gray-50 to-white p-0 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl",
          // "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-purple-900/10 before:via-black-500/10 before:to-yellow-500/10 before:content-['']",
          "after:absolute after:inset-0 after:rounded-2xl after:border after:border-white/50 after:content-['']",
          className
        )}
        dir="rtl"
        {...props}
      >
        {/* Background Pattern */}
        {/* <div className="absolute  inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-blue-100/30" /> */}
        
        {/* Animated Border */}
        {/* <div className="absolute -inset-1 rounded-2xl  opacity-20 blur-sm transition-all duration-1000 group-hover:opacity-40 group-hover:blur-md" /> */}
        
        <div className="relative z-10 p-6">
          {children}
        </div>
        
        <DialogPrimitive.Close className="absolute cursor-pointer left-4 top-4 z-20 rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm opacity-70 ring-offset-background transition-all duration-300 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 hover:scale-110 hover:bg-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:pointer-events-none group">
          <X className="h-4 w-4 text-gray-700 transition-transform group-hover:rotate-90" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-3 text-center sm:text-left pb-4 border-b border-gray-100",
      "bg-gradient-to-r from-transparent via-white/50 to-transparent ",
      className
    )}
    dir="rtl"
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse pt-4 mt-4 border-t border-gray-100",
      "bg-gradient-to-r from-transparent via-white/30 to-transparent",
      className
    )}
    dir="rtl"
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-bold bg-gradient-to-r  text-yellow-600 bg-clip-text  leading-tight tracking-tight",
      "drop-shadow-sm ",
      className
    )}
    dir="rtl"
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm text-gray-600 leading-relaxed tracking-wide",
      "bg-gradient-to-r from-gray-500 to-gray-700 bg-clip-text text-transparent",
      className
    )}
    dir="rtl"
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
}
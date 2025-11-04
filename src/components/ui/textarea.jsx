// import * as React from "react"

// import { cn } from "@/lib/utils"

// const Textarea = React.forwardRef(({ className, ...props }, ref) => {
//   return (
//     <textarea
//       className={cn(
//         "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
//         className
//       )}
//       ref={ref}
//       {...props}
//     />
//   )
// })
// Textarea.displayName = "Textarea"

// export { Textarea }


import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  return (
    <div className="relative w-full">
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border-2 bg-white px-4 py-3 text-base font-medium ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          // Variants
          variant === "default" && [
            "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200",
            "shadow-sm focus:shadow-lg"
          ],
          variant === "gradient" && [
            "border-gray-300 focus:border-transparent",
            "shadow-lg focus:shadow-xl",
            "focus:bg-gradient-to-br focus:from-white focus:via-purple-50 focus:to-yellow-50"
          ],
          variant === "modern" && [
            "border-transparent bg-gray-50 focus:bg-white",
            "shadow-inner focus:shadow-lg",
            "focus:border-purple-500"
          ],
          variant === "premium" && [
            "border-purple-300 bg-white focus:border-purple-500",
            "shadow-purple-500/10 focus:shadow-purple-500/20",
            "focus:ring-2 focus:ring-purple-200"
          ],
          className
        )}
        ref={ref}
        {...props}
      />
      
      {/* Gradient focus indicator */}
      <div className={cn(
        "absolute bottom-0 right-1/2 h-1 w-0 bg-gradient-to-r from-purple-800 to-yellow-800 transition-all duration-300 transform translate-x-1/2 rounded-full",
        "peer-focus:w-[calc(100%-2rem)]"
      )} />
      
      {/* Character counter */}
      {props.maxLength && (
        <div className="absolute left-3 bottom-3 text-xs text-gray-400 font-medium">
          {props.value?.length || 0}/{props.maxLength}
        </div>
      )}
      
      {/* Floating label effect */}
      {props["data-label"] && (
        <label className={cn(
          "absolute -top-2 right-3 px-2 text-sm font-semibold transition-all duration-200",
          "bg-white text-gray-600 peer-focus:text-purple-700",
          "transform origin-right"
        )}>
          {props["data-label"]}
        </label>
      )}
    </div>
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
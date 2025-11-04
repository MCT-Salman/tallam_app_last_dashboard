// import * as React from "react"
// import * as SwitchPrimitives from "@radix-ui/react-switch"

// import { cn } from "@/lib/utils"

// const Switch = React.forwardRef(({ className, ...props }, ref) => (
//   <SwitchPrimitives.Root
//     className={cn(
//       "peer inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90",
//       className
//     )}
//     {...props}
//     ref={ref}
//   >
//     <SwitchPrimitives.Thumb
//       className={cn(
//         "pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-lg ring-0 transition-all duration-300 ease-in-out data-[state=checked]:rtl:-translate-x-5 data-[state=checked]:ltr:translate-x-5 data-[state=unchecked]:translate-x-0 hover:scale-110"
//       )}
//     />
//   </SwitchPrimitives.Root>
// ))
// Switch.displayName = SwitchPrimitives.Root.displayName

// export { Switch }


import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, variant = "default", showIcons = false, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 relative overflow-hidden",
      // Variants for unchecked state
      variant === "default" && "data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400",
      variant === "gradient" && "data-[state=unchecked]:bg-gradient-to-r data-[state=unchecked]:from-gray-400 data-[state=unchecked]:to-gray-600",
      variant === "modern" && "data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:border-gray-300",
      
      // Variants for checked state
      variant === "default" && "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-800 data-[state=checked]:to-yellow-800",
      variant === "gradient" && "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-800 data-[state=checked]:to-yellow-800",
      variant === "modern" && "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-800 data-[state=checked]:to-yellow-800",
      
      // Shadow effects
      "shadow-lg hover:shadow-xl transition-shadow",
      className
    )}
    {...props}
    ref={ref}
  >
    {/* Background pattern for modern variant */}
    {variant === "modern" && (
      <div className={cn(
        "absolute inset-0 rounded-full transition-opacity duration-300",
        "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-800 data-[state=checked]:to-yellow-800",
        "data-[state=unchecked]:bg-gray-300"
      )} />
    )}
    
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-2xl ring-0 transition-all duration-300 ease-in-out relative z-10",
        "data-[state=checked]:rtl:-translate-x-7 data-[state=checked]:ltr:translate-x-7 data-[state=unchecked]:translate-x-1",
        "border border-gray-200",
        "hover:scale-110 transition-transform"
      )}
    >
      {/* Icons inside thumb */}
      {showIcons && (
        <>
          <Check className={cn(
            "absolute inset-0 m-auto h-3 w-3 transition-all duration-300",
            "text-green-600 data-[state=checked]:opacity-100 data-[state=unchecked]:opacity-0"
          )} />
          <X className={cn(
            "absolute inset-0 m-auto h-3 w-3 transition-all duration-300",
            "text-red-500 data-[state=checked]:opacity-0 data-[state=unchecked]:opacity-100"
          )} />
        </>
      )}
    </SwitchPrimitives.Thumb>
    
    {/* Glow effect for checked state */}
    <div className={cn(
      "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
      "bg-gradient-to-r from-purple-800 to-yellow-800",
      "data-[state=checked]:opacity-20"
    )} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
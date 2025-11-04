// import * as React from "react"

// import { cn } from "@/lib/utils"

// const Card = React.forwardRef(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn(
//       "rounded-lg border bg-card text-card-foreground shadow-sm",
//       className
//     )}
//     {...props}
//   />
// ))
// Card.displayName = "Card"

// const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn("flex flex-col space-y-1.5 p-6", className)}
//     {...props}
//   />
// ))
// CardHeader.displayName = "CardHeader"

// const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
//   <h3
//     ref={ref}
//     className={cn(
//       "text-2xl font-semibold leading-none tracking-tight",
//       className
//     )}
//     {...props}
//   />
// ))
// CardTitle.displayName = "CardTitle"

// const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
//   <p
//     ref={ref}
//     className={cn("text-sm text-muted-foreground", className)}
//     {...props}
//   />
// ))
// CardDescription.displayName = "CardDescription"

// const CardContent = React.forwardRef(({ className, ...props }, ref) => (
//   <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
// ))
// CardContent.displayName = "CardContent"

// const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn("flex items-center p-6 pt-0", className)}
//     {...props}
//   />
// ))
// CardFooter.displayName = "CardFooter"

// export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }


// import * as React from "react"

// import { cn } from "@/lib/utils"

// const Card = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn(
//       "relative rounded-2xl border-2 bg-transparent text-card-foreground shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] group overflow-hidden",
//       // Variants
//       variant === "default" && "border-purple-800/30 hover:border-purple-800/50",
//       variant === "gradient" && "border-transparent",
//       variant === "modern" && "border-yellow-800/20 hover:border-yellow-800/40",
//       variant === "premium" && "border-purple-800/40 hover:border-purple-800/60",
      
//       className
//     )}
//     {...props}
//   >
//     {/* Animated Gradient Border for gradient variant */}
//     {variant === "gradient" && (
//       <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-800 to-yellow-800 opacity-30 blur-sm transition-all duration-500 group-hover:opacity-50 group-hover:blur-md" />
//     )}
    
//     {/* Main Content */}
//     <div className="relative bg-transparent rounded-2xl">
//       {props.children}
//     </div>
//   </div>
// ))
// Card.displayName = "Card"

// const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn(
//       "flex flex-col space-y-3 p-8 pb-4 relative",
//       // Gradient accent line
//       "after:absolute after:bottom-0 after:right-1/4 after:w-1/2 after:h-0.5 after:bg-gradient-to-r after:from-purple-800 after:to-yellow-800 after:rounded-full after:opacity-50",
//       className
//     )}
//     {...props}
//   />
// ))
// CardHeader.displayName = "CardHeader"

// const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
//   <h3
//     ref={ref}
//     className={cn(
//       "text-3xl font-bold leading-tight tracking-tight",
//       "bg-gradient-to-r from-purple-800 to-yellow-800 bg-clip-text text-transparent",
//       "drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300",
//       className
//     )}
//     {...props}
//   />
// ))
// CardTitle.displayName = "CardTitle"

// const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
//   <p
//     ref={ref}
//     className={cn(
//       "text-lg text-gray-700 leading-relaxed tracking-wide",
//       "bg-gradient-to-r from-purple-900 to-yellow-900 bg-clip-text text-transparent",
//       "group-hover:from-purple-800 group-hover:to-yellow-800 transition-all duration-300",
//       className
//     )}
//     {...props}
//   />
// ))
// CardDescription.displayName = "CardDescription"

// const CardContent = React.forwardRef(({ className, ...props }, ref) => (
//   <div 
//     ref={ref} 
//     className={cn(
//       "p-8 pt-4 relative",
//       // Subtle pattern overlay
//       "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-purple-800/5 before:via-transparent before:to-yellow-800/5 before:content-['']",
//       className
//     )} 
//     {...props} 
//   />
// ))
// CardContent.displayName = "CardContent"

// const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn(
//       "flex items-center p-8 pt-4 relative",
//       // Top border accent
//       "before:absolute before:top-0 before:left-1/4 before:w-1/2 before:h-0.5 before:bg-gradient-to-r before:from-purple-800 before:to-yellow-800 before:rounded-full before:opacity-30",
//       className
//     )}
//     {...props}
//   />
// ))
// CardFooter.displayName = "CardFooter"

// export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border-2 bg-transparent text-card-foreground shadow-lg",
      // Variants
      variant === "default" && "border-purple-800/40",
      variant === "gradient" && "border-transparent",
      variant === "modern" && "border-yellow-800/30",
      variant === "premium" && "border-purple-800/50",
      
      className
    )}
    {...props}
  >
    {/* Gradient Border for gradient variant */}
    {variant === "gradient" && (
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-800 to-yellow-800 opacity-40" />
    )}
    
    {/* Main Content */}
    <div className="relative bg-transparent rounded-2xl">
      {props.children}
    </div>
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-3 p-8 pb-4 relative",
      // Gradient accent line
      "after:absolute after:bottom-0 after:right-1/4 after:w-1/2 after:h-0.5 after:bg-gradient-to-r after:from-purple-800 after:to-yellow-400 after:rounded-full after:opacity-60",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-3xl font-bold leading-tight tracking-tight",
      "bg-gradient-to-r from-purple-800 to-yellow-600 bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-lg text-gray-800 leading-relaxed tracking-wide",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-8 pt-4",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-8 pt-4 relative",
      // Top border accent
      "before:absolute before:top-0 before:left-1/4 before:w-1/2 before:h-0.5 before:bg-gradient-to-r before:from-purple-800 before:to-yellow-400 before:rounded-full before:opacity-40",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
// import * as React from "react";
// import { Slot } from "@radix-ui/react-slot";
// import { cva } from "class-variance-authority";

// import { cn } from "@/lib/utils";

// const buttonVariants = cva(
//   "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
//   {
//     variants: {
//       variant: {
//         default: "bg-primary text-primary-foreground hover:bg-primary/90",
//         destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
//         outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
//         secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         ghost: "hover:bg-accent hover:text-accent-foreground",
//         link: "text-primary underline-offset-4 hover:underline",
//       },
//       size: {
//         default: "h-10 px-4 py-2",
//         sm: "h-9 rounded-md px-3",
//         lg: "h-11 rounded-md px-8",
//         icon: "h-10 w-10",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// );

// const Button = React.forwardRef(
//   ({ className, variant, size, asChild = false, ...props }, ref) => {
//     const Comp = asChild ? Slot : "button";
//     return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
//   }
// );
// Button.displayName = "Button";

// export { Button, buttonVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-purple-800 to-yellow-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105 hover:from-purple-700 hover:to-yellow-600 active:scale-95",
        
        destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:scale-105 hover:from-red-700 hover:to-rose-700 active:scale-95",
        
        outline: "border-2 border-purple-200 bg-white/80 backdrop-blur-sm text-purple-700 shadow-sm hover:shadow-md hover:bg-purple-50 hover:border-purple-300 hover:scale-105 active:scale-95 hover:text-purple-800",
        
        secondary: "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-xl hover:shadow-gray-500/25 hover:scale-105 hover:from-gray-700 hover:to-gray-800 active:scale-95",
        
        ghost: "bg-transparent text-purple-800 hover:bg-purple-50 hover:scale-105 active:scale-95 hover:text-purple-700 hover:shadow-sm",
        
        link: "text-purple-600 underline-offset-4 hover:underline hover:text-purple-700 bg-transparent",
        
        premium: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 hover:from-amber-600 hover:to-orange-600 active:scale-95",
        
        neon: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105 hover:from-cyan-600 hover:to-blue-600 active:scale-95 border border-cyan-400/50",
        
        gradient: "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 bg-size-200 bg-pos-0 hover:bg-pos-100",
      },
      size: {
        default: "h-12 px-6 py-3 text-base font-semibold",
        sm: "h-10 rounded-lg px-4 py-2 text-sm font-medium",
        lg: "h-14 rounded-xl px-8 py-4 text-lg font-bold",
        xl: "h-16 rounded-2xl px-10 py-5 text-xl font-bold",
        icon: "h-12 w-12 rounded-xl",
        "icon-sm": "h-10 w-10 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    withSparkles = false,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp 
        className={cn(
          buttonVariants({ variant, size, className }),
          // Animation for gradient background
          variant === "gradient" && "animate-gradient-x",
          // Sparkles effect container
          withSparkles && "sparkle-container"
        )} 
        ref={ref} 
        disabled={loading || props.disabled}
        {...props}
      >
        {/* Animated background shine effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className={cn(
            "absolute inset-0 translate-x-[-100%] skew-x-[-20deg] transition-transform duration-1000",
            "bg-gradient-to-r from-transparent via-white/30 to-transparent",
            "group-hover:translate-x-[100%] group-hover:skew-x-[-20deg]"
          )} />
        </div>
        
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {/* Sparkles icon for premium buttons */}
        {withSparkles && !loading && (
          <Sparkles className="h-4 w-4 text-amber-200 animate-pulse" />
        )}
        
        {/* Button content */}
        <span className={cn(
          "relative z-10 flex items-center gap-2",
          loading && "opacity-0"
        )}>
          {children}
        </span>
        
        {/* Pulse animation for certain variants */}
        {(variant === "premium" || variant === "neon") && (
          <div className={cn(
            "absolute inset-0 rounded-xl animate-pulse",
            variant === "premium" ? "bg-amber-500/20" : "bg-cyan-500/20"
          )} />
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
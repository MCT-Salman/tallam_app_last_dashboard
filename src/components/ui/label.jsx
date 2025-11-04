// import * as React from "react";
// import * as LabelPrimitive from "@radix-ui/react-label";
// import { cva } from "class-variance-authority";

// import { cn } from "@/lib/utils";

// const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

// const Label = React.forwardRef((props, ref) => {
//   const { className, ...rest } = props;
//   return (
//     <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...rest} />
//   );
// });
// Label.displayName = LabelPrimitive.Root.displayName;

// export { Label };

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "text-gray-900",
        gradient: "bg-gradient-to-r from-purple-800 to-yellow-800 bg-clip-text text-transparent",
        outline: "text-gray-900 border-2 border-transparent bg-gradient-to-r from-purple-800 to-yellow-800 bg-clip-text text-transparent",
        modern: "text-gray-900 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-800 after:to-yellow-800 after:rounded-full",
        premium: "text-gray-900 bg-gradient-to-r from-purple-800 to-yellow-800 bg-clip-text text-transparent drop-shadow-sm",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
        xl: "text-lg font-semibold",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      weight: "medium"
    }
  }
);

const Label = React.forwardRef((props, ref) => {
  const { 
    className, 
    variant = "default",
    size = "default",
    weight = "medium",
    ...rest 
  } = props;
  
  return (
    <LabelPrimitive.Root 
      ref={ref} 
      className={cn(labelVariants({ variant, size, weight }), className)} 
      {...rest} 
    />
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
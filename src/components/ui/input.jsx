// import * as React from "react"

// import { cn } from "@/lib/utils"

// const Input = React.forwardRef(({ className, type, ...props }, ref) => {
//   return (
//     <input
//       type={type}
//       className={cn(
//         "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//         className
//       )}
//       dir="rtl"
//       ref={ref}
//       {...props}
//     />
//   )
// })
// Input.displayName = "Input"

// export { Input }

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

// import * as React from "react"

// import { cn } from "@/lib/utils"

// const Input = React.forwardRef(({ className, type, variant = "default", ...props }, ref) => {
//   return (
//     <div className="relative w-full">
//       <input
//         type={type}
//         className={cn(
//           "flex h-12 w-full rounded-xl border-2 bg-white/80 backdrop-blur-sm px-4 py-3 text-base font-medium transition-all duration-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//           "shadow-lg hover:shadow-xl focus:shadow-2xl",
//           "border-gray-200 hover:border-purple-300 focus:border-purple-800",
//           "focus:bg-white focus:scale-[1.02]",
//           "placeholder:transition-all placeholder:duration-300 focus:placeholder:translate-x-2",
          
//           // Variants
//           variant === "glow" && [
//             "border-purple-200 hover:border-yellow-600 focus:border-purple-900",
//             "shadow-purple-500/10 hover:shadow-purple-500/20 focus:shadow-purple-500/30",
//             "bg-gradient-to-r from-white to-purple-50/30"
//           ],
          
//           variant === "modern" && [
//             "border-transparent bg-gray-50/50 hover:bg-white",
//             "shadow-sm hover:shadow-md focus:shadow-lg",
//             "focus:border-blue-500 focus:bg-white",
//             "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-blue-500/10 before:via-purple-500/10 before:to-pink-500/10 before:opacity-0 before:transition-opacity before:duration-300 focus:before:opacity-100"
//           ],
          
//           variant === "neon" && [
//             "border-gray-800 bg-gray-900 text-white",
//             "shadow-none hover:shadow-blue-500/20 focus:shadow-blue-500/40",
//             "hover:border-blue-400 focus:border-blue-500",
//             "bg-gradient-to-r from-gray-900 to-gray-800",
//             "placeholder:text-gray-500"
//           ],

//           className
//         )}
//         dir="rtl"
//         ref={ref}
//         {...props}
//       />
      
//       {/* Animated Focus Indicator */}
//       <div className={cn(
//         "absolute bottom-0 right-1/2 h-0.5 w-0 bg-gradient-to-r from-purple-800 to-yellow-600 transition-all duration-500 transform translate-x-1/2",
//         "peer-focus:w-[calc(100%-2rem)] peer-focus:width-animation"
//       )} />
      
//       {/* Floating Label Effect (optional) */}
//       {props["data-label"] && (
//         <label className={cn(
//           "absolute -top-2 right-3 px-1 text-xs font-medium transition-all duration-300",
//           "bg-white text-gray-500 peer-focus:text-purple-800 peer-focus:scale-110",
//           "transform origin-right"
//         )}>
//           {props["data-label"]}
//         </label>
//       )}
      
//       {/* Decorative Icons Container */}
//       <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 space-x-reverse">
//         {props["data-icon"] && (
//           <span className="text-gray-400 transition-colors duration-300 peer-focus:text-purple-800">
//             {props["data-icon"]}
//           </span>
//         )}
//       </div>
//     </div>
//   )
// })
// Input.displayName = "Input"

// export { Input }

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////


import * as React from "react"
import { Upload, Image } from "lucide-react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, variant = "default", ...props }, ref) => {
  // إذا كان نوع file نعيد تصميم مخصص
  if (type === "file") {
    return (
      <div className="relative w-full">
        <label
          htmlFor={props.id}
          className={cn(
            "flex flex-col items-center justify-center w-full h-32 cursor-pointer rounded-xl border-2 border-dashed bg-white/80 backdrop-blur-sm transition-all duration-300",
            "shadow-lg hover:shadow-xl focus-within:shadow-2xl",
            "border-gray-300 hover:border-purple-400 focus-within:border-purple-600",
            "hover:bg-white focus-within:bg-white",
            "text-center group",
            
            // Variants for file input
            variant === "glow" && [
              "border-purple-300 hover:border-yellow-400 focus-within:border-purple-600",
              "shadow-purple-500/10 hover:shadow-purple-500/20 focus-within:shadow-purple-500/30",
              "bg-gradient-to-r from-white to-purple-50/30"
            ],
            
            variant === "modern" && [
              "border-gray-200 bg-gray-50/50 hover:bg-white",
              "shadow-sm hover:shadow-md focus-within:shadow-lg",
              "focus-within:border-blue-500 focus-within:bg-white"
            ],
            
            variant === "neon" && [
              "border-gray-700 bg-gray-900 text-white",
              "shadow-none hover:shadow-blue-500/20 focus-within:shadow-blue-500/40",
              "hover:border-blue-400 focus-within:border-blue-500"
            ],

            className
          )}
        >
          <input
            type="file"
            className="hidden"
            ref={ref}
            {...props}
          />
          
          {/* أيقونة الرفع */}
          <div className={cn(
            "mb-2 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1",
            variant === "neon" ? "text-blue-400" : "text-purple-600"
          )}>
            <Upload className="h-8 w-8" />
          </div>
          
          {/* النص الرئيسي */}
          <div className={cn(
            "text-base font-medium transition-colors duration-300",
            variant === "neon" ? "text-white" : "text-gray-700"
          )}>
            ارفع صورة
          </div>
          
          {/* النص الثانوي */}
          {/* <div className={cn(
            "text-sm mt-1 transition-colors duration-300",
            variant === "neon" ? "text-gray-400" : "text-gray-500"
          )}>
            انقر أو اسحب الصورة هنا
          </div> */}
          
          {/* تأثير عند التركيز */}
          <div className={cn(
            "absolute bottom-0 right-1/2 h-0.5 w-0 bg-gradient-to-r from-purple-800 to-yellow-600 transition-all duration-500 transform translate-x-1/2",
            "group-focus-within:w-[calc(100%-2rem)]"
          )} />
        </label>
        
        {/* عرض اسم الملف إذا تم اختياره */}
        {props.value && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            <Image className="h-4 w-4 inline ml-1" />
            {props.value.name || "تم اختيار ملف"}
          </div>
        )}
      </div>
    )
  }

  // الكود الأصلي لأنواع input الأخرى
  return (
    <div className="relative w-full">
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 bg-white/80 backdrop-blur-sm px-4 py-3 text-base font-medium transition-all duration-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "shadow-lg hover:shadow-xl focus:shadow-2xl",
          "border-gray-200 hover:border-purple-300 focus:border-purple-800",
          "focus:bg-white focus:scale-[1.02]",
          "placeholder:transition-all placeholder:duration-300 focus:placeholder:translate-x-2",
          
          // Variants
          variant === "glow" && [
            "border-purple-200 hover:border-yellow-600 focus:border-purple-900",
            "shadow-purple-500/10 hover:shadow-purple-500/20 focus:shadow-purple-500/30",
            "bg-gradient-to-r from-white to-purple-50/30"
          ],
          
          variant === "modern" && [
            "border-transparent bg-gray-50/50 hover:bg-white",
            "shadow-sm hover:shadow-md focus:shadow-lg",
            "focus:border-blue-500 focus:bg-white",
            "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-blue-500/10 before:via-purple-500/10 before:to-pink-500/10 before:opacity-0 before:transition-opacity before:duration-300 focus:before:opacity-100"
          ],
          
          variant === "neon" && [
            "border-gray-800 bg-gray-900 text-white",
            "shadow-none hover:shadow-blue-500/20 focus:shadow-blue-500/40",
            "hover:border-blue-400 focus:border-blue-500",
            "bg-gradient-to-r from-gray-900 to-gray-800",
            "placeholder:text-gray-500"
          ],

          className
        )}
        dir="rtl"
        ref={ref}
        {...props}
      />
      
      {/* Animated Focus Indicator */}
      <div className={cn(
        "absolute bottom-0 right-1/2 h-0.5 w-0 bg-gradient-to-r from-purple-800 to-yellow-600 transition-all duration-500 transform translate-x-1/2",
        "peer-focus:w-[calc(100%-2rem)] peer-focus:width-animation"
      )} />
      
      {/* Floating Label Effect (optional) */}
      {props["data-label"] && (
        <label className={cn(
          "absolute -top-2 right-3 px-1 text-xs font-medium transition-all duration-300",
          "bg-white text-gray-500 peer-focus:text-purple-800 peer-focus:scale-110",
          "transform origin-right"
        )}>
          {props["data-label"]}
        </label>
      )}
      
      {/* Decorative Icons Container */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 space-x-reverse">
        {props["data-icon"] && (
          <span className="text-gray-400 transition-colors duration-300 peer-focus:text-purple-800">
            {props["data-icon"]}
          </span>
        )}
      </div>
    </div>
  )
})
Input.displayName = "Input"

export { Input }
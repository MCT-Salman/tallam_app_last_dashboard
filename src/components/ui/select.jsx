// import * as React from "react"
// import * as SelectPrimitive from "@radix-ui/react-select"
// import { Check, ChevronDown, ChevronUp, Search, X } from "lucide-react"

// import { cn } from "@/lib/utils"

// const Select = SelectPrimitive.Root

// const SelectGroup = SelectPrimitive.Group

// const SelectValue = SelectPrimitive.Value

// const SelectTrigger = React.forwardRef(
//   ({ className, children, ...props }, ref) => (
//     <SelectPrimitive.Trigger
//       ref={ref}
//       className={cn(
//         "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
//         className
//       )}
//       dir="rtl"
//       {...props}
//     >
//       {children}
//       <SelectPrimitive.Icon asChild>
//         <ChevronDown className="h-4 w-4 opacity-50" />
//       </SelectPrimitive.Icon>
//     </SelectPrimitive.Trigger>
//   )
// )
// SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// const SelectScrollUpButton = React.forwardRef(
//   ({ className, ...props }, ref) => (
//     <SelectPrimitive.ScrollUpButton
//       ref={ref}
//       className={cn(
//         "flex cursor-default items-center justify-center py-1",
//         className
//       )}
//       {...props}
//     >
//       <ChevronUp className="h-4 w-4" />
//     </SelectPrimitive.ScrollUpButton>
//   )
// )
// SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

// const SelectScrollDownButton = React.forwardRef(
//   ({ className, ...props }, ref) => (
//     <SelectPrimitive.ScrollDownButton
//       ref={ref}
//       className={cn(
//         "flex cursor-default items-center justify-center py-1",
//         className
//       )}
//       {...props}
//     >
//       <ChevronDown className="h-4 w-4" />
//     </SelectPrimitive.ScrollDownButton>
//   )
// )
// SelectScrollDownButton.displayName =
//   SelectPrimitive.ScrollDownButton.displayName

// const SelectContent = React.forwardRef(
//   ({ 
//     className, 
//     children, 
//     position = "popper", 
//     searchable = false,
//     searchPlaceholder = "بحث...",
//     onSearchChange,
//     ...props 
//   }, ref) => {
//     const [internalSearch, setInternalSearch] = React.useState("")
//     const searchInputRef = React.useRef(null)
    
//     const handleSearchChange = (value) => {
//       setInternalSearch(value)
//       onSearchChange?.(value)
//     }

//     // التركيز على حقل البحث عند فتح الـ Select
//     React.useEffect(() => {
//       if (searchable && searchInputRef.current) {
//         const timeoutId = setTimeout(() => {
//           searchInputRef.current?.focus()
//         }, 100)
//         return () => clearTimeout(timeoutId)
//       }
//     }, [searchable])

//     // تصفية الأطفال بناءً على البحث إذا كان searchable
//     const filteredChildren = React.useMemo(() => {
//       if (!searchable || !internalSearch) return children
      
//       return React.Children.map(children, child => {
//         if (child?.type?.displayName === "SelectItem") {
//           const childText = child.props.children?.toString().toLowerCase() || ""
//           if (childText.includes(internalSearch.toLowerCase())) {
//             return child
//           }
//           return null
//         }
//         return child
//       }).filter(Boolean)
//     }, [children, searchable, internalSearch])

//     return (
//       <SelectPrimitive.Portal>
//         <SelectPrimitive.Content
//           ref={ref}
//           className={cn(
//             "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
//             position === "popper" &&
//               "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
//             className
//           )}
//           position={position}
//           // الحل الحاسم: منع الإغلاق التلقائي عند التركيز على البحث
//           onCloseAutoFocus={(e) => {
//             if (searchInputRef.current === document.activeElement) {
//               e.preventDefault()
//             }
//           }}
//           {...props}
//         >
//           <SelectScrollUpButton />
          
//           {/* Search Input */}
//           {searchable && (
//             <div className="sticky top-0 z-10 bg-popover border-b p-2">
//               <div className="relative">
//                 <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
//                 <input
//                   ref={searchInputRef}
//                   type="text"
//                   placeholder={searchPlaceholder}
//                   value={internalSearch}
//                   onChange={(e) => handleSearchChange(e.target.value)}
//                   className="flex w-full rounded-md border border-input bg-background px-8 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1"
//                   dir="rtl"
//                   // الحل: استخدام onPointerDown بدلاً من onMouseDown
//                   onPointerDown={(e) => {
//                     // إيقاف الانتشار لمنع إغلاق الـ Select
//                     e.stopPropagation()
//                   }}
//                 />
//                 {internalSearch && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       handleSearchChange("")
//                       searchInputRef.current?.focus()
//                     }}
//                     className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground flex items-center justify-center"
//                   >
//                     <X className="h-3 w-3" />
//                   </button>
//                 )}
//               </div>
//             </div>
//           )}
          
//           <SelectPrimitive.Viewport
//             className={cn(
//               "p-1",
//               position === "popper" &&
//                 "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
//             )}
//           >
//             {searchable ? filteredChildren : children}
//           </SelectPrimitive.Viewport>
//           <SelectScrollDownButton />
//         </SelectPrimitive.Content>
//       </SelectPrimitive.Portal>
//     )
//   }
// )
// SelectContent.displayName = SelectPrimitive.Content.displayName

// const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
//   <SelectPrimitive.Label
//     ref={ref}
//     className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
//     {...props}
//   />
// ))
// SelectLabel.displayName = SelectPrimitive.Label.displayName

// const SelectItem = React.forwardRef(
//   ({ className, children, ...props }, ref) => (
//     <SelectPrimitive.Item
//       ref={ref}
//       className={cn(
//         "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
//         className
//       )}
//       dir="rtl"
//       {...props}
//     >
//       <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
//         <SelectPrimitive.ItemIndicator>
//           <Check className="h-4 w-4" />
//         </SelectPrimitive.ItemIndicator>
//       </span>

//       <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
//     </SelectPrimitive.Item>
//   )
// )
// SelectItem.displayName = SelectPrimitive.Item.displayName

// const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
//   <SelectPrimitive.Separator
//     ref={ref}
//     className={cn("-mx-1 my-1 h-px bg-muted", className)}
//     {...props}
//   />
// ))
// SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// export {
//   Select,
//   SelectGroup,
//   SelectValue,
//   SelectTrigger,
//   SelectContent,
//   SelectLabel,
//   SelectItem,
//   SelectSeparator,
//   SelectScrollUpButton,
//   SelectScrollDownButton
// }



import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, Search, X, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(
  ({ className, children, variant = "default", ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex h-12 w-full items-center justify-between rounded-xl border-2 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm font-medium transition-all duration-300 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        "shadow-lg hover:shadow-xl focus:shadow-2xl",
        "border-gray-200 hover:border-purple-300 focus:border-purple-500",
        "hover:scale-[1.02] focus:scale-[1.02]",
        
        // Variants
        variant === "glow" && [
          "border-purple-200 hover:border-purple-400 focus:border-purple-800",
          "shadow-purple-500/10 hover:shadow-purple-500/20 focus:shadow-purple-500/30",
          "bg-gradient-to-r from-white to-purple-50/30"
        ],
        
        variant === "modern" && [
          "border-transparent bg-gray-50/50 hover:bg-white",
          "shadow-sm hover:shadow-md focus:shadow-lg",
          "focus:border-blue-500 focus:bg-white",
        ],
        
        variant === "neon" && [
          "border-gray-800 bg-gray-900 text-white",
          "shadow-none hover:shadow-blue-500/20 focus:shadow-blue-500/40",
          "hover:border-blue-400 focus:border-blue-500",
          "bg-gradient-to-r from-gray-900 to-gray-800",
        ],

        className
      )}
      dir="rtl"
      {...props}
    >
      {children}
      
      <SelectPrimitive.Icon asChild>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full bg-current opacity-60 transition-all duration-300",
            "group-hover:opacity-100 group-focus:opacity-100",
            variant === "neon" ? "bg-blue-400" : "bg-purple-800"
          )} />
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-300",
            "group-hover:scale-110 group-focus:scale-110 group-focus:rotate-180",
            variant === "neon" ? "text-blue-400" : "text-purple-900"
          )} />
        </div>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-2 bg-gradient-to-b from-popover to-transparent",
        "text-purple-600 hover:text-purple-700 transition-colors",
        className
      )}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
)
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-2 bg-gradient-to-t from-popover to-transparent",
        "text-purple-600 hover:text-purple-700 transition-colors",
        className
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
)
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(
  ({ 
    className, 
    children, 
    position = "popper", 
    searchable = false,
    searchPlaceholder = "ابحث...",
    onSearchChange,
    variant = "default",
    ...props 
  }, ref) => {
    const [internalSearch, setInternalSearch] = React.useState("")
    const searchInputRef = React.useRef(null)
    
    const handleSearchChange = (value) => {
      setInternalSearch(value)
      onSearchChange?.(value)
    }

    React.useEffect(() => {
      if (searchable && searchInputRef.current) {
        const timeoutId = setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timeoutId)
      }
    }, [searchable])

    const filteredChildren = React.useMemo(() => {
      if (!searchable || !internalSearch) return children
      
      return React.Children.map(children, child => {
        if (child?.type?.displayName === "SelectItem") {
          const childText = child.props.children?.toString().toLowerCase() || ""
          if (childText.includes(internalSearch.toLowerCase())) {
            return child
          }
          return null
        }
        return child
      }).filter(Boolean)
    }, [children, searchable, internalSearch])

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "backdrop-blur-md bg-white/95 border-gray-200",
            "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-purple-500/5 before:via-blue-500/5 before:to-pink-500/5 before:content-['']",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            
            // Variants for content
            variant === "glow" && "border-purple-200 shadow-purple-500/20",
            variant === "modern" && "border-blue-200 shadow-blue-500/10",
            variant === "neon" && "border-blue-500/30 bg-gray-900/95 shadow-blue-500/30",

            className
          )}
          position={position}
          onCloseAutoFocus={(e) => {
            if (searchInputRef.current === document.activeElement) {
              e.preventDefault()
            }
          }}
          {...props}
        >
          {/* Animated Border */}
          <div className="absolute -inset-1 rounded-2xl bg-purple-900 opacity-10 blur-sm" />
          
          <SelectScrollUpButton />
          
          {/* Enhanced Search Input */}
          {searchable && (
            <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur-sm border-b border-gray-100 p-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={internalSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={cn(
                    "flex w-full rounded-lg border-2 bg-white/80 backdrop-blur-sm px-10 py-2.5 text-sm font-medium ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all duration-300",
                    "border-purple-200 focus:border-purple-900 focus:bg-white",
                    "shadow-inner focus:shadow-lg"
                  )}
                  dir="rtl"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                  }}
                />
                {internalSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSearchChange("")
                      searchInputRef.current?.focus()
                    }}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-purple-800 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              {/* Search Results Count */}
              {internalSearch && (
                <div className="text-xs text-purple-800 mt-2 text-center font-medium">
                  {React.Children.count(filteredChildren)} نتيجة
                </div>
              )}
            </div>
          )}
          
          <SelectPrimitive.Viewport
            className={cn(
              "p-2 relative z-10",
              position === "popper" &&
                "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
            )}
          >
            {searchable ? filteredChildren : children}
            
            {/* Empty State */}
            {searchable && internalSearch && React.Children.count(filteredChildren) === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <div className="text-sm font-medium">لا توجد نتائج</div>
                <div className="text-xs mt-1">جرب استخدام كلمات أخرى</div>
              </div>
            )}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    )
  }
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "py-2.5 px-3 text-xs font-bold uppercase tracking-wide border-b border-gray-100",
      "bg-gradient-to-r from-transparent via-purple-50 to-transparent",
      "text-purple-700",
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 px-3 text-sm outline-none transition-all duration-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-30  focus:bg-purple-900  focus:text-white focus:shadow-lg",
        "hover:bg-purple-50 hover:scale-[1.02] hover:shadow-md",
        "border border-transparent hover:border-purple-200",
        "group",
        className
      )}
      dir="rtl"
      {...props}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <div className="flex items-center justify-center">
            <Check className="h-4 w-4 text-white animate-in zoom-in-50 duration-200" />
            <Sparkles className="h-3 w-3 text-yellow-600 absolute animate-ping" />
          </div>
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText className="font-medium">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
)
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      "-mx-1 my-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent",
      className
    )}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
}



// import * as React from 'react';
// import TextField from '@mui/material/TextField';
// import Autocomplete from '@mui/material/Autocomplete';
// import top100Films from './top100Films';

// export default function ComboBox() {
//   return (
//     <Autocomplete
//       disablePortal
//       options={top100Films}
//       sx={{ width: 300 }}
//       renderInput={(params) => <TextField {...params} label="Movie" />}
//     />
//   );
// }


// range
// import * as React from 'react';
// import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
// import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
// import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';

// export default function BasicDateRangePicker() {
//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs}>
//       <DemoContainer components={['DateRangePicker']}>
//         <DateRangePicker />
//       </DemoContainer>
//     </LocalizationProvider>
//   );
// }
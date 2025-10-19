import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      dir="rtl"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
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
        "flex cursor-default items-center justify-center py-1",
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
        "flex cursor-default items-center justify-center py-1",
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
  ({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
        className
      )}
      dir="rtl"
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
)
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
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


// import * as React from "react"
// import * as SelectPrimitive from "@radix-ui/react-select"
// import { Check, ChevronDown, ChevronUp } from "lucide-react"
// import { cn } from "@/lib/utils"

// const Select = SelectPrimitive.Root

// const SelectGroup = SelectPrimitive.Group

// const SelectValue = SelectPrimitive.Value

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
// SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

// // Context للتواصل بين Trigger و Content
// const SelectContext = React.createContext(undefined)

// const SelectContent = React.forwardRef(
//   ({ className, children, position = "popper", ...props }, ref) => {
//     const context = React.useContext(SelectContext)
    
//     // فلترة Children بناءً على search value
//     const filteredChildren = React.useMemo(() => {
//       if (!context?.searchValue) return children
      
//       return React.Children.map(children, child => {
//         if (React.isValidElement(child) && child.type === SelectItem) {
//           const childText = child.props.children?.toString().toLowerCase() || ""
//           const searchText = context.searchValue.toLowerCase()
//           if (childText.includes(searchText)) {
//             return child
//           }
//           return null
//         }
//         return child
//       }).filter(Boolean)
//     }, [children, context?.searchValue])

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
//           {...props}
//         >
//           <SelectScrollUpButton />
//           <SelectPrimitive.Viewport
//             className={cn(
//               "p-1",
//               position === "popper" &&
//                 "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
//             )}
//           >
//             {filteredChildren.length > 0 ? filteredChildren : (
//               <div className="py-6 text-center text-sm text-muted-foreground">
//                 لا توجد نتائج
//               </div>
//             )}
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

// // Select الجديد الذي يدير الـ state
// const SelectWithSearch = React.forwardRef(
//   ({ children, onValueChange, value, ...props }, ref) => {
//     const [searchValue, setSearchValue] = React.useState("")
//     const [open, setOpen] = React.useState(false)
//     const [selectedValue, setSelectedValue] = React.useState(value || "")
//     const inputRef = React.useRef(null)
    
//     const handleSearchChange = (newSearchValue) => {
//       setSearchValue(newSearchValue)
//       // فتح القائمة تلقائياً عند البدء بالكتابة
//       if (newSearchValue && !open) {
//         setOpen(true)
//       }
//     }

//     const handleValueChange = (newValue) => {
//       setSelectedValue(newValue)
//       setSearchValue("") // مسح البحث بعد الاختيار
//       setOpen(false) // إغلاق القائمة بعد الاختيار
//       onValueChange?.(newValue)
//     }

//     // تحديث القيمة المختارة عندما تتغير القيمة من الخارج
//     React.useEffect(() => {
//       setSelectedValue(value || "")
//     }, [value])
    
//     return (
//       <SelectContext.Provider value={{ 
//         searchValue, 
//         setSearchValue: handleSearchChange,
//         open,
//         setOpen,
//         inputRef,
//         selectedValue,
//         onValueChange: handleValueChange
//       }}>
//         <SelectPrimitive.Root 
//           {...props} 
//           value={selectedValue}
//           onValueChange={handleValueChange}
//           open={open} 
//           onOpenChange={setOpen}
//         >
//           {children}
//         </SelectPrimitive.Root>
//       </SelectContext.Provider>
//     )
//   }
// )
// SelectWithSearch.displayName = "SelectWithSearch"

// // SelectTrigger الجديد مع البحث
// const SelectTrigger = React.forwardRef(
//   ({ className, children, ...props }, ref) => {
//     const context = React.useContext(SelectContext)
    
//     if (!context) {
//       throw new Error("SelectTrigger must be used within Select component")
//     }

//     const { searchValue, setSearchValue, setOpen, inputRef, selectedValue } = context
    
//     const handleInputChange = (e) => {
//       const value = e.target.value
//       setSearchValue(value)
      
//       // فتح القائمة تلقائياً عند البدء بالكتابة
//       if (value && !context.open) {
//         setOpen(true)
//       }
//     }

//     const handleInputFocus = (e) => {
//       // فتح القائمة عند التركيز على حقل البحث
//       if (!context.open) {
//         setOpen(true)
//       }
//     }

//     const handleInputKeyDown = (e) => {
//       // السماح بالكتابة الطبيعية دون تدخل
//       if (e.key === "Escape" && context.open) {
//         setOpen(false)
//         e.currentTarget.blur()
//       }
//     }

//     const handleContainerClick = (e) => {
//       // فتح القائمة عند النقر على أي مكان في الحاوية
//       if (!context.open) {
//         setOpen(true)
//         // إعطاء التركيز لحقل الإدخال
//         setTimeout(() => {
//           inputRef.current?.focus()
//         }, 0)
//       }
//     }

//     return (
//       <div 
//         className={cn(
//           "flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text",
//           className
//         )}
//         onClick={handleContainerClick}
//       >
//         {/* عرض القيمة المختارة عندما لا يكون هناك بحث */}
//         {!searchValue && selectedValue && (
//           <div className="flex-1 h-10 px-3 py-2 text-sm text-right pointer-events-none">
//             <SelectValue />
//           </div>
//         )}
        
//         {/* حقل الإدخال للبحث - يكون مرئياً فقط عند البحث أو عندما لا تكون هناك قيمة مختارة */}
//         {(searchValue || !selectedValue) && (
//           <input
//             ref={inputRef}
//             type="text"
//             value={searchValue}
//             onChange={handleInputChange}
//             onFocus={handleInputFocus}
//             placeholder={selectedValue ? "ابحث..." : "اختر خيار..."}
//             className="flex-1 h-10 px-3 py-2 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground text-right"
//             dir="rtl"
//             onKeyDown={handleInputKeyDown}
//           />
//         )}
        
//         {/* زر فتح/إغلاق القائمة */}
//         <SelectPrimitive.Trigger 
//           ref={ref}
//           className="flex items-center justify-center h-10 px-3 border-r border-input text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
//           {...props}
//         >
//           <ChevronDown className="h-4 w-4 opacity-50" />
//         </SelectPrimitive.Trigger>
//       </div>
//     )
//   }
// )
// SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// // تصدير الـ Select الجديد بدلاً من القديم
// export {
//   SelectWithSearch as Select,
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
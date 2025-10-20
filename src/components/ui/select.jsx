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
// import { Check, ChevronDown, ChevronUp, Search } from "lucide-react"

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
//       <div className="flex items-center gap-2 flex-1 text-right">
//         {/* <span className="text-lg">[^]</span> */}
//         {children}
//       </div>
//       <SelectPrimitive.Icon asChild>
//         <ChevronDown className="h-4 w-4 opacity-50" />
//       </SelectPrimitive.Icon>
//     </SelectPrimitive.Trigger>
//   )
// )
// SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// const SelectContent = React.forwardRef(
//   ({ className, children, position = "popper", ...props }, ref) => {
//     const [searchValue, setSearchValue] = React.useState("")
//     const searchInputRef = React.useRef(null)
    
//     // إصلاح مشكلة التركيز - إعادة التركيز عند تغيير القيمة
//     React.useEffect(() => {
//       if (searchInputRef.current) {
//         searchInputRef.current.focus()
//       }
//     }, [searchValue])

//     const filteredChildren = React.Children.map(children, child => {
//       if (!React.isValidElement(child)) return child
      
//       if (child.type === SelectGroup) {
//         const filteredItems = React.Children.map(child.props.children, item => {
//           if (!React.isValidElement(item)) return item
//           const itemText = item.props.children?.toLowerCase() || ""
//           return itemText.includes(searchValue.toLowerCase()) ? item : null
//         }).filter(Boolean)
        
//         return filteredItems.length > 0 
//           ? React.cloneElement(child, {}, filteredItems)
//           : null
//       }
      
//       if (child.type === SelectItem) {
//         const itemText = child.props.children?.toLowerCase() || ""
//         return itemText.includes(searchValue.toLowerCase()) ? child : null
//       }
      
//       return child
//     }).filter(Boolean)

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
//           {/* Search Input */}
//           <div className="sticky top-0 bg-popover p-2 border-b z-10">
//             <div className="relative">
//               <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <input
//                 ref={searchInputRef}
//                 type="text"
//                 placeholder="....بحث"
//                 value={searchValue}
//                 onChange={(e) => setSearchValue(e.target.value)}
//                 className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-ring"
//                 dir="rtl"
//                 autoFocus
//                 onMouseDown={(e) => {
//                   // منع إغلاق القائمة عند النقر على حقل البحث
//                   e.stopPropagation()
//                 }}
//                 onClick={(e) => {
//                   // منع إغلاق القائمة عند النقر على حقل البحث
//                   e.stopPropagation()
//                 }}
//               />
//             </div>
//           </div>

//           <SelectScrollUpButton />
//           <SelectPrimitive.Viewport
//             className={cn(
//               "p-1",
//               position === "popper" &&
//                 "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
//             )}
//           >
//             {filteredChildren && filteredChildren.length > 0 ? filteredChildren : (
//               <div className="py-2 px-3 text-sm text-muted-foreground text-center">
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

// // إذا كنت تريد حقل البحث بجانب الـ trigger وليس داخل القائمة، يمكنك استخدام هذا المكون المخصص:

// const SearchableSelect = React.forwardRef(
//   ({ 
//     className,
//     children,
//     searchPlaceholder = "....بحث",
//     onSearchChange,
//     ...props 
//   }, ref) => {
//     const [searchValue, setSearchValue] = React.useState("")
//     const [isOpen, setIsOpen] = React.useState(false)

//     const handleSearchChange = (e) => {
//       const value = e.target.value
//       setSearchValue(value)
//       onSearchChange?.(value)
//     }

//     return (
//       <div className={cn("flex gap-2 items-center", className)} dir="rtl">
//         {/* Search Input بجانب ال Select */}
//         <div className="relative flex-1">
//           <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <input
//             type="text"
//             placeholder={searchPlaceholder}
//             value={searchValue}
//             onChange={handleSearchChange}
//             className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
//             dir="rtl"
//           />
//         </div>

//         {/* Select العادي */}
//         <Select 
//           {...props} 
//           open={isOpen}
//           onOpenChange={setIsOpen}
//         >
//           <SelectTrigger className="w-40">
//             <SelectValue placeholder="اختر" />
//           </SelectTrigger>
//           <SelectContent>
//             {React.Children.map(children, child => {
//               if (!React.isValidElement(child)) return child
              
//               const childText = child.props.children?.toLowerCase() || ""
//               return childText.includes(searchValue.toLowerCase()) ? child : null
//             }).filter(Boolean)}
//           </SelectContent>
//         </Select>
//       </div>
//     )
//   }
// )
// SearchableSelect.displayName = "SearchableSelect"

// // بقية المكونات تبقى كما هي
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
//   SelectScrollDownButton,
//   SearchableSelect
// }
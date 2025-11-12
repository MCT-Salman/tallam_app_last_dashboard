import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Cities from "./Cities"
import Areas from "./Areas"
import PointsOfSale from "../points/PointsOfSale"
import PaymentMethods from "../payments/PaymentMethods"

const TABS = [
  { value: "cities", label: "المدن", component: <Cities /> },
  { value: "areas", label: "المناطق", component: <Areas /> },
  { value: "points", label: "نقاط البيع", component: <PointsOfSale /> },
]

const LocationsManagement = ({ initialTab = "cities" }) => {
  const tabValues = useMemo(() => TABS.map(tab => tab.value), [])
  const [activeTab, setActiveTab] = useState(tabValues.includes(initialTab) ? initialTab : "cities")

  useEffect(() => {
    if (tabValues.includes(initialTab)) {
      setActiveTab(initialTab)
    }
  }, [initialTab, tabValues])

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" dir="rtl">
      <h1 className="text-xl md:text-3xl font-bold text-center text-secondary">
        إدارة المدن والمناطق ونقاط البيع وطرق الدفع
      </h1>

      {/* Mobile Select */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر قسم" />
          </SelectTrigger>
          <SelectContent>
            {TABS.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid md:grid-cols-3 gap-2 bg-muted rounded-lg p-1">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-3 md:mt-4 bg-background rounded-lg p-3 md:p-4 shadow-sm">
          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-3 md:space-y-4">
              {tab.component}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}

export default LocationsManagement



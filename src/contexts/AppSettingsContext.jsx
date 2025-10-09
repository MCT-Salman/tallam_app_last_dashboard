// src\contexts\AppSettingsContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

const AppSettingsContext = createContext(null)

export function AppSettingsProvider({ children }) {
  const [usdToSyp, setUsdToSyp] = useState(() => {
    const saved = localStorage.getItem("usd_to_syp_rate")
    return saved ? parseFloat(saved) : 16000
  })

  useEffect(() => {
    if (!isFinite(usdToSyp) || usdToSyp <= 0) return
    localStorage.setItem("usd_to_syp_rate", String(usdToSyp))
  }, [usdToSyp])

  const value = useMemo(() => ({ usdToSyp, setUsdToSyp }), [usdToSyp])

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider")
  return ctx
}

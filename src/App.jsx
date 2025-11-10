// src\App.jsx
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppSettingsProvider } from "./contexts/AppSettingsContext"
import { AuthProvider } from "./contexts/AuthContext"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute"


import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Dashboard from "./pages/Dashboard"

const queryClient = new QueryClient()

import "./styles/sonner.css"
import Account from "@/components/account/Account"
import Courses from "@/components/courses_managments/Courses"
import Coupons from "@/components/coupons/Coupons"
import Transactions from "@/components/transactions/Transactions"
import LevelSubscribersReport from "@/components/financial/LevelSubscribersReport"
import Stories from "@/components/stories/Stories"
import Notifications from "@/components/notifications/Notifications"
import SettingsComp from "@/components/settings/Settings"
import Accesscode from "@/components/accesscode/Accesscode"
import Review from "@/components/review/Review"
import Admins_Accounts from "@/components/account/Admins_Accounts"
import TeacherReports from "./components/financial/TeacherReports"
import LocationsManagement from "@/components/locations/LocationsManagement"

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AppSettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/accounts" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Account />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin-accounts" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Admins_Accounts />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/courses" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Courses />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/accesscode" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Accesscode />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/coupons" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Coupons />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Transactions />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/reports/level-subscribers" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LevelSubscribersReport />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/stories" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Stories />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Notifications />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/reviews" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Review />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/reports/teacher" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TeacherReports />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsComp />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/locations" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationsManagement initialTab="cities" />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/cities" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationsManagement initialTab="cities" />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/areas" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationsManagement initialTab="areas" />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/points-of-sale" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationsManagement initialTab="points" />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/payment-methods" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationsManagement initialTab="payments" />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </AuthProvider>
        </AppSettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
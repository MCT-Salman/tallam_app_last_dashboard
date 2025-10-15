// src\App.jsx
import { Toaster } from "@/components/ui/toaster"
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
// import Quizzes from "@/components/quizzes/Quizzes"
// import Files from "@/components/files/Files"
import Transactions from "@/components/transactions/Transactions"
import Financial from "@/components/financial/Financial"
// import Ads from "@/components/ads/Ads"
import Stories from "@/components/stories/Stories"
import Notifications from "@/components/notifications/Notifications"
// import Suggestions from "@/components/suggestions/Suggestions"
// import Profile from "@/components/profile/Profile"
import SettingsComp from "@/components/settings/Settings"
import Accesscode from "@/components/accesscode/Accesscode"
import Review from "@/components/review/Review"
import Admins_Accounts from "@/components/account/Admins_Accounts"

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
              {/* <Route path="/quizzes" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Quizzes />
                  </DashboardLayout>
                </ProtectedRoute>
              } /> */}
              {/* <Route path="/files" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Files />
                  </DashboardLayout>
                </ProtectedRoute>
              } /> */}
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Transactions />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              <Route path="/financial" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Financial />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              {/* <Route path="/ads" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Ads />
                  </DashboardLayout>
                </ProtectedRoute>
              } /> */}
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
              {/* <Route path="/suggestions" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suggestions />
                  </DashboardLayout>
                </ProtectedRoute>
              } /> */}
              {/* <Route path="/profile" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              } /> */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsComp />
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
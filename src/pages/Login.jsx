// src/pages/Login.jsx
import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import heroImg from "/tallaam_logo.png"
import { useSearchParams } from 'react-router-dom';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // قراءة رسالة انتهاء الجلسة من URL
    const sessionExpired = searchParams.get('sessionExpired');
    const message = searchParams.get('message');
    
    if (sessionExpired && message) {
      setError(decodeURIComponent(message));
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard"
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (submitting || loading) return
    setError("")
    setSubmitting(true)

    if (!formData.identifier.trim() || !formData.password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور")
      setSubmitting(false)
      return
    }

    try {
      await login(formData.identifier, formData.password)
    } catch (err) {
      console.error("Login error:", err)
      const errorMessage =
        err.response?.data?.res?.message ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "فشل تسجيل الدخول. يُرجى التحقق من اسم المستخدم وكلمة المرور."
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* اللوحة اليمنى */}
        <div className="flex items-center justify-center p-6 md:p-10">
          <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border/60 shadow-xl">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center">
                <img
                  src="/tallaam_logo2.png"
                  alt="تعلّم"
                  className="h-16 object-contain"
                />
              </div>
              <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
              <CardDescription>
                أدخل بياناتك للوصول إلى حسابك
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                    e.preventDefault()
                    handleSubmit(e) // ✅ إضافة هذا السطر
                  }
                }}
              >
                {/* اسم المستخدم */}
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-right block">
                    اسم المستخدم أو الهاتف
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="ايميل / اسم المستخدم"
                    value={formData.identifier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        identifier: e.target.value
                      }))
                    }
                    className="pr-3"
                    dir="rtl"
                    required
                  />
                </div>

                {/* كلمة المرور */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-right block">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="أدخل كلمة المرور"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value
                        }))
                      }
                      className="pr-10 pl-10"
                      required
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={loading || submitting}
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-accent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* نسيت كلمة المرور */}
                <div className="flex items-center justify-between gap-4">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary-hover transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                {/* عرض الخطأ */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 !mt-4">
                    <p className="text-sm text-center text-red-700 font-medium">
                      {error}
                    </p>
                  </div>
                )}

                {/* زر الدخول */}
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={loading || submitting}
                >
                  {submitting || loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      جاري تسجيل الدخول...
                    </span>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* اللوحة اليسرى */}
        <div className="relative bg-primary hidden md:block">
          <div
            className="absolute inset-0 bg-center bg-no-repeat -top-90"
            style={{ backgroundImage: `url(${heroImg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000]/70 to-background/20" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-12">
            <h1 className="text-3xl font-bold text-white mb-3">
              مرحباً بك في منصة تعلّم
            </h1>
            <p className="text-white/80 max-w-md">
              سجل دخولك للوصول إلى لوحة التحكم وإدارة المنصة بسهولة.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

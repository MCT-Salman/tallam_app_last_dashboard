// src\pages\NotFound.jsx
import { useLocation, Link } from "react-router-dom"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    )
  }, [location.pathname])

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-secondary/20"
      dir="rtl"
    >
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">
          عذراً! الصفحة المطلوبة غير موجودة
        </p>
        <p className="mb-8 text-muted-foreground">
          يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو حذفها
        </p>
        <Link to="/dashboard">
          <Button className="btn-hero cursor-pointer">العودة للرئيسية</Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound

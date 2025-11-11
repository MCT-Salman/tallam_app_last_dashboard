// src\pages\NotFound.jsx
import { useLocation, Link } from "react-router-dom"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react"

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
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <AlertTriangle className="w-16 h-16 text-purple-900 dark:text-red-400" />
          </div>
          <div className="absolute top-[0%] left-[50%] translate-x-[-50%] w-30 h-30 border-4 border-red-200 dark:border-red-800 rounded-full animate-ping"></div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
            404
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            عذراً! الصفحة غير موجودة
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            لم نتمكن من العثور على الصفحة التي تبحث عنها. 
            قد تكون الصفحة قد تم نقلها أو حذفها.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-right">
              <strong>المسار المحاول:</strong>
              <br />
              <code dir="ltr" className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs mt-1 inline-block">
                {location.pathname}
              </code>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="flex-1">
            <Button className="w-full bg-gradient-to-l bg-purple-900  text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-12">
              <Home className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
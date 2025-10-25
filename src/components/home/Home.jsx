import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, GraduationCap, BookOpen, Image as ImageIcon, TrendingUp, DollarSign } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAllUsers, getInstructors, getCourseLevels, getStories, getAllAccessCodes, getTransactions } from "@/api/api"
import { showErrorToast } from "@/hooks/useToastMessages"

// دالة لتحويل الأرقام إلى نص عربي
const numberToArabicWords = (num) => {
  if (num === 0) return 'صفر'
  
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر']
  const hundreds = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة']
  
  if (num < 10) return ones[num]
  if (num >= 10 && num < 20) return teens[num - 10]
  if (num >= 20 && num < 100) {
    const ten = Math.floor(num / 10)
    const one = num % 10
    return one === 0 ? tens[ten] : `${ones[one]} و${tens[ten]}`
  }
  if (num >= 100 && num < 1000) {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    return remainder === 0 ? hundreds[hundred] : `${hundreds[hundred]} و${numberToArabicWords(remainder)}`
  }
  if (num >= 1000 && num < 1000000) {
    const thousand = Math.floor(num / 1000)
    const remainder = num % 1000
    const thousandWord = thousand === 1 ? 'ألف' : thousand === 2 ? 'ألفان' : `${numberToArabicWords(thousand)} ألف`
    return remainder === 0 ? thousandWord : `${thousandWord} و${numberToArabicWords(remainder)}`
  }
  if (num >= 1000000) {
    const million = Math.floor(num / 1000000)
    const remainder = num % 1000000
    const millionWord = million === 1 ? 'مليون' : million === 2 ? 'مليونان' : `${numberToArabicWords(million)} مليون`
    return remainder === 0 ? millionWord : `${millionWord} و${numberToArabicWords(remainder)}`
  }
  
  return num.toString()
}

// مكون مخصص لـ Tooltip الإيرادات
const CustomRevenueTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const valueSYP = payload[0]?.value || 0
    const valueUSD = payload[0]?.payload?.revenueUSD || 0
    
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg min-w-[250px]">
        <p className="font-bold text-gray-800 mb-3 text-center border-b pb-2">{payload[0].payload.month}</p>
        
        {/* السعر بالليرة السورية */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">بالليرة السورية:</p>
          <p className="text-green-600 font-bold text-lg">{valueSYP.toLocaleString()} ل.س</p>
          <p className="text-xs text-gray-600 mt-1">{numberToArabicWords(valueSYP)} ليرة سورية</p>
        </div>
        
        {/* السعر بالدولار */}
        {valueUSD > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-1">بالدولار الأمريكي:</p>
            <p className="text-blue-600 font-bold text-lg">${valueUSD.toLocaleString()}</p>
          </div>
        )}
      </div>
    )
  }
  return null
}

const Home = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalInstructors: 0,
    totalLevels: 0,
    activeStories: 0
  })

  const [subscribersChart, setSubscribersChart] = useState([])
  const [revenueChart, setRevenueChart] = useState([])
  const [levelsChart, setLevelsChart] = useState([])

  // جلب الإحصائيات
  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      // 1. جلب إجمالي الطلاب
      const usersRes = await getAllUsers({ role: 'STUDENT', take: 10000 })
      const allStudents = usersRes.data?.data?.items || []
      const totalStudents = allStudents.length

      // 2. جلب الطلاب النشطين (الذين لديهم أكواد نشطة)
      const accessCodesRes = await getAllAccessCodes()
      const allAccessCodes = accessCodesRes.data?.data || []
      
      // استخراج المستخدمين الفريدين الذين لديهم أكواد نشطة
      const activeUserIds = new Set()
      const now = new Date()
      
      allAccessCodes.forEach(code => {
        if (code.isActive && code.userId) {
          const expiresAt = new Date(code.expiresAt)
          if (expiresAt > now) {
            activeUserIds.add(code.userId)
          }
        }
      })
      
      const activeStudents = activeUserIds.size

      // 3. جلب عدد المدرسين
      const instructorsRes = await getInstructors()
      const instructorsData = Array.isArray(instructorsRes.data?.data?.data) 
        ? instructorsRes.data.data.data 
        : Array.isArray(instructorsRes.data?.data?.items)
        ? instructorsRes.data.data.items
        : []
      const totalInstructors = instructorsData.length

      // 4. جلب عدد المستويات (نحتاج لجلب جميع الكورسات أولاً)
      const coursesRes = await fetch(`${import.meta.env.VITE_BASE_URL || "https://dev.tallaam.com"}/api/catalog/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      const coursesData = await coursesRes.json()
      const allCourses = Array.isArray(coursesData.data?.items) 
        ? coursesData.data.items 
        : Array.isArray(coursesData.data?.data)
        ? coursesData.data.data
        : []
      
      let totalLevels = 0
      for (const course of allCourses) {
        try {
          const levelsRes = await getCourseLevels(course.id)
          let levels = []
          
          if (Array.isArray(levelsRes.data?.data)) {
            if (levelsRes.data.data.length > 0 && Array.isArray(levelsRes.data.data[0])) {
              levels = levelsRes.data.data[0]
            } else {
              levels = levelsRes.data.data
            }
          } else if (Array.isArray(levelsRes.data?.data?.items)) {
            levels = levelsRes.data.data.items
          } else if (Array.isArray(levelsRes.data?.data?.data)) {
            levels = levelsRes.data.data.data
          }
          
          totalLevels += levels.length
        } catch (err) {
          console.error(`Error fetching levels for course ${course.id}:`, err)
        }
      }

      // 5. جلب القصص النشطة
      const storiesRes = await getStories()
      let allStories = []
      
      if (storiesRes.data?.data?.data && Array.isArray(storiesRes.data.data.data)) {
        allStories = storiesRes.data.data.data
      } else if (Array.isArray(storiesRes.data?.data)) {
        allStories = storiesRes.data.data
      } else if (Array.isArray(storiesRes.data)) {
        allStories = storiesRes.data
      }
      
      const activeStories = allStories.filter(story => story.isActive).length

      console.log("📊 Dashboard Stats:", {
        totalStudents,
        activeStudents,
        totalInstructors,
        totalLevels,
        activeStories
      })

      setStats({
        totalStudents,
        activeStudents,
        totalInstructors,
        totalLevels,
        activeStories
      })

      // إنشاء بيانات المخططات
      await generateChartData(allStudents, allAccessCodes, allCourses, totalLevels)

    } catch (err) {
      console.error("❌ Error fetching dashboard stats:", err)
      showErrorToast("فشل تحميل إحصائيات لوحة التحكم")
    } finally {
      setLoading(false)
    }
  }

  // إنشاء بيانات المخططات
  const generateChartData = async (students, accessCodes, courses, totalLevels) => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const currentYear = new Date().getFullYear()

    // 1. مخطط المشتركين حسب الشهر
    const subscribersData = months.map((month, index) => {
      const monthStudents = students.filter(student => {
        const createdDate = new Date(student.createdAt)
        return createdDate.getMonth() === index && createdDate.getFullYear() === currentYear
      })
      return {
        month,
        count: monthStudents.length
      }
    })
    setSubscribersChart(subscribersData)

    // 2. مخطط الإيرادات من المعاملات حسب الشهر
    try {
      // جلب جميع المعاملات
      const transactionsRes = await getTransactions({ page: 1, limit: 10000 })
      const allTransactions = transactionsRes.data?.data?.transactions || []
      
      console.log("📊 All transactions for revenue:", allTransactions.length)
      
      const revenueData = months.map((month, index) => {
        const monthTransactions = allTransactions.filter(transaction => {
          const createdDate = new Date(transaction.createdAt)
          return createdDate.getMonth() === index && createdDate.getFullYear() === currentYear
        })
        
        // حساب الإيرادات بالليرة السورية
        const totalRevenueSYP = monthTransactions.reduce((sum, transaction) => {
          let amount = 0
          if (transaction.amountPaid) {
            if (typeof transaction.amountPaid === 'number') {
              amount = transaction.amountPaid
            } else if (transaction.amountPaid.d && Array.isArray(transaction.amountPaid.d)) {
              amount = transaction.amountPaid.d[0] || 0
            }
          }
          return sum + amount
        }, 0)
        
        // حساب الإيرادات بالدولار من المستويات
        const totalRevenueUSD = monthTransactions.reduce((sum, transaction) => {
          let amountUSD = 0
          // محاولة الحصول على السعر بالدولار من المستوى
          if (transaction.accessCode?.courseLevel?.priceUSD) {
            amountUSD = transaction.accessCode.courseLevel.priceUSD
          }
          return sum + amountUSD
        }, 0)
        
        return {
          month,
          revenue: totalRevenueSYP,
          revenueUSD: totalRevenueUSD
        }
      })
      
      console.log("📊 Revenue data (SYP & USD):", revenueData)
      console.log("📊 Total USD revenue:", revenueData.reduce((sum, item) => sum + item.revenueUSD, 0))
      setRevenueChart(revenueData)
    } catch (err) {
      console.error("❌ Error fetching transactions for chart:", err)
      setRevenueChart(months.map(month => ({ month, revenue: 0 })))
    }

    // 3. مخطط المستويات المضافة حسب الشهر
    // جلب جميع المستويات مرة واحدة ثم فلترتها
    const allLevelsWithDates = []
    
    for (const course of courses) {
      try {
        const levelsRes = await getCourseLevels(course.id)
        let levels = []
        
        if (Array.isArray(levelsRes.data?.data)) {
          if (levelsRes.data.data.length > 0 && Array.isArray(levelsRes.data.data[0])) {
            levels = levelsRes.data.data[0]
          } else {
            levels = levelsRes.data.data
          }
        } else if (Array.isArray(levelsRes.data?.data?.items)) {
          levels = levelsRes.data.data.items
        } else if (Array.isArray(levelsRes.data?.data?.data)) {
          levels = levelsRes.data.data.data
        }
        
        // إضافة المستويات التي لها تاريخ إنشاء
        levels.forEach(level => {
          if (level.createdAt) {
            allLevelsWithDates.push(level)
          }
        })
      } catch (err) {
        console.error(`Error fetching levels for course ${course.id}:`, err)
      }
    }
    
    // الآن نفلتر المستويات حسب الشهر
    const levelsData = months.map((month, index) => {
      const monthLevels = allLevelsWithDates.filter(level => {
        const createdDate = new Date(level.createdAt)
        return createdDate.getMonth() === index && createdDate.getFullYear() === currentYear
      })
      
      return {
        month,
        count: monthLevels.length
      }
    })
    
    console.log("📊 Total levels with dates:", allLevelsWithDates.length)
    console.log("📊 Levels data by month:", levelsData)
    setLevelsChart(levelsData)
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* العنوان المحسّن */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-lg blur-3xl -z-10"></div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              نظرة شاملة على أداء المنصة
            </p>
          </div>
          {/* <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>متصل</span>
            </div>
          </div> */}
        </div>
      </div>

      {/* البطاقات الإحصائية المحسّنة */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* إجمالي المشتركين */}
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">إجمالي المشتركين</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              جميع الطلاب المسجلين
            </p>
          </CardContent>
        </Card>

        {/* المشتركين النشطين */}
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">المشتركين النشطين</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.activeStudents.toLocaleString()}</div>
            {/* <p className="text-xs text-green-600 mt-2 flex items-center gap-1"> */}
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span> لديهم أكواد شراء نشطة</span>
            {/* </p> */}
          </CardContent>
        </Card>

        {/* عدد المدرسين */}
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-purple-50 to-violet-50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-violet-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">المدرسين</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{stats.totalInstructors.toLocaleString()}</div>
            <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              إجمالي المدرسين
            </p>
          </CardContent>
        </Card>

        {/* عدد المستويات */}
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-amber-50 to-yellow-50">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">الدورات</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{stats.totalLevels.toLocaleString()}</div>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              عدد الدورات بمستوياتها
            </p>
          </CardContent>
        </Card>

        {/* القصص النشطة */}
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-rose-50 to-pink-50">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-900">القصص النشطة</CardTitle>
            <div className="p-2 bg-rose-100 rounded-lg group-hover:scale-110 transition-transform">
              <ImageIcon className="h-5 w-5 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-700">{stats.activeStories.toLocaleString()}</div>
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              قصص نشطة حالياً
            </p>
          </CardContent>
        </Card>
      </div>

      {/* المخططات البيانية المحسّنة */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* مخطط المشتركين */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
          <CardHeader className="border-b bg-white/50 backdrop-blur">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              المشتركين خلال الأشهر
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">تتبع نمو المشتركين الجدد</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={subscribersChart}>
                <defs>
                  <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#colorSubscribers)"
                  name="عدد المشتركين"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

         {/* مخطط المستويات - عرض كامل */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50/50 to-violet-50/50">
        <CardHeader className="border-b bg-white/50 backdrop-blur">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            الدورات المضافة خلال الأشهر
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">نمو محتوى المنصة التعليمي</p>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={levelsChart}>
              <defs>
                <linearGradient id="colorLevels" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fill="url(#colorLevels)"
                name="عدد الدورات"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#7c3aed' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

       
      </div>
 {/* مخطط الإيرادات */}
 <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50/50 to-emerald-50/50">
          <CardHeader className="border-b bg-white/50 backdrop-blur">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              الإيرادات من الأكواد
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">تحليل الإيرادات الشهرية</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomRevenueTooltip />} />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#colorRevenue)"
                  name="الإيرادات (ل.س)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
     
    </div>
  )
}

export default Home

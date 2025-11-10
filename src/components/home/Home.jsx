import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserCheck, GraduationCap, BookOpen, Image as ImageIcon, TrendingUp,
   DollarSign, MapPin, Code, Globe, BadgeAlert } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
   ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  getAllUsers,
  getInstructors,
  getCourses,
  getCourseLevels,
  getStories,
  getTransactions,
  getAllAccessCodes,
  getcountStudentOfInstructors
} from "@/api/api"
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

    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg min-w-[250px]">
        <p className="font-bold text-gray-800 mb-3 text-center border-b pb-2">{payload[0].payload.month}</p>

        {/* السعر بالليرة السورية */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">بالليرة السورية:</p>
          <p className="text-green-600 font-bold text-lg">{valueSYP.toLocaleString()} ل.س</p>
          <p className="text-xs text-gray-600 mt-1">{numberToArabicWords(valueSYP)} ليرة سورية</p>
        </div>
      </div>
    )
  }
  return null
}

// مكون مخصص لـ Tooltip الدول
const CustomCountryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{payload[0].name}</p>
        <p className="text-green-600 font-bold">{payload[0].value.toLocaleString()} طالب</p>
      </div>
    )
  }
  return null
}

// ألوان للمخطط الدائري
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const Home = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalInstructors: 0,
    totalLevels: 0,
    activeStories: 0,
    activeCodesCount: 0,
    totalUsersWithAnyActiveCode: 0
  })

  const [subscribersChart, setSubscribersChart] = useState([])
  const [revenueChart, setRevenueChart] = useState([])
  const [levelsChart, setLevelsChart] = useState([])
  const [usersByCountry, setUsersByCountry] = useState([])
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [countryUsersCount, setCountryUsersCount] = useState(0)

  // الحالات الجديدة للدكاترة
  const [instructorsStudents, setInstructorsStudents] = useState([])
  const [selectedInstructor, setSelectedInstructor] = useState('all')
  const [instructorStudentsCount, setInstructorStudentsCount] = useState(0)

  // دالة مساعدة لجلب تقرير الأكواد النشطة (بديل عن API غير موجود)
  const getAccessCodesReportData = async () => {
    try {
      const accessCodesRes = await getAllAccessCodes()
      const allAccessCodes = Array.isArray(accessCodesRes.data?.data)
        ? accessCodesRes.data.data
        : Array.isArray(accessCodesRes.data?.data?.items)
          ? accessCodesRes.data.data.items
          : Array.isArray(accessCodesRes.data)
            ? accessCodesRes.data
            : []

      // حساب الإحصائيات محلياً
      const now = new Date()
      // نشط: غير مستخدم ومفعّل
      const activeCodes = allAccessCodes.filter(code => (code.expiresAt < now.toString()) && code.used)

      const activeUserIds = new Set()
      const usersByLevelMap = new Map()

      activeCodes.forEach(code => {
        const uid = code.userId || code.user?.id
        if (uid) {
          activeUserIds.add(uid)
        }

        // تجميع حسب المستوى
        const levelId = code.courseLevelId || code.courseLevel?.id
        const levelName = code.courseLevelName || code.courseLevel?.name
        if (levelId && levelName) {
          if (!usersByLevelMap.has(levelId)) {
            usersByLevelMap.set(levelId, {
              courseLevelId: levelId,
              courseLevelName: levelName,
              totalUsersWithActiveCode: 0,
              userSet: new Set()
            })
          }
          const levelData = usersByLevelMap.get(levelId)
          if (uid) {
            levelData.userSet.add(uid)
            levelData.totalUsersWithActiveCode = levelData.userSet.size
          }
        }
      })

      return {
        activeCodesCount: activeCodes.length,
        totalUsersWithAnyActiveCode: activeUserIds.size,
        usersByLevel: Array.from(usersByLevelMap.values())
      }
    } catch (error) {
      console.error("Error generating access codes report:", error)
      return {
        activeCodesCount: 0,
        totalUsersWithAnyActiveCode: 0,
        usersByLevel: []
      }
    }
  }

  // دالة مساعدة لجلب تقرير المستخدمين حسب البلد (بديل عن API غير موجود)
  const getUsersReportData = async () => {
    try {
      const usersRes = await getAllUsers({ role: 'STUDENT', take: 1000 })
      const allStudents = usersRes.data?.data?.items || []

      // تجميع حسب البلد
      const countryMap = new Map()

      allStudents.forEach(student => {
        const country = student.country || 'غير محدد'
        if (!countryMap.has(country)) {
          countryMap.set(country, { country, totalUsers: 0 })
        }
        countryMap.get(country).totalUsers++
      })

      return Array.from(countryMap.values())
    } catch (error) {
      console.error("Error generating users report:", error)
      return []
    }
  }

  // دالة جديدة لجلب عدد الطلاب لكل دكتور من الـ API
  const fetchInstructorsStudentsCount = async () => {
    try {
      const response = await getcountStudentOfInstructors()
      if (response.data?.success) {
        return response.data.data.count || []
      }
      return []
    } catch (error) {
      console.error("Error fetching instructors students count:", error)
      return []
    }
  }

  // جلب جميع البيانات بشكل متوازي
  const fetchDashboardStats = useCallback(async () => {
    setLoading(true)
    try {
      // جلب جميع البيانات بالتوازي
      const [
        usersRes,
        instructorsRes,
        coursesRes,
        storiesRes,
        transactionsRes,
        instructorsStudentsData
      ] = await Promise.all([
        getAllUsers({ role: 'STUDENT', take: 1000 }),
        getInstructors(),
        getCourses(), // مطابق لطريقة صفحات الإدارة
        getStories(),
        getTransactions({ page: 1, limit: 1000 }),
        fetchInstructorsStudentsCount() // جلب بيانات الدكاترة والطلاب
      ])

      // جلب التقارير بشكل منفصل (لأنها قد تسبب أخطاء)
      const [accessCodesReport, usersReport] = await Promise.all([
        getAccessCodesReportData(),
        getUsersReportData()
      ])

      // معالجة البيانات الأساسية
      const allStudents = usersRes.data?.data?.items || []
      const totalStudents = allStudents.length

      // بيانات الأكواد النشطة من التقرير المحلي
      const activeCodesCount = accessCodesReport.activeCodesCount || 0
      const totalUsersWithAnyActiveCode = accessCodesReport.totalUsersWithAnyActiveCode || 0

      // عدد المدرسين
      const instructorsData = Array.isArray(instructorsRes.data?.data?.data)
        ? instructorsRes.data.data.data
        : Array.isArray(instructorsRes.data?.data?.items)
          ? instructorsRes.data.data.items
          : []
      const totalInstructors = instructorsData.length

      // تخزين بيانات الدكاترة والطلاب
      setInstructorsStudents(instructorsStudentsData)

      // عدد المستويات (من جميع الكورسات)
      const allCourses = Array.isArray(coursesRes.data?.data?.items)
        ? coursesRes.data.data.items
        : Array.isArray(coursesRes.data?.data?.data)
          ? coursesRes.data.data.data
          : Array.isArray(coursesRes.data)
            ? coursesRes.data
            : []
      let totalLevels = await calculateTotalLevels(allCourses)
      // إذا لم نجد أي مستويات، حاول مرة أخرى بطريقة التسطيح من الـ CourseLevel.jsx
      if (totalLevels === 0 && allCourses.length > 0) {
        console.warn('No levels counted, retrying with fallback extraction...')
        const levelPromises = allCourses.map(course =>
          getCourseLevels(course.id).catch(() => ({ data: { data: [] } }))
        )
        const results = await Promise.all(levelPromises)
        const levelsCount = results.reduce((acc, res) => {
          let data = []
          if (Array.isArray(res.data?.data)) {
            data = res.data.data.length > 0 && Array.isArray(res.data.data[0])
              ? res.data.data[0]
              : res.data.data
          } else if (Array.isArray(res.data?.data?.items)) {
            data = res.data.data.items
          } else if (Array.isArray(res.data?.data?.data)) {
            data = res.data.data.data
          }
          return acc + (data?.length || 0)
        }, 0)
        if (levelsCount > 0) {
          totalLevels = levelsCount
        }
      }

      // القصص النشطة
      const storiesData = await processStoriesData(storiesRes)
      const activeStories = storiesData.filter(story => story.isActive && story.isStory).length
      const activeAds = storiesData.filter(story => story.isActive && !story.isStory).length

      // بيانات الدول
      const countryData = usersReport || []
      setUsersByCountry(countryData)

      // تحديث الإحصائيات
      setStats({
        totalStudents,
        activeStudents: totalUsersWithAnyActiveCode,
        totalInstructors,
        totalLevels,
        activeStories,
        activeAds,
        activeCodesCount,
        totalUsersWithAnyActiveCode
      })


      // إنشاء بيانات المخططات من البيانات الحقيقية
      await generateChartData(allStudents, transactionsRes.data?.data?.transactions || [], allCourses)

    } catch (err) {
      console.error(" Error fetching dashboard stats:", err)
      showErrorToast("فشل تحميل إحصائيات لوحة التحكم")
      // استخدام بيانات افتراضية في حالة الخطأ
      setSubscribersChart(generateFallbackChartData())
      setRevenueChart(generateFallbackChartData())
      setLevelsChart(generateFallbackChartData())
    } finally {
      setLoading(false)
    }
  }, [])

  // حساب إجمالي المستويات
  const calculateTotalLevels = async (courses) => {
    try {
      const levelPromises = courses.map(course =>
        getCourseLevels(course.id).catch(err => {
          console.error(`Error fetching levels for course ${course.id}:`, err)
          return { data: { data: [] } }
        })
      )

      const levelsResults = await Promise.all(levelPromises)
      return levelsResults.reduce((total, result) => {
        let levels = []
        const raw = result.data?.data
        if (Array.isArray(raw)) {
          levels = raw.flat()
        } else if (Array.isArray(result.data?.data?.items)) {
          levels = result.data.data.items
        } else if (Array.isArray(result.data)) {
          levels = result.data
        }
        return total + (levels?.length || 0)
      }, 0)
    } catch (error) {
      console.error("Error calculating total levels:", error)
      return 0
    }
  }

  // معالجة بيانات القصص
  const processStoriesData = async (storiesRes) => {
    try {
      let allStories = []

      if (storiesRes.data?.data?.data && Array.isArray(storiesRes.data.data.data)) {
        allStories = storiesRes.data.data.data
      } else if (Array.isArray(storiesRes.data?.data)) {
        allStories = storiesRes.data.data
      } else if (Array.isArray(storiesRes.data)) {
        allStories = storiesRes.data
      }

      return allStories
    } catch (error) {
      console.error("Error processing stories data:", error)
      return []
    }
  }

  // إنشاء بيانات المخططات من البيانات الحقيقية
  const generateChartData = async (students, transactions, courses) => {
    const months = ['[1] كانون الثاني', '[2] شباط', '[3] آذار', '[4] نيسان', '[5] أيار', '[6] حزيران', '[7] تموز', '[8] آب', '[9] أيلول', '[10] تشرين الأول', '[11] تشرين الثاني', '[12] كانون الأول'];
    const currentYear = new Date().getFullYear()

    // 1. مخطط المشتركين حسب الشهر - معالجة محلية
    const subscribersData = months.map((month, index) => {
      const monthStudents = students.filter(student => {
        if (!student.createdAt) return false
        const createdDate = new Date(student.createdAt)
        return createdDate.getMonth() === index && createdDate.getFullYear() === currentYear
      })
      return {
        month,
        count: monthStudents.length
      }
    })
    setSubscribersChart(subscribersData)

    // 2. مخطط الإيرادات - معالجة محلية
    const revenueData = months.map((month, index) => {
      const monthTransactions = transactions.filter(transaction => {
        if (!transaction.createdAt) return false
        const createdDate = new Date(transaction.createdAt)
        return createdDate.getMonth() === index && createdDate.getFullYear() === currentYear
      })

      const totalRevenue = monthTransactions.reduce((sum, transaction) => {
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

      return {
        month,
        revenue: totalRevenue
      }
    })
    setRevenueChart(revenueData)

    // 3. مخطط المستويات - معالجة محلية
    const levelsData = await generateLevelsChartData(courses)
    setLevelsChart(levelsData)
  }

  // إنشاء بيانات مخطط المستويات من البيانات الحقيقية
  const generateLevelsChartData = async (courses) => {
    const months = ['[1] كانون الثاني', '[2] شباط', '[3] آذار', '[4] نيسان', '[5] أيار', '[6] حزيران', '[7] تموز', '[8] آب', '[9] أيلول', '[10] تشرين الأول', '[11] تشرين الثاني', '[12] كانون الأول'];
    const currentYear = new Date().getFullYear()

    try {
      // جلب جميع المستويات مع تواريخها
      const allLevels = await getAllLevelsWithDates(courses)
      // Fallback: إذا كانت خالية، أعد المحاولة باستخدام منطق CourseLevel.jsx
      let levelsWithDates = allLevels
      if (!levelsWithDates.length && courses.length) {
        const levelPromises = courses.map(course =>
          getCourseLevels(course.id).catch(() => ({ data: { data: [] } }))
        )
        const results = await Promise.all(levelPromises)
        const extracted = []
        results.forEach(res => {
          let data = []
          if (Array.isArray(res.data?.data)) {
            data = res.data.data.length > 0 && Array.isArray(res.data.data[0])
              ? res.data.data[0]
              : res.data.data
          } else if (Array.isArray(res.data?.data?.items)) {
            data = res.data.data.items
          } else if (Array.isArray(res.data?.data?.data)) {
            data = res.data.data.data
          }
          data.forEach(level => level?.createdAt && extracted.push(level))
        })
        levelsWithDates = extracted
      }

      // تجميع المستويات حسب الشهر
      const monthlyCounts = new Array(12).fill(0)

      levelsWithDates.forEach(level => {
        if (level.createdAt) {
          const createdDate = new Date(level.createdAt)
          if (createdDate.getFullYear() === currentYear) {
            const monthIndex = createdDate.getMonth()
            monthlyCounts[monthIndex]++
          }
        }
      })

      return months.map((month, index) => ({
        month,
        count: monthlyCounts[index]
      }))
    } catch (error) {
      console.error("Error generating levels chart data:", error)
      // بيانات افتراضية في حالة الخطأ
      return months.map(month => ({ month, count: 0 }))
    }
  }

  // دالة مساعدة لجمع جميع المستويات مع التواريخ
  const getAllLevelsWithDates = async (courses) => {
    const levelPromises = courses.map(course =>
      getCourseLevels(course.id).catch(err => {
        console.error(`Error fetching levels for course ${course.id}:`, err)
        return { data: { data: [] } }
      })
    )

    const levelsResults = await Promise.all(levelPromises)
    const allLevels = []

    levelsResults.forEach(result => {
      let levels = []
      const raw = result.data?.data
      if (Array.isArray(raw)) {
        levels = raw.flat()
      } else if (Array.isArray(result.data?.data?.items)) {
        levels = result.data.data.items
      } else if (Array.isArray(result.data)) {
        levels = result.data
      }
      levels.forEach(level => {
        if (level && level.createdAt) {
          allLevels.push(level)
        }
      })
    })

    return allLevels
  }

  // بيانات افتراضية للمخططات في حالة الخطأ
  const generateFallbackChartData = () => {
    const months = ['[1] كانون الثاني', '[2] شباط', '[3] آذار', '[4] نيسان', '[5] أيار', '[6] حزيران', '[7] تموز', '[8] آب', '[9] أيلول', '[10] تشرين الأول', '[11] تشرين الثاني', '[12] كانون الأول'];
    return months.map(month => ({ month, count: 0, revenue: 0 }))
  }

  // تحديث عدد الطلاب عند اختيار دولة
  useEffect(() => {
    if (selectedCountry === 'all') {
      setCountryUsersCount(stats.totalStudents)
    } else {
      const countryData = usersByCountry.find(country => country.country === selectedCountry)
      setCountryUsersCount(countryData ? countryData.totalUsers : 0)
    }
  }, [selectedCountry, usersByCountry, stats.totalStudents])

  // تحديث عدد الطلاب عند اختيار الدكتور
  useEffect(() => {
    if (selectedInstructor === 'all') {
      setInstructorStudentsCount(stats.totalStudents)
    } else {
      const instructorData = instructorsStudents.find(instructor =>
        instructor.instructorId.toString() === selectedInstructor
      )
      setInstructorStudentsCount(instructorData ? instructorData.studentCount : 0)
    }
  }, [selectedInstructor, instructorsStudents, stats.totalStudents])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        {/* <p className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</p> */}
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
            <h1 className="text-4xl font-bold bg-secondary bg-clip-text text-transparent">
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              نظرة شاملة على أداء المنصة
            </p>
          </div>
        </div>
      </div>

      {/* البطاقات الإحصائية - جميعها بيانات حقيقية */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
            <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              جميع الطلاب المسجلين
            </div>
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
            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>لديهم دورات نشطة</span>
            </div>
          </CardContent>
        </Card>

        {/* الأكواد النشطة */}
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">الأكواد النشطة</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform">
              <Code className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{stats.activeCodesCount.toLocaleString()}</div>
            <div className="text-xs text-orange-600 mt-2 flex items-center gap-1">
              <Code className="h-3 w-3" />
              أكواد مستخدمة حالياً
            </div>
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
            <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              إجمالي المدرسين
            </div>
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
            <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              عدد الدورات بمستوياتها
            </div>
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
            <div className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              قصص نشطة حالياً
            </div>
          </CardContent>
        </Card>

        {/* الإعلانات النشطة */}
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none bg-gradient-to-br from-gray-50 to-zinc-50">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200/15 to-zinc-300/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">الإعلانات النشطة</CardTitle>
            <div className="p-2 bg-gray-100 rounded-lg group-hover:scale-110 transition-transform">
              <BadgeAlert className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{stats.activeAds.toLocaleString()}</div>
            <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              إعلان نشط حالياً
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المخططات البيانية - جميعها بيانات حقيقية */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
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
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
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

        {/* توزيع المستخدمين حسب البلد */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50/50 to-violet-50/50">
          <CardHeader className="border-b bg-white/50 backdrop-blur">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              توزيع المستخدمين حسب البلد
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">التوزيع الجغرافي للمشتركين</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usersByCountry}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ country, totalUsers }) => `${country}: ${totalUsers}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="totalUsers"
                  nameKey="country"
                >
                  {usersByCountry.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomCountryTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* اختيار الدولة وعرض العدد */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-cyan-50/50 to-blue-50/50">
          <CardHeader className="border-b bg-white/50 backdrop-blur">
            <CardTitle className="flex items-center gap-2 text-cyan-900">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <MapPin className="h-5 w-5 text-cyan-600" />
              </div>
              الطلاب حسب البلد
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">اختر دولة لعرض عدد الطلاب</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الدولة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الدول</SelectItem>
                  {usersByCountry.map((country, index) => (
                    <SelectItem key={index} value={country.country}>
                      {country.country} ({country.totalUsers})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-center p-6 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg border border-cyan-200">
                <div className="text-4xl font-bold text-cyan-700 mb-2">
                  {countryUsersCount.toLocaleString()}
                </div>
                <p className="text-cyan-600 font-medium">
                  {selectedCountry === 'all' ? 'إجمالي الطلاب' : `طلاب من ${selectedCountry}`}
                </p>
                <p className="text-sm text-cyan-500 mt-2">
                  {numberToArabicWords(countryUsersCount)} طالب
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* اختيار الدكتور وعرض عدد الطلاب */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-teal-50/50 to-green-50/50">
          <CardHeader className="border-b bg-white/50 backdrop-blur">
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <div className="p-2 bg-teal-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-teal-600" />
              </div>
              الطلاب حسب المدرس
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">اختر مدرس لعرض عدد الطلاب المشتركين لديه</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المدرس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدرسين</SelectItem>
                  {instructorsStudents.map((instructor) => (
                    <SelectItem
                      key={instructor.instructorId}
                      value={instructor.instructorId.toString()}
                    >
                      {instructor.instructorName} ({instructor.studentCount} طالب)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-center p-6 bg-gradient-to-br from-teal-100 to-green-100 rounded-lg border border-teal-200">
                <div className="text-4xl font-bold text-teal-700 mb-2">
                  {instructorStudentsCount.toLocaleString()}
                </div>
                <p className="text-teal-600 font-medium">
                  {selectedInstructor === 'all'
                    ? 'إجمالي الطلاب'
                    : `طلاب لدى ${instructorsStudents.find(i => i.instructorId.toString() === selectedInstructor)?.instructorName || 'المدرس المحدد'}`
                  }
                </p>
                <p className="text-sm text-teal-500 mt-2">
                  {numberToArabicWords(instructorStudentsCount)} طالب
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* مخطط المستويات */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-pink-50/50 to-rose-50/50">
          <CardHeader className="border-b bg-white/50 backdrop-blur">
            <CardTitle className="flex items-center gap-2 text-pink-900">
              <div className="p-2 bg-pink-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-pink-600" />
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
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
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
                  stroke="#ec4899"
                  strokeWidth={3}
                  fill="url(#colorLevels)"
                  name="عدد الدورات"
                  dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#db2777' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Home
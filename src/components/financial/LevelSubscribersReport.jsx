import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ChevronDown, ChevronUp, Loader2, Users, GraduationCap, BookOpen, Layers, Eye, Search, Filter, User, Phone, Hash, ChevronLeft, ChevronRight } from "lucide-react"
import { 
  getInstructors,
  getSpecializations,
  getCourses,
  getCourseLevels,
  getAllAccessCodes
} from "@/api/api"
import { showErrorToast } from "@/hooks/useToastMessages"

// اعتبر الكود نشطاً إذا كان isActive=true ولم يُستخدم
const isCodeActive = (code) => {
  if (!code) return false
  if (code.used) return false
  if (!code.isActive) return false
  return true
}

const LevelSubscribersReport = () => {
  const [loading, setLoading] = useState(false)
  const [instructors, setInstructors] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [courses, setCourses] = useState([])
  const [levelsByCourseId, setLevelsByCourseId] = useState(new Map())
  const [activeCodes, setActiveCodes] = useState([])
  const [expanded, setExpanded] = useState({})
  const [selectedInstructor, setSelectedInstructor] = useState("all")
  const [selectedSpec, setSelectedSpec] = useState("all")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [minSubscribers, setMinSubscribers] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("count")
  const [sortOrder, setSortOrder] = useState("desc")
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState(null)
  const [detailSearch, setDetailSearch] = useState("")
  const [detailPage, setDetailPage] = useState(1)
  const [detailPerPage, setDetailPerPage] = useState(20)
  const [showFilters, setShowFilters] = useState(false)

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [instRes, specRes, coursesRes, codesRes] = await Promise.all([
          getInstructors(),
          getSpecializations(),
          getCourses(),
          getAllAccessCodes()
        ])

        // المدرسون
        const instructorsData = Array.isArray(instRes.data?.data?.data)
          ? instRes.data.data.data
          : Array.isArray(instRes.data?.data?.items)
          ? instRes.data.data.items
          : []
        setInstructors(instructorsData)

        // التخصصات
        const specsData = Array.isArray(specRes.data?.data?.data)
          ? specRes.data.data.data
          : Array.isArray(specRes.data?.data?.items)
          ? specRes.data.data.items
          : Array.isArray(specRes.data?.data)
          ? specRes.data.data
          : []
        setSpecializations(specsData)

        // الكورسات
        const coursesData = Array.isArray(coursesRes.data?.data?.items)
          ? coursesRes.data.data.items
          : Array.isArray(coursesRes.data?.data?.data)
          ? coursesRes.data.data.data
          : Array.isArray(coursesRes.data)
          ? coursesRes.data
          : []
        setCourses(coursesData)

        // المستويات لكل كورس
        const levelPromises = coursesData.map(c => getCourseLevels(c.id).catch(() => ({ data: { data: [] } })))
        const levelResults = await Promise.all(levelPromises)
        const map = new Map()
        levelResults.forEach((res, idx) => {
          let data = []
          if (Array.isArray(res.data?.data)) {
            data = res.data.data.length > 0 && Array.isArray(res.data.data[0]) ? res.data.data[0] : res.data.data
          } else if (Array.isArray(res.data?.data?.items)) {
            data = res.data.data.items
          } else if (Array.isArray(res.data?.data?.data)) {
            data = res.data.data.data
          } else if (Array.isArray(res.data)) {
            data = res.data
          }
          map.set(coursesData[idx].id, data || [])
        })
        setLevelsByCourseId(map)

        // الأكواد النشطة
        const allCodes = Array.isArray(codesRes.data?.data)
          ? codesRes.data.data
          : Array.isArray(codesRes.data?.data?.items)
          ? codesRes.data.data.items
          : Array.isArray(codesRes.data)
          ? codesRes.data
          : []
        const onlyActive = allCodes.filter(isCodeActive)
        setActiveCodes(onlyActive)
      } catch (e) {
        console.error(e)
        showErrorToast('فشل تحميل بيانات التقرير')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // خرائط مساعدة
  const instructorById = useMemo(() => {
    const m = new Map()
    instructors.forEach(i => m.set(i.id, i))
    return m
  }, [instructors])

  const specializationById = useMemo(() => {
    const m = new Map()
    specializations.forEach(s => m.set(s.id, s))
    return m
  }, [specializations])

  const courseById = useMemo(() => {
    const m = new Map()
    courses.forEach(c => m.set(c.id, c))
    return m
  }, [courses])

  // بناء الهيكل: مدرس -> تخصص -> كورس -> مستوى
  const hierarchy = useMemo(() => {
    // تجميع المشتركين النشطين لكل مستوى
    const levelIdToSubscribers = new Map()
    activeCodes.forEach(code => {
      const levelId = code.courseLevelId || code.courseLevel?.id
      if (!levelId) return
      const subs = levelIdToSubscribers.get(levelId) || []
      subs.push({
        id: code.userId || code.user?.id,
        name: code.user?.name || '-',
        phone: code.user?.phone || '-',
        code: code.code
      })
      levelIdToSubscribers.set(levelId, subs)
    })

    // إنشاء مستويات مع ربطها بالمدرس/الكورس/التخصص
    const instructorMap = new Map()

    courses.forEach(course => {
      const levels = levelsByCourseId.get(course.id) || []
      levels.forEach(level => {
        const instructorId = level.instructorId
        const specId = course.specializationId
        const lvlSubscribers = levelIdToSubscribers.get(level.id) || []

        if (!instructorMap.has(instructorId)) {
          instructorMap.set(instructorId, new Map()) // specId -> courses map
        }
        const specMap = instructorMap.get(instructorId)

        if (!specMap.has(specId)) {
          specMap.set(specId, new Map()) // courseId -> levels array
        }
        const courseMap = specMap.get(specId)

        const existing = courseMap.get(course.id) || []
        existing.push({
          level,
          subscribers: lvlSubscribers,
          count: lvlSubscribers.length
        })
        courseMap.set(course.id, existing)
      })
    })

    return instructorMap
  }, [courses, levelsByCourseId, activeCodes])

  // تحويل الهيكل إلى صفوف جدول مسطحة
  const tableRows = useMemo(() => {
    const rows = []
    hierarchy.forEach((specMap, instructorId) => {
      specMap.forEach((courseMap, specId) => {
        courseMap.forEach((levels, courseId) => {
          levels.forEach(({ level, subscribers }) => {
            rows.push({
              instructorId,
              instructorName: instructorById.get(instructorId)?.name || '-',
              specializationId: specId,
              specializationName: specializationById.get(specId)?.name || '-',
              courseId,
              courseTitle: courseById.get(courseId)?.title || '-',
              levelId: level.id,
              levelName: level.name,
              count: subscribers.length,
              subscribers,
            })
          })
        })
      })
    })
    return rows
  }, [hierarchy, instructorById, specializationById, courseById])

  // خيارات الفلاتر
  const coursesForSpec = useMemo(() => {
    if (selectedSpec === 'all') return courses
    return courses.filter(c => c.specializationId === selectedSpec)
  }, [courses, selectedSpec])

  // تطبيق الفلاتر والبحث
  const filteredRows = useMemo(() => {
    let rows = [...tableRows]

    if (selectedInstructor !== 'all') {
      rows = rows.filter(r => r.instructorId === selectedInstructor)
    }
    if (selectedSpec !== 'all') {
      rows = rows.filter(r => r.specializationId === selectedSpec)
    }
    if (selectedCourse !== 'all') {
      rows = rows.filter(r => r.courseId === selectedCourse)
    }
    if (minSubscribers > 0) {
      rows = rows.filter(r => r.count >= Number(minSubscribers))
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter(r =>
        r.levelName?.toLowerCase().includes(q) ||
        r.courseTitle?.toLowerCase().includes(q) ||
        r.specializationName?.toLowerCase().includes(q) ||
        r.instructorName?.toLowerCase().includes(q) ||
        r.subscribers.some(s => (s.name || '').toLowerCase().includes(q) || (s.phone || '').includes(searchTerm))
      )
    }

    // الترتيب
    rows.sort((a, b) => {
      let av, bv
      switch (sortBy) {
        case 'instructor':
          av = a.instructorName?.toLowerCase(); bv = b.instructorName?.toLowerCase(); break
        case 'specialization':
          av = a.specializationName?.toLowerCase(); bv = b.specializationName?.toLowerCase(); break
        case 'course':
          av = a.courseTitle?.toLowerCase(); bv = b.courseTitle?.toLowerCase(); break
        case 'level':
          av = a.levelName?.toLowerCase(); bv = b.levelName?.toLowerCase(); break
        case 'count':
        default:
          av = a.count; bv = b.count
      }
      if (av < bv) return sortOrder === 'asc' ? -1 : 1
      if (av > bv) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return rows
  }, [tableRows, selectedInstructor, selectedSpec, selectedCourse, minSubscribers, searchTerm, sortBy, sortOrder])

  // ترقيم الصفحات
  const totalItems = filteredRows.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const pageStart = (currentPage - 1) * itemsPerPage
  const pageRows = filteredRows.slice(pageStart, pageStart + itemsPerPage)

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // تفاصيل المشتركين (بحث + ترقيم صفحات داخل حوار منفصل)
  const detailFiltered = useMemo(() => {
    if (!detailRow) return []
    const q = detailSearch.trim().toLowerCase()
    let subs = [...detailRow.subscribers]
    if (q) {
      subs = subs.filter(s => (s.name || '').toLowerCase().includes(q) || (s.phone || '').includes(detailSearch) || (s.code || '').toLowerCase().includes(q))
    }
    return subs
  }, [detailRow, detailSearch])

  const detailTotal = detailFiltered.length
  const detailTotalPages = Math.ceil(detailTotal / detailPerPage) || 1
  const detailStart = (detailPage - 1) * detailPerPage
  const detailPageRows = detailFiltered.slice(detailStart, detailStart + detailPerPage)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>المشتركين النشطين لكل مستوى</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">فلترة وعرض تفصيلي للمشتركين حسب المستوى</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {totalItems} مستوى
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="h-4 w-4 ml-2" />
                الفلاتر
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 mt-5">
          {/* شريط البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} 
              placeholder="ابحث بالاسم، الهاتف، المستوى، الدورة..."
              className="pr-10"
            />
          </div>

          {/* الفلاتر المتقدمة */}
          <div className={`space-y-4 p-4 rounded-lg border bg-muted/30 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">المدرس</Label>
                <Select value={selectedInstructor} onValueChange={(v) => { setSelectedInstructor(v); setCurrentPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدرس" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    <SelectItem value="all">جميع المدرسين</SelectItem>
                    {instructors.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">الاختصاص</Label>
                <Select value={selectedSpec} onValueChange={(v) => { setSelectedSpec(v); setSelectedCourse('all'); setCurrentPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الاختصاص" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    <SelectItem value="all">كل الاختصاصات</SelectItem>
                    {specializations.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">الدورة</Label>
                <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setCurrentPage(1) }} disabled={selectedSpec === 'all'}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedSpec === 'all' ? 'اختر الاختصاص أولاً' : 'اختر الدورة'} />
                  </SelectTrigger>
                  <SelectContent searchable>
                    <SelectItem value="all">كل الدورات</SelectItem>
                    {coursesForSpec.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">الحد الأدنى للمشتركين</Label>
                <Input 
                  type="number" 
                  value={minSubscribers} 
                  onChange={(e) => { setMinSubscribers(e.target.value); setCurrentPage(1) }} 
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* الجدول - للشاشات المتوسطة والكبيرة */}
          <div className="rounded-md border overflow-x-auto hidden md:block">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('instructor')}
                  >
                    <div className="flex items-center gap-1">
                      المدرس 
                      {sortBy === 'instructor' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('specialization')}
                  >
                    <div className="flex items-center gap-1">
                      الاختصاص
                      {sortBy === 'specialization' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('course')}
                  >
                    <div className="flex items-center gap-1">
                      الدورة
                      {sortBy === 'course' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center gap-1">
                      المستوى
                      {sortBy === 'level' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('count')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      عدد المشتركين
                      {sortBy === 'count' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length > 0 ? pageRows.map((row, index) => (
                  <TableRow 
                    key={row.levelId} 
                    className={index % 2 === 0 ? 'bg-muted/30' : ''}
                  >
                    <TableCell className="font-medium">{row.instructorName}</TableCell>
                    <TableCell>{row.specializationName}</TableCell>
                    <TableCell>{row.courseTitle}</TableCell>
                    <TableCell>
                      <span className="font-medium">{row.levelName}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Badge 
                          variant={row.count > 0 ? "default" : "secondary"} 
                          className="text-sm"
                        >
                          {row.count} مشترك
                        </Badge>
                        {row.count > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => { 
                              setDetailRow(row); 
                              setDetailSearch(''); 
                              setDetailPage(1); 
                              setDetailOpen(true) 
                            }}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8 opacity-50" />
                        <p>لا توجد بيانات مطابقة</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* البطاقات - للشاشات الصغيرة */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {pageRows.length > 0 ? pageRows.map(row => (
              <Card key={`card-${row.levelId}`} className="p-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    {row.levelName}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {row.instructorName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {row.specializationName}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {row.courseTitle}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={row.count > 0 ? "default" : "secondary"} 
                      className="text-sm"
                    >
                      {row.count} مشترك
                    </Badge>
                    {row.count > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { 
                          setDetailRow(row); 
                          setDetailSearch(''); 
                          setDetailPage(1); 
                          setDetailOpen(true) 
                        }}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        التفاصيل
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="text-center py-8">
                <CardContent>
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">لا توجد بيانات مطابقة</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* الترقيم */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              عرض {(pageStart+1)} - {Math.min(pageStart + itemsPerPage, totalItems)} من {totalItems}
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1) }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="عدد الصفوف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 صفوف</SelectItem>
                  <SelectItem value="20">20 صفوف</SelectItem>
                  <SelectItem value="50">50 صفوف</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
                  <span className="text-sm font-medium">{currentPage}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sm text-muted-foreground">{totalPages}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حوار تفاصيل المشتركين */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="border-b p-6">
            <DialogHeader>
              <DialogTitle className="text-right flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <div className="text-xl font-bold">{detailRow?.levelName}</div>
                  <DialogDescription className="text-right mt-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary" className="gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {detailRow?.instructorName}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Layers className="w-3 h-3" />
                        {detailRow?.specializationName}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <BookOpen className="w-3 h-3" />
                        {detailRow?.courseTitle}
                      </Badge>
                      <Badge className="gap-1">
                        <Users className="w-3 h-3" />
                        {detailRow?.count} مشترك
                      </Badge>
                    </div>
                  </DialogDescription>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="space-y-4 p-6 max-h-[60vh] overflow-y-auto">
            {/* فلاتر البحث داخل الحوار */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="space-y-2">
                <Label className="text-sm font-medium">بحث داخل المشتركين</Label>
                <Input 
                  value={detailSearch} 
                  onChange={(e) => { setDetailSearch(e.target.value); setDetailPage(1) }} 
                  placeholder="ابحث بالاسم، الهاتف، أو الكود..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">عدد النتائج</Label>
                <Select value={detailPerPage.toString()} onValueChange={(v) => { setDetailPerPage(Number(v)); setDetailPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="عدد النتائج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 نتائج</SelectItem>
                    <SelectItem value="20">20 نتائج</SelectItem>
                    <SelectItem value="50">50 نتائج</SelectItem>
                    <SelectItem value="100">100 نتائج</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* جدول المشتركين */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-2 justify-start">
                        <User className="h-4 w-4" />
                        الاسم
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-2 justify-start">
                        <Phone className="h-4 w-4" />
                        الهاتف
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-2 justify-start">
                        <Hash className="h-4 w-4" />
                        الكود
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailPageRows.length > 0 ? detailPageRows.map((s, idx) => (
                    <TableRow key={`${detailRow?.levelId}-${idx}`}>
                      <TableCell className="text-right">{s.name}</TableCell>
                      <TableCell className="text-right font-mono" dir="ltr">{s.phone}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono text-xs">
                          {s.code}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <User className="h-8 w-8 opacity-50" />
                          <p>لا توجد نتائج</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ترقيم الصفحات داخل الحوار */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                عرض {(detailStart+1)} - {Math.min(detailStart + detailPerPage, detailTotal)} من {detailTotal}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDetailPage(p => Math.max(1, p-1))} 
                  disabled={detailPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
                  <span className="text-sm font-medium">{detailPage}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sm text-muted-foreground">{detailTotalPages}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDetailPage(p => Math.min(detailTotalPages, p+1))} 
                  disabled={detailPage === detailTotalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LevelSubscribersReport
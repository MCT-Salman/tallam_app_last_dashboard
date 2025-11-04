import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    CalendarIcon, Search, Loader2, ChevronDown, ChevronUp,
    Filter, User, UserCheck, CalendarRange,
    X, FileSpreadsheet, BarChart3, Info
} from "lucide-react"
import { format, startOfDay, endOfDay } from "date-fns"
import { ar } from "date-fns/locale"
import { getInstructors } from "@/api/api"
import { getInstructorReport } from "@/api/api"
import { showErrorToast } from "@/hooks/useToastMessages"

const TeacherReports = () => {
    const [loading, setLoading] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [selectedInstructor, setSelectedInstructor] = useState("");
    const [dateRange, setDateRange] = useState({
        from: null,
        to: null
    });
    const [reportData, setReportData] = useState(null);
    const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);
    const [expandedLevels, setExpandedLevels] = useState({});

    // Fetch instructors on component mount
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setIsLoadingInstructors(true);
                const res = await getInstructors();
                // استخدام نفس هيكل البيانات الموجود في مكون Instructor
                const data = Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
                console.log("Instructors data:", data);
                setInstructors(data);
            } catch (error) {
                console.error("Error fetching instructors:", error);
                showErrorToast("فشل في تحميل قائمة المدرسين");
            } finally {
                setIsLoadingInstructors(false);
            }
        };

        fetchInstructors();
    }, []);

    const handleSearch = async () => {
        if (!selectedInstructor || !dateRange.from || !dateRange.to) {
            showErrorToast("الرجاء تحديد المدرس وتاريخ البداية والنهاية");
            return;
        }

        try {
            setLoading(true);
            const startDate = format(startOfDay(dateRange.from), "yyyy-MM-dd");
            const endDate = format(endOfDay(dateRange.to), "yyyy-MM-dd");

            const response = await getInstructorReport(selectedInstructor, startDate, endDate);
            if (response.data?.success) {
                setReportData(response.data.data[0]); // نأخذ أول عنصر في المصفوفة
                setExpandedLevels({}); // نعيد حالة التوسيع
            }
        } catch (error) {
            showErrorToast("فشل في جلب التقرير");
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLevelExpansion = (levelId) => {
        setExpandedLevels(prev => ({
            ...prev,
            [levelId]: !prev[levelId]
        }));
    };

    // Calculate total amount from all students
    const totalAmount = reportData?.allStudents?.reduce((sum, student) => sum + (student.totalPaid || 0), 0) || 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold">
                        تقارير المدرسين
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        استعلام عن طلاب المدرسين خلال فترة زمنية محددة
                    </p>
                </CardHeader>
                <CardContent>
                    {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"> */}
                        {/* 🔍 قسم الفلترة والعرض */}
                        <div className="space-y-6">
                            {/* شريط الفلاتر الرئيسي */}
                            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-sm">
                                {/* عنوان القسم */}
                                <div className="flex items-center gap-2 mb-6">
                                    <Filter className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-gray-800">تقارير المدرسين</h3>
                                </div>

                                {/* شبكة الفلاتر */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Instructor Selection - مع أيقونة */}
                                    <div className="space-y-3">
                                        <Label htmlFor="instructor" className="text-sm font-medium flex items-center gap-2 text-gray-700">
                                            <User className="h-4 w-4 text-primary" />
                                            اختر المدرس
                                        </Label>
                                        <Select
                                            value={selectedInstructor}
                                            onValueChange={setSelectedInstructor}
                                            disabled={isLoadingInstructors}
                                        >
                                            <SelectTrigger className="transition-all duration-200 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-400 bg-white/80">
                                                <SelectValue placeholder="اختر المدرس" />
                                            </SelectTrigger>
                                            <SelectContent searchable className="bg-white border border-gray-200 shadow-lg max-h-60">
                                                {instructors.map((instructor) => (
                                                    <SelectItem key={instructor.id} value={instructor.id} className="flex items-center gap-2">
                                                        {/* <UserCheck className="h-4 w-4 text-gray-500" /> */}
                                                        {instructor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isLoadingInstructors && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                جاري تحميل المدرسين...
                                            </div>
                                        )}
                                    </div>

                                    {/* From Date - مع أيقونة */}
                                    <div className="space-y-3">
                                        <Label htmlFor="from-date" className="text-sm font-medium flex items-center gap-2 text-gray-700">
                                            {/* <Calendar className="h-4 w-4 text-primary" /> */}
                                            من تاريخ
                                        </Label>
                                        <div className="relative">
                                            {/* <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /> */}
                                            <Input
                                                id="from-date"
                                                type="date"
                                                value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                                                onChange={(e) => {
                                                    const newFrom = e.target.value ? new Date(e.target.value) : null
                                                    setDateRange(prev => ({ ...prev, from: newFrom }))
                                                }}
                                                className="pr-10 transition-all duration-200 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-400 bg-white/80"
                                            />
                                        </div>
                                    </div>

                                    {/* To Date - مع أيقونة */}
                                    <div className="space-y-3">
                                        <Label htmlFor="to-date" className="text-sm font-medium flex items-center gap-2 text-gray-700">
                                            {/* <CalendarRange className="h-4 w-4 text-primary" /> */}
                                            إلى تاريخ
                                        </Label>
                                        <div className="relative">
                                            {/* <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /> */}
                                            <Input
                                                id="to-date"
                                                type="date"
                                                value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                                                onChange={(e) => {
                                                    const newTo = e.target.value ? new Date(e.target.value) : null
                                                    setDateRange(prev => ({ ...prev, to: newTo }))
                                                }}
                                                disabled={!dateRange.from}
                                                min={dateRange.from ? dateRange.from.toISOString().split('T')[0] : undefined}
                                                className="pr-10 transition-all duration-200 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-400 bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Search Button */}
                                    <div className="flex items-end">
                                        <Button
                                            onClick={handleSearch}
                                            disabled={loading || !selectedInstructor || !dateRange.from || !dateRange.to}
                                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                                    جاري البحث...
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="ml-2 h-4 w-4" />
                                                    بحث
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* معلومات إضافية */}
                                {dateRange.from && dateRange.to && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 text-sm text-blue-700">
                                            <Info className="h-4 w-4" />
                                            <span>
                                                الفترة المحددة: من {dateRange.from.toLocaleDateString('ar-EG')} إلى {dateRange.to.toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* شريط النتائج والإحصائيات */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                    {/* عرض النتائج - مع تصميم جذاب */}
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white rounded-lg p-2 shadow-sm border">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-700">
                                                تقرير المدرس
                                                {selectedInstructor && (
                                                    <span className="font-bold text-primary"> {instructors.find(i => i.id === selectedInstructor)?.name} </span>
                                                )}
                                            </p>
                                            {dateRange.from && dateRange.to && (
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    <span className="text-xs text-green-600 font-medium">
                                                        الفترة: {dateRange.from.toLocaleDateString('ar-EG')} - {dateRange.to.toLocaleDateString('ar-EG')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* أزرار الإجراءات */}
                                    <div className="flex items-center gap-3">
                                        {(selectedInstructor || dateRange.from || dateRange.to) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedInstructor('')
                                                    setDateRange({ from: null, to: null })
                                                }}
                                                className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                                            >
                                                <X className="h-4 w-4" />
                                                مسح البحث
                                            </Button>
                                        )}

                                        {/* زر تصدير التقرير */}
                                        {/* <Button
                                            size="sm"
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-all duration-200"
                                            disabled={!selectedInstructor || !dateRange.from || !dateRange.to}
                                        >
                                            <FileSpreadsheet className="h-4 w-4" />
                                            تصدير التقرير
                                        </Button> */}
                                    </div>
                                </div>

                                {/* شريط التقدم للإظهار المرئي */}
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-purple-900 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(reportData ? 100 : 0)}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {reportData ? '100%' : '0%'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    {/* </div> */}

                    {/* Report Results */}
                    {reportData && (
                        <div className="space-y-6">
                            {/* Instructor Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">ملخص المدرس</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-600">اسم المدرس</p>
                                            <p className="text-lg font-bold">{reportData.instructor.name}</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-600">عدد المواد</p>
                                            <p className="text-lg font-bold">{reportData.totalCourses}</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-purple-600">عدد الطلاب</p>
                                            <p className="text-lg font-bold">{reportData.totalStudents}</p>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <p className="text-sm text-orange-600">إجمالي المبالغ</p>
                                            <p className="text-lg font-bold">{reportData.totalAmount?.toLocaleString()} ل.س</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Levels Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">تفصيل المستويات</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {reportData.levels.map((levelData) => (
                                            <div key={levelData.courseLevel.id} className="border rounded-lg">
                                                <div
                                                    className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer"
                                                    onClick={() => toggleLevelExpansion(levelData.courseLevel.id)}
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{levelData.courseLevel.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {levelData.course.title} - {levelData.totalStudents} طالب - {levelData.totalAmount?.toLocaleString()} ل.س
                                                        </p>
                                                    </div>
                                                    <Button variant="ghost" size="sm">
                                                        {expandedLevels[levelData.courseLevel.id] ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>

                                                {expandedLevels[levelData.courseLevel.id] && levelData.students.length > 0 && (
                                                    <div className="p-4 border-t">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="text-right">اسم الطالب</TableHead>
                                                                    <TableHead className="text-right">الهاتف</TableHead>
                                                                    <TableHead className="text-right">المبلغ المدفوع</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {levelData.students.map((student) => (
                                                                    <TableRow key={student.id}>
                                                                        <TableCell className="text-right">{student.name}</TableCell>
                                                                        <TableCell className="text-right" dir="ltr">{student.phone}</TableCell>
                                                                        <TableCell className="text-right font-medium">
                                                                            {student.amountPaid?.toLocaleString()} ل.س
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* All Access Codes Details */}
<Card>
    <CardHeader>
        <CardTitle className="text-lg">تفاصيل جميع الأكواد</CardTitle>
    </CardHeader>
    <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">اسم الطالب</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">المادة</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reportData.levels.flatMap(levelData => 
                    levelData.accessCodesCount.map((accessCode, index) => (
                        <TableRow key={`${levelData.courseLevel.id}-${accessCode.code || index}`}>
                            <TableCell className="text-right font-mono font-medium">
                                {accessCode.code}
                            </TableCell>
                            <TableCell className="text-right">
                                {accessCode.user?.name || "غير محدد"}
                            </TableCell>
                            <TableCell className="text-right" dir="ltr">
                                {accessCode.user?.phone || "غير محدد"}
                            </TableCell>
                            <TableCell className="text-right">
                                {levelData.course.title}
                            </TableCell>
                            <TableCell className="text-right">
                                {levelData.courseLevel.name}
                            </TableCell>
                            <TableCell className="text-right">
                                {accessCode.issuedAt ? new Date(accessCode.issuedAt).toLocaleDateString('ar-EG') : "غير محدد"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {accessCode.transaction?.[0]?.amountPaid ? 
                                    parseInt(accessCode.transaction[0].amountPaid).toLocaleString() : 0
                                } ل.س
                            </TableCell>
                        </TableRow>
                    ))
                )}
                {/* صف المجموع */}
                <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={6} className="text-right">
                        الإجمالي الكلي:
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                        {totalAmount.toLocaleString()} ل.س
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </CardContent>
</Card>
                        </div>
                    )}

                    {!reportData && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            لا توجد بيانات متاحة. الرجاء تحديد المدرس وتاريخ البداية والنهاية ثم اضغط على زر البحث.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherReports;
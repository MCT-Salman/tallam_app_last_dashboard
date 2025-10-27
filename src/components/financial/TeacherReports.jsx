import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Search, Loader2, ChevronDown, ChevronUp } from "lucide-react"
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Instructor Selection - تم التصحيح هنا */}
                        <div className="space-y-2">
                            <Label htmlFor="instructor">اختر المدرس</Label>
                            <Select
                                value={selectedInstructor}
                                onValueChange={setSelectedInstructor}
                                disabled={isLoadingInstructors}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر المدرس" />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {instructors.map((instructor) => (
                                        <SelectItem key={instructor.id} value={instructor.id}>
                                            {instructor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isLoadingInstructors && (
                                <div className="text-sm text-muted-foreground">جاري تحميل المدرسين...</div>
                            )}
                        </div>

                        {/* Date Range Picker */}
                        <div className="space-y-2">
                            <Label>من تاريخ</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {dateRange.from ? (
                                            format(dateRange.from, "yyyy/MM/dd", { locale: ar })
                                        ) : (
                                            <span>اختر التاريخ</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                        initialFocus
                                        locale={ar}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>إلى تاريخ</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                        disabled={!dateRange.from}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {dateRange.to ? (
                                            format(dateRange.to, "yyyy/MM/dd", { locale: ar })
                                        ) : (
                                            <span>اختر التاريخ</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                        initialFocus
                                        locale={ar}
                                        disabled={(date) => date < (dateRange.from || new Date(0))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Search Button */}
                        <div className="flex items-end">
                            <Button 
                                onClick={handleSearch}
                                disabled={loading || !selectedInstructor || !dateRange.from || !dateRange.to}
                                className="w-full"
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
                                            <p className="text-sm text-green-600">عدد الكورسات</p>
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
                                                                        <TableCell className="text-right">{student.phone}</TableCell>
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

                            {/* All Students Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">إجمالي الطلاب</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">اسم الطالب</TableHead>
                                                <TableHead className="text-right">الهاتف</TableHead>
                                                <TableHead className="text-right">إجمالي المبالغ المدفوعة</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.allStudents.map((student) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="text-right">{student.name}</TableCell>
                                                    <TableCell className="text-right">{student.phone}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {student.totalPaid?.toLocaleString()} ل.س
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Total Row */}
                                            <TableRow className="bg-gray-50">
                                                <TableCell colSpan={2} className="text-right font-bold">
                                                    الإجمالي:
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-600">
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
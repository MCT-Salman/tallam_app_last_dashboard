import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Search, Loader2, Download } from "lucide-react"
import { format, startOfDay, endOfDay } from "date-fns"
import { ar } from "date-fns/locale"
import { getInstructors, getTeacherEnrollments } from "@/api/teacherApi"
import { showErrorToast } from "@/hooks/useToastMessages"

const TeacherReports = () => {
    const [loading, setLoading] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [selectedInstructor, setSelectedInstructor] = useState("");
    const [dateRange, setDateRange] = useState({
        from: null,
        to: null
    });
    const [enrollments, setEnrollments] = useState([]);
    const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);

    // Fetch instructors on component mount
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setIsLoadingInstructors(true);
                const response = await getInstructors();
                if (response.data?.success) {
                    setInstructors(response.data.data);
                }
            } catch (error) {
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
            const params = {
                instructorId: selectedInstructor,
                startDate: startOfDay(dateRange.from).toISOString(),
                endDate: endOfDay(dateRange.to).toISOString()
            };

            const response = await getTeacherEnrollments(params);
            if (response.data?.success) {
                setEnrollments(response.data.data);
            }
        } catch (error) {
            showErrorToast("فشل في جلب بيانات الطلاب");
            console.error("Error fetching enrollments:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total amount
    const totalAmount = enrollments.reduce((sum, item) => sum + (item.amount || 0), 0);

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
                        {/* Instructor Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="instructor">اختر المدرس</Label>
                            <select
                                id="instructor"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedInstructor}
                                onChange={(e) => setSelectedInstructor(e.target.value)}
                                disabled={isLoadingInstructors}
                            >
                                <option value="">اختر المدرس</option>
                                {instructors.map((instructor) => (
                                    <option key={instructor.id} value={instructor.id}>
                                        {instructor.name}
                                    </option>
                                ))}
                            </select>
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

                    {/* Results Table */}
                    {enrollments.length > 0 && (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">اسم الطالب</TableHead>
                                        <TableHead className="text-right">المستوى</TableHead>
                                        <TableHead className="text-right">تاريخ الاشتراك</TableHead>
                                        <TableHead className="text-right">المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id}>
                                            <TableCell className="text-right">{enrollment.studentName}</TableCell>
                                            <TableCell className="text-right">{enrollment.levelName}</TableCell>
                                            <TableCell className="text-right">
                                                {format(new Date(enrollment.enrollmentDate), "yyyy/MM/dd", { locale: ar })}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {enrollment.amount?.toLocaleString()} ل.س
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Total Row */}
                                    <TableRow className="bg-gray-50">
                                        <TableCell colSpan={3} className="text-right font-bold">
                                            الإجمالي:
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            {totalAmount.toLocaleString()} ل.س
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {enrollments.length === 0 && !loading && (
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

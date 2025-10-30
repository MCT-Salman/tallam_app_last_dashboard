import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, User, Book, MessageCircle, Calendar, Filter, RotateCcw } from "lucide-react";
import { getSuggestions } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";

const Suggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [allSuggestions, setAllSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, suggestion: null });
    // const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [userFilter, setUserFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // جلب جميع الاقتراحات
    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const params = {
                skip: (currentPage - 1) * itemsPerPage,
                take: itemsPerPage,
                q: searchTerm || undefined,
            };

            const res = await getSuggestions(params);
            console.log("Suggestions API response:", res);

            let data = [];
            let total = 0;

            if (res.data?.data) {
                data = Array.isArray(res.data.data) ? res.data.data : [];
                total = res.data.pagination?.total || data.length;
            }

            setAllSuggestions(data);
            setSuggestions(data);
            console.log(`✅ Loaded ${data.length} suggestions`);
        } catch (err) {
            console.error("❌ Error fetching suggestions:", err);
            showErrorToast("فشل تحميل الاقتراحات");
            setAllSuggestions([]);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [currentPage, itemsPerPage]);

    // استخراج المستخدمين الفريدين من الاقتراحات
    const uniqueUsers = useMemo(() => {
        const users = allSuggestions
            .map(suggestion => suggestion.user)
            .filter(user => user && user.id)
            .filter((user, index, self) => 
                self.findIndex(u => u.id === user.id) === index
            )
            .sort((a, b) => a.name?.localeCompare(b.name));
        return users;
    }, [allSuggestions]);

    // استخراج الكورسات الفريدة من الاقتراحات
    const uniqueCourses = useMemo(() => {
        const courses = allSuggestions
            .map(suggestion => suggestion.courseLevel)
            .filter(course => course && course.id)
            .filter((course, index, self) => 
                self.findIndex(c => c.id === course.id) === index
            )
            .sort((a, b) => a.name?.localeCompare(b.name));
        return courses;
    }, [allSuggestions]);

    // فلترة وترتيب البيانات
    const filteredAndSortedSuggestions = useMemo(() => {
        let filtered = [...allSuggestions];

        // البحث بالرسالة أو اسم المستخدم
        if (searchTerm.trim()) {
            filtered = filtered.filter(suggestion =>
                suggestion.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                suggestion.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                suggestion.courseLevel?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // فلترة بالمستخدم
        if (userFilter !== "all") {
            filtered = filtered.filter(suggestion =>
                suggestion.user?.id?.toString() === userFilter
            );
        }

        // فلترة بالكورس
        if (courseFilter !== "all") {
            filtered = filtered.filter(suggestion =>
                suggestion.courseLevel?.id?.toString() === courseFilter
            );
        }

        // الترتيب
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case "user":
                    aValue = a.user?.name?.toLowerCase() || "";
                    bValue = b.user?.name?.toLowerCase() || "";
                    break;
                case "course":
                    aValue = a.courseLevel?.name?.toLowerCase() || "";
                    bValue = b.courseLevel?.name?.toLowerCase() || "";
                    break;
                case "message":
                    aValue = a.message?.toLowerCase() || "";
                    bValue = b.message?.toLowerCase() || "";
                    break;
                case "createdAt":
                    aValue = new Date(a.createdAt) || new Date(0);
                    bValue = new Date(b.createdAt) || new Date(0);
                    break;
                default:
                    aValue = new Date(a.createdAt) || new Date(0);
                    bValue = new Date(b.createdAt) || new Date(0);
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [allSuggestions, searchTerm, userFilter, courseFilter, sortBy, sortOrder]);

    // إعادة تعيين الصفحة عند تغيير الفلتر
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, userFilter, courseFilter, itemsPerPage]);

    // حذف الاقتراح
    // const handleDelete = async (id) => {
    //     try {
    //         await deleteSuggestion(id);
    //         fetchSuggestions();
    //         showSuccessToast("تم حذف الاقتراح بنجاح");
    //     } catch (err) {
    //         showErrorToast(err?.response?.data?.message || "فشل الحذف");
    //     }
    // };

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد";
        return new Date(dateString).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Pagination calculations
    const totalItems = filteredAndSortedSuggestions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Handle sort
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("");
        setUserFilter("all");
        setCourseFilter("all");
        setSortBy("createdAt");
        setSortOrder("desc");
        setCurrentPage(1);
    };

    // عرض التفاصيل الكاملة للاقتراح
    const renderSuggestionDetails = (suggestion) => {
        if (!suggestion) return null;

        return (
            <div className="space-y-6 text-right">
                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <Label className="font-bold text-base">الرسالة:</Label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                                <p className="text-lg leading-relaxed">{suggestion.message}</p>
                            </div>
                        </div>

                        <div>
                            <Label className="font-bold text-base">المستخدم:</Label>
                            <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
                                <User className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-semibold">{suggestion.user?.name || "غير محدد"}</p>
                                    <p className="text-sm text-muted-foreground">{suggestion.user?.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label className="font-bold text-base">المادة:</Label>
                            {suggestion.courseLevel ? (
                                <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
                                    <Book className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="font-semibold">{suggestion.courseLevel.name}</p>
                                        <p className="text-sm text-muted-foreground">المستوى</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-2 text-muted-foreground">لا توجد مادة مرتبطة</p>
                            )}
                        </div>

                        <div>
                            <Label className="font-bold text-base">تاريخ الإرسال:</Label>
                            <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-primary" />
                                <p className="font-semibold">{formatDate(suggestion.createdAt)}</p>
                            </div>
                        </div>

                        <div>
                            <Label className="font-bold text-base">معرف الاقتراح:</Label>
                            <p className="mt-1 font-mono bg-gray-100 p-2 rounded">{suggestion.id}</p>
                        </div>
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="border-t pt-4">
                    <h3 className="font-bold text-lg mb-3">معلومات إضافية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">معرف المستخدم:</Label>
                            <p>{suggestion.userId || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">معرف المستوى:</Label>
                            <p>{suggestion.courseLevelId || "غير مرتبط"}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // مكون البطاقة للعنصر الواحد
    const SuggestionCard = ({ suggestion }) => (
        <Card className="mb-4 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* الرسالة */}
                    <div>
                        <div className="flex items-start gap-3">
                            <MessageCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-lg font-medium line-clamp-3">{suggestion.message}</p>
                            </div>
                        </div>
                    </div>

                    {/* المعلومات */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{suggestion.user?.name || "غير محدد"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Book className="w-4 h-4 text-muted-foreground" />
                            <span>{suggestion.courseLevel?.name || "لا يوجد مادة"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(suggestion.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                #{suggestion.id}
                            </Badge>
                        </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex justify-between gap-2 pt-3 border-t">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailDialog({ isOpen: true, suggestion })}
                            className="flex-1"
                        >
                            <Eye className="w-4 h-4 ml-1" />
                            التفاصيل
                        </Button>
                        {/* <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteDialog({
                                isOpen: true,
                                itemId: suggestion.id,
                                itemName: `الاقتراح من ${suggestion.user?.name}`
                            })}
                            className="flex-1"
                        >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                        </Button> */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة الاقتراحات والشكاوى</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        إجمالي الاقتراحات: {allSuggestions.length}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث في الرسائل أو المستخدمين..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>

                    {/* User Filter */}
                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة بالمستخدم" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع المستخدمين</SelectItem>
                            {uniqueUsers.map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Course Filter */}
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة بالمادة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع المواد</SelectItem>
                            <SelectItem value="none">بدون مادة</SelectItem>
                            {uniqueCourses.map(course => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort By */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                            <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt">تاريخ الإرسال</SelectItem>
                            <SelectItem value="user">اسم المستخدم</SelectItem>
                            <SelectItem value="course">اسم المادة</SelectItem>
                            <SelectItem value="message">الرسالة</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Items Per Page */}
                    <Select 
                        value={itemsPerPage.toString()} 
                        onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="عدد العناصر" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 عناصر</SelectItem>
                            <SelectItem value="10">10 عناصر</SelectItem>
                            <SelectItem value="20">20 عنصر</SelectItem>
                            <SelectItem value="50">50 عنصر</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Reset Filters & Results Count */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        عرض {startItem} إلى {endItem} من {totalItems} اقتراح
                        {(searchTerm || userFilter !== "all" || courseFilter !== "all") && ` (مفلتر)`}
                    </div>

                    {(searchTerm || userFilter !== "all" || courseFilter !== "all") && (
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                            <RotateCcw className="w-4 h-4 ml-1" />
                            إعادة تعيين الفلترة
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-b-2 rounded-full border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {/* Table View - for medium screens and up */}
                        <div className="hidden md:block">
                            <Table className="direction-rtl">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="table-header">المستخدم</TableHead>
                                        <TableHead 
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("message")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الرسالة
                                                {sortBy === "message" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("course")}
                                        >
                                            <div className="flex items-center gap-1">
                                                المادة
                                                {sortBy === "course" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            <div className="flex items-center gap-1">
                                                تاريخ الإرسال
                                                {sortBy === "createdAt" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedSuggestions.length > 0 ? filteredAndSortedSuggestions.map(suggestion => (
                                        <TableRow key={suggestion.id} className="hover:bg-gray-50">
                                            <TableCell className="table-cell">
                                                <div className="flex items-center gap-3">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium">{suggestion.user?.name || "غير محدد"}</div>
                                                        <div className="text-sm text-muted-foreground">{suggestion.user?.phone}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <div className="max-w-xs">
                                                    <p className="line-clamp-2" title={suggestion.message}>
                                                        {suggestion.message}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {suggestion.courseLevel ? (
                                                    <Badge variant="outline">
                                                        {suggestion.courseLevel.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">لا يوجد</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {formatDate(suggestion.createdAt)}
                                            </TableCell>
                                            <TableCell className="table-cell text-right space-x-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDetailDialog({ isOpen: true, suggestion })}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {/* <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => setDeleteDialog({
                                                        isOpen: true,
                                                        itemId: suggestion.id,
                                                        itemName: `الاقتراح من ${suggestion.user?.name}`
                                                    })}
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button> */}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                {allSuggestions.length === 0 ? "لا توجد اقتراحات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards View - for small screens */}
                        <div className="block md:hidden">
                            {filteredAndSortedSuggestions.length > 0 ? (
                                filteredAndSortedSuggestions.map(suggestion => (
                                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allSuggestions.length === 0 ? "لا توجد اقتراحات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredAndSortedSuggestions.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalItems} اقتراح
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNumber;
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i;
                                            } else {
                                                pageNumber = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNumber}
                                                    variant={currentPage === pageNumber ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {pageNumber}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Delete Confirmation Dialog */}
            {/* <AlertDialog
                open={deleteDialog.isOpen}
                onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
            >
                <AlertDialogContent className="text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الاقتراح؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف الاقتراح "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row-reverse gap-2">
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                                await handleDelete(deleteDialog.itemId);
                                setDeleteDialog({ isOpen: false, itemId: null, itemName: "" });
                            }}
                        >
                            حذف
                        </AlertDialogAction>
                        <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })}>
                            إلغاء
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog> */}

            {/* Suggestion Details Dialog */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الاقتراح</DialogTitle>
                    </DialogHeader>
                    {renderSuggestionDetails(detailDialog.suggestion)}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default Suggestions;
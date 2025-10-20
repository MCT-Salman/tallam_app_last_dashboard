import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Search, ChevronLeft, ChevronRight, Eye, Download, Filter, RefreshCw, Calendar as CalendarIcon, DollarSign, Receipt, User, BookOpen, Loader2, Image, FileText, CreditCard, FileSpreadsheet, X } from "lucide-react"
import { getTransactions, getTransactionStats } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns"
import { ar } from "date-fns/locale"
import * as XLSX from 'xlsx'

const Transactions = () => {
    const [transactions, setTransactions] = useState([])
    const [stats, setStats] = useState({})
    const [loading, setLoading] = useState(false)
    const [exportLoading, setExportLoading] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [detailDialog, setDetailDialog] = useState(false)

    // Search & Filter states
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState("createdAt")
    const [sortOrder, setSortOrder] = useState("desc")

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalCount, setTotalCount] = useState(0)

    // Date filter states
    const [dateRange, setDateRange] = useState({
        from: null,
        to: null
    })
    const [quickDateFilter, setQuickDateFilter] = useState("all")
    const [datePickerOpen, setDatePickerOpen] = useState(false)

    // جلب البيانات
    const fetchData = async (overrideDateParams = null) => {
        try {
            setLoading(true);

            const now = new Date();
            let dateParams = overrideDateParams || {};

            if (!overrideDateParams) {
                if (quickDateFilter !== "all") {
                    let startDate, endDate;

                    switch (quickDateFilter) {
                        case "daily":
                            startDate = startOfDay(now);
                            endDate = endOfDay(now);
                            break;
                        case "weekly":
                            startDate = startOfWeek(now, { locale: ar });
                            endDate = endOfWeek(now, { locale: ar });
                            break;
                        case "monthly":
                            startDate = startOfMonth(now);
                            endDate = endOfMonth(now);
                            break;
                        case "yearly":
                            startDate = startOfYear(now);
                            endDate = endOfYear(now);
                            break;
                        default:
                            break;
                    }

                    if (startDate && endDate) {
                        dateParams.startDate = startDate.toISOString();
                        dateParams.endDate = endDate.toISOString();
                    }
                } else if (dateRange.from && dateRange.to) {
                    dateParams.startDate = startOfDay(dateRange.from).toISOString();
                    dateParams.endDate = endOfDay(dateRange.to).toISOString();
                }
            }

            const params = {
                page: currentPage,
                limit: itemsPerPage,
                sortBy,
                sortOrder,
                ...(searchTerm && { search: searchTerm }),
                ...dateParams,
            };

            Object.keys(params).forEach((key) => {
                if (!params[key]) delete params[key];
            });

            console.log("📊 Fetching with params:", params);

            const [transactionsRes, statsRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params),
            ]);

            if (transactionsRes.data?.success) {
                const transactionsData = transactionsRes.data.data?.transactions || [];
                const paginationInfo = transactionsRes.data.data?.pagination;
                setTransactions(transactionsData);
                setTotalCount(paginationInfo?.total || transactionsData.length);
            } else {
                setTransactions([]);
                setTotalCount(0);
            }

            if (statsRes.data?.success) {
                setStats(statsRes.data.data || {});
            } else {
                setStats({});
            }

        } catch (err) {
            console.error("❌ Error fetching transactions:", err);
            showErrorToast(err.response?.data?.message || "فشل في جلب بيانات المعاملات");
            setTransactions([]);
            setTotalCount(0);
            setStats({});
        } finally {
            setLoading(false);
        }
    };

    // فلترة وترتيب البيانات تلقائياً (للعرض فقط)
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = [...transactions];

        // البحث برقم المعاملة أو اسم المستخدم أو الكورس (فلترة محلية إضافية)
        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.id?.toString().includes(searchTerm) ||
                item.accessCode?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.accessCode?.courseLevel?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.accessCode?.user?.phone?.includes(searchTerm) ||
                item.accessCode?.code?.includes(searchTerm)
            );
        }

        // الترتيب المحلي الإضافي
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case "id":
                    aValue = a.id;
                    bValue = b.id;
                    break;
                case "user":
                    aValue = a.accessCode?.user?.name?.toLowerCase() || "";
                    bValue = b.accessCode?.user?.name?.toLowerCase() || "";
                    break;
                case "course":
                    aValue = a.accessCode?.courseLevel?.course?.title?.toLowerCase() || "";
                    bValue = b.accessCode?.courseLevel?.course?.title?.toLowerCase() || "";
                    break;
                case "amountPaid":
                    aValue = getAmountValue(a.amountPaid);
                    bValue = getAmountValue(b.amountPaid);
                    break;
                case "createdAt":
                default:
                    aValue = new Date(a.createdAt) || new Date(0);
                    bValue = new Date(b.createdAt) || new Date(0);
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [transactions, searchTerm, sortBy, sortOrder]);

    // تطبيق البحث تلقائياً مع Debounce (لجلب بيانات جديدة من السيرفر)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                setCurrentPage(1);
                fetchData();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // إعادة جلب البيانات عند مسح البحث
    useEffect(() => {
        if (searchTerm === "") {
            setCurrentPage(1);
            fetchData();
        }
    }, [searchTerm]);

    // إعادة جلب البيانات عند تغيير أي من المعلمات
    useEffect(() => {
        fetchData()
    }, [currentPage, itemsPerPage, sortBy, sortOrder, quickDateFilter])

    // إعادة جلب البيانات عند تغيير نطاق التاريخ المخصص
    useEffect(() => {
        if (dateRange.from && dateRange.to) {
            setCurrentPage(1)
            const timer = setTimeout(() => {
                fetchData()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [dateRange.from, dateRange.to])

    // تصدير البيانات إلى Excel
    const handleExportToExcel = async () => {
        try {
            setExportLoading(true);

            // جلب جميع البيانات بدون pagination للتصدير
            const params = {
                limit: 10000,
                sortBy,
                sortOrder,
                ...(searchTerm && { search: searchTerm }),
            };

            // إضافة فلاتر التاريخ إذا كانت موجودة
            if (quickDateFilter !== "all") {
                const now = new Date();
                let startDate, endDate;

                switch (quickDateFilter) {
                    case "daily":
                        startDate = startOfDay(now);
                        endDate = endOfDay(now);
                        break;
                    case "weekly":
                        startDate = startOfWeek(now, { locale: ar });
                        endDate = endOfWeek(now, { locale: ar });
                        break;
                    case "monthly":
                        startDate = startOfMonth(now);
                        endDate = endOfMonth(now);
                        break;
                    case "yearly":
                        startDate = startOfYear(now);
                        endDate = endOfYear(now);
                        break;
                    default:
                        break;
                }

                if (startDate && endDate) {
                    params.startDate = startDate.toISOString();
                    params.endDate = endDate.toISOString();
                }
            } else if (dateRange.from && dateRange.to) {
                params.startDate = startOfDay(dateRange.from).toISOString();
                params.endDate = endOfDay(dateRange.to).toISOString();
            }

            console.log("📤 Exporting with params:", params);

            const response = await getTransactions(params);
            const transactionsData = response.data?.success
                ? response.data.data?.transactions || []
                : [];

            if (transactionsData.length === 0) {
                showErrorToast("لا توجد بيانات للتصدير");
                return;
            }

            // تحضير البيانات للتصدير
            const excelData = transactionsData.map((transaction, index) => ({
                '#': index + 1,
                'رقم المعاملة': transaction.id,
                'اسم المستخدم': transaction.accessCode?.user?.name || 'غير محدد',
                'هاتف المستخدم': transaction.accessCode?.user?.phone || 'غير محدد',
                'اسم الكورس': transaction.accessCode?.courseLevel?.course?.title || 'غير محدد',
                'اسم المستوى': transaction.accessCode?.courseLevel?.name || 'غير محدد',
                'المبلغ المدفوع': getAmountValue(transaction.amountPaid),
                'المبلغ المدفوع (ل.س)': `${getAmountValue(transaction.amountPaid).toLocaleString()} ل.س`,
                'كود الدخول': transaction.accessCode?.code || 'غير محدد',
                'تاريخ الإنشاء': formatDate(transaction.createdAt),
                'آخر تحديث': formatDate(transaction.updatedAt),
                'البلد': transaction.accessCode?.user?.country || 'غير محدد',
                'الجنس': transaction.accessCode?.user?.sex || 'غير محدد',
                'الدور': transaction.accessCode?.user?.role || 'غير محدد',
                'ملاحظات': transaction.notes || 'لا توجد',
                'يوجد إيصال': transaction.receiptImageUrl ? 'نعم' : 'لا'
            }));

            // إنشاء workbook جديد
            const wb = XLSX.utils.book_new();

            // إنشاء worksheet من البيانات
            const ws = XLSX.utils.json_to_sheet(excelData);

            // تنسيق الأعمدة
            const colWidths = [
                { wch: 5 },
                { wch: 12 },
                { wch: 20 },
                { wch: 15 },
                { wch: 25 },
                { wch: 20 },
                { wch: 15 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 10 },
                { wch: 15 },
                { wch: 30 },
                { wch: 10 }
            ];
            ws['!cols'] = colWidths;

            // إضافة worksheet إلى workbook
            XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');

            // إنشاء ورقة إضافية للإحصائيات
            const statsData = [
                ['إحصائيات الفواتير'],
                [''],
                ['إجمالي عدد الفواتير', transactionsData.length],
                ['إجمالي المبالغ', `${getAmountValue(stats.totalAmount).toLocaleString()} ل.س`],
                ['متوسط المبلغ', `${getAmountValue(stats.averageAmount).toLocaleString()} ل.س`],
                ['أعلى مبلغ', `${getAmountValue(stats.maxAmount).toLocaleString()} ل.س`],
                [''],
                ['تاريخ التصدير', new Date().toLocaleDateString('ar-SA')],
                ['وقت التصدير', new Date().toLocaleTimeString('ar-SA')]
            ];

            const wsStats = XLSX.utils.aoa_to_sheet(statsData);
            const statsColWidths = [
                { wch: 25 },
                { wch: 25 }
            ];
            wsStats['!cols'] = statsColWidths;
            XLSX.utils.book_append_sheet(wb, wsStats, 'الإحصائيات');

            // إنشاء اسم الملف
            const fileName = `فواتير_${new Date().toISOString().split('T')[0]}.xlsx`;

            // حفظ الملف
            XLSX.writeFile(wb, fileName);

            showSuccessToast(`تم تصدير ${transactionsData.length} فاتورة إلى ملف Excel`);

        } catch (error) {
            console.error("❌ Error exporting to Excel:", error);
            showErrorToast("فشل في تصدير البيانات إلى Excel");
        } finally {
            setExportLoading(false);
        }
    };

    // تطبيق فلاتر التاريخ المخصص
    const applyCustomDateFilter = () => {
        if (dateRange.from && dateRange.to) {
            setQuickDateFilter("custom");
            setCurrentPage(1);
            setDatePickerOpen(false);

            const startDate = startOfDay(dateRange.from);
            const endDate = endOfDay(dateRange.to);

            const dateParams = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };

            console.log("📅 Applying custom date filter:", dateParams);
            fetchData(dateParams);
        } else {
            showErrorToast("يرجى اختيار تاريخ البداية والنهاية");
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
        setDateRange({ from: null, to: null })
        setQuickDateFilter("all")
        setCurrentPage(1)
    }

    // Reset date filter only
    const resetDateFilter = () => {
        setDateRange({ from: null, to: null })
        setQuickDateFilter("all")
        setCurrentPage(1)
    }

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // Handle sort
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
        setCurrentPage(1)
    }

    // استخراج قيمة المبلغ من الكائن
    const getAmountValue = (amountObj) => {
        if (!amountObj) return 0
        if (typeof amountObj === 'number') return amountObj
        if (amountObj.d && Array.isArray(amountObj.d)) {
            return amountObj.d[0] || 0
        }
        return 0
    }

    // تنسيق المبلغ بالليرة السورية
    const formatAmount = (amountObj) => {
        const amount = getAmountValue(amountObj)
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'SYP'
        }).format(amount || 0)
    }

    // تنسيق التاريخ بـ en-US
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد"
        return new Date(dateString).toLocaleDateString('en-US')
    }

    // تنسيق التاريخ بشكل مختصر بـ en-US
    const formatShortDate = (dateString) => {
        if (!dateString) return "غير محدد"
        return new Date(dateString).toLocaleDateString('en-US')
    }

    // تنسيق التاريخ للعرض في الزر
    const formatDateForDisplay = (date) => {
        if (!date) return null
        return format(date, 'yyyy/MM/dd')
    }

    // الحصول على صورة الإيصال
    const getReceiptImageUrl = (receiptImageUrl) => {
        if (!receiptImageUrl) return null
        if (receiptImageUrl.startsWith('/')) {
            return `https://dev.tallaam.com${receiptImageUrl}`
        }
        return receiptImageUrl
    }

    // Pagination calculations
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalCount)

    // استخدام البيانات المفلترة محلياً للعرض
    const displayTransactions = filteredAndSortedTransactions;

    // عرض تفاصيل المعاملة
    const handleViewDetails = async (transaction) => {
        console.log("🔍 Showing transaction details:", transaction);
        setSelectedTransaction(transaction);
        setDetailDialog(true);
    }

    // تصدير الفاتورة
    const handleExportInvoice = async (transaction) => {
        try {
            setLoading(true)

            const printWindow = window.open('', '_blank')
            printWindow.document.write(`
            <html>
                <head>
                    <title>فاتورة #${transaction.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .section { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                        .label { font-weight: bold; color: #555; }
                        .value { color: #333; }
                        .total { font-size: 18px; font-weight: bold; color: green; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>فاتورة معاملة</h1>
                        <h2>رقم المعاملة: #${transaction.id}</h2>
                    </div>
                    
                    <div class="section">
                        <h3>المعلومات الأساسية</h3>
                        <div class="row">
                            <span class="label">رقم المعاملة:</span>
                            <span class="value">#${transaction.id}</span>
                        </div>
                        <div class="row">
                            <span class="label">المبلغ:</span>
                            <span class="value">${formatAmount(transaction.amountPaid)}</span>
                        </div>
                        <div class="row">
                            <span class="label">تاريخ الإنشاء:</span>
                            <span class="value">${formatDate(transaction.createdAt)}</span>
                        </div>
                        <div class="row">
                            <span class="label">آخر تحديث:</span>
                            <span class="value">${formatDate(transaction.updatedAt)}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>معلومات المستخدم</h3>
                        <div class="row">
                            <span class="label">الاسم:</span>
                            <span class="value">${transaction.accessCode?.user?.name || "غير محدد"}</span>
                        </div>
                        <div class="row">
                            <span class="label">الهاتف:</span>
                            <span class="value"dir="ltr">${transaction.accessCode?.user?.phone || "غير محدد"}</span>
                        </div>
                        <div class="row">
                            <span class="label">الجنس:</span>
                            <span class="value">${transaction.accessCode?.user?.sex || "غير محدد"}</span>
                        </div>
                        <div class="row">
                            <span class="label">تاريخ الميلاد:</span>
                            <span class="value">${formatDate(transaction.accessCode?.user?.birthDate)}</span>
                        </div>
                        <div class="row">
                            <span class="label">البلد:</span>
                            <span class="value">${transaction.accessCode?.user?.country || "غير محدد"}</span>
                        </div>
                        <div class="row">
                            <span class="label">الدور:</span>
                            <span class="value">${transaction.accessCode?.user?.role || "غير محدد"}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>معلومات الكورس</h3>
                        <div class="row">
                            <span class="label">الكورس:</span>
                            <span class="value">${transaction.accessCode?.courseLevel?.course?.title || "غير محدد"}</span>
                        </div>
                        <div class="row">
                            <span class="label">المستوى:</span>
                            <span class="value">${transaction.accessCode?.courseLevel?.name || "غير محدد"}</span>
                        </div>
                        <div class="row">
                            <span class="label">كود الدخول:</span>
                            <span class="value">${transaction.accessCode?.code || "غير محدد"}</span>
                        </div>
                    </div>
                    
                    ${transaction.notes ? `
                    <div class="section">
                        <h3>ملاحظات</h3>
                        <p>${transaction.notes}</p>
                    </div>
                    ` : ''}
                    
                    <div class="total">
                        الإجمالي: ${formatAmount(transaction.amountPaid)}
                    </div>
                </body>
            </html>
        `)
            printWindow.document.close()
            printWindow.print()

            showSuccessToast(`تم تصدير فاتورة المعاملة #${transaction.id}`)
        } catch (error) {
            console.error("❌ Error exporting invoice:", error)
            showErrorToast("فشل في تصدير الفاتورة")
        } finally {
            setLoading(false)
        }
    }

    // عرض صورة الإيصال
    const handleViewReceipt = (receiptImageUrl) => {
        const fullUrl = getReceiptImageUrl(receiptImageUrl)
        if (fullUrl) {
            window.open(fullUrl, '_blank')
        }
    }

    // الحصول على نص الفلتر النشط
    const getActiveFilterText = () => {
        if (quickDateFilter !== "all") {
            const texts = {
                daily: "اليوم",
                weekly: "آخر 7 أيام",
                monthly: "هذا الشهر",
                yearly: "هذه السنة",
                custom: "مخصص"
            }
            return texts[quickDateFilter] || ""
        }
        return ""
    }

    // مكون عرض الإحصائيات
    const StatsCards = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="overflow-hidden">
                <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">إجمالي المعاملات</p>
                            <p className="text-lg font-bold">{stats.totalTransactions || 0}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Receipt className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">إجمالي المبالغ</p>
                            <p className="text-lg font-bold text-green-600">{formatAmount(stats.totalAmount)}</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full">
                            <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">متوسط المبلغ</p>
                            <p className="text-lg font-bold">{formatAmount(stats.averageAmount)}</p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-full">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">أعلى مبلغ</p>
                            <p className="text-lg font-bold text-red-600">{formatAmount(stats.maxAmount)}</p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-full">
                            <DollarSign className="w-4 h-4 text-red-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    // مكون فلاتر التاريخ المحسّن
    const DateFilters = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* فلتر التاريخ السريع */}
            <div className="space-y-2">
                <Label className="text-sm">فلتر سريع</Label>
                <Select
                    value={quickDateFilter}
                    onValueChange={(value) => {
                        setQuickDateFilter(value)
                        setDateRange({ from: null, to: null })
                        setCurrentPage(1)
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر فترة زمنية" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع التواريخ</SelectItem>
                        <SelectItem value="daily">اليوم</SelectItem>
                        <SelectItem value="weekly">هذا الأسبوع</SelectItem>
                        <SelectItem value="monthly">هذا الشهر</SelectItem>
                        <SelectItem value="yearly">هذه السنة</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* فلتر التاريخ من - إلى - محسّن */}
            <div className="space-y-2">
                <Label className="text-sm">فلتر مخصص</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span>
                                    {dateRange.from && dateRange.to ? (
                                        `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`
                                    ) : (
                                        "اختر الفترة الزمنية"
                                    )}
                                </span>
                            </div>
                            {dateRange.from && dateRange.to && (
                                <X
                                    className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        resetDateFilter()
                                    }}
                                />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">اختر الفترة الزمنية</h4>
                                {dateRange.from && dateRange.to && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetDateFilter}
                                        className="h-8 text-xs"
                                    >
                                        مسح
                                    </Button>
                                )}
                            </div>
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                defaultMonth={dateRange.from || new Date()}
                                locale={ar}
                            />
                        </div>
                        <div className="p-3 border-t bg-muted/50">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-sm text-muted-foreground">
                                    {dateRange.from && dateRange.to ? (
                                        `المحدد: ${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`
                                    ) : (
                                        "اختر تاريخ البداية والنهاية"
                                    )}
                                </div>
                                <Button
                                    onClick={applyCustomDateFilter}
                                    disabled={!dateRange.from || !dateRange.to}
                                    size="sm"
                                >
                                    تطبيق
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )

    // بطاقة المعاملة للشاشات الصغيرة
    const TransactionCard = ({ transaction }) => (
        <Card key={transaction.id} className="mb-4">
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* الرأس */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold">#{transaction.id}</span>
                        </div>
                        <Badge variant="outline" className="text-green-600 font-bold">
                            {formatAmount(transaction.amountPaid)}
                        </Badge>
                    </div>

                    {/* المعلومات الأساسية */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">
                                    {transaction.accessCode?.user?.name || "غير محدد"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {transaction.accessCode?.user?.phone}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="text-sm truncate">
                                    {transaction.accessCode?.courseLevel?.course?.title || "غير محدد"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {transaction.accessCode?.courseLevel?.name}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">التاريخ:</span>
                            <span>{formatShortDate(transaction.createdAt)}</span>
                        </div>
                    </div>

                    {/* الإجراءات */}
                    <div className="flex justify-between pt-2 border-t">
                        <div className="flex gap-2">
                            {transaction.receiptImageUrl && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewReceipt(transaction.receiptImageUrl)}
                                    className="h-8"
                                >
                                    <Image className="w-3 h-3 ml-1" />
                                    الإيصال
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(transaction)}
                                className="h-8 w-8 p-0"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleExportInvoice(transaction)}
                                className="h-8 w-8 p-0"
                            >
                                <FileText className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <Card className="w-full overflow-hidden">
            <CardHeader className="flex flex-col gap-4 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">التحويلات المالية والفواتير</CardTitle>

                {/* إحصائيات سريعة */}
                <StatsCards />

                {/* فلاتر التاريخ */}
                <DateFilters />

                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="relative md:col-span-2">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث برقم المعاملة أو المستخدم أو الكورس..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>

                    {/* Items Per Page */}
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(Number(value))
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="عدد العناصر" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 عناصر</SelectItem>
                            <SelectItem value="10">10 عناصر</SelectItem>
                            <SelectItem value="20">20 عناصر</SelectItem>
                            <SelectItem value="50">50 عناصر</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            disabled={loading}
                            className="flex-1 min-w-[120px]"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 ml-2" />
                            )}
                            تحديث
                        </Button>

                        {/* زر التصدير إلى Excel */}
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleExportToExcel}
                            disabled={exportLoading || transactions.length === 0}
                            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700"
                        >
                            {exportLoading ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-4 h-4 ml-2" />
                            )}
                            تصدير Excel
                        </Button>

                        {(searchTerm || quickDateFilter !== "all" || dateRange.from || dateRange.to) && (
                            <Button variant="outline" size="sm" onClick={resetFilters} className="flex-1 min-w-[120px]">
                                <Filter className="w-4 h-4 ml-2" />
                                إعادة تعيين
                            </Button>
                        )}
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        عرض {displayTransactions.length} من أصل {totalCount} معاملة
                        {(searchTerm || quickDateFilter !== "all" || dateRange.from) && (
                            <span className="text-blue-600 mr-2">
                                {getActiveFilterText() && ` - ${getActiveFilterText()}`}
                                {searchTerm && ` - بحث: "${searchTerm}"`}
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 sm:p-6">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <>
                        {/* عرض الجدول للشاشات المتوسطة والكبيرة */}
                        <div className="hidden md:block">
                            <div className="rounded-md border overflow-x-auto">
                                <Table className="min-w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                onClick={() => handleSort("id")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    رقم المعاملة
                                                    {sortBy === "id" && (
                                                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                onClick={() => handleSort("user")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    المستخدم
                                                    {sortBy === "user" && (
                                                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                onClick={() => handleSort("course")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    الكورس
                                                    {sortBy === "course" && (
                                                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                onClick={() => handleSort("amountPaid")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    المبلغ
                                                    {sortBy === "amountPaid" && (
                                                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">الإيصال</TableHead>
                                            <TableHead
                                                className="cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                onClick={() => handleSort("createdAt")}
                                            >
                                                <div className="flex items-center gap-1">
                                                    التاريخ
                                                    {sortBy === "createdAt" && (
                                                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right whitespace-nowrap">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayTransactions.length > 0 ? displayTransactions.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    #{item.id}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="truncate">{item.accessCode?.user?.name || "غير محدد"}</div>
                                                            <div className="text-sm text-muted-foreground truncate" dir='ltr'>
                                                                {item.accessCode?.user?.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="truncate">{item.accessCode?.courseLevel?.course?.title || "غير محدد"}</div>
                                                            <div className="text-sm text-muted-foreground truncate">
                                                                {item.accessCode?.courseLevel?.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="font-bold text-green-600">
                                                        {formatAmount(item.amountPaid)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {item.receiptImageUrl ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewReceipt(item.receiptImageUrl)}
                                                            className="w-full sm:w-auto"
                                                        >
                                                            <Image className="w-4 h-4 ml-2" />
                                                            <span className="hidden sm:inline">عرض الإيصال</span>
                                                            <span className="sm:hidden">الإيصال</span>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-gray-500">لا يوجد</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDate(item.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2 whitespace-nowrap">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleViewDetails(item)}
                                                        title="عرض التفاصيل"
                                                        className="h-8 w-8"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleExportInvoice(item)}
                                                        title="تصدير الفاتورة"
                                                        className="h-8 w-8"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    {transactions.length === 0 ? "لا توجد معاملات" : "لم يتم العثور على نتائج"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* عرض البطاقات للشاشات الصغيرة */}
                        <div className="md:hidden">
                            {displayTransactions.length > 0 ? (
                                displayTransactions.map(item => (
                                    <TransactionCard key={item.id} transaction={item} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {transactions.length === 0 ? "لا توجد معاملات" : "لم يتم العثور على نتائج"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {displayTransactions.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} - {endItem} من أصل {totalCount} معاملة
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <div className="flex items-center gap-1 flex-wrap justify-center">
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
                                                    className="h-8 w-8 p-0"
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
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Transaction Details Dialog */}
                <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
                    <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900 text-right">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-6 h-6 text-blue-600" />
                                    تفاصيل المعاملة
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedTransaction && (
                            <div className="space-y-6 text-right">
                                {/* الهيدر مع المعلومات الأساسية */}
                                <div className="bg-gradient-to-l from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                        {/* صورة الإيصال */}
                                        <div className="relative flex-shrink-0">
                                            {selectedTransaction.receiptImageUrl ? (
                                                <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={getReceiptImageUrl(selectedTransaction.receiptImageUrl)}
                                                        alt="صورة الإيصال"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            // إذا فشل تحميل الصورة، عرض أيقونة بديلة
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    <div className="hidden w-full h-full items-center justify-center bg-gray-100">
                                                        <Receipt className="w-16 h-16 text-gray-400" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-32 h-32 lg:w-40 lg:h-40 bg-blue-600 rounded-2xl shadow-lg border-4 border-white flex items-center justify-center">
                                                    <Receipt className="w-16 h-16 text-white" />
                                                </div>
                                            )}
                                            {/* شارة رقم المعاملة */}
                                            <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg">
                                                #{selectedTransaction.id}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                                                معاملة #{selectedTransaction.id}
                                            </h2>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                                                    مدفوعة
                                                </Badge>

                                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                                    <DollarSign className="w-3 h-3 ml-1" />
                                                    {formatAmount(selectedTransaction.amountPaid)}
                                                </Badge>

                                                {selectedTransaction.receiptImageUrl && (
                                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                        يوجد إيصال
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* معلومات سريعة */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    {/* <Calendar className="w-4 h-4 text-blue-600" /> */}
                                                    <span>تاريخ المعاملة: {formatDate(selectedTransaction.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                    <span>المستخدم: {selectedTransaction.accessCode?.user?.name || "غير محدد"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* الشبكة الرئيسية للمعلومات */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* معلومات المبلغ والدفع */}
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader className="pb-3 bg-gradient-to-l from-green-50 to-emerald-50 rounded-t-lg">
                                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                                <Receipt className="w-5 h-5 text-green-600" />
                                                معلومات المبلغ والدفع
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-medium text-gray-700">المبلغ المدفوع</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-2xl text-green-600 block">
                                                            {formatAmount(selectedTransaction.amountPaid)}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {getAmountValue(selectedTransaction.amountPaid).toLocaleString()} ليرة سورية
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        {/* <Calendar className="w-4 h-4 text-blue-600" /> */}
                                                        <span className="text-sm font-medium text-gray-700">تاريخ الدفع</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-medium text-gray-900 block">
                                                            {formatDate(selectedTransaction.createdAt)}
                                                        </span>
                                                        {/* <span className="text-xs text-gray-500">
                      {new Date(selectedTransaction.createdAt).toLocaleTimeString('ar-SA')}
                    </span> */}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* حالة الإيصال */}
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">حالة الإيصال</span>
                                                    <Badge
                                                        variant={selectedTransaction.receiptImageUrl ? "default" : "secondary"}
                                                        className={selectedTransaction.receiptImageUrl ? "bg-green-600" : "bg-gray-500"}
                                                    >
                                                        {selectedTransaction.receiptImageUrl ? "🟢 مرفق" : "🔴 غير مرفق"}
                                                    </Badge>
                                                </div>
                                                {selectedTransaction.receiptImageUrl && (
                                                    <div className="text-center mt-3">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleViewReceipt(selectedTransaction.receiptImageUrl)}
                                                            className="w-full"
                                                        >
                                                            <Image className="w-4 h-4 ml-2" />
                                                            عرض صورة الإيصال
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* معلومات المستخدم */}
                                    <Card className="border border-gray-200 shadow-sm">
                                        <CardHeader className="pb-3 bg-gradient-to-l from-purple-50 to-indigo-50 rounded-t-lg">
                                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                                <User className="w-5 h-5 text-purple-600" />
                                                معلومات المستخدم
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                                    <span className="text-sm font-medium text-gray-700">الاسم الكامل</span>
                                                    <span className="font-medium text-gray-900">
                                                        {selectedTransaction.accessCode?.user?.name || "غير محدد"}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                                    <span className="text-sm font-medium text-gray-700">رقم الهاتف</span>
                                                    <span className="font-medium text-gray-900" dir="ltr">
                                                        {selectedTransaction.accessCode?.user?.phone || "غير محدد"}
                                                    </span>
                                                </div>

                                                {/* <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">البريد الإلكتروني</span>
                  <span className="font-medium text-gray-900">
                    {selectedTransaction.accessCode?.user?.email || "غير محدد"}
                  </span>
                </div> */}

                                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                                    <span className="text-sm font-medium text-gray-700">البلد</span>
                                                    <span className="font-medium text-gray-900">
                                                        {selectedTransaction.accessCode?.user?.country || "غير محدد"}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* معلومات الكورس والوصول */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-gradient-to-l from-orange-50 to-amber-50 rounded-t-lg">
                                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                            <BookOpen className="w-5 h-5 text-orange-600" />
                                            معلومات الكورس والوصول
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-gray-700 border-b pb-2">معلومات الكورس</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">اسم الكورس:</span>
                                                        <span className="font-medium text-gray-900">
                                                            {selectedTransaction.accessCode?.courseLevel?.course?.title || "غير محدد"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">المستوى:</span>
                                                        <span className="font-medium text-gray-900">
                                                            {selectedTransaction.accessCode?.courseLevel?.name || "غير محدد"}
                                                        </span>
                                                    </div>
                                                    {/* <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">نوع الكورس:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTransaction.accessCode?.courseLevel?.course?.type || "غير محدد"}
                    </span>
                  </div> */}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-gray-700 border-b pb-2">معلومات الوصول</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">كود الدخول:</span>
                                                        <Badge variant="secondary" className="font-mono text-lg font-bold">
                                                            {selectedTransaction.accessCode?.code || "غير محدد"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">حالة الكود:</span>
                                                        <Badge variant="default" className="bg-green-600">
                                                            🟢 نشط
                                                        </Badge>
                                                    </div>
                                                    {/* <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {formatDate(selectedTransaction.accessCode?.createdAt)}
                    </span>
                  </div> */}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* معلومات إضافية */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-gradient-to-l from-gray-50 to-slate-50 rounded-t-lg">
                                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                            <FileText className="w-5 h-5 text-gray-600" />
                                            معلومات إضافية
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">معرف المعاملة</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                  {selectedTransaction.id}
                </span>
              </div> */}

                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">تاريخ الإنشاء</span>
                                                <div className="text-right">
                                                    <span className="font-medium text-gray-900 block">{formatDate(selectedTransaction.createdAt)}</span>
                                                    {/* <span className="text-xs text-gray-500">
                    {new Date(selectedTransaction.createdAt).toLocaleTimeString('ar-SA')}
                  </span> */}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">آخر تحديث</span>
                                                <div className="text-right">
                                                    <span className="font-medium text-gray-900 block">{formatDate(selectedTransaction.updatedAt)}</span>
                                                    {/* <span className="text-xs text-gray-500">
                    {new Date(selectedTransaction.updatedAt).toLocaleTimeString('ar-SA')}
                  </span> */}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">نوع المعاملة</span>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                    شراء كورس
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* الملاحظات */}
                                        {selectedTransaction.notes && (
                                            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-yellow-600" />
                                                    الملاحظات
                                                </h4>
                                                <p className="text-gray-700 bg-white p-3 rounded border border-yellow-300">
                                                    {selectedTransaction.notes}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* أزرار الإجراءات */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                    <Button
                                        variant="default"
                                        onClick={() => handleExportInvoice(selectedTransaction)}
                                        className="flex items-center gap-2 flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <FileText className="w-4 h-4" />
                                        تصدير الفاتورة
                                    </Button>

                                    {selectedTransaction.receiptImageUrl && (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleViewReceipt(selectedTransaction.receiptImageUrl)}
                                            className="flex items-center gap-2 flex-1"
                                        >
                                            <Image className="w-4 h-4" />
                                            عرض الإيصال
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            // إمكانية إضافة وظيفة الطباعة المباشرة
                                            window.print();
                                        }}
                                        className="flex items-center gap-2 flex-1"
                                    >
                                        <FileText className="w-4 h-4" />
                                        طباعة التفاصيل
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

export default Transactions
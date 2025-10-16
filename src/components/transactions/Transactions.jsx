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
import { Search, ChevronLeft, ChevronRight, Eye, Download, Filter, RefreshCw, Calendar as CalendarIcon, DollarSign, Receipt, User, BookOpen, Loader2, Image, FileText, CreditCard } from "lucide-react"
import { getTransactions, getTransactionStats } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns"
import { ar } from "date-fns/locale"

const Transactions = () => {
    const [transactions, setTransactions] = useState([])
    const [stats, setStats] = useState({})
    const [loading, setLoading] = useState(false)
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
    const [quickDateFilter, setQuickDateFilter] = useState("all") // all, daily, weekly, monthly, yearly

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
            setStats({});
        } finally {
            setLoading(false);
        }
    };


    // إعادة جلب البيانات عند تغيير أي من المعلمات
    useEffect(() => {
        fetchData()
    }, [currentPage, itemsPerPage, sortBy, sortOrder, quickDateFilter])

    // إعادة جلب البيانات عند تغيير نطاق التاريخ المخصص
    useEffect(() => {
        if (dateRange.from && dateRange.to) {
            setCurrentPage(1)
            // سنستخدم useEffect منفصل للتأكد من تطبيق التغييرات
            const timer = setTimeout(() => {
                fetchData()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [dateRange.from, dateRange.to])

    // تطبيق فلاتر البحث
    const applySearchFilters = () => {
        setCurrentPage(1)
        fetchData()
    }

    // تطبيق فلاتر التاريخ المخصص
    const applyCustomDateFilter = () => {
        if (dateRange.from && dateRange.to) {
            setQuickDateFilter("custom");
            setCurrentPage(1);

            // نستخدم startOfDay و endOfDay لضمان شمول اليومين بالكامل
            const startDate = startOfDay(dateRange.from);
            const endDate = endOfDay(dateRange.to);

            const dateParams = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };

            console.log("📅 Applying custom date filter:", dateParams);

            fetchData(dateParams); // نمررها للدالة مباشرة
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
        return new Intl.NumberFormat('ar-SY', {
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

    // الحصول على صورة الإيصال
    const getReceiptImageUrl = (receiptImageUrl) => {
        if (!receiptImageUrl) return null
        // إذا كان الرابط نسبياً، نضيف الـ base URL
        if (receiptImageUrl.startsWith('/')) {
            return `https://dev.tallaam.com${receiptImageUrl}`
        }
        return receiptImageUrl
    }

    // Pagination calculations
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalCount)

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

    // مكون فلاتر التاريخ
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
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر فترة زمنية" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع التواريخ</SelectItem>
                        <SelectItem value="daily">يومي (اليوم فقط)</SelectItem>
                        <SelectItem value="weekly">أسبوعي (آخر 7 أيام)</SelectItem>
                        <SelectItem value="monthly">شهري (هذا الشهر)</SelectItem>
                        <SelectItem value="yearly">سنوي (هذه السنة)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* فلتر التاريخ من - إلى */}
            <div className="space-y-2">
                <Label className="text-sm">فلتر مخصص (من - إلى)</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-right font-normal"
                            >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "من تاريخ"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateRange.from}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-right font-normal"
                            >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "إلى تاريخ"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateRange.to}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        onClick={applyCustomDateFilter}
                        disabled={!dateRange.from || !dateRange.to}
                        className="whitespace-nowrap"
                    >
                        تطبيق
                    </Button>
                </div>
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


    // عرض التفاصيل الكاملة للمعاملة
    const renderTransactionDetails = (transaction) => {
        if (!transaction) return null

        const receiptUrl = getReceiptImageUrl(transaction.receiptImageUrl)
        const user = transaction.accessCode?.user
        const courseLevel = transaction.accessCode?.courseLevel
        const course = courseLevel?.course

        return (
            <div className="space-y-6 text-right">
                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <Label className="font-semibold text-gray-600 block mb-2">رقم المعاملة</Label>
                        <p className="text-xl font-bold text-gray-900">#{transaction.id}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <Label className="font-semibold text-gray-600 block mb-2">المبلغ المدفوع</Label>
                        <p className="text-xl font-bold text-green-600">{formatAmount(transaction.amountPaid)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <Label className="font-semibold text-gray-600 block mb-2">تاريخ الإنشاء</Label>
                        <p className="text-lg text-gray-900">{formatDate(transaction.createdAt)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <Label className="font-semibold text-gray-600 block mb-2">آخر تحديث</Label>
                        <p className="text-lg text-gray-900">{formatDate(transaction.updatedAt)}</p>
                    </div>

                    {transaction.accessCodeId && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <Label className="font-semibold text-gray-600 block mb-2">معرف كود الدخول</Label>
                            <p className="text-lg text-gray-900">{transaction.accessCodeId}</p>
                        </div>
                    )}

                    {transaction.couponId && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <Label className="font-semibold text-gray-600 block mb-2">معرف الكوبون</Label>
                            <p className="text-lg text-gray-900">{transaction.couponId}</p>
                        </div>
                    )}
                </div>

                {/* صورة الإيصال */}
                {receiptUrl && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-right">
                        <div className="flex items-center gap-3 mb-4 justify-end">
                            <h3 className="text-xl font-bold text-gray-900">صورة الإيصال</h3>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Image className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 items-start">
                            <div className="flex-1">
                                <div className="w-full max-w-xs mx-auto lg:mx-0 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 hover:shadow-lg transition-shadow">
                                    <img
                                        src={receiptUrl}
                                        alt="صورة الإيصال"
                                        className="w-full h-64 object-contain cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => handleViewReceipt(transaction.receiptImageUrl)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full lg:w-auto">
                                <Button
                                    onClick={() => handleViewReceipt(transaction.receiptImageUrl)}
                                    variant="outline"
                                    className="w-full lg:w-64 justify-center"
                                    size="lg"
                                >
                                    <Image className="w-4 h-4 ml-2" />
                                    عرض صورة الإيصال في نافذة جديدة
                                </Button>
                                <Button
                                    onClick={() => handleExportInvoice(transaction)}
                                    className="w-full lg:w-64 justify-center bg-green-600 hover:bg-green-700"
                                    size="lg"
                                >
                                    <FileText className="w-4 h-4 ml-2" />
                                    تصدير الفاتورة
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* معلومات المستخدم */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-right">
                    <div className="flex items-center gap-3 mb-6 justify-end">
                        <h3 className="text-xl font-bold text-gray-900">معلومات المستخدم</h3>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <User className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <InfoCard label="الاسم الكامل" value={user?.name} />
                        <InfoCard label="رقم الهاتف" value={user?.phone} dir={"ltr"} />
                        <InfoCard label="الجنس" value={user?.sex} />
                        <InfoCard label="تاريخ الميلاد" value={formatDate(user?.birthDate)} />
                        <InfoCard label="البلد" value={user?.country} />
                        <InfoCard label="رمز الدولة" value={user?.countryCode} dir={"ltr"} />
                        <InfoCard label="الدور" value={user?.role} />
                        <StatusCard
                            label="الحالة"
                            value={user?.isActive ? 'نشط' : 'غير نشط'}
                            isActive={user?.isActive}
                        />
                        <InfoCard label="معرف المستخدم" value={user?.id} />
                    </div>

                    {user?.avatarUrl && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border text-right">
                            <Label className="font-semibold text-gray-700 block mb-3">الصورة الشخصية</Label>
                            <div className="w-32 h-32 border-2 border-gray-300 rounded-xl overflow-hidden bg-white mr-auto">
                                <img
                                    src={`https://dev.tallaam.com${user.avatarUrl}`}
                                    alt="الصورة الشخصية"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* معلومات الكورس والمستوى */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-right">
                    <div className="flex items-center gap-3 mb-6 justify-end">
                        <h3 className="text-xl font-bold text-gray-900">معلومات الكورس والمستوى</h3>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InfoCard label="اسم الكورس" value={course?.title} />
                        <InfoCard label="اسم المستوى" value={courseLevel?.name} />
                        <InfoCard label="معرف الكورس" value={course?.id} />
                        <InfoCard label="معرف المستوى" value={courseLevel?.id} />
                    </div>
                </div>

                {/* معلومات كود الدخول */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-right">
                    <div className="flex items-center gap-3 mb-6 justify-end">
                        <h3 className="text-xl font-bold text-gray-900">معلومات كود الدخول</h3>
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <CreditCard className="w-5 h-5 text-yellow-600" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <Label className="font-semibold text-gray-700 block mb-3">كود الدخول</Label>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <p className="font-mono text-lg font-bold text-center text-gray-900">
                                    {transaction.accessCode?.code || "غير محدد"}
                                </p>
                            </div>
                        </div>

                        <InfoCard
                            label="معرف كود الدخول"
                            value={transaction.accessCode?.id}
                            className="bg-white border border-gray-200 rounded-xl p-4"
                        />
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-right">
                    <div className="flex items-center gap-3 mb-6 justify-end">
                        <h3 className="text-xl font-bold text-gray-900">معلومات إضافية</h3>
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* الملاحظات */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <Label className="font-semibold text-gray-700 block mb-3">ملاحظات</Label>
                            <p className={`p-3 rounded-lg ${transaction.notes
                                    ? "bg-white border border-gray-300 text-gray-900"
                                    : "bg-gray-100 text-gray-500 border border-gray-200"
                                }`}>
                                {transaction.notes || "لا توجد ملاحظات"}
                            </p>
                        </div>

                        {/* معلومات الكوبون */}
                        {transaction.coupon && (
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 text-right">
                                <div className="flex items-center gap-3 mb-4 justify-end">
                                    <h4 className="text-lg font-bold text-blue-900">معلومات الكوبون</h4>
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Badge className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard label="كود الكوبون" value={transaction.coupon.code} />
                                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                                        <Label className="font-semibold text-gray-700 block mb-2">قيمة الخصم</Label>
                                        <p className="text-lg font-bold text-red-600">
                                            {transaction.coupon.discount}
                                            {transaction.coupon.isPercent ? '%' : ' ل.س'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* تفاصيل المبلغ */}
                        <div className="bg-green-50 rounded-xl p-6 border border-green-200 text-right">
                            <div className="flex items-center gap-3 mb-4 justify-end">
                                <h4 className="text-lg font-bold text-green-900">تفاصيل المبلغ</h4>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                    <Label className="font-semibold text-gray-700 block mb-2">قيمة المبلغ</Label>
                                    <p className="text-xl font-bold text-green-600 font-mono">
                                        {getAmountValue(transaction.amountPaid)} ل.س
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // مكونات مساعدة للتصميم
    const InfoCard = ({ label, value, className = "", dir=""}) => (
        <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 text-right ${className}`} >
            <Label className="font-semibold text-gray-700 block mb-2">{label}</Label>
            <p className="text-gray-900" dir={dir}>{value || "غير محدد"}</p>
        </div>
    )

    const StatusCard = ({ label, value, isActive }) => (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-right">
            <Label className="font-semibold text-gray-700 block mb-2">{label}</Label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                {value}
            </span>
        </div>
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
                            onKeyPress={(e) => e.key === 'Enter' && applySearchFilters()}
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

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="flex-1">
                            {loading ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 ml-2" />
                            )}
                            تحديث
                        </Button>
                        {(searchTerm || quickDateFilter !== "all" || dateRange.from || dateRange.to) && (
                            <Button variant="outline" size="sm" onClick={resetFilters} className="flex-1">
                                <Filter className="w-4 h-4 ml-2" />
                                إعادة تعيين
                            </Button>
                        )}
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        عرض {transactions.length} من أصل {totalCount} معاملة
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
                                        {transactions.length > 0 ? transactions.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    #{item.id}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="truncate">{item.accessCode?.user?.name || "غير محدد"}</div>
                                                            <div className="text-sm text-muted-foreground truncate">
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
                            {transactions.length > 0 ? (
                                transactions.map(item => (
                                    <TransactionCard key={item.id} transaction={item} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {transactions.length === 0 ? "لا توجد معاملات" : "لم يتم العثور على نتائج"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {transactions.length > 0 && (
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
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>تفاصيل المعاملة #{selectedTransaction?.id}</DialogTitle>
                        </DialogHeader>
                        {renderTransactionDetails(selectedTransaction)}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

export default Transactions
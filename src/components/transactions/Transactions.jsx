import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, Eye, Download, Filter, RefreshCw, Calendar, DollarSign, Receipt, User, BookOpen, Loader2, Image, FileText } from "lucide-react"
import { getTransactions, getTransactionStats } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"

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

    // جلب البيانات
    const fetchData = async () => {
        try {
            setLoading(true)

            const params = {
                page: currentPage,
                limit: itemsPerPage,
                sortBy,
                sortOrder,
                ...(searchTerm && { search: searchTerm })
            }

            const [transactionsRes, statsRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params)
            ])

            console.log("📊 Transactions response:", transactionsRes)
            console.log("📈 Stats response:", statsRes)

            // معالجة بيانات المعاملات
            if (transactionsRes.data?.success) {
                const transactionsData = transactionsRes.data.data?.transactions || []
                const paginationInfo = transactionsRes.data.data?.pagination
                
                setTransactions(transactionsData)
                setTotalCount(paginationInfo?.total || transactionsData.length)
            } else {
                setTransactions([])
                setTotalCount(0)
            }

            // معالجة الإحصائيات
            if (statsRes.data?.success) {
                setStats(statsRes.data.data || {})
            } else {
                setStats({})
            }
            
        } catch (err) {
            console.error("❌ Error fetching transactions:", err)
            showErrorToast(err.response?.data?.message || "فشل في جلب بيانات المعاملات")
            setTransactions([])
            setStats({})
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentPage, itemsPerPage, sortBy, sortOrder])

    // فلترة البيانات محلياً للبحث
    const filteredTransactions = useMemo(() => {
        let filtered = [...transactions]

        // فلترة بالنص
        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.id?.toString().includes(searchTerm) ||
                item.accessCode?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.accessCode?.user?.phone?.includes(searchTerm) ||
                item.accessCode?.courseLevel?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.accessCode?.code?.includes(searchTerm)
            )
        }

        return filtered
    }, [transactions, searchTerm])

    // ترتيب البيانات
    const sortedTransactions = useMemo(() => {
        const filtered = [...filteredTransactions]

        filtered.sort((a, b) => {
            let aValue, bValue

            switch (sortBy) {
                case "amountPaid":
                    aValue = getAmountValue(a.amountPaid) || 0
                    bValue = getAmountValue(b.amountPaid) || 0
                    break
                case "user":
                    aValue = a.accessCode?.user?.name || ""
                    bValue = b.accessCode?.user?.name || ""
                    break
                case "course":
                    aValue = a.accessCode?.courseLevel?.course?.title || ""
                    bValue = b.accessCode?.courseLevel?.course?.title || ""
                    break
                case "createdAt":
                default:
                    aValue = new Date(a.createdAt).getTime()
                    bValue = new Date(b.createdAt).getTime()
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
            return 0
        })

        return filtered
    }, [filteredTransactions, sortBy, sortOrder])

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

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
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
    }

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
        setCurrentPage(1)
    }

    // تطبيق فلاتر البحث
    const applySearchFilters = () => {
        setCurrentPage(1)
    }

    // عرض تفاصيل المعاملة
    const handleViewDetails = async (transaction) => {
      console.log("🔍 Showing transaction details:", transaction);
    setSelectedTransaction(transaction);
    setDetailDialog(true);
        // try {
        //     const transactionRes = await getTransactionById(transaction.id)
        //     if (transactionRes?.success) {
        //         setSelectedTransaction(transactionRes.data.data)
        //         setDetailDialog(true)
        //     }
        // } catch (err) {
        //     showErrorToast("فشل في جلب تفاصيل المعاملة")
        // }
    }

    // تصدير الفاتورة
    const handleExportInvoice = (transaction) => {
        showSuccessToast(`تم تصدير فاتورة المعاملة #${transaction.id}`)
        // هنا يمكن إضافة منطق التصدير الفعلي
    }

    // عرض صورة الإيصال
    const handleViewReceipt = (receiptImageUrl) => {
        const fullUrl = getReceiptImageUrl(receiptImageUrl)
        if (fullUrl) {
            window.open(fullUrl, '_blank')
        }
    }

    // مكون عرض الإحصائيات
    const StatsCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">إجمالي المعاملات</p>
                            <p className="text-2xl font-bold">{stats.totalTransactions || 0}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Receipt className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">إجمالي المبالغ</p>
                            <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalAmount)}</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full">
                            <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">متوسط المبلغ</p>
                            <p className="text-2xl font-bold">{formatAmount(stats.averageAmount)}</p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-full">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">أعلى مبلغ</p>
                            <p className="text-2xl font-bold text-red-600">{formatAmount(stats.maxAmount)}</p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-full">
                            <DollarSign className="w-4 h-4 text-red-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    // عرض التفاصيل الكاملة للمعاملة
    const renderTransactionDetails = (transaction) => {
        if (!transaction) return null

        const receiptUrl = getReceiptImageUrl(transaction.receiptImageUrl)

        return (
            <div className="space-y-4 text-right">
                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-bold">رقم المعاملة:</Label>
                        <p className="mt-1">#{transaction.id}</p>
                    </div>
                    <div>
                        <Label className="font-bold">المبلغ:</Label>
                        <p className="mt-1 text-green-600 font-bold">{formatAmount(transaction.amountPaid)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">التاريخ:</Label>
                        <p className="mt-1">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">آخر تحديث:</Label>
                        <p className="mt-1">{formatDate(transaction.updatedAt)}</p>
                    </div>
                </div>

                {/* صورة الإيصال */}
                {receiptUrl && (
                    <div className="border-t pt-4">
                        <h3 className="font-bold mb-2">صورة الإيصال</h3>
                        <div className="flex gap-4 items-start">
                            <div className="w-32 h-32 border rounded-lg overflow-hidden">
                                <img 
                                    src={receiptUrl} 
                                    alt="صورة الإيصال"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleViewReceipt(transaction.receiptImageUrl)}
                                />
                            </div>
                            <Button 
                                onClick={() => handleViewReceipt(transaction.receiptImageUrl)}
                                variant="outline"
                                size="sm"
                            >
                                <Image className="w-4 h-4 ml-2" />
                                عرض صورة الإيصال
                            </Button>
                        </div>
                    </div>
                )}

                {/* معلومات المستخدم */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات المستخدم</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">الاسم:</Label>
                            <p>{transaction.accessCode?.user?.name || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">الهاتف:</Label>
                            <p>{transaction.accessCode?.user?.phone || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">البلد:</Label>
                            <p>{transaction.accessCode?.user?.country || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">معرف المستخدم:</Label>
                            <p>{transaction.accessCode?.user?.id || "غير محدد"}</p>
                        </div>
                    </div>
                </div>

                {/* معلومات الكورس */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات الكورس</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">الكورس:</Label>
                            <p>{transaction.accessCode?.courseLevel?.course?.title || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">المستوى:</Label>
                            <p>{transaction.accessCode?.courseLevel?.name || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">التخصص:</Label>
                            <p>{transaction.accessCode?.courseLevel?.course?.specialization?.name || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">معرف المستوى:</Label>
                            <p>{transaction.accessCode?.courseLevel?.id || "غير محدد"}</p>
                        </div>
                    </div>
                </div>

                {/* معلومات كود الدخول */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات كود الدخول</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">كود الدخول:</Label>
                            <p className="font-mono text-lg">{transaction.accessCode?.code || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">معرف كود الدخول:</Label>
                            <p>{transaction.accessCode?.id || "غير محدد"}</p>
                        </div>
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات إضافية</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label className="font-medium">ملاحظات:</Label>
                            <p className={transaction.notes ? "border rounded-lg p-3 bg-gray-50" : "text-gray-500"}>
                                {transaction.notes || "لا توجد ملاحظات"}
                            </p>
                        </div>
                        {transaction.coupon && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-medium">الكوبون المستخدم:</Label>
                                    <p>{transaction.coupon.code}</p>
                                </div>
                                <div>
                                    <Label className="font-medium">قيمة الخصم:</Label>
                                    <p className="text-red-600">
                                        {transaction.coupon.discount}
                                        {transaction.coupon.isPercent ? '%' : ' ل.س'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <CardTitle>التحويلات المالية والفواتير</CardTitle>

                {/* إحصائيات سريعة */}
                <StatsCards />

                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
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
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                            {loading ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 ml-2" />
                            )}
                            تحديث
                        </Button>
                        {searchTerm && (
                            <Button variant="outline" size="sm" onClick={resetFilters}>
                                <Filter className="w-4 h-4 ml-2" />
                                إعادة تعيين
                            </Button>
                        )}
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        عرض {sortedTransactions.length} من أصل {totalCount} معاملة
                        {searchTerm && ` (مفلتر)`}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <>
                        {/* Table View */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer hover:bg-gray-100"
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
                                            className="cursor-pointer hover:bg-gray-100"
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
                                            className="cursor-pointer hover:bg-gray-100"
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
                                            className="cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("amountPaid")}
                                        >
                                            <div className="flex items-center gap-1">
                                                المبلغ
                                                {sortBy === "amountPaid" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead>الإيصال</TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            <div className="flex items-center gap-1">
                                                التاريخ
                                                {sortBy === "createdAt" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTransactions.length > 0 ? sortedTransactions.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                #{item.id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div>{item.accessCode?.user?.name || "غير محدد"}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {item.accessCode?.user?.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div>{item.accessCode?.courseLevel?.course?.title || "غير محدد"}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {item.accessCode?.courseLevel?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-green-600">
                                                    {formatAmount(item.amountPaid)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.receiptImageUrl ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewReceipt(item.receiptImageUrl)}
                                                    >
                                                        <Image className="w-4 h-4 ml-2" />
                                                        عرض الإيصال
                                                    </Button>
                                                ) : (
                                                    <span className="text-gray-500">لا يوجد</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(item.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleViewDetails(item)}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleExportInvoice(item)}
                                                    title="تصدير الفاتورة"
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

                        {/* Pagination */}
                        {sortedTransactions.length > 0 && (
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
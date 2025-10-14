import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye, Download, File, FileText, Image, Archive, Video, Music, FileQuestion } from "lucide-react"
import { getFiles, uploadFile, deleteFile, getCourses, getCourseLevels, updateFile, getFilesPost, getSpecializations } from "@/api/api"
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages"
import { BASE_URL } from "@/api/api"

const Files = () => {
    const [files, setFiles] = useState([])
    const [allFiles, setAllFiles] = useState([])
    const [specializations, setSpecializations] = useState([])
    const [courses, setCourses] = useState([])
    const [levels, setLevels] = useState([])
    const [selectedSpecialization, setSelectedSpecialization] = useState("")
    const [selectedCourse, setSelectedCourse] = useState("")
    const [selectedLevel, setSelectedLevel] = useState("")
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fileToUpload, setFileToUpload] = useState(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" })
    const [detailDialog, setDetailDialog] = useState({ isOpen: false, file: null })
    const [editDialog, setEditDialog] = useState({ isOpen: false, file: null, newFile: null })

    // Pagination & Filtering states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState("all")
    const [sortBy, setSortBy] = useState("createdAt")
    const [sortOrder, setSortOrder] = useState("desc")
    const [totalFiles, setTotalFiles] = useState(0)
    const [pagination, setPagination] = useState({})

    // دالة لتنظيف وتكوين مسار الملف
    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return ""
        const cleanBaseUrl = BASE_URL.replace(/\/$/, "")
        const cleanFileUrl = fileUrl.replace(/^\//, "")
        return `${cleanBaseUrl}/${cleanFileUrl}`
    }

    // جلب الاختصاصات
    const fetchSpecializations = async () => {
        try {
            const res = await getSpecializations();
            const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data :
                Array.isArray(res.data?.data) ? res.data.data : [];
            console.log("Specializations data:", data);
            setSpecializations(data);
        } catch (err) {
            console.error("Error fetching specializations:", err);
            showErrorToast("فشل تحميل الاختصاصات");
        }
    };

    // جلب الكورسات بناءً على الاختصاص المحدد
    const fetchCourses = async (specializationId) => {
        if (!specializationId) {
            setCourses([]);
            setSelectedCourse("");
            return;
        }

        try {
            const res = await getCourses();
            let allCourses = Array.isArray(res.data?.data?.items) ? res.data.data.items :
                Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
            
            // فلترة الكورسات حسب الاختصاص المحدد
            const filteredCourses = allCourses.filter(course => 
                course.specializationId === parseInt(specializationId)
            );
            
            console.log("Filtered courses:", filteredCourses);
            setCourses(filteredCourses);
        } catch (err) {
            console.error(err);
            showErrorToast("فشل تحميل الكورسات");
        }
    };

    // جلب مستويات الكورس المحدد
    const fetchCourseLevels = async (courseId) => {
        if (!courseId) {
            setLevels([])
            setSelectedLevel("")
            return
        }

        try {
            const res = await getCourseLevels(courseId)
            console.log("Full levels response:", res);
            
            let data = [];
            if (Array.isArray(res.data?.data)) {
                if (res.data.data.length > 0 && Array.isArray(res.data.data[0])) {
                    data = res.data.data[0];
                } else {
                    data = res.data.data;
                }
            } else if (Array.isArray(res.data?.data?.items)) {
                data = res.data.data.items;
            } else if (Array.isArray(res.data?.data?.data)) {
                data = res.data.data.data;
            }
            
            console.log("Levels data:", data);
            setLevels(data || []);
        } catch (err) {
            console.error("Error fetching levels:", err);
            showErrorToast("فشل تحميل مستويات الكورس");
            setLevels([]);
        }
    }

    // جلب الملفات
    const fetchFiles = async () => {
        if (!selectedLevel) {
            setAllFiles([])
            setTotalFiles(0)
            return
        }

        setLoading(true)
        try {
            const requestBody = {
                courseLevelId: Number(selectedLevel),
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm || undefined
            }

            // تنظيف البيانات - إزالة القيم undefined
            Object.keys(requestBody).forEach(key => {
                if (requestBody[key] === undefined) {
                    delete requestBody[key]
                }
            })

            console.log("📤 Fetching files with body:", requestBody)

            let res;
            
            try {
                res = await getFilesPost(requestBody);
                console.log("✅ POST request successful:", res);
            } catch (postError) {
                console.log("❌ POST failed, trying GET without courseLevelId...");
                const params = {
                    page: currentPage,
                    limit: itemsPerPage,
                    q: searchTerm || undefined
                }
                res = await getFiles(params);
            }

            console.log("📊 Files API response:", res)
            
            let data = []
            let total = 0
            let paginationData = {}
            
            if (res.data?.success) {
                if (Array.isArray(res.data.data)) {
                    data = res.data.data
                    total = res.data.data.length
                } else if (res.data.data?.data && Array.isArray(res.data.data.data)) {
                    data = res.data.data.data
                    total = res.data.data.pagination?.total || data.length
                    paginationData = res.data.data.pagination || {}
                } else if (Array.isArray(res.data.data)) {
                    data = res.data.data
                    total = data.length
                }
            } else if (Array.isArray(res.data)) {
                data = res.data
                total = data.length
            }
            
            setAllFiles(data || [])
            setTotalFiles(total || 0)
            setPagination(paginationData)
        } catch (err) {
            console.error("❌ Error fetching files:", err)
            console.error("❌ Error response:", err.response?.data)
            const errorMessage = err.response?.data?.message || "فشل تحميل الملفات"
            showErrorToast(errorMessage)
            setAllFiles([])
            setTotalFiles(0)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSpecializations()
    }, [])

    useEffect(() => {
        if (selectedSpecialization) {
            fetchCourses(selectedSpecialization)
            setSelectedCourse("")
            setSelectedLevel("")
        } else {
            setCourses([])
            setSelectedCourse("")
            setSelectedLevel("")
        }
    }, [selectedSpecialization])

    useEffect(() => {
        if (selectedCourse) {
            fetchCourseLevels(selectedCourse)
            setSelectedLevel("")
        } else {
            setLevels([])
            setSelectedLevel("")
        }
    }, [selectedCourse])

    useEffect(() => {
        if (selectedLevel) {
            fetchFiles()
        } else {
            setAllFiles([])
            setTotalFiles(0)
        }
    }, [selectedLevel, currentPage, itemsPerPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, typeFilter, itemsPerPage])

    // التعامل مع اختيار الملف للرفع
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setFileToUpload(file)
        }
    }

    // رفع الملف
    const handleUpload = async () => {
        if (!fileToUpload) return showErrorToast("يرجى اختيار ملف للرفع")
        if (!selectedLevel) return showErrorToast("يرجى اختيار المستوى أولاً")

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', fileToUpload)
            formData.append('courseLevelId', selectedLevel)

            console.log("📤 Uploading file:", fileToUpload.name)

            const res = await uploadFile(formData)
            console.log("📊 Upload response:", res)

            if (res.data?.success) {
                showSuccessToast(res.data.message || "تم رفع الملف بنجاح")
                setFileToUpload(null)
                setIsDialogOpen(false)
                fetchFiles()
            } else {
                throw new Error(res.data?.message || "فشل رفع الملف")
            }
        } catch (err) {
            console.error("❌ Upload error:", err.response?.data || err)
            const errorMessage = err.response?.data?.message || "فشل رفع الملف"
            showErrorToast(errorMessage)
        } finally {
            setUploading(false)
        }
    }

    // تعديل الملف
    const handleUpdateFile = async (fileId, updatedData) => {
        try {
            const formData = new FormData()
            
            if (updatedData.file) {
                formData.append('file', updatedData.file)
            }
            if (updatedData.courseLevelId) {
                formData.append('courseLevelId', updatedData.courseLevelId)
            }

            const res = await updateFile(fileId, formData)
            
            if (res.data?.success) {
                showSuccessToast(res.data.message || "تم تعديل الملف بنجاح")
                fetchFiles()
                return true
            } else {
                throw new Error(res.data?.message || "فشل تعديل الملف")
            }
        } catch (err) {
            console.error("❌ Update error:", err.response?.data || err)
            const errorMessage = err.response?.data?.message || "فشل تعديل الملف"
            showErrorToast(errorMessage)
            return false
        }
    }

    // حذف الملف
    const handleDelete = async (id) => {
        try {
            const res = await deleteFile(id)
            
            if (res.data?.success) {
                showSuccessToast(res.data.message || "تم حذف الملف بنجاح")
                fetchFiles()
            } else {
                throw new Error(res.data?.message || "فشل حذف الملف")
            }
        } catch (err) {
            console.error("❌ Delete error:", err.response?.data || err)
            const errorMessage = err.response?.data?.message || "فشل حذف الملف"
            showErrorToast(errorMessage)
        }
    }

    // الحصول على أيقونة الملف حسب النوع
    const getFileIcon = (fileType) => {
        if (!fileType) return <FileQuestion className="w-5 h-5" />
        
        if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />
        if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />
        if (fileType.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />
        if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
        if (fileType.includes('word') || fileType.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText className="w-5 h-5 text-green-600" />
        if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5 text-yellow-600" />
        
        return <File className="w-5 h-5 text-gray-500" />
    }

    // الحصول على نوع الملف بشكل مقروء
    const getFileTypeText = (fileType) => {
        if (!fileType) return "غير معروف"
        
        if (fileType.startsWith('image/')) return "صورة"
        if (fileType.startsWith('video/')) return "فيديو"
        if (fileType.startsWith('audio/')) return "صوت"
        if (fileType.includes('pdf')) return "PDF"
        if (fileType.includes('word') || fileType.includes('document')) return "مستند Word"
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return "جدول Excel"
        if (fileType.includes('zip') || fileType.includes('rar')) return "ملف مضغوط"
        
        return fileType
    }

    // تنسيق حجم الملف
    const formatFileSize = (size) => {
        if (!size) return "0 B"
        
        const units = ['B', 'KB', 'MB', 'GB']
        let sizeNumber = size
        let unitIndex = 0
        
        while (sizeNumber >= 1024 && unitIndex < units.length - 1) {
            sizeNumber /= 1024
            unitIndex++
        }
        
        return `${sizeNumber.toFixed(2)} ${units[unitIndex]}`
    }

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return "غير محدد"
        return new Date(dateString).toLocaleDateString('en-US')
    }

    // الحصول على اسم الكورس
    const getCourseName = (courseId) => {
        const course = courses.find(crs => crs.id === courseId)
        return course ? course.title : "غير محدد"
    }

    // الحصول على اسم المستوى
    const getLevelName = (levelId) => {
        const level = levels.find(lvl => lvl.id === levelId)
        return level ? level.name : "غير محدد"
    }

    // عرض التفاصيل الكاملة للملف - الدالة المفقودة
    const renderFileDetails = (file) => {
        if (!file) return null

        return (
            <div className="space-y-6 text-right">
                {/* المعلومات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="font-bold">اسم الملف:</Label>
                        <p className="mt-1 text-lg">{file.name}</p>
                    </div>
                    <div>
                        <Label className="font-bold">نوع الملف:</Label>
                        <p className="mt-1">
                            <Badge variant="outline">
                                {getFileTypeText(file.type)}
                            </Badge>
                        </p>
                    </div>
                    <div>
                        <Label className="font-bold">حجم الملف:</Label>
                        <p className="mt-1">{formatFileSize(file.size)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">تاريخ الرفع:</Label>
                        <p className="mt-1">{formatDate(file.createdAt)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">الكورس:</Label>
                        <p className="mt-1">{getCourseName(file.courseLevel?.courseId)}</p>
                    </div>
                    <div>
                        <Label className="font-bold">المستوى:</Label>
                        <p className="mt-1">{getLevelName(file.courseLevelId)}</p>
                    </div>
                </div>

                {/* رابط التحميل */}
                <div className="border-t pt-4">
                    <Label className="font-bold">رابط التحميل:</Label>
                    <div className="mt-2">
                        <a 
                            href={getFileUrl(file.url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                        >
                            {getFileUrl(file.url)}
                        </a>
                    </div>
                </div>

                {/* معلومات إضافية */}
                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">معلومات إضافية:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-medium">معرف الملف:</Label>
                            <p>{file.id || "غير محدد"}</p>
                        </div>
                        <div>
                            <Label className="font-medium">المفتاح:</Label>
                            <p className="font-mono text-sm">{file.key}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // مكون بطاقة الملف للعرض على الجوال - الدالة المفقودة
    const FileCard = ({ file }) => (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg truncate">{file.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                        {getFileTypeText(file.type)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {formatFileSize(file.size)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">المستوى:</span>
                            <span className="flex-1 truncate">{getLevelName(file.courseLevelId)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">التاريخ:</span>
                            <span>{formatDate(file.createdAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailDialog({ isOpen: true, file })}
                        className="flex-1"
                    >
                        <Eye className="w-4 h-4 ml-1" />
                        التفاصيل
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditDialog({ isOpen: true, file, newFile: null })}
                        className="flex-1"
                    >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getFileUrl(file.url), '_blank')}
                        className="flex-1"
                    >
                        <Download className="w-4 h-4 ml-1" />
                        تحميل
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({
                            isOpen: true,
                            itemId: file.id,
                            itemName: file.name || "بدون اسم"
                        })}
                        className="flex-1"
                    >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    // فلترة وترتيب البيانات
    const filteredAndSortedFiles = useMemo(() => {
        let filtered = [...allFiles]

        if (searchTerm.trim()) {
            filtered = filtered.filter(file =>
                file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.type?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(file => {
                if (typeFilter === "image") return file.type?.startsWith('image/')
                if (typeFilter === "video") return file.type?.startsWith('video/')
                if (typeFilter === "audio") return file.type?.startsWith('audio/')
                if (typeFilter === "document") return file.type?.includes('document') || file.type?.includes('pdf') || file.type?.includes('word')
                if (typeFilter === "archive") return file.type?.includes('zip') || file.type?.includes('rar')
                return true
            })
        }

        filtered.sort((a, b) => {
            let aValue, bValue

            switch (sortBy) {
                case "name":
                    aValue = a.name?.toLowerCase() || ""
                    bValue = b.name?.toLowerCase() || ""
                    break
                case "size":
                    aValue = a.size || 0
                    bValue = b.size || 0
                    break
                case "type":
                    aValue = a.type?.toLowerCase() || ""
                    bValue = b.type?.toLowerCase() || ""
                    break
                case "createdAt":
                    aValue = new Date(a.createdAt) || new Date(0)
                    bValue = new Date(b.createdAt) || new Date(0)
                    break
                default:
                    aValue = new Date(a.createdAt) || new Date(0)
                    bValue = new Date(b.createdAt) || new Date(0)
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
            return 0
        })

        return filtered
    }, [allFiles, searchTerm, typeFilter, sortBy, sortOrder])

    // Pagination calculations
    const totalItems = filteredAndSortedFiles.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

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

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <CardTitle>إدارة الملفات</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                disabled={!selectedLevel}
                                onClick={() => setFileToUpload(null)}
                            >
                                رفع ملف <Plus className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>رفع ملف جديد</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>اختر الملف *</Label>
                                    <Input
                                        type="file"
                                        onChange={handleFileSelect}
                                        accept="*/*"
                                    />
                                    {fileToUpload && (
                                        <div className="p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-center gap-2">
                                                {getFileIcon(fileToUpload.type)}
                                                <div>
                                                    <p className="font-medium">{fileToUpload.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatFileSize(fileToUpload.size)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button 
                                    onClick={handleUpload}
                                    disabled={!fileToUpload || uploading}
                                    className="w-full"
                                >
                                    {uploading ? "جاري الرفع..." : "رفع الملف"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* التصنيف الهرمي: اختصاص → كورس → مستوى */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* اختيار الاختصاص */}
                    <div className="space-y-2">
                        <Label>اختر الاختصاص</Label>
                        <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الاختصاص" />
                            </SelectTrigger>
                            <SelectContent>
                                {specializations.map((spec) => (
                                    <SelectItem key={spec.id} value={spec.id}>
                                        {spec.name || spec.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* اختيار الكورس */}
                    <div className="space-y-2">
                        <Label>اختر الكورس</Label>
                        <Select 
                            value={selectedCourse} 
                            onValueChange={setSelectedCourse}
                            disabled={!selectedSpecialization}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={selectedSpecialization ? "اختر الكورس" : "اختر الاختصاص أولاً"} />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* اختيار المستوى */}
                    <div className="space-y-2">
                        <Label>اختر المستوى</Label>
                        <Select 
                            value={selectedLevel} 
                            onValueChange={setSelectedLevel}
                            disabled={!selectedCourse}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={selectedCourse ? "اختر المستوى" : "اختر الكورس أولاً"} />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map((level) => (
                                    <SelectItem key={level.id} value={level.id}>
                                        {level.name} (ترتيب: {level.order})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filters Section - Only show when a level is selected */}
                {selectedLevel && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث باسم الملف أو النوع..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>

                            {/* Type Filter */}
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="فلترة بالنوع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الأنواع</SelectItem>
                                    <SelectItem value="image">الصور</SelectItem>
                                    <SelectItem value="video">الفيديوهات</SelectItem>
                                    <SelectItem value="audio">الصوتيات</SelectItem>
                                    <SelectItem value="document">المستندات</SelectItem>
                                    <SelectItem value="archive">الملفات المضغوطة</SelectItem>
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

                            {/* Sort By */}
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ترتيب حسب" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="createdAt">تاريخ الرفع</SelectItem>
                                    <SelectItem value="name">اسم الملف</SelectItem>
                                    <SelectItem value="size">الحجم</SelectItem>
                                    <SelectItem value="type">النوع</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Filters & Results Count */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                عرض {filteredAndSortedFiles.length} من أصل {allFiles.length} ملف
                                {(searchTerm || typeFilter !== "all") && ` (مفلتر)`}
                            </div>

                            {(searchTerm || typeFilter !== "all") && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setSearchTerm("")
                                    setTypeFilter("all")
                                    setCurrentPage(1)
                                }}>
                                    إعادة تعيين الفلترة
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </CardHeader>

            <CardContent>
                {!selectedLevel ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {!selectedSpecialization ? "يرجى اختيار اختصاص أولاً" : 
                         !selectedCourse ? "يرجى اختيار كورس أولاً" : 
                         "يرجى اختيار مستوى لعرض ملفاته"}
                    </div>
                ) : loading ? (
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
                                        <TableHead className="table-header">الملف</TableHead>
                                        <TableHead 
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("name")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الاسم
                                                {sortBy === "name" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("type")}
                                        >
                                            <div className="flex items-center gap-1">
                                                النوع
                                                {sortBy === "type" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("size")}
                                        >
                                            <div className="flex items-center gap-1">
                                                الحجم
                                                {sortBy === "size" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="table-header cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("createdAt")}
                                        >
                                            <div className="flex items-center gap-1">
                                                تاريخ الرفع
                                                {sortBy === "createdAt" && (
                                                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="table-header text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedFiles.length > 0 ? filteredAndSortedFiles.map(file => (
                                        <TableRow key={file.id}>
                                            <TableCell className="table-cell">
                                                {getFileIcon(file.type)}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <div className="font-medium">{file.name}</div>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                <Badge variant="outline">
                                                    {getFileTypeText(file.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {formatFileSize(file.size)}
                                            </TableCell>
                                            <TableCell className="table-cell">
                                                {formatDate(file.createdAt)}
                                            </TableCell>
                                            <TableCell className="table-cell text-right space-x-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDetailDialog({ isOpen: true, file })}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setEditDialog({ isOpen: true, file, newFile: null })}
                                                    title="تعديل الملف"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => window.open(getFileUrl(file.url), '_blank')}
                                                    title="تحميل الملف"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => setDeleteDialog({
                                                        isOpen: true,
                                                        itemId: file.id,
                                                        itemName: file.name || "بدون اسم"
                                                    })}
                                                    title="حذف الملف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                {allFiles.length === 0 ? "لا توجد ملفات لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards View - for small screens */}
                        <div className="block md:hidden">
                            {filteredAndSortedFiles.length > 0 ? (
                                filteredAndSortedFiles.map(file => (
                                    <FileCard key={file.id} file={file} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    {allFiles.length === 0 ? "لا توجد ملفات لهذا المستوى" : "لا توجد نتائج مطابقة للبحث"}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredAndSortedFiles.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    عرض {startItem} إلى {endItem} من {totalItems} ملف
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
                                            let pageNumber
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i
                                            } else {
                                                pageNumber = currentPage - 2 + i
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
                                            )
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
            <AlertDialog
                open={deleteDialog.isOpen}
                onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
            >
                <AlertDialogContent className="text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الملف؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف الملف "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row-reverse gap-2">
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                                await handleDelete(deleteDialog.itemId)
                                setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })
                            }}
                        >
                            حذف
                        </AlertDialogAction>
                        <AlertDialogCancel onClick={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: "" })}>
                            إلغاء
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* File Details Dialog */}
            <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog({ isOpen, file: null })}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تفاصيل الملف</DialogTitle>
                    </DialogHeader>
                    {renderFileDetails(detailDialog.file)}
                </DialogContent>
            </Dialog>

            {/* Edit File Dialog */}
            <Dialog open={editDialog.isOpen} onOpenChange={(isOpen) => setEditDialog({ isOpen, file: null, newFile: null })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>تعديل الملف</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label>اختر ملف جديد (اختياري)</Label>
                            <Input
                                type="file"
                                onChange={(e) => setEditDialog(prev => ({ ...prev, newFile: e.target.files?.[0] }))}
                                accept="*/*"
                            />
                            {editDialog.newFile && (
                                <div className="p-3 border rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        {getFileIcon(editDialog.newFile.type)}
                                        <div>
                                            <p className="font-medium">{editDialog.newFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatFileSize(editDialog.newFile.size)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button 
                            onClick={async () => {
                                const success = await handleUpdateFile(editDialog.file.id, {
                                    file: editDialog.newFile,
                                    courseLevelId: selectedLevel
                                })
                                if (success) {
                                    setEditDialog({ isOpen: false, file: null, newFile: null })
                                }
                            }}
                            className="w-full"
                        >
                            حفظ التعديلات
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default Files
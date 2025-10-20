import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search,BarChart3,Phone , ChevronLeft, ChevronRight, Eye, Trash2, Plus, Bell, Users, User, Send, Calendar, MessageCircle, Filter, RotateCcw, Image, Upload, X } from "lucide-react";
import { getNotifications, createNotification, createBroadcastNotification, createNotificationForUsers, deleteNotification } from "@/api/api";
import { getAllUsers } from "@/api/api";
import { showSuccessToast, showErrorToast } from "@/hooks/useToastMessages";
import { BASE_URL } from "@/api/api";
import { imageConfig } from "@/utils/corsConfig";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailDialog, setDetailDialog] = useState({ isOpen: false, notification: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemId: null, itemName: "" });
  const [createDialog, setCreateDialog] = useState({ isOpen: false, type: "single" });

  // نموذج إنشاء الإشعار
  const [notificationForm, setNotificationForm] = useState({
    type: "GENERAL",
    title: "",
    body: "",
    link: "",
    imageUrl: "",
    data: "",
    userId: "",
    userIds: []
  });

  // حالة لصورة الإشعار
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Pagination & Filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // أنواع الإشعارات المصححة
  const notificationTypes = [
    { value: "GENERAL", label: "عام", color: "default" },
    { value: "COURSE_NEW", label: "دورة جديدة", color: "default" },
    { value: "COURSE_UPDATE", label: "تحديث دورة", color: "outline" },
    { value: "LESSON_NEW", label: "درس جديد", color: "secondary" },
    { value: "QUIZ_AVAILABLE", label: "اختبار متاح", color: "default" },
    { value: "SYSTEM", label: "نظام", color: "secondary" }
  ];

  // دالة لتنظيف وتكوين مسار الصورة
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/tallaam_logo2.png";
    const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
    const cleanImageUrl = imageUrl.replace(/^\//, "");
    return `${cleanBaseUrl}/${cleanImageUrl}`;
  };

  // جلب جميع المستخدمين
  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      const data = Array.isArray(res.data?.data?.items) ? res.data.data.items :
        Array.isArray(res.data?.data?.data) ? res.data.data.data : [];
      setUsers(data);
    } catch (err) {
      console.error(err);
      showErrorToast("فشل تحميل المستخدمين");
    }
  };

  // جلب جميع الإشعارات
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // إزالة معاملات الصفحة من الـ params لأننا نريد جميع البيانات
      const params = {
        type: typeFilter !== "all" ? typeFilter : undefined,
        userId: userFilter !== "all" ? (userFilter === "null" ? null : userFilter) : undefined
      };

      const res = await getNotifications(params);
      console.log("Notifications API response:", res);

      let data = [];
      let total = 0;

      if (res.data?.data?.notifications) {
        data = Array.isArray(res.data.data.notifications) ? res.data.data.notifications : [];
        total = res.data.data.pagination?.total || data.length;
      } else if (Array.isArray(res.data?.data)) {
        data = res.data.data;
        total = data.length;
      } else if (Array.isArray(res.data?.data?.data)) {
        data = res.data.data.data;
        total = data.length;
      } else if (Array.isArray(res.data?.data?.items)) {
        data = res.data.data.items;
        total = data.length;
      }

      console.log(`✅ Loaded ${data.length} notifications`);
      setAllNotifications(data || []);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
      showErrorToast("فشل تحميل الإشعارات");
      setAllNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, userFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);



  // استخراج المستخدمين الفريدين من الإشعارات
  const uniqueUsersFromNotifications = useMemo(() => {
    const notificationUsers = allNotifications
      .map(notification => notification.user)
      .filter(user => user && user.id)
      .filter((user, index, self) =>
        self.findIndex(u => u.id === user.id) === index
      )
      .sort((a, b) => a.name?.localeCompare(b.name));
    return notificationUsers;
  }, [allNotifications]);

  // التعامل مع تغيير الصورة
  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // لا نضع imageUrl في النموذج، سنرسل الملف مباشرة
      setNotificationForm(prev => ({ ...prev, imageUrl: "" }));
    } else {
      setImageFile(null);
      setImagePreview(null);
      setNotificationForm(prev => ({ ...prev, imageUrl: "" }));
    }
  };

  // فلترة وترتيب البيانات
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = [...allNotifications];

    // البحث بالعنوان أو المحتوى
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          break;
        case "user":
          aValue = a.user?.name?.toLowerCase() || "";
          bValue = b.user?.name?.toLowerCase() || "";
          break;
        case "type":
          aValue = a.type?.toLowerCase() || "";
          bValue = b.type?.toLowerCase() || "";
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
  }, [allNotifications, searchTerm, sortBy, sortOrder]);

  // إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, userFilter, itemsPerPage]);

  // التعامل مع تغييرات نموذج الإنشاء
  const handleFormChange = (key, value) => {
    setNotificationForm(prev => ({ ...prev, [key]: value }));
  };

  // إضافة مستخدم للمستخدمين المتعددين
  const addUserToMultiple = (userId) => {
    if (!notificationForm.userIds.includes(userId)) {
      handleFormChange("userIds", [...notificationForm.userIds, userId]);
    }
  };

  // إزالة مستخدم من المستخدمين المتعددين
  const removeUserFromMultiple = (userId) => {
    handleFormChange("userIds", notificationForm.userIds.filter(id => id !== userId));
  };

  // إرسال الإشعار
  const handleSendNotification = async () => {
    if (!notificationForm.title.trim()) return showErrorToast("يرجى إدخال عنوان الإشعار");
    if (!notificationForm.body.trim()) return showErrorToast("يرجى إدخال محتوى الإشعار");

    try {
      let response;
      let requestData;

      // تحضير البيانات الأساسية
      const baseData = {
        title: notificationForm.title,
        body: notificationForm.body,
        type: notificationForm.type,
      };

      // إضافة الحقول الاختيارية فقط إذا كانت تحتوي على قيم
      if (notificationForm.link && notificationForm.link.trim()) {
        baseData.link = notificationForm.link.trim();
      }

      console.log("📤 Preparing notification data:", baseData);

      if (createDialog.type === "single") {
        if (!notificationForm.userId) return showErrorToast("يرجى اختيار مستخدم");

        requestData = {
          userId: parseInt(notificationForm.userId),
          ...baseData
        };

        console.log("📤 Sending single notification:", requestData);
        response = await createNotification(requestData);

      } else if (createDialog.type === "multiple") {
        if (!notificationForm.userIds.length) return showErrorToast("يرجى اختيار مستخدمين على الأقل");

        // إرسال كمصفوفة أرقام - هذا هو المهم!
        requestData = {
          userIds: notificationForm.userIds.map(id => parseInt(id)), // مصفوفة أرقام
          ...baseData
        };

        console.log("📤 Sending multiple notifications:", requestData);
        response = await createNotificationForUsers(requestData);

      } else if (createDialog.type === "broadcast") {
        requestData = baseData;
        console.log("📤 Sending broadcast notification:", requestData);
        response = await createBroadcastNotification(requestData);
      }

      showSuccessToast(response.data.message || "تم إرسال الإشعار بنجاح");

      // إعادة تعيين النموذج
      setNotificationForm({
        type: "GENERAL",
        title: "",
        body: "",
        link: "",
        imageUrl: "",
        data: "",
        userId: "",
        userIds: []
      });
      setImageFile(null);
      setImagePreview(null);
      setCreateDialog({ isOpen: false, type: "single" });
      fetchNotifications();
    } catch (err) {
      console.error("❌ Error sending notification:", err.response?.data || err);
      showErrorToast(err?.response?.data?.message || "فشل إرسال الإشعار");
    }
  };

  // دالة مساعدة لرفع الصورة
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // حذف الإشعار
  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      fetchNotifications();
      showSuccessToast("تم حذف الإشعار بنجاح");
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "فشل الحذف");
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString('en-US');
  };

  // الحصول على لون البادج حسب النوع
  const getTypeBadgeVariant = (type) => {
    const notificationType = notificationTypes.find(t => t.value === type);
    return notificationType?.color || "outline";
  };

  // الحصول على نص النوع
  const getTypeText = (type) => {
    const notificationType = notificationTypes.find(t => t.value === type);
    return notificationType?.label || type;
  };

  // حساب البيانات المعروضة في الصفحة الحالية
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedNotifications.slice(startIndex, endIndex);
  }, [filteredAndSortedNotifications, currentPage, itemsPerPage]);

  // Pagination calculations
  const totalItems = filteredAndSortedNotifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // التمرير للأعلى عند تغيير الصفحة
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // إعادة تعيين الصفحة عند تغيير الفلتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, userFilter, itemsPerPage]);

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
    setTypeFilter("all");
    setUserFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // دالة لحساب الوقت المنقضي
const calculateTimeAgo = (dateString) => {
  if (!dateString) return "غير محدد";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return "منذ يوم";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
  return `منذ ${Math.floor(diffDays / 365)} سنوات`;
};

// دالة لتحسين تنسيق التاريخ
// const formatDate = (dateString) => {
//   if (!dateString) return "غير محدد";
//   return new Date(dateString).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit'
//   });
// };

  // عرض التفاصيل الكاملة للإشعار
  const renderNotificationDetails = (notification) => {
    if (!notification) return null;

    return (
      <div className="space-y-6 text-right">
        {/* المعلومات الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="font-bold text-base">عنوان الإشعار:</Label>
              <p className="mt-1 text-lg font-semibold">{notification.title}</p>
            </div>

            <div>
              <Label className="font-bold text-base">محتوى الإشعار:</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                <p className="text-lg leading-relaxed">{notification.body}</p>
              </div>
            </div>

            <div>
              <Label className="font-bold text-base">المستخدم:</Label>
              {notification.user ? (
                <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">{notification.user.name}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{notification.user.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground">إشعار عام</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="font-bold text-base">نوع الإشعار:</Label>
              <div className="mt-2">
                <Badge variant={getTypeBadgeVariant(notification.type)}>
                  {getTypeText(notification.type)}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="font-bold text-base">تاريخ الإرسال:</Label>
              <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <p className="font-semibold">{formatDate(notification.createdAt)}</p>
              </div>
            </div>
{/* 
            {notification.link && (
              <div>
                <Label className="font-bold text-base">الرابط:</Label>
                <a
                  href={notification.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-blue-600 hover:underline break-all"
                >
                  {notification.link}
                </a>
              </div>
            )} */}

            {notification.imageUrl && (
              <div>
                <Label className="font-bold text-base">صورة الإشعار:</Label>
                <div className="mt-2">
                  <img
                    src={getImageUrl(notification.imageUrl)}
                    alt="صورة الإشعار"
                    className="max-w-full h-auto max-h-48 rounded-md border"
                    {...imageConfig}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/tallaam_logo2.png";
                    }}
                  />
                </div>
              </div>
            )}

            {/* <div>
              <Label className="font-bold text-base">معرف الإشعار:</Label>
              <p className="mt-1 font-mono bg-gray-100 p-2 rounded">{notification.id}</p>
            </div> */}
          </div>
        </div>

        {/* معلومات إضافية */}
        {/* {notification.data && (
          <div className="border-t pt-4">
            <h3 className="font-bold text-lg mb-3">البيانات الإضافية</h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(notification.data, null, 2)}
            </pre>
          </div>
        )} */}
      </div>
    );
  };

  // مكون البطاقة للعنصر الواحد
  const NotificationCard = ({ notification }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* العنوان والنوع */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-semibold">{notification.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getTypeBadgeVariant(notification.type)}>
                    {getTypeText(notification.type)}
                  </Badge>
                  {notification.user && (
                    <Badge variant="outline">
                      <User className="w-3 h-3 ml-1" />
                      {notification.user.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* المحتوى */}
          <div>
            <p className="text-gray-700 line-clamp-3">{notification.body}</p>
          </div>

          {/* صورة الإشعار إن وجدت */}
          {notification.imageUrl && (
            <div>
              <img
                src={getImageUrl(notification.imageUrl)}
                alt="صورة الإشعار"
                className="max-w-full h-auto max-h-32 rounded-md border"
                {...imageConfig}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/tallaam_logo2.png";
                }}
              />
            </div>
          )}

          {/* المعلومات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatDate(notification.createdAt)}</span>
            </div>
            {notification.link && (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">يحتوي على رابط</span>
              </div>
            )}
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-between gap-2 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDetailDialog({ isOpen: true, notification })}
              className="flex-1"
            >
              <Eye className="w-4 h-4 ml-1" />
              التفاصيل
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialog({
                isOpen: true,
                itemId: notification.id,
                itemName: notification.title
              })}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 ml-1" />
              حذف
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle>إدارة الإشعارات</CardTitle>
          <Dialog open={createDialog.isOpen} onOpenChange={(isOpen) => setCreateDialog({ ...createDialog, isOpen })}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setCreateDialog({ isOpen: true, type: "single" });
                  setNotificationForm({
                    type: "GENERAL",
                    title: "",
                    body: "",
                    link: "",
                    imageUrl: "",
                    data: "",
                    userId: "",
                    userIds: []
                  });
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                إرسال إشعار
                <Send className="w-4 h-4 ml-1" />
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-right">إرسال إشعار جديد</DialogTitle>
                <DialogDescription className="text-right">
                  اختر نوع الإرسال وأدخل بيانات الإشعار
                </DialogDescription>
              </DialogHeader>

              <Tabs value={createDialog.type} onValueChange={(value) => setCreateDialog({ ...createDialog, type: value })}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="single">مستخدم واحد</TabsTrigger>
                  <TabsTrigger value="multiple">مستخدمين محددين</TabsTrigger>
                  <TabsTrigger value="broadcast">جميع المستخدمين</TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>المستخدم *</Label>
                    <Select
                      value={notificationForm.userId}
                      onValueChange={(value) => handleFormChange("userId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} - {user.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="multiple" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>اختر المستخدمين *</Label>
                    <Select
                      value=""
                      onValueChange={addUserToMultiple}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستخدمين" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(user => !notificationForm.userIds.includes(user.id.toString()))
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} - {user.phone}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>

                    {/* عرض المستخدمين المختارين */}
                    {notificationForm.userIds.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-sm">المستخدمين المختارين ({notificationForm.userIds.length}):</Label>
                        <div className="flex flex-wrap gap-2">
                          {notificationForm.userIds.map(userId => {
                            const user = users.find(u => u.id.toString() === userId);
                            return user ? (
                              <Badge key={userId} variant="secondary" className="flex items-center gap-1 py-1">
                                {user.name}
                                <button
                                  type="button"
                                  onClick={() => removeUserFromMultiple(userId)}
                                  className="hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      يمكنك اختيار أكثر من مستخدم
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="broadcast" className="space-y-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        سيتم إرسال هذا الإشعار لجميع المستخدمين النشطين في النظام
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>نوع الإشعار *</Label>
                  <Select
                    value={notificationForm.type}
                    onValueChange={(value) => handleFormChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الإشعار" />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>عنوان الإشعار *</Label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    placeholder="أدخل عنوان الإشعار..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>محتوى الإشعار *</Label>
                  <Textarea
                    value={notificationForm.body}
                    onChange={(e) => handleFormChange("body", e.target.value)}
                    rows={4}
                    placeholder="أدخل محتوى الإشعار..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>رابط (اختياري)</Label>
                  <Input
                    value={notificationForm.link}
                    onChange={(e) => handleFormChange("link", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-image">صورة الإشعار (اختياري)</Label>
                  <Input
                    id="notification-image"
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="معاينة الصورة"
                        className="max-h-40 rounded-md border"
                        {...imageConfig}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/tallaam_logo2.png";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* <div className="space-y-2">
                  <Label>بيانات إضافية (JSON - اختياري)</Label>
                  <Textarea
                    value={notificationForm.data}
                    onChange={(e) => handleFormChange("data", e.target.value)}
                    rows={3}
                    placeholder='{"key": "value"}'
                  />
                  <p className="text-sm text-muted-foreground">
                    أدخل بيانات JSON صالحة لإضافة معلومات إضافية للإشعار
                  </p>
                </div> */}

                <Button onClick={handleSendNotification} className="w-full">
                  <Send className="w-4 h-4 ml-1" />
                  إرسال الإشعار
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في العناوين أو المحتوى..."
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
              {notificationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User Filter */}
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة بالمستخدم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستخدمين</SelectItem>
              <SelectItem value="null">إشعارات عامة</SelectItem>
              {uniqueUsersFromNotifications.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
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
              <SelectItem value="title">العنوان</SelectItem>
              <SelectItem value="user">المستخدم</SelectItem>
              <SelectItem value="type">النوع</SelectItem>
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
            عرض {startItem} إلى {endItem} من {totalItems} إشعار
            {(searchTerm || typeFilter !== "all" || userFilter !== "all") && ` (مفلتر)`}
          </div>

          {(searchTerm || typeFilter !== "all" || userFilter !== "all") && (
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
                    <TableHead
                      className="table-header cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-1">
                        العنوان
                        {sortBy === "title" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="table-header cursor-pointer hover:bg-gray-100"
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
                    <TableHead className="table-header">المحتوى</TableHead>
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
                  {paginatedNotifications.length > 0 ? paginatedNotifications.map(notification => (
                    <TableRow key={notification.id} className="hover:bg-gray-50">
                      <TableCell className="table-cell font-medium">
                        <div className="flex items-center gap-2">
                          {notification.imageUrl && (
                            <img
                              src={getImageUrl(notification.imageUrl)}
                              alt="صورة الإشعار"
                              className="w-8 h-8 rounded object-cover"
                              {...imageConfig}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          {notification.title}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell">
                        {notification.user ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {notification.user.name}
                          </div>
                        ) : (
                          <Badge variant="outline">عام</Badge>
                        )}
                      </TableCell>
                      <TableCell className="table-cell">
                        <Badge variant={getTypeBadgeVariant(notification.type)}>
                          {getTypeText(notification.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell max-w-xs">
                        <p className="truncate" title={notification.body}>
                          {notification.body}
                        </p>
                      </TableCell>
                      <TableCell className="table-cell">
                        {formatDate(notification.createdAt)}
                      </TableCell>
                      <TableCell className="table-cell text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDetailDialog({ isOpen: true, notification })}
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => setDeleteDialog({
                            isOpen: true,
                            itemId: notification.id,
                            itemName: notification.title
                          })}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        {allNotifications.length === 0 ? "لا توجد إشعارات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Cards View - for small screens */}
            <div className="block md:hidden">
              {paginatedNotifications.length > 0 ? (
                paginatedNotifications.map(notification => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {allNotifications.length === 0 ? "لا توجد إشعارات متاحة" : "لا توجد نتائج مطابقة للبحث"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {/* Pagination */}
            {filteredAndSortedNotifications.length > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  عرض {startItem} إلى {endItem} من {totalItems} إشعار
                  {(searchTerm || typeFilter !== "all" || userFilter !== "all") && ` (مفلتر)`}
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // عرض 5 صفحات فقط حول الصفحة الحالية
                        if (totalPages <= 7) return true;
                        return page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2);
                      })
                      .map((pageNumber, index, array) => {
                        // إضافة نقاط عندما تكون هناك فجوات
                        const showEllipsis = index > 0 && pageNumber - array[index - 1] > 1;

                        return (
                          <React.Fragment key={pageNumber}>
                            {showEllipsis && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNumber)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          </React.Fragment> 
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
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">هل أنت متأكد من حذف هذا الإشعار؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف الإشعار "{deleteDialog.itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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
      </AlertDialog>

      {/* Notification Details Dialog */}
<Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
  <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-gray-900 text-right">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          تفاصيل الإشعار
        </div>
      </DialogTitle>
    </DialogHeader>
    
    {detailDialog.notification && (
      <div className="space-y-6 text-right">
        {/* الهيدر مع المعلومات الأساسية */}
        <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* أيقونة الإشعار */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                {detailDialog.notification.imageUrl ? (
                  <img
                    src={getImageUrl(detailDialog.notification.imageUrl)}
                    alt="صورة الإشعار"
                    className="w-16 h-16 rounded-xl object-cover"
                    {...imageConfig}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/tallaam_logo2.png";
                    }}
                  />
                ) : (
                  <Bell className="w-10 h-10 text-blue-600" />
                )}
              </div>
              {/* شارة النوع */}
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                {getTypeText(detailDialog.notification.type).charAt(0)}
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {detailDialog.notification.title}
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={getTypeBadgeVariant(detailDialog.notification.type)} 
                      className="text-sm font-medium">
                  {getTypeText(detailDialog.notification.type)}
                </Badge>
                
                {detailDialog.notification.user ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    <User className="w-3 h-3 ml-1" />
                    {detailDialog.notification.user.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    <Users className="w-3 h-3 ml-1" />
                    إشعار عام
                  </Badge>
                )}
                
                {detailDialog.notification.link && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                    <MessageCircle className="w-3 h-3 ml-1" />
                    يحتوي على رابط
                  </Badge>
                )}
              </div>
              
              {/* معلومات سريعة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>أرسل في: {formatDate(detailDialog.notification.createdAt)}</span>
                </div>
                {detailDialog.notification.user && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span dir="ltr">{detailDialog.notification.user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* الشبكة الرئيسية للمعلومات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* محتوى الإشعار */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-l from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <MessageCircle className="w-5 h-5 text-green-600" />
                محتوى الإشعار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[120px]">
                <p className="text-gray-800 leading-relaxed text-lg">
                  {detailDialog.notification.body}
                </p>
              </div>
              
              {/* {detailDialog.notification.link && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">الرابط المصاحب</span>
                  </div>
                  <a
                    href={detailDialog.notification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all text-sm font-medium"
                  >
                    {detailDialog.notification.link}
                  </a>
                </div>
              )} */}
            </CardContent>
          </Card>

          {/* معلومات الإرسال */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-l from-purple-50 to-pink-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <Send className="w-5 h-5 text-purple-600" />
                معلومات الإرسال
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">تاريخ الإرسال</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900 block">{formatDate(detailDialog.notification.createdAt)}</span>
                    {/* <span className="text-xs text-gray-500">
                      {new Date(detailDialog.notification.createdAt).toLocaleTimeString('ar-SA')}
                    </span> */}
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">نوع المستلم</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {detailDialog.notification.user ? "مستخدم محدد" : "جميع المستخدمين"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">نوع الإشعار</span>
                  </div>
                  <Badge variant={getTypeBadgeVariant(detailDialog.notification.type)}>
                    {getTypeText(detailDialog.notification.type)}
                  </Badge>
                </div>
                
                {/* <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">معرف الإشعار</span>
                  </div>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                    {detailDialog.notification.id}
                  </span>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات المستخدم (إذا كان الإشعار لمستخدم محدد) */}
        {detailDialog.notification.user && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-l from-orange-50 to-amber-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <User className="w-5 h-5 text-orange-600" />
                معلومات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">اسم المستخدم</span>
                  <span className="font-medium text-gray-900">{detailDialog.notification.user.name}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">رقم الهاتف</span>
                  <span className="font-medium text-gray-900" dir="ltr">{detailDialog.notification.user.phone}</span>
                </div>
                
                {detailDialog.notification.user.email && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">البريد الإلكتروني</span>
                    <span className="font-medium text-gray-900">{detailDialog.notification.user.email}</span>
                  </div>
                )}
                
                {detailDialog.notification.user.role && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">الدور</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {detailDialog.notification.user.role}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* الإحصائيات السريعة */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 bg-gradient-to-l from-gray-50 to-slate-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              ملخص الإشعار
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">📱</div>
                <div className="text-sm font-medium text-gray-700 mt-1">النوع</div>
                <div className="text-lg font-bold text-gray-900">
                  {getTypeText(detailDialog.notification.type)}
                </div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">
                  {detailDialog.notification.user ? "👤" : "👥"}
                </div>
                <div className="text-sm font-medium text-gray-700 mt-1">المستلم</div>
                <div className="text-lg font-bold text-gray-900">
                  {detailDialog.notification.user ? "مفرد" : "جميع"}
                </div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-2xl font-bold text-purple-600">🕒</div>
                <div className="text-sm font-medium text-gray-700 mt-1">المدة</div>
                <div className="text-lg font-bold text-gray-900">
                  {calculateTimeAgo(detailDialog.notification.createdAt)}
                </div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="text-2xl font-bold text-orange-600">
                  {detailDialog.notification.link ? "🔗" : "📄"}
                </div>
                <div className="text-sm font-medium text-gray-700 mt-1">المحتوى</div>
                <div className="text-lg font-bold text-gray-900">
                  {detailDialog.notification.link ? "مع رابط" : "نص فقط"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أزرار الإجراءات */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          {/* {detailDialog.notification.link && (
            <Button
              variant="outline"
              onClick={() => window.open(detailDialog.notification.link, '_blank')}
              className="flex items-center gap-2 flex-1"
            >
              <Send className="w-4 h-4" />
              زيارة الرابط
            </Button>
          )} */}
          
          <Button
            variant="outline"
            onClick={() => {
              // إعادة إرسال الإشعار أو نسخ المحتوى
              navigator.clipboard.writeText(detailDialog.notification.body);
              showSuccessToast("تم نسخ محتوى الإشعار");
            }}
            className="flex items-center gap-2 flex-1"
          >
            <MessageCircle className="w-4 h-4" />
            نسخ المحتوى
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteDialog({
                isOpen: true,
                itemId: detailDialog.notification.id,
                itemName: detailDialog.notification.title
              });
              setDetailDialog({ isOpen: false, notification: null });
            }}
            className="flex items-center gap-2 flex-1"
          >
            <Trash2 className="w-4 h-4" />
            حذف الإشعار
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </Card>
  );
};

export default Notifications;
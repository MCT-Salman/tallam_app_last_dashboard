// src\components\auth\LogoutButton.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LogoutButton({ variant = "ghost", size = "icon", className = "" }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // عرض رسالة تأكيد في وسط الشاشة
    toast("هل أنت متأكد من تسجيل الخروج؟", {
      position: "top-center", // عرض في وسط الشاشة
      action: {
        label: "تسجيل الخروج",
        onClick: () => {
          logout();
          navigate("/login", { replace: true });
          toast.success("تم تسجيل الخروج بنجاح", {
            position: "top-center" // عرض رسالة النجاح في الوسط أيضاً
          });
        },
      },
      cancel: {
        label: "إلغاء",
        onClick: () => {},
      },
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 ml-2" />
            <span>تسجيل الخروج</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>تسجيل الخروج</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Specialization from "./Specialization";
import Instructor from "./Instructor";
import Course from "./Course";
import CourseLevel from "./CourseLevel";
import Lesson from "./Lesson";
import Files from "./Files";
import Quizzes from "./Quizzes";

const Courses = () => {
  const [activeTab, setActiveTab] = useState("Specialization");

  const tabs = [
    { value: "Specialization", label: "الاختصاص" },
    { value: "Instructor", label: "المدرسين" },
    { value: "Course", label: "المواد" },
    { value: "CourseLevel", label: "المستويات" },
    { value: "Lesson", label: "الدروس" },
    { value: "File", label: "الملفات" },
    { value: "Quiz", label: "الاختبارات" }
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-center text-foreground">
        إدارة الكورسات
      </h1>

      {/* للشاشات الصغيرة - قائمة منسدلة */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر قسم" />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        {/* للشاشات المتوسطة والكبيرة - تبويبات عادية */}
        <TabsList className="hidden md:grid md:grid-cols-7 gap-2 bg-muted rounded-lg p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* محتوى التبويبات */}
        <div className="mt-3 md:mt-4 bg-background rounded-lg p-3 md:p-4 shadow-sm">
          <TabsContent value="Specialization" className="space-y-3 md:space-y-4">
            <Specialization />
          </TabsContent>
          <TabsContent value="Instructor" className="space-y-3 md:space-y-4">
            <Instructor />
          </TabsContent>
          <TabsContent value="Course" className="space-y-3 md:space-y-4">
            <Course />
          </TabsContent>
          <TabsContent value="CourseLevel" className="space-y-3 md:space-y-4">
            <CourseLevel />
          </TabsContent>
          <TabsContent value="Lesson" className="space-y-3 md:space-y-4">
            <Lesson />
          </TabsContent>
          <TabsContent value="File" className="space-y-3 md:space-y-4">
            <Files />
          </TabsContent>
          <TabsContent value="Quiz" className="space-y-3 md:space-y-4">
            <Quizzes />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Courses;
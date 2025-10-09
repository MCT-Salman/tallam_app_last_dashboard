import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Specialization from "./Specialization";
import Instructor from "./Instructor";
import Course from "./Course";
import CourseLevel from "./CourseLevel";
import Lesson from "./Lesson";

const Courses = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center text-foreground">
        إدارة الكورسات
      </h1>

      <Tabs className="w-full" defaultValue="Specialization" dir="rtl">
        {/* قائمة التبويبات */}
        <TabsList className="grid grid-cols-5 gap-2 bg-muted rounded-lg p-1">
          <TabsTrigger
            value="Specialization"
            className="transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            الاختصاص
          </TabsTrigger>
          <TabsTrigger
            value="Instructor"
            className="transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            المدرسين
          </TabsTrigger>
          <TabsTrigger
            value="Course"
            className="transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            المواد
          </TabsTrigger>
          <TabsTrigger
            value="CourseLevel"
            className="transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            المستويات
          </TabsTrigger>
          <TabsTrigger
            value="Lesson"
            className="transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            الدروس
          </TabsTrigger>
        </TabsList>

        {/* محتوى التبويبات */}
        <div className="mt-4 bg-background rounded-lg p-4 shadow-sm">
          <TabsContent value="Specialization" className="space-y-4">
            <Specialization />
          </TabsContent>
          <TabsContent value="Instructor" className="space-y-4">
            <Instructor />
          </TabsContent>
          <TabsContent value="Course" className="space-y-4">
            <Course />
          </TabsContent>
          <TabsContent value="CourseLevel" className="space-y-4">
            <CourseLevel />
          </TabsContent>
          <TabsContent value="Lesson" className="space-y-4">
            <Lesson />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Courses;

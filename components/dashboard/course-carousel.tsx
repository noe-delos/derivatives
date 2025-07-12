/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";
import { CoursePreviewCard } from "@/components/course-preview-card";

interface Course {
  id: string;
  title: string;
  description: string;
  picture_url: string;
  difficulty: string;
  category: {
    name: string;
  };
  created_at: string;
  _count?: {
    course_modules: number;
    course_registrations: number;
  };
  is_registered?: boolean;
  progress?: number;
}

export function CourseCarousel() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: coursesData } = await supabase
      .from("courses")
      .select(
        `
        *,
        category:categories(name),
        course_registrations(user_id),
        course_modules(id)
      `
      )
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (coursesData && user) {
      // Check user registration and calculate progress
      const coursesWithProgress = await Promise.all(
        coursesData.map(async (course) => {
          const isRegistered = course.course_registrations?.some(
            (reg: any) => reg.user_id === user.id
          );

          let progress = 0;
          if (isRegistered) {
            const { data: modules } = await supabase
              .from("course_modules")
              .select("id")
              .eq("course_id", course.id);

            if (modules) {
              const { data: completedModules } = await supabase
                .from("module_progress")
                .select("id")
                .eq("user_id", user.id)
                .eq("completed", true)
                .in(
                  "module_id",
                  modules.map((m) => m.id)
                );

              progress =
                modules.length > 0
                  ? Math.round(
                      ((completedModules?.length || 0) / modules.length) * 100
                    )
                  : 0;
            }
          }

          return {
            ...course,
            is_registered: isRegistered,
            progress,
            _count: {
              course_modules: course.course_modules?.length || 0,
              course_registrations: course.course_registrations?.length || 0,
            },
          };
        })
      );

      setCourses(coursesWithProgress);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex-shrink-0 w-80 cursor-pointer"
            onClick={() => router.push(`/courses/${course.id}`)}
          >
            <CoursePreviewCard
              course={course}
              userProgress={course.progress || 0}
              completionRate={course.is_registered ? course.progress || 0 : 0}
              isDisabled={!course.is_registered}
              className="h-full"
            />
          </div>
        ))}
      </div>
      {/* Gradient overlay for scroll indication */}
      <div className="absolute right-0 top-0 bottom-4 w-24 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
    </div>
  );
}

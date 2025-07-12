"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { DashboardNavigator } from "@/components/dashboard/dashboard-navigator";
import { CoursePreviewCard } from "@/components/course-preview-card";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  title: string;
  description: string;
  category_id: string;
  picture_url: string | null;
  difficulty: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
  category?: { name: string };
  _count?: {
    course_modules: number;
    course_registrations: number;
  };
}

interface EnrolledCourse extends Course {
  progress: number;
  nextModule?: {
    name: string;
    type: 'video' | 'file' | 'quiz';
    estimatedTime?: number;
  };
}

interface UserData {
  day_streak: number;
  subscription_type: "free" | "premium_800" | "premium_2000";
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'difficulty'>('date');
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        // Load user data
        const { data: profileData } = await supabase
          .from("users")
          .select("day_streak, subscription_type")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setUserData(profileData);
        }

        // Load all courses with category info and counts
        const { data: coursesData } = await supabase
          .from("courses")
          .select(`
            *,
            category:categories(name),
            course_modules(id),
            course_registrations(user_id)
          `)
          .eq("is_published", true)
          .order("order_index", { ascending: true });

        if (coursesData) {
          // Format courses with counts
          const formattedCourses = coursesData.map(course => ({
            ...course,
            _count: {
              course_modules: course.course_modules?.length || 0,
              course_registrations: course.course_registrations?.length || 0
            }
          }));
          setCourses(formattedCourses);

          // Get enrolled courses with progress
          const enrolledCoursesData = await Promise.all(
            formattedCourses
              .filter(course => 
                course.course_registrations?.some((reg: any) => reg.user_id === user.id)
              )
              .map(async (course) => {
                // Get progress
                const { data: modules } = await supabase
                  .from("course_modules")
                  .select(`
                    id,
                    name,
                    order_index,
                    estimated_time_minutes,
                    module_content(content_type)
                  `)
                  .eq("course_id", course.id)
                  .order("order_index");

                let progress = 0;
                let nextModule = null;

                if (modules && modules.length > 0) {
                  const { data: completedModules } = await supabase
                    .from("module_progress")
                    .select("module_id")
                    .eq("user_id", user.id)
                    .eq("completed", true)
                    .in("module_id", modules.map(m => m.id));

                  const completedCount = completedModules?.length || 0;
                  progress = Math.round((completedCount / modules.length) * 100);

                  // Find next module
                  const completedIds = completedModules?.map(m => m.module_id) || [];
                  const nextModuleData = modules.find(m => !completedIds.includes(m.id));
                  
                  if (nextModuleData) {
                    nextModule = {
                      name: nextModuleData.name,
                      type: nextModuleData.module_content?.[0]?.content_type || 'file',
                      estimatedTime: nextModuleData.estimated_time_minutes
                    };
                  }
                }

                return {
                  ...course,
                  progress,
                  nextModule
                } as EnrolledCourse;
              })
          );

          setEnrolledCourses(enrolledCoursesData.filter(c => c.progress < 100));
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter courses based on status
  const getFilteredCourses = () => {
    let filtered = courses;

    // Status filter
    if (statusFilter === 'not_started') {
      filtered = courses.filter(course => 
        !enrolledCourses.some(ec => ec.id === course.id)
      );
    } else if (statusFilter === 'in_progress') {
      filtered = courses.filter(course => 
        enrolledCourses.some(ec => ec.id === course.id && ec.progress > 0 && ec.progress < 100)
      );
    } else if (statusFilter === 'completed') {
      filtered = courses.filter(course => 
        enrolledCourses.some(ec => ec.id === course.id && ec.progress === 100)
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'difficulty') {
      const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      filtered.sort((a, b) => 
        (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 999) - 
        (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 999)
      );
    }

    return filtered;
  };

  const filteredCourses = getFilteredCourses();

  const canAccessCourse = (course: Course, index: number) => {
    if (userData?.subscription_type === "premium_800" || userData?.subscription_type === "premium_2000") {
      return true;
    }
    return index === 0; // Only first course is free
  };

  if (loading) {
    return (
      <div className="space-y-0">
        <div className="-mx-6 -mt-6">
          <DashboardNavigator dayStreak={0} />
        </div>
        <div className="flex items-center justify-center h-96">
          <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Dashboard Navigator */}
      <div className="-mx-6 -mt-6">
        <DashboardNavigator dayStreak={userData?.day_streak || 0} />
      </div>
      
      <div className="space-y-8 pt-6">
        {/* Continue Section - Only show if there are enrolled courses */}
        {enrolledCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('courses.continue')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledCourses.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="cursor-pointer"
                >
                  <CoursePreviewCard
                    course={course}
                    mode="horizontal"
                    userProgress={course.progress}
                    nextModule={course.nextModule}
                    onContinue={() => router.push(`/courses/${course.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Courses Section */}
        <section>
          {/* Header with filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{t('courses.allCourses')}</h2>
              <Badge variant="secondary" className="rounded-full">
                {filteredCourses.length}
              </Badge>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Status Filters */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('all')}
                >
                  {t('courses.all')}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'not_started' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('not_started')}
                >
                  {t('courses.notStarted')}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'in_progress' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('in_progress')}
                >
                  {t('courses.inProgress')}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'completed' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('completed')}
                >
                  {t('courses.completed')}
                </Button>
              </div>

              {/* Search and Sort */}
              <div className="flex gap-2 ml-auto">
                <div className="relative">
                  <Icon 
                    icon="mdi:magnify" 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  />
                  <Input
                    placeholder={t('courses.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('courses.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t('courses.sortByDate')}</SelectItem>
                    <SelectItem value="name">{t('courses.sortByName')}</SelectItem>
                    <SelectItem value="difficulty">{t('courses.sortByDifficulty')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course, index) => {
              const isAccessible = canAccessCourse(course, index);
              const isEnrolled = enrolledCourses.some(ec => ec.id === course.id);
              const enrolledCourse = enrolledCourses.find(ec => ec.id === course.id);
              
              return (
                <div
                  key={course.id}
                  onClick={() => isAccessible && router.push(`/courses/${course.id}`)}
                  className={isAccessible ? "cursor-pointer" : ""}
                >
                  <CoursePreviewCard
                    course={course}
                    userProgress={enrolledCourse?.progress || 0}
                    completionRate={enrolledCourse?.progress || 0}
                    isDisabled={!isAccessible}
                    className="h-full"
                  />
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <Icon 
                icon="mdi:book-open-variant" 
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('courses.noCourses')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('courses.tryDifferentFilter')}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
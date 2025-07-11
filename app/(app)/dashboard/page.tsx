"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { DashboardNavigator } from "@/components/dashboard/dashboard-navigator";
import { CourseCarousel } from "@/components/dashboard/course-carousel";
import { Objectives } from "@/components/dashboard/objectives";
import { createClient } from "@/lib/supabase/client";

interface UserData {
  first_name: string | null;
  last_name: string | null;
  day_streak: number;
  subscription_type: "free" | "premium_800" | "premium_2000";
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userProgress, setUserProgress] = useState({
    coursesCompleted: 0,
    totalCourses: 0,
    hoursLearned: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Get user profile data
        const { data: profileData } = await supabase
          .from("users")
          .select("first_name, last_name, day_streak, subscription_type")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setUserData(profileData);
        }

        // Get user progress data
        const { data: registrations } = await supabase
          .from("course_registrations")
          .select(
            `
            course_id,
            courses(
              title,
              course_modules(
                id,
                estimated_time_minutes,
                module_progress(completed)
              )
            )
          `
          )
          .eq("user_id", user.id);

        let coursesCompleted = 0;
        let totalCourses = registrations?.length || 0;
        let hoursLearned = 0;

        registrations?.forEach((reg) => {
          const modules = reg.courses?.course_modules || [];
          const completedModules = modules.filter(
            (module) => module.module_progress?.[0]?.completed
          );

          if (
            completedModules.length === modules.length &&
            modules.length > 0
          ) {
            coursesCompleted++;
          }

          hoursLearned += completedModules.reduce(
            (acc, module) => acc + (module.estimated_time_minutes || 0),
            0
          );
        });

        setUserProgress({
          coursesCompleted,
          totalCourses,
          hoursLearned: Math.round(hoursLearned / 60), // Convert to hours
        });

        // Update last login and calculate streak
        const today = new Date().toISOString().split("T")[0];
        await supabase
          .from("users")
          .update({ last_login_date: today })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.goodMorning");
    if (hour < 18) return t("dashboard.goodAfternoon");
    return t("dashboard.goodEvening");
  };

  const userName =
    userData?.first_name || userData?.last_name || t("dashboard.learner");
  const progressPercentage =
    userProgress.totalCourses > 0
      ? Math.round(
          (userProgress.coursesCompleted / userProgress.totalCourses) * 100
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon
          icon="mdi:loading"
          className="h-8 w-8 animate-spin text-gray-500"
        />
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

        {/* Main Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Video/Image Section */}
          <div className="lg:col-span-3 aspect-video rounded-3xl shadow-soft overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              className="w-full h-full object-cover"
              src="/dashboard.png"
              alt="Derivatives Presentation"
            />
          </div>

          {/* Objectives Section */}
          <div className="lg:col-span-2">
            <Objectives />
          </div>
        </div>

      {/* Courses Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          {t("courses.allCourses")}
        </h2>
        <CourseCarousel />
      </section>
      </div>
    </div>
  );
}

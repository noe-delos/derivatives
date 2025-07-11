"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { DashboardNavigator } from "@/components/dashboard/dashboard-navigator";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  picture_url: string | null;
  difficulty: string;
  is_published: boolean;
  order_index: number;
}

interface UserData {
  day_streak: number;
  subscription_type: "free" | "premium_800" | "premium_2000";
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [registeredCourses, setRegisteredCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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

        // Load courses
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .eq("is_published", true)
          .order("order_index", { ascending: true });

        if (coursesData) {
          setCourses(coursesData);
        }

        // Load registered courses
        const { data: registrationsData } = await supabase
          .from("course_registrations")
          .select("course_id")
          .eq("user_id", user.id);

        if (registrationsData) {
          setRegisteredCourses(registrationsData.map(reg => reg.course_id));
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  const isFirstCourse = (index: number) => index === 0;
  const canAccessCourse = (index: number) => {
    if (userData?.subscription_type === "premium_800" || userData?.subscription_type === "premium_2000") {
      return true;
    }
    return isFirstCourse(index);
  };

  if (loading) {
    return (
      <div className="space-y-0">
        <div className="-mx-6 -mt-6">
          <DashboardNavigator dayStreak={0} />
        </div>
        <div className="flex items-center justify-center h-96">
          <Icon
            icon="mdi:loading"
            className="h-8 w-8 animate-spin text-gray-500"
          />
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
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tous les cours
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Découvrez nos formations complètes en finance et trading
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {courses.map((course, index) => {
            const isAccessible = canAccessCourse(index);
            const isRegistered = registeredCourses.includes(course.id);
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-card transition-all cursor-pointer group",
                  isAccessible ? "hover:shadow-lg hover:-translate-y-1" : "opacity-60",
                )}
              >
                {/* Image Banner */}
                <div className="relative h-32 w-full overflow-hidden p-2">
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-gray-50">
                    <Image
                      src={course.picture_url || "/default-course.png"}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/default-course.png'
                      }}
                    />
                    {!isAccessible && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <Icon 
                          icon="mdi:lock" 
                          className="h-6 w-6 text-white"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Category Badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-5 left-5 bg-foreground/80 text-background backdrop-blur-sm rounded-full px-2 py-1 text-xs"
                  >
                    {course.category}
                  </Badge>
                  
                  {/* Registration Status */}
                  {isRegistered && isAccessible && (
                    <Badge className="absolute top-5 right-5 bg-green-500 hover:bg-green-600 text-xs px-2 py-1 rounded-full">
                      <Icon icon="mdi:check" className="h-3 w-3 mr-1" />
                      Inscrit
                    </Badge>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex items-center gap-2">
                    <Badge className="py-1 px-2 rounded-full bg-muted text-muted-foreground border-none text-xs">
                      {course.difficulty}
                    </Badge>
                  </div>
                  
                  {/* Action Button */}
                  <div className="pt-2">
                    {isAccessible ? (
                      <Link href={`/courses/${course.id}`}>
                        <Button 
                          size="sm" 
                          className="w-full text-xs h-8 rounded-full" 
                          variant={isRegistered ? "default" : "outline"}
                        >
                          {isRegistered ? (
                            <>
                              <Icon icon="mdi:play" className="h-3 w-3 mr-2" />
                              Continuer
                            </>
                          ) : (
                            <>
                              <Icon icon="mdi:eye" className="h-3 w-3 mr-2" />
                              Voir le cours
                            </>
                          )}
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        size="sm"
                        className="w-full text-xs h-8 rounded-full" 
                        variant="outline" 
                        disabled
                      >
                        <Icon icon="mdi:lock" className="h-3 w-3 mr-2" />
                        Premium requis
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-12">
            <Icon 
              icon="mdi:book-open-variant" 
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun cours disponible
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Les cours seront bientôt disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
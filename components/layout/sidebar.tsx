"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { createClient } from "@/lib/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Course {
  id: string;
  title: string;
  is_published: boolean;
  picture_url: string | null;
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const supabase = createClient();

  const shouldShowText = !isCollapsed;

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, is_published, picture_url")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error loading courses:", error);
      } else {
        setCourses(data || []);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    {
      title: t("courses.courses"),
      items: loading
        ? []
        : courses.map((course) => ({
            name: course.title,
            href: `/courses/${course.id}`,
            icon: "mdi:book-open-page-variant",
          })),
    },
    {
      title: t("common.community"),
      items: [
        { name: t("common.reviews"), href: "/reviews", icon: "mdi:star" },
        { name: t("common.discord"), href: "/discord", icon: "mdi:discord" },
      ],
    },
    {
      title: t("common.general"),
      items: [
        { name: t("common.profile"), href: "/profile", icon: "mdi:account" },
        { name: t("common.settings"), href: "/settings", icon: "mdi:cog" },
      ],
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative flex h-full w-full flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
          className
        )}
      >
        <div className="flex h-14 items-center justify-between px-3 mb-4">
          <div
            className={cn(
              "flex w-full",
              shouldShowText ? "justify-start" : "justify-center"
            )}
          >
            {isCollapsed ? (
              <div
                className="relative flex items-center justify-center cursor-pointer"
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                onClick={toggleSidebar}
              >
                {isLogoHovered ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Icon icon="mdi:chevron-right" className="h-4 w-4" />
                  </Button>
                ) : (
                  <img
                    src="/logo-small.png"
                    alt="Derivatives Logo"
                    className="h-6 w-6 transition-all"
                  />
                )}
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 transition-all"
              >
                <img
                  src="/logo.png"
                  alt="Derivatives Logo"
                  className="h-8 w-auto transition-all"
                />
              </Link>
            )}
          </div>
          {shouldShowText && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
            >
              <Icon
                icon={isCollapsed ? "mdi:chevron-right" : "mdi:chevron-left"}
                className="h-4 w-4"
              />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className={cn("space-y-4 py-3", !shouldShowText && "space-y-3")}>
            {navItems.map((section, sectionIndex) => (
              <div key={section.title}>
                {shouldShowText && (
                  <>
                    {sectionIndex > 0 && (
                      <div className="mx-2 mb-3 border-t px-4 border-gray-100 dark:border-gray-800" />
                    )}
                    <h3 className="mb-2 px-2 ml-2 text-xs font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const linkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg py-2 text-sm text-gray-700 dark:text-gray-300 transition-all",
                          "hover:bg-gray-100 dark:hover:bg-gray-800/50",
                          isActive &&
                            "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
                          shouldShowText
                            ? "px-2 ml-4"
                            : "justify-center px-1.5 py-1.5"
                        )}
                      >
                        <Icon
                          icon={item.icon}
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isActive && "text-blue-600 dark:text-blue-400"
                          )}
                        />
                        {shouldShowText && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </Link>
                    );

                    if (!shouldShowText) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return linkContent;
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-gray-200 dark:border-gray-800 p-2">
          <div className="space-y-2">
            {!shouldShowText ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/progression"
                    className={cn(
                      "flex items-center justify-center rounded-lg px-1.5 py-1.5 text-gray-700 dark:text-gray-300 transition-all",
                      "hover:bg-gray-100 dark:hover:bg-gray-800/50",
                      pathname === "/progression" &&
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    )}
                  >
                    <Icon
                      icon="mdi:chart-timeline-variant"
                      className="h-4 w-4"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {t("common.progression")}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/progression"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 ml-4 text-sm text-gray-700 dark:text-gray-300 transition-all",
                  "hover:bg-gray-100 dark:hover:bg-gray-800/50",
                  pathname === "/progression" &&
                    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                )}
              >
                <Icon
                  icon="mdi:chart-timeline-variant"
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    pathname === "/progression" &&
                      "text-blue-600 dark:text-blue-400"
                  )}
                />
                <span className="text-sm">{t("common.progression")}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

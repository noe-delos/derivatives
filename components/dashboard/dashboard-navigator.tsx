"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  href: string;
  icon?: string;
}

interface DashboardNavigatorProps {
  dayStreak: number;
}

export function DashboardNavigator({ dayStreak }: DashboardNavigatorProps) {
  const pathname = usePathname();

  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      name: t("dashboard.home"),
      href: "/dashboard",
      icon: "material-symbols:home-rounded",
    },
    {
      name: t("common.courses"),
      href: "/dashboard/courses",
      icon: "majesticons:book",
    },
    {
      name: t("common.quizzes"),
      href: "/dashboard/quizz",
      icon: "streamline:controller-1-solid",
    },
    {
      name: t("common.progression"),
      href: "/dashboard/progression",
      icon: "ri:progress-5-fill",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getStreakIcon = () => {
    if (dayStreak >= 7) return "/fire.png";
    return "/ice.png";
  };

  return (
    <div className="w-full border-b">
      <div className="flex items-center justify-between">
        <nav className="flex h-12 items-center space-x-6 lg:space-x-8 px-4 lg:px-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground/80",
                isActive(item.href)
                  ? "font-bold text-foreground"
                  : "text-foreground/60"
              )}
            >
              {item.icon && <Icon icon={item.icon} className="h-4 w-4" />}
              {item.name}
              {isActive(item.href) && (
                <span className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm font-medium cursor-help px-4 lg:px-6">
                <img
                  src={getStreakIcon()}
                  alt={dayStreak >= 7 ? "Fire" : "Ice"}
                  className="h-7 w-5"
                />
                <span>{dayStreak}</span>
                <span className="text-muted-foreground">days</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your current streak: {dayStreak} days</p>
              <p className="text-xs text-muted-foreground">
                {dayStreak >= 7
                  ? "You're on fire! Keep it up!"
                  : "Keep going to reach your fire streak!"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

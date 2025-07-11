"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DayStreakProps {
  currentStreak: number;
}

export function DayStreak({ currentStreak }: DayStreakProps) {
  const { t } = useTranslation();

  // Determine if user is on a streak or has broken it
  const isOnStreak = currentStreak > 0;
  const theme = isOnStreak ? "fire" : "ice";

  // Get days of the week in French
  const daysOfWeek = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];
  const today = new Date().getDay();

  // Generate last 7 days streak status (mock data for demonstration)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dayIndex = (today - 6 + i + 7) % 7;
    const isToday = i === 6;
    const hasStreak = isOnStreak && (currentStreak >= 7 - i || isToday);
    return {
      day: daysOfWeek[dayIndex],
      hasStreak,
      isToday,
    };
  });

  // Calculate hours left in day
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursLeft = Math.ceil(
    (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)
  );

  return (
    <motion.div
      className="h-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="p-8 space-y-8 bg-background shadow-soft rounded-3xl">
        {/* Main streak display */}
        <motion.div
          className="text-center space-y-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          {/* Fire/Ice icon */}
          <motion.div
            className="relative"
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <img
              src={isOnStreak ? "/fire.png" : "/ice.png"}
              alt={theme}
              className={cn(
                "w-auto h-[4rem] mx-auto",
                !isOnStreak && "w-[2.5rem]"
              )}
            />
          </motion.div>

          {/* Streak number */}
          <motion.div
            className="relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.5,
              type: "spring",
              bounce: 0.3,
            }}
          >
            <span
              className={cn(
                "text-6xl font-bold rounded-full",
                !isOnStreak &&
                  "bg-gradient-to-b from-[#99E0FE] to-[#1AAEF5] bg-clip-text text-transparent"
              )}
              style={isOnStreak ? { color: "#FF6B35" } : undefined}
            >
              {currentStreak}
            </span>
          </motion.div>

          {/* "day streak" text */}
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            {t("dashboard.dayStreak")}
          </motion.p>
        </motion.div>

        {/* Last 7 days */}
        <motion.div
          className="flex justify-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {last7Days.map((day, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  day.isToday
                    ? isOnStreak
                      ? "text-orange-500"
                      : "text-blue-500"
                    : "text-muted-foreground"
                )}
              >
                {day.day}
              </span>
              <motion.div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center p-1",
                  isOnStreak
                    ? "bg-gradient-to-b from-orange-400 to-orange-600"
                    : "bg-gradient-to-b from-[#99E0FE] to-[#1AAEF5]"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  icon="mdi:check-bold"
                  className="w-4 h-4 text-white font-bold"
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Encouragement text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <p className="text-sm text-muted-foreground">
            {isOnStreak ? (
              <>
                Vous avez étendu votre série avec plus de{" "}
                <span className="text-orange-500 font-medium">
                  {hoursLeft} heures
                </span>{" "}
                restantes dans la journée. Beau travail !
              </>
            ) : (
              "Commencez une nouvelle série aujourd'hui !"
            )}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

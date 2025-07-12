"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface HeaderProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function Header({ showMenuButton, onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ name: t("common.dashboard"), href: "/dashboard" }];

    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // Skip dashboard since it's already added
      if (path === "dashboard") return;

      let name = path;
      if (path === "courses") name = t("common.courses");
      else if (path === "profile") name = t("common.profile");
      else if (path === "settings") name = t("common.settings");
      else if (path === "progression") name = t("common.progression");
      else if (path === "reviews") name = t("common.reviews");
      else if (path === "discord") name = t("common.discord");
      else name = path.charAt(0).toUpperCase() + path.slice(1);

      breadcrumbs.push({ name, href: currentPath });
    });

    return breadcrumbs;
  };

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("Header: Fetched user data:", userData);
        console.log("Header: User role:", userData?.role);

        if (error) {
          console.error("Error fetching user data:", error);
        }

        setUser(userData);
      }
    }

    async function getNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.is_read).length);
        }
      }
    }

    getUser();
    getNotifications();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function markAsRead(notificationId: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications(
      notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex h-16 items-center px-4 gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Icon icon="mdi:menu" className="h-5 w-5" />
          </Button>
        )}

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
          {getBreadcrumbs().map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center">
              {index > 0 && (
                <Icon icon="mdi:chevron-right" className="h-4 w-4 mx-1" />
              )}
              {index === getBreadcrumbs().length - 1 ? (
                <span className="text-gray-900 dark:text-white font-medium">
                  {breadcrumb.name}
                </span>
              ) : (
                <Link
                  href={breadcrumb.href}
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Icon icon="mdi:bell" className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t("common.notifications")}</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm">
                  {t("common.markAsRead")}
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Aucune notification
                </p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors",
                        notification.is_read ? "bg-gray-50" : "bg-blue-50"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <h4 className="font-medium text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.profile_picture_url}
                  alt={user?.first_name}
                />
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {user?.first_name?.[0] ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                  {user?.last_name?.[0] ||
                    user?.email?.split("@")[0]?.[1]?.toUpperCase() ||
                    ""}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <Icon icon="mdi:account" className="mr-2 h-4 w-4" />
              <span>{t("common.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Icon icon="mdi:cog" className="mr-2 h-4 w-4" />
              <span>{t("common.settings")}</span>
            </DropdownMenuItem>
            {(user?.role === "admin" || user?.role === "moderator") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/backoffice/courses")}>
                  <Icon icon="mdi:shield-crown" className="mr-2 h-4 w-4" />
                  <span>Backoffice</span>
                </DropdownMenuItem>
              </>
            )}
            {/* Debug info - temporary */}
            {process.env.NODE_ENV === "development" && (
              <DropdownMenuItem disabled>
                <span className="text-xs text-gray-500">
                  Role: {user?.role || "undefined"}
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
              <span>{t("common.signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

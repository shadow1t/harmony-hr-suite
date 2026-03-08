import { Globe, Bell, LogOut, Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export function TopBar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const { companyId } = useCompany();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !companyId) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    };
    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, companyId]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    for (const id of unreadIds) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card px-2 sm:px-4 gap-2 sm:gap-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" onClick={toggleLanguage} title={t('language.switch')} className="h-8 w-8 sm:h-9 sm:w-9">
          <Globe className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 sm:w-80 p-0" align="end">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-sm">{language === "ar" ? "الإشعارات" : "Notifications"}</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllRead}>
                  {language === "ar" ? "تعيين الكل كمقروء" : "Mark all read"}
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-64">
              {notifications.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">{language === "ar" ? "لا توجد إشعارات" : "No notifications"}</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 ${!n.is_read ? "bg-primary/5" : ""}`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground truncate">{n.message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString(language === "ar" ? "ar" : "en")}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 sm:h-9 gap-2 px-1.5 sm:px-2">
              <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 me-2" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

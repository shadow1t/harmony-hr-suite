import { LayoutDashboard, Building2, ArrowLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { titleAr: "لوحة التحكم", titleEn: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { titleAr: "إدارة الشركات", titleEn: "Tenants", url: "/admin/tenants", icon: Building2 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { language } = useLanguage();

  return (
    <Sidebar collapsible="icon" side={language === "ar" ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground font-bold text-xs">
            SA
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {language === "ar" ? "لوحة المنصة" : "Platform Admin"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{language === "ar" ? "الإدارة" : "Management"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{language === "ar" ? item.titleAr : item.titleEn}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="hover:bg-sidebar-accent/50">
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{language === "ar" ? "العودة للنظام" : "Back to App"}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-xs text-sidebar-foreground/50">
          {!collapsed && (language === "ar" ? "© 2026 منصة HR SaaS" : "© 2026 HR SaaS Platform")}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

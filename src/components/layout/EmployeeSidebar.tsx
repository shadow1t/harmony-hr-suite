import { Home, Clock, CalendarDays, Wallet } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
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
  { titleAr: "الرئيسية", titleEn: "Overview", url: "/my-portal", icon: Home },
  { titleAr: "حضوري", titleEn: "My Attendance", url: "/my-attendance", icon: Clock },
  { titleAr: "إجازاتي", titleEn: "My Leaves", url: "/my-leaves", icon: CalendarDays },
  { titleAr: "رواتبي", titleEn: "My Payslips", url: "/my-payslips", icon: Wallet },
];

export function EmployeeSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { language } = useLanguage();
  const { company } = useCompany();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-3 px-2">
          {company?.logo_url ? (
            <img src={company.logo_url} alt="Logo" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
              HR
            </div>
          )}
          {!collapsed && (
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {language === "ar" ? company?.name_ar : company?.name_en || company?.name_ar || "HR"}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{language === "ar" ? "بوابتي" : "My Portal"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{language === "ar" ? item.titleAr : item.titleEn}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-xs text-sidebar-foreground/50">
          {!collapsed && "© 2026 HR SaaS Platform"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

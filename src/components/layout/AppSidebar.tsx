import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Wallet,
  UserPlus,
  GraduationCap,
  TrendingUp,
  Building2,
  FileText,
  Settings,
  Shield,
} from "lucide-react";
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
import type { TranslationKey } from "@/i18n/translations";

interface NavItem {
  titleKey: TranslationKey;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  labelKey: TranslationKey;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: 'nav.dashboard',
    items: [
      { titleKey: 'nav.dashboard', url: '/', icon: LayoutDashboard },
    ],
  },
  {
    labelKey: 'nav.employeeManagement',
    items: [
      { titleKey: 'nav.employees', url: '/employees', icon: Users },
      { titleKey: 'nav.departments', url: '/departments', icon: Building2 },
    ],
  },
  {
    labelKey: 'nav.timeManagement',
    items: [
      { titleKey: 'nav.attendance', url: '/attendance', icon: Clock },
      { titleKey: 'nav.leaves', url: '/leaves', icon: CalendarDays },
    ],
  },
  {
    labelKey: 'nav.financial',
    items: [
      { titleKey: 'nav.payroll', url: '/payroll', icon: Wallet },
    ],
  },
  {
    labelKey: 'nav.talentManagement',
    items: [
      { titleKey: 'nav.recruitment', url: '/recruitment', icon: UserPlus },
      { titleKey: 'nav.training', url: '/training', icon: GraduationCap },
      { titleKey: 'nav.performance', url: '/performance', icon: TrendingUp },
    ],
  },
  {
    labelKey: 'nav.reports',
    items: [
      { titleKey: 'nav.reports', url: '/reports', icon: FileText },
      { titleKey: 'nav.settings', url: '/settings', icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t } = useLanguage();
  const { company, isSuperAdmin } = useCompany();

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
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">{company?.name_en || t('app.name')}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{t(item.titleKey)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {isSuperAdmin && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/admin" className="hover:bg-sidebar-accent/50 text-destructive">
                  <Shield className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Platform Admin</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <div className="px-2 py-2 text-xs text-sidebar-foreground/50">
          {!collapsed && "© 2026 HR SaaS Platform"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

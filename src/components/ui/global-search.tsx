import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Users, Clock, CalendarDays, Wallet, UserPlus,
  GraduationCap, TrendingUp, Building2, FileText, Settings, User,
  Search, Briefcase, ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchableEmployee {
  id: string;
  name: string;
  employee_number: string;
  position: string | null;
  department?: string | null;
}

interface SearchableDepartment {
  id: string;
  name: string;
}

const pages = [
  { path: "/", icon: LayoutDashboard, labelAr: "لوحة التحكم", labelEn: "Dashboard", keywords: ["home", "main", "رئيسية"] },
  { path: "/employees", icon: Users, labelAr: "الموظفين", labelEn: "Employees", keywords: ["staff", "people", "عمال"] },
  { path: "/departments", icon: Building2, labelAr: "الأقسام والفروع", labelEn: "Departments", keywords: ["branches", "فروع", "أقسام"] },
  { path: "/attendance", icon: Clock, labelAr: "الحضور والانصراف", labelEn: "Attendance", keywords: ["check-in", "حضور", "دوام"] },
  { path: "/leaves", icon: CalendarDays, labelAr: "الإجازات", labelEn: "Leaves", keywords: ["vacation", "إجازة", "غياب"] },
  { path: "/payroll", icon: Wallet, labelAr: "الرواتب", labelEn: "Payroll", keywords: ["salary", "رواتب", "مالية"] },
  { path: "/recruitment", icon: UserPlus, labelAr: "التوظيف", labelEn: "Recruitment", keywords: ["hiring", "jobs", "وظائف"] },
  { path: "/training", icon: GraduationCap, labelAr: "التدريب", labelEn: "Training", keywords: ["courses", "دورات", "تعليم"] },
  { path: "/performance", icon: TrendingUp, labelAr: "تقييم الأداء", labelEn: "Performance", keywords: ["evaluation", "تقييم", "أداء"] },
  { path: "/reports", icon: FileText, labelAr: "التقارير", labelEn: "Reports", keywords: ["analytics", "تحليلات", "إحصائيات"] },
  { path: "/settings", icon: Settings, labelAr: "الإعدادات", labelEn: "Settings", keywords: ["config", "إعدادات", "تهيئة"] },
];

const quickActions = [
  { path: "/employees", labelAr: "إضافة موظف جديد", labelEn: "Add new employee", icon: UserPlus, keywords: ["add employee"] },
  { path: "/attendance", labelAr: "تسجيل حضور", labelEn: "Record attendance", icon: Clock, keywords: ["check in"] },
  { path: "/leaves", labelAr: "طلب إجازة", labelEn: "Request leave", icon: CalendarDays, keywords: ["leave request"] },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<SearchableEmployee[]>([]);
  const [departments, setDepartments] = useState<SearchableDepartment[]>([]);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const isAr = language === "ar";

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Load employees & departments when dialog opens
  useEffect(() => {
    if (!open || !companyId) return;
    const fetchData = async () => {
      const [empRes, deptRes] = await Promise.all([
        supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number, position_ar, position_en, department_id").eq("company_id", companyId).eq("status", "active").limit(200),
        supabase.from("departments").select("id, name_ar, name_en").eq("company_id", companyId),
      ]);
      if (empRes.data) {
        setEmployees(empRes.data.map(e => ({
          id: e.id,
          name: isAr
            ? `${e.first_name_ar} ${e.last_name_ar}`
            : `${e.first_name_en || e.first_name_ar} ${e.last_name_en || e.last_name_ar}`,
          employee_number: e.employee_number,
          position: isAr ? e.position_ar : (e.position_en || e.position_ar),
          department: null,
        })));
      }
      if (deptRes.data) {
        setDepartments(deptRes.data.map(d => ({
          id: d.id,
          name: isAr ? d.name_ar : d.name_en,
        })));
      }
    };
    fetchData();
  }, [open, companyId, isAr]);

  // Reset query when closed
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  // Filter employees by query
  const filteredEmployees = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.employee_number.toLowerCase().includes(q) ||
      (e.position && e.position.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, employees]);

  // Filter departments by query
  const filteredDepartments = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return departments.filter(d => d.name.toLowerCase().includes(q)).slice(0, 5);
  }, [query, departments]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={isAr ? "ابحث عن صفحة، موظف، قسم..." : "Search pages, employees, departments..."}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد نتائج" : "No results found"}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms"}
            </p>
          </div>
        </CommandEmpty>

        {/* Quick Actions - show when no query */}
        {!query && (
          <CommandGroup heading={isAr ? "إجراءات سريعة" : "Quick Actions"}>
            {quickActions.map((action) => (
              <CommandItem key={action.path + action.labelEn} onSelect={() => handleSelect(action.path)} className="gap-3 cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="flex-1">{isAr ? action.labelAr : action.labelEn}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Pages */}
        <CommandGroup heading={isAr ? "الصفحات" : "Pages"}>
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => handleSelect(page.path)}
              className="gap-3 cursor-pointer"
              keywords={[page.labelAr, page.labelEn, ...page.keywords]}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <page.icon className="h-4 w-4 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span>{isAr ? page.labelAr : page.labelEn}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Employees */}
        {filteredEmployees.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={isAr ? "الموظفون" : "Employees"}>
              {filteredEmployees.map((emp) => (
                <CommandItem key={emp.id} onSelect={() => handleSelect("/employees")} className="gap-3 cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                    <User className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-medium">{emp.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {emp.employee_number} {emp.position && `• ${emp.position}`}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {isAr ? "موظف" : "Employee"}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Departments */}
        {filteredDepartments.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={isAr ? "الأقسام" : "Departments"}>
              {filteredDepartments.map((dept) => (
                <CommandItem key={dept.id} onSelect={() => handleSelect("/departments")} className="gap-3 cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{dept.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {isAr ? "قسم" : "Dept"}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
          <span>{isAr ? "تنقل" : "Navigate"}</span>
          <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
          <span>{isAr ? "اختيار" : "Select"}</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd>
          <span>{isAr ? "إغلاق" : "Close"}</span>
        </div>
      </div>
    </CommandDialog>
  );
}

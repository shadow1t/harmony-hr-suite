import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard, Users, Clock, CalendarDays, Wallet, UserPlus,
  GraduationCap, TrendingUp, Building2, FileText, Settings
} from "lucide-react";

const pages = [
  { path: "/", icon: LayoutDashboard, labelAr: "لوحة التحكم", labelEn: "Dashboard" },
  { path: "/employees", icon: Users, labelAr: "الموظفين", labelEn: "Employees" },
  { path: "/departments", icon: Building2, labelAr: "الأقسام والفروع", labelEn: "Departments" },
  { path: "/attendance", icon: Clock, labelAr: "الحضور والانصراف", labelEn: "Attendance" },
  { path: "/leaves", icon: CalendarDays, labelAr: "الإجازات", labelEn: "Leaves" },
  { path: "/payroll", icon: Wallet, labelAr: "الرواتب", labelEn: "Payroll" },
  { path: "/recruitment", icon: UserPlus, labelAr: "التوظيف", labelEn: "Recruitment" },
  { path: "/training", icon: GraduationCap, labelAr: "التدريب", labelEn: "Training" },
  { path: "/performance", icon: TrendingUp, labelAr: "تقييم الأداء", labelEn: "Performance" },
  { path: "/reports", icon: FileText, labelAr: "التقارير", labelEn: "Reports" },
  { path: "/settings", icon: Settings, labelAr: "الإعدادات", labelEn: "Settings" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

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

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={language === "ar" ? "ابحث عن صفحة..." : "Search pages..."} />
      <CommandList>
        <CommandEmpty>{language === "ar" ? "لا توجد نتائج" : "No results found"}</CommandEmpty>
        <CommandGroup heading={language === "ar" ? "الصفحات" : "Pages"}>
          {pages.map((page) => (
            <CommandItem key={page.path} onSelect={() => handleSelect(page.path)} className="gap-3 cursor-pointer">
              <page.icon className="h-4 w-4 shrink-0" />
              <span>{language === "ar" ? page.labelAr : page.labelEn}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

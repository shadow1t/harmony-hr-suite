import { useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

const routeNames: Record<string, { ar: string; en: string }> = {
  "/": { ar: "لوحة التحكم", en: "Dashboard" },
  "/employees": { ar: "الموظفين", en: "Employees" },
  "/departments": { ar: "الأقسام", en: "Departments" },
  "/attendance": { ar: "الحضور والانصراف", en: "Attendance" },
  "/leaves": { ar: "الإجازات", en: "Leaves" },
  "/payroll": { ar: "الرواتب", en: "Payroll" },
  "/recruitment": { ar: "التوظيف", en: "Recruitment" },
  "/training": { ar: "التدريب", en: "Training" },
  "/performance": { ar: "الأداء", en: "Performance" },
  "/reports": { ar: "التقارير", en: "Reports" },
  "/settings": { ar: "الإعدادات", en: "Settings" },
  "/settings/company": { ar: "إعدادات الشركة", en: "Company Settings" },
};

export function PageBreadcrumb() {
  const location = useLocation();
  const { language } = useLanguage();

  if (location.pathname === "/") return null;

  const segments = location.pathname.split("/").filter(Boolean);
  const Sep = language === "ar" ? ChevronLeft : ChevronRight;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{language === "ar" ? "الرئيسية" : "Home"}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((_, index) => {
          const path = "/" + segments.slice(0, index + 1).join("/");
          const name = routeNames[path];
          const isLast = index === segments.length - 1;
          return (
            <span key={path} className="contents">
              <BreadcrumbSeparator><Sep className="h-3.5 w-3.5" /></BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name ? (language === "ar" ? name.ar : name.en) : segments[index]}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={path}>{name ? (language === "ar" ? name.ar : name.en) : segments[index]}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

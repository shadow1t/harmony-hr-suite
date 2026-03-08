import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Wallet, Stethoscope, Home } from "lucide-react";

export default function MyPortal() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [annualRemaining, setAnnualRemaining] = useState<number | null>(null);
  const [sickRemaining, setSickRemaining] = useState<number | null>(null);
  const [lastSalary, setLastSalary] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !companyId) return;

    const fetchData = async () => {
      // Get employee linked to this user
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .single();

      if (!emp) return;
      setEmployeeId(emp.id);

      const year = new Date().getFullYear();

      const [balRes, payRes] = await Promise.all([
        supabase
          .from("leave_balances")
          .select("leave_type, remaining_days")
          .eq("employee_id", emp.id)
          .eq("year", year),
        supabase
          .from("payroll")
          .select("net_salary, month, year")
          .eq("employee_id", emp.id)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1),
      ]);

      if (balRes.data) {
        const annual = balRes.data.find((b) => b.leave_type === "annual");
        const sick = balRes.data.find((b) => b.leave_type === "sick");
        if (annual) setAnnualRemaining(annual.remaining_days);
        if (sick) setSickRemaining(sick.remaining_days);
      }

      if (payRes.data?.[0]) {
        setLastSalary(payRes.data[0].net_salary);
      }
    };

    fetchData();
  }, [user, companyId]);

  const widgets = [
    {
      icon: CalendarDays,
      label: language === "ar" ? "رصيد الإجازات السنوية" : "Annual Leave Balance",
      value: annualRemaining !== null ? `${annualRemaining} ${language === "ar" ? "يوم" : "days"}` : "--",
      color: "text-blue-600",
    },
    {
      icon: Stethoscope,
      label: language === "ar" ? "رصيد الإجازات المرضية" : "Sick Leave Balance",
      value: sickRemaining !== null ? `${sickRemaining} ${language === "ar" ? "يوم" : "days"}` : "--",
      color: "text-orange-600",
    },
    {
      icon: Wallet,
      label: language === "ar" ? "آخر صافي راتب" : "Last Net Salary",
      value: lastSalary !== null ? `${lastSalary.toLocaleString()} ${language === "ar" ? "ر.س" : "SAR"}` : "--",
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Home className="h-6 w-6" />
        {language === "ar" ? "بوابتي" : "My Portal"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {widgets.map((w, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{w.label}</CardTitle>
              <w.icon className={`h-5 w-5 ${w.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{w.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!employeeId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {language === "ar"
              ? "لم يتم ربط حسابك بسجل موظف بعد. يرجى التواصل مع قسم الموارد البشرية."
              : "Your account is not linked to an employee record yet. Please contact HR."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

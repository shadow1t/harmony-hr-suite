import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

export default function MyPayslips() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !companyId) return;

    const fetchData = async () => {
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .single();

      if (!emp) { setLoading(false); return; }

      const { data } = await supabase
        .from("payroll")
        .select("*")
        .eq("employee_id", emp.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (data) setPayslips(data);
      setLoading(false);
    };

    fetchData();
  }, [user, companyId]);

  const monthName = (m: number) => {
    const months = language === "ar"
      ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[m - 1] || m;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="h-6 w-6" />
        {language === "ar" ? "رواتبي" : "My Payslips"}
      </h1>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          ) : payslips.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {language === "ar" ? "لا توجد كشوف رواتب" : "No payslips available"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "الفترة" : "Period"}</TableHead>
                  <TableHead>{language === "ar" ? "الأساسي" : "Basic"}</TableHead>
                  <TableHead>{language === "ar" ? "البدلات" : "Allowances"}</TableHead>
                  <TableHead>{language === "ar" ? "الخصومات" : "Deductions"}</TableHead>
                  <TableHead>{language === "ar" ? "الصافي" : "Net"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{monthName(p.month)} {p.year}</TableCell>
                    <TableCell>{(p.basic_salary || 0).toLocaleString()}</TableCell>
                    <TableCell>{((p.housing_allowance || 0) + (p.transport_allowance || 0) + (p.other_allowances || 0)).toLocaleString()}</TableCell>
                    <TableCell className="text-destructive">{((p.social_insurance || 0) + (p.deductions || 0)).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{(p.net_salary || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                        {p.status === "paid" ? (language === "ar" ? "مدفوع" : "Paid") : (language === "ar" ? "مسودة" : "Draft")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

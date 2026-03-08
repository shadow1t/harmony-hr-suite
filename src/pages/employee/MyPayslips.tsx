import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Printer } from "lucide-react";

export default function MyPayslips() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId, company } = useCompany();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const [printPayslip, setPrintPayslip] = useState<any>(null);

  useEffect(() => {
    if (!user || !companyId) return;

    const fetchData = async () => {
      const { data: emp } = await supabase
        .from("employees")
        .select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number, position_ar, position_en")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .single();

      if (!emp) { setLoading(false); return; }
      setEmployeeInfo(emp);

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

  const handlePrint = (payslip: any) => {
    setPrintPayslip(payslip);
    setTimeout(() => {
      const content = printRef.current;
      if (!content) return;
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`
        <html dir="${language === "ar" ? "rtl" : "ltr"}">
        <head><title>Payslip</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 5px 0; font-size: 20px; }
          .header p { margin: 2px 0; color: #666; font-size: 14px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info div { font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px 12px; border: 1px solid #ddd; text-align: ${language === "ar" ? "right" : "left"}; font-size: 14px; }
          th { background: #f5f5f5; font-weight: bold; }
          .total { font-weight: bold; font-size: 16px; background: #e8f5e9 !important; }
          @media print { body { padding: 20px; } }
        </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
        </html>
      `);
      win.document.close();
      win.print();
    }, 100);
  };

  const empName = employeeInfo
    ? (language === "ar" ? `${employeeInfo.first_name_ar} ${employeeInfo.last_name_ar}` : `${employeeInfo.first_name_en || employeeInfo.first_name_ar} ${employeeInfo.last_name_en || employeeInfo.last_name_ar}`)
    : "";

  const currency = company?.currency || "SAR";

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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{monthName(p.month)} {p.year}</TableCell>
                    <TableCell>{(p.basic_salary || 0).toLocaleString()}</TableCell>
                    <TableCell>{((p.housing_allowance || 0) + (p.transport_allowance || 0) + (p.other_allowances || 0)).toLocaleString()}</TableCell>
                    <TableCell className="text-destructive">{((p.social_insurance || 0) + (p.deductions || 0)).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{(p.net_salary || 0).toLocaleString()} {currency}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                        {p.status === "paid" ? (language === "ar" ? "مدفوع" : "Paid") : (language === "ar" ? "مسودة" : "Draft")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handlePrint(p)}>
                        <Printer className="h-4 w-4 me-1" />
                        {language === "ar" ? "طباعة" : "Print"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hidden print template */}
      <div className="hidden">
        <div ref={printRef}>
          {printPayslip && (
            <div>
              <div className="header">
                {company?.logo_url && <img src={company.logo_url} alt="Logo" />}
                <h1>{language === "ar" ? company?.name_ar : company?.name_en}</h1>
                <p>{language === "ar" ? "كشف راتب" : "Payslip"} — {monthName(printPayslip.month)} {printPayslip.year}</p>
              </div>
              <div className="info">
                <div>
                  <p><strong>{language === "ar" ? "الموظف:" : "Employee:"}</strong> {empName}</p>
                  <p><strong>{language === "ar" ? "الرقم الوظيفي:" : "Employee #:"}</strong> {employeeInfo?.employee_number}</p>
                </div>
                <div>
                  <p><strong>{language === "ar" ? "المسمى:" : "Position:"}</strong> {language === "ar" ? employeeInfo?.position_ar : employeeInfo?.position_en || employeeInfo?.position_ar || "-"}</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{language === "ar" ? "البند" : "Item"}</th>
                    <th>{language === "ar" ? "المبلغ" : "Amount"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>{language === "ar" ? "الراتب الأساسي" : "Basic Salary"}</td><td>{(printPayslip.basic_salary || 0).toLocaleString()} {currency}</td></tr>
                  <tr><td>{language === "ar" ? "بدل السكن" : "Housing Allowance"}</td><td>{(printPayslip.housing_allowance || 0).toLocaleString()} {currency}</td></tr>
                  <tr><td>{language === "ar" ? "بدل النقل" : "Transport Allowance"}</td><td>{(printPayslip.transport_allowance || 0).toLocaleString()} {currency}</td></tr>
                  <tr><td>{language === "ar" ? "بدلات أخرى" : "Other Allowances"}</td><td>{(printPayslip.other_allowances || 0).toLocaleString()} {currency}</td></tr>
                  <tr><td>{language === "ar" ? "التأمينات الاجتماعية" : "Social Insurance"}</td><td style={{color: "red"}}>-{(printPayslip.social_insurance || 0).toLocaleString()} {currency}</td></tr>
                  <tr><td>{language === "ar" ? "خصومات أخرى" : "Other Deductions"}</td><td style={{color: "red"}}>-{(printPayslip.deductions || 0).toLocaleString()} {currency}</td></tr>
                  <tr className="total"><td>{language === "ar" ? "صافي الراتب" : "Net Salary"}</td><td>{(printPayslip.net_salary || 0).toLocaleString()} {currency}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

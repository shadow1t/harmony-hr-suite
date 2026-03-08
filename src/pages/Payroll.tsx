import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet, Play, DollarSign } from "lucide-react";

export default function Payroll() {
  const { language } = useLanguage();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setLoading(true);
    const [pRes, eRes] = await Promise.all([
      supabase.from("payroll").select("*, employees(first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number)").eq("month", month).eq("year", year).order("created_at"),
      supabase.from("employees").select("*").eq("status", "active"),
    ]);
    if (pRes.data) setPayrolls(pRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const generatePayroll = async () => {
    if (employees.length === 0) { toast.error(language === "ar" ? "لا يوجد موظفين" : "No employees"); return; }
    const records = employees.map((e) => {
      const basic = Number(e.basic_salary) || 0;
      const housing = Number(e.housing_allowance) || 0;
      const transport = Number(e.transport_allowance) || 0;
      const other = Number(e.other_allowances) || 0;
      const gross = basic + housing + transport + other;
      const socialInsurance = basic * 0.0975; // 9.75% employee share
      const net = gross - socialInsurance;
      return {
        employee_id: e.id, month, year,
        basic_salary: basic, housing_allowance: housing, transport_allowance: transport, other_allowances: other,
        social_insurance: Math.round(socialInsurance * 100) / 100,
        net_salary: Math.round(net * 100) / 100,
        status: "draft",
      };
    });
    const { error } = await supabase.from("payroll").upsert(records, { onConflict: "employee_id,month,year" });
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم إنشاء مسيّر الرواتب" : "Payroll generated"); fetchData(); }
  };

  const empName = (emp: any) => language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;

  const totalNet = payrolls.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);

  const months = language === "ar" 
    ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6" /> {language === "ar" ? "الرواتب" : "Payroll"}</h1>
        <div className="flex items-center gap-3">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={generatePayroll}><Play className="h-4 w-4 me-2" />{language === "ar" ? "إنشاء المسيّر" : "Generate"}</Button>
        </div>
      </div>

      {payrolls.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي صافي الرواتب" : "Total Net Payroll"}</p>
                <p className="text-2xl font-bold">{totalNet.toLocaleString()} {language === "ar" ? "ر.س" : "SAR"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : payrolls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{language === "ar" ? "لم يتم إنشاء مسيّر لهذا الشهر بعد" : "No payroll generated for this month"}</p>
              <Button variant="outline" onClick={generatePayroll}>{language === "ar" ? "إنشاء الآن" : "Generate Now"}</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                  <TableHead>{language === "ar" ? "الأساسي" : "Basic"}</TableHead>
                  <TableHead>{language === "ar" ? "البدلات" : "Allowances"}</TableHead>
                  <TableHead>{language === "ar" ? "التأمينات" : "Insurance"}</TableHead>
                  <TableHead>{language === "ar" ? "الصافي" : "Net"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employees ? empName(p.employees) : "-"}</TableCell>
                    <TableCell>{Number(p.basic_salary).toLocaleString()}</TableCell>
                    <TableCell>{(Number(p.housing_allowance) + Number(p.transport_allowance) + Number(p.other_allowances)).toLocaleString()}</TableCell>
                    <TableCell className="text-destructive">-{Number(p.social_insurance).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{Number(p.net_salary).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
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

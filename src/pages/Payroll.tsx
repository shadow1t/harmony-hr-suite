import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Wallet, Play, DollarSign, Download, Trash2, ArrowRight } from "lucide-react";

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const statusFlow: Record<string, string> = { draft: "processing", processing: "completed", completed: "paid" };

export default function Payroll() {
  const { language } = useLanguage();
  const { companyId, company } = useCompany();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkStatusAction, setBulkStatusAction] = useState<string | null>(null);

  const currency = company?.currency || "SAR";
  const insurancePct = company?.social_insurance_pct ?? 9.75;

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
    const pct = insurancePct / 100;
    const records: any[] = employees.map((e) => {
      const basic = Number(e.basic_salary) || 0;
      const housing = Number(e.housing_allowance) || 0;
      const transport = Number(e.transport_allowance) || 0;
      const other = Number(e.other_allowances) || 0;
      const gross = basic + housing + transport + other;
      const socialInsurance = basic * pct;
      const net = gross - socialInsurance;
      return {
        employee_id: e.id, month, year, company_id: companyId,
        basic_salary: basic, housing_allowance: housing, transport_allowance: transport, other_allowances: other,
        social_insurance: Math.round(socialInsurance * 100) / 100,
        net_salary: Math.round(net * 100) / 100,
        status: "draft" as const,
      };
    });
    const { error } = await supabase.from("payroll").upsert(records, { onConflict: "employee_id,month,year" });
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم إنشاء مسيّر الرواتب" : "Payroll generated"); fetchData(); }
  };

  type PayrollStatus = "draft" | "processing" | "completed" | "paid";
  const updateSingleStatus = async (id: string, newStatus: PayrollStatus) => {
    const { error } = await supabase.from("payroll").update({ status: newStatus }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم التحديث" : "Updated"); fetchData(); }
  };

  const updateBulkStatus = async () => {
    if (!bulkStatusAction) return;
    const currentStatus = Object.entries(statusFlow).find(([, v]) => v === bulkStatusAction)?.[0];
    if (!currentStatus) return;
    const ids = payrolls.filter(p => p.status === currentStatus).map(p => p.id);
    if (ids.length === 0) { toast.error(language === "ar" ? "لا توجد سجلات للتحديث" : "No records to update"); setBulkStatusAction(null); return; }
    const { error } = await supabase.from("payroll").update({ status: bulkStatusAction }).in("id", ids);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? `تم تحديث ${ids.length} سجل` : `Updated ${ids.length} records`); fetchData(); }
    setBulkStatusAction(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("payroll").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  const empName = (emp: any) => language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;
  const totalNet = payrolls.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);

  const handleExportCSV = () => {
    const rows = payrolls.map((p) => ({
      Employee: p.employees ? empName(p.employees) : "",
      "Employee #": p.employees?.employee_number || "",
      Basic: p.basic_salary, Housing: p.housing_allowance, Transport: p.transport_allowance,
      "Other Allowances": p.other_allowances, Insurance: p.social_insurance, Net: p.net_salary, Status: p.status,
    }));
    exportCSV(rows, `payroll-${year}-${month}.csv`);
  };

  const months = language === "ar"
    ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const statusLabel = (s: string) => {
    const map: Record<string, { ar: string; en: string; v: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { ar: "مسودة", en: "Draft", v: "secondary" },
      processing: { ar: "قيد المعالجة", en: "Processing", v: "outline" },
      completed: { ar: "مكتمل", en: "Completed", v: "default" },
      paid: { ar: "مدفوع", en: "Paid", v: "default" },
    };
    const item = map[s] || { ar: s, en: s, v: "outline" as const };
    return <Badge variant={item.v}>{language === "ar" ? item.ar : item.en}</Badge>;
  };

  const nextStatusLabel = (current: string) => {
    const next = statusFlow[current];
    if (!next) return null;
    const labels: Record<string, { ar: string; en: string }> = {
      processing: { ar: "بدء المعالجة", en: "Process" },
      completed: { ar: "إكمال", en: "Complete" },
      paid: { ar: "تأكيد الدفع", en: "Mark Paid" },
    };
    return labels[next] || null;
  };

  // Count by status
  const statusCounts = payrolls.reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Wallet className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "الرواتب" : "Payroll"}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{[2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" onClick={generatePayroll}><Play className="h-4 w-4 me-2" />{language === "ar" ? "إنشاء المسيّر" : "Generate"}</Button>
          {payrolls.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 me-2" />{language === "ar" ? "تصدير CSV" : "Export CSV"}</Button>
          )}
        </div>
      </div>

      {payrolls.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الصافي" : "Total Net"}</p>
                <p className="text-lg font-bold">{totalNet.toLocaleString()} {currency}</p>
              </div>
            </CardContent>
          </Card>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card key={status}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{statusLabel(status)}</p>
                <p className="text-lg font-bold">{count} {language === "ar" ? "موظف" : "employees"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk status actions */}
      {payrolls.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">{language === "ar" ? "تحديث جماعي للحالة" : "Bulk Status Update"}</p>
            <div className="flex gap-2 flex-wrap">
              {statusCounts["draft"] && (
                <Button size="sm" variant="outline" onClick={() => setBulkStatusAction("processing")}>
                  <ArrowRight className="h-4 w-4 me-1" />
                  {language === "ar" ? `معالجة الكل (${statusCounts["draft"]})` : `Process All (${statusCounts["draft"]})`}
                </Button>
              )}
              {statusCounts["processing"] && (
                <Button size="sm" variant="outline" onClick={() => setBulkStatusAction("completed")}>
                  <ArrowRight className="h-4 w-4 me-1" />
                  {language === "ar" ? `إكمال الكل (${statusCounts["processing"]})` : `Complete All (${statusCounts["processing"]})`}
                </Button>
              )}
              {statusCounts["completed"] && (
                <Button size="sm" variant="outline" onClick={() => setBulkStatusAction("paid")}>
                  <ArrowRight className="h-4 w-4 me-1" />
                  {language === "ar" ? `تأكيد دفع الكل (${statusCounts["completed"]})` : `Mark All Paid (${statusCounts["completed"]})`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={!!bulkStatusAction} onOpenChange={(o) => !o && setBulkStatusAction(null)}
        title={language === "ar" ? "تأكيد التحديث الجماعي" : "Confirm Bulk Update"}
        description={language === "ar" ? "هل تريد تحديث حالة جميع السجلات المؤهلة؟" : "Update status of all eligible records?"}
        confirmLabel={language === "ar" ? "تحديث" : "Update"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        variant="default" onConfirm={updateBulkStatus} />

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure you want to delete this record?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete} />

      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : payrolls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{language === "ar" ? "لم يتم إنشاء مسيّر لهذا الشهر بعد" : "No payroll generated for this month"}</p>
              <Button variant="outline" onClick={generatePayroll}>{language === "ar" ? "إنشاء الآن" : "Generate Now"}</Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                      <TableHead>{language === "ar" ? "الأساسي" : "Basic"}</TableHead>
                      <TableHead>{language === "ar" ? "البدلات" : "Allowances"}</TableHead>
                      <TableHead>{language === "ar" ? "التأمينات" : "Insurance"}</TableHead>
                      <TableHead>{language === "ar" ? "الصافي" : "Net"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="w-28">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls.map((p) => {
                      const next = nextStatusLabel(p.status);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.employees ? empName(p.employees) : "-"}</TableCell>
                          <TableCell>{Number(p.basic_salary).toLocaleString()}</TableCell>
                          <TableCell>{(Number(p.housing_allowance) + Number(p.transport_allowance) + Number(p.other_allowances)).toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">-{Number(p.social_insurance).toLocaleString()}</TableCell>
                          <TableCell className="font-bold">{Number(p.net_salary).toLocaleString()} {currency}</TableCell>
                          <TableCell>{statusLabel(p.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {next && (
                                <Button variant="ghost" size="sm" onClick={() => updateSingleStatus(p.id, statusFlow[p.status])}>
                                  <ArrowRight className="h-4 w-4 me-1" />{language === "ar" ? next.ar : next.en}
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

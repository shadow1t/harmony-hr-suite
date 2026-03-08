import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";
import { Plus, Search, Users, Download, Pencil, Trash2 } from "lucide-react";

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

const emptyForm = {
  employee_number: "", first_name_ar: "", last_name_ar: "", first_name_en: "", last_name_en: "",
  email: "", phone: "", national_id: "", nationality: "", department_id: "", branch_id: "",
  position_ar: "", position_en: "", contract_type: "full_time",
  hire_date: new Date().toISOString().split("T")[0], basic_salary: "", housing_allowance: "", transport_allowance: "",
  id_expiry_date: "", contract_expiry_date: "",
};

export default function Employees() {
  const { t, language } = useLanguage();
  const { companyId } = useCompany();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchData = async () => {
    setLoading(true);
    const [empRes, deptRes, branchRes] = await Promise.all([
      supabase.from("employees").select("*, departments(name_ar, name_en), branches(name_ar, name_en)").order("created_at", { ascending: false }),
      supabase.from("departments").select("*"),
      supabase.from("branches").select("*"),
    ]);
    if (empRes.data) setEmployees(empRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
    if (branchRes.data) setBranches(branchRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = employees.filter((e) => {
    const name = `${e.first_name_ar} ${e.last_name_ar} ${e.first_name_en || ""} ${e.last_name_en || ""} ${e.employee_number}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const pagination = usePagination(filtered, 10);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (emp: any) => {
    setEditingId(emp.id);
    setForm({
      employee_number: emp.employee_number || "", first_name_ar: emp.first_name_ar || "", last_name_ar: emp.last_name_ar || "",
      first_name_en: emp.first_name_en || "", last_name_en: emp.last_name_en || "", email: emp.email || "", phone: emp.phone || "",
      national_id: emp.national_id || "", nationality: emp.nationality || "", department_id: emp.department_id || "",
      branch_id: emp.branch_id || "", position_ar: emp.position_ar || "", position_en: emp.position_en || "",
      contract_type: emp.contract_type || "full_time", hire_date: emp.hire_date || "",
      basic_salary: emp.basic_salary?.toString() || "", housing_allowance: emp.housing_allowance?.toString() || "",
      transport_allowance: emp.transport_allowance?.toString() || "", id_expiry_date: emp.id_expiry_date || "",
      contract_expiry_date: emp.contract_expiry_date || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_number || !form.first_name_ar || !form.last_name_ar) {
      toast.error(language === "ar" ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields"); return;
    }
    setSaving(true);
    const payload: any = {
      ...form, company_id: companyId,
      basic_salary: parseFloat(form.basic_salary) || 0, housing_allowance: parseFloat(form.housing_allowance) || 0,
      transport_allowance: parseFloat(form.transport_allowance) || 0,
      department_id: form.department_id || null, branch_id: form.branch_id || null,
      id_expiry_date: form.id_expiry_date || null, contract_expiry_date: form.contract_expiry_date || null,
    };
    if (editingId) {
      const { error } = await supabase.from("employees").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم تحديث بيانات الموظف" : "Employee updated");
    } else {
      const { error } = await supabase.from("employees").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم إضافة الموظف بنجاح" : "Employee added successfully");
    }
    setSaving(false); setDialogOpen(false); setForm({ ...emptyForm }); setEditingId(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("employees").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم حذف الموظف" : "Employee deleted"); fetchData(); }
    setDeleteId(null);
  };

  const handleExportCSV = () => {
    const rows = filtered.map((e) => ({
      "Employee #": e.employee_number, Name: `${e.first_name_ar} ${e.last_name_ar}`,
      Email: e.email || "", Phone: e.phone || "",
      Department: e.departments ? (language === "ar" ? e.departments.name_ar : e.departments.name_en) : "",
      Position: language === "ar" ? e.position_ar : e.position_en || "", "Hire Date": e.hire_date, Status: e.status,
    }));
    exportCSV(rows, "employees.csv");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: language === "ar" ? "نشط" : "Active", variant: "default" },
      on_leave: { label: language === "ar" ? "في إجازة" : "On Leave", variant: "secondary" },
      terminated: { label: language === "ar" ? "منتهي الخدمة" : "Terminated", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const activeCount = employees.filter(e => e.status === "active").length;
  const onLeaveCount = employees.filter(e => e.status === "on_leave").length;
  const terminatedCount = employees.filter(e => e.status === "terminated").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label={language === "ar" ? "إجمالي الموظفين" : "Total Employees"} value={employees.length} />
        <StatCard icon={Users} label={language === "ar" ? "نشط" : "Active"} value={activeCount} color="text-green-600" />
        <StatCard icon={Users} label={language === "ar" ? "في إجازة" : "On Leave"} value={onLeaveCount} color="text-yellow-600" />
        <StatCard icon={Users} label={language === "ar" ? "منتهي الخدمة" : "Terminated"} value={terminatedCount} color="text-destructive" />
      </div>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("employees.title")}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 me-2" />{language === "ar" ? "تصدير CSV" : "Export CSV"}</Button>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-2" />{t("employees.addNew")}</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل بيانات الموظف" : "Edit Employee") : t("employees.addNew")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>{language === "ar" ? "الرقم الوظيفي *" : "Employee Number *"}</Label><Input value={form.employee_number} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم الأول (عربي) *" : "First Name (AR) *"}</Label><Input value={form.first_name_ar} onChange={(e) => setForm({ ...form, first_name_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم الأخير (عربي) *" : "Last Name (AR) *"}</Label><Input value={form.last_name_ar} onChange={(e) => setForm({ ...form, last_name_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم الأول (إنجليزي)" : "First Name (EN)"}</Label><Input value={form.first_name_en} onChange={(e) => setForm({ ...form, first_name_en: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم الأخير (إنجليزي)" : "Last Name (EN)"}</Label><Input value={form.last_name_en} onChange={(e) => setForm({ ...form, last_name_en: e.target.value })} /></div>
            <div><Label>{t("auth.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الهاتف" : "Phone"}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "رقم الهوية" : "National ID"}</Label><Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الجنسية" : "Nationality"}</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            <div>
              <Label>{t("employees.department")}</Label>
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر القسم" : "Select department"} /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{language === "ar" ? d.name_ar : d.name_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === "ar" ? "الفرع" : "Branch"}</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر الفرع" : "Select branch"} /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{language === "ar" ? b.name_ar : b.name_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("employees.position")}</Label><Input value={form.position_ar} onChange={(e) => setForm({ ...form, position_ar: e.target.value })} placeholder={language === "ar" ? "المسمى بالعربي" : "Position AR"} /></div>
            <div><Label>{language === "ar" ? "المسمى (إنجليزي)" : "Position (EN)"}</Label><Input value={form.position_en} onChange={(e) => setForm({ ...form, position_en: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "تاريخ التعيين" : "Hire Date"}</Label><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
            <div>
              <Label>{language === "ar" ? "نوع العقد" : "Contract Type"}</Label>
              <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">{language === "ar" ? "دوام كامل" : "Full Time"}</SelectItem>
                  <SelectItem value="part_time">{language === "ar" ? "دوام جزئي" : "Part Time"}</SelectItem>
                  <SelectItem value="contract">{language === "ar" ? "عقد" : "Contract"}</SelectItem>
                  <SelectItem value="temporary">{language === "ar" ? "مؤقت" : "Temporary"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{language === "ar" ? "الراتب الأساسي" : "Basic Salary"}</Label><Input type="number" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "بدل السكن" : "Housing Allowance"}</Label><Input type="number" value={form.housing_allowance} onChange={(e) => setForm({ ...form, housing_allowance: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "بدل النقل" : "Transport Allowance"}</Label><Input type="number" value={form.transport_allowance} onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "تاريخ انتهاء الهوية" : "ID Expiry Date"}</Label><Input type="date" value={form.id_expiry_date} onChange={(e) => setForm({ ...form, id_expiry_date: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "تاريخ انتهاء العقد" : "Contract Expiry Date"}</Label><Input type="date" value={form.contract_expiry_date} onChange={(e) => setForm({ ...form, contract_expiry_date: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : t("common.save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this employee? This action cannot be undone."}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("common.search")} value={search} onChange={(e) => { setSearch(e.target.value); pagination.resetPage(); }} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">{t("app.loading")}</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("employees.employeeId")}</TableHead>
                        <TableHead>{t("employees.name")}</TableHead>
                        <TableHead>{t("employees.department")}</TableHead>
                        <TableHead>{t("employees.position")}</TableHead>
                        <TableHead>{t("employees.joinDate")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead className="w-20">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.items.map((emp: any) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-mono">{emp.employee_number}</TableCell>
                          <TableCell className="font-medium">
                            {language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`}
                          </TableCell>
                          <TableCell>{emp.departments ? (language === "ar" ? emp.departments.name_ar : emp.departments.name_en) : "-"}</TableCell>
                          <TableCell>{language === "ar" ? emp.position_ar : (emp.position_en || emp.position_ar) || "-"}</TableCell>
                          <TableCell>{emp.hire_date}</TableCell>
                          <TableCell>{statusBadge(emp.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(emp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <TablePagination {...pagination} language={language} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

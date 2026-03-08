import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, Clock, Pencil, Trash2 } from "lucide-react";

export default function Attendance() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ employee_id: "", date: new Date().toISOString().split("T")[0], check_in: "", check_out: "", status: "present" });
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    setLoading(true);
    const [aRes, eRes] = await Promise.all([
      supabase.from("attendance").select("*, employees(first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number)").eq("date", dateFilter).order("created_at", { ascending: false }),
      supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number").eq("status", "active"),
    ]);
    if (aRes.data) setRecords(aRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [dateFilter]);

  const openAdd = () => { setEditingId(null); setForm({ employee_id: "", date: dateFilter, check_in: "", check_out: "", status: "present" }); setDialogOpen(true); };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      employee_id: r.employee_id,
      date: r.date,
      check_in: r.check_in ? new Date(r.check_in).toTimeString().slice(0, 5) : "",
      check_out: r.check_out ? new Date(r.check_out).toTimeString().slice(0, 5) : "",
      status: r.status || "present",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_id) { toast.error(language === "ar" ? "اختر الموظف" : "Select employee"); return; }
    const payload: any = { employee_id: form.employee_id, date: form.date, status: form.status, company_id: companyId };
    if (form.check_in) payload.check_in = `${form.date}T${form.check_in}:00`;
    else payload.check_in = null;
    if (form.check_out) payload.check_out = `${form.date}T${form.check_out}:00`;
    else payload.check_out = null;

    if (editingId) {
      const { error } = await supabase.from("attendance").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("attendance").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم تسجيل الحضور" : "Attendance recorded");
    }
    setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("attendance").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  const empName = (emp: any) => language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;

  const statusColor = (s: string) => {
    if (s === "present") return "default";
    if (s === "late") return "secondary";
    if (s === "absent") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "الحضور والانصراف" : "Attendance"}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "تسجيل حضور" : "Record"}</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل الحضور" : "Edit Attendance") : (language === "ar" ? "تسجيل حضور" : "Record Attendance")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{language === "ar" ? "الموظف" : "Employee"}</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر الموظف" : "Select employee"} /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employee_number} - {empName(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{language === "ar" ? "التاريخ" : "Date"}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "وقت الحضور" : "Check In"}</Label><Input type="time" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "وقت الانصراف" : "Check Out"}</Label><Input type="time" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></div>
            <div>
              <Label>{language === "ar" ? "الحالة" : "Status"}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">{language === "ar" ? "حاضر" : "Present"}</SelectItem>
                  <SelectItem value="late">{language === "ar" ? "متأخر" : "Late"}</SelectItem>
                  <SelectItem value="absent">{language === "ar" ? "غائب" : "Absent"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure you want to delete this record?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"}
        cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete}
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : records.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد سجلات لهذا اليوم" : "No records for this date"}</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-[650px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "الرقم الوظيفي" : "ID"}</TableHead>
                      <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                      <TableHead>{language === "ar" ? "الحضور" : "Check In"}</TableHead>
                      <TableHead>{language === "ar" ? "الانصراف" : "Check Out"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="w-20">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.employees?.employee_number}</TableCell>
                        <TableCell>{r.employees ? empName(r.employees) : "-"}</TableCell>
                        <TableCell>{r.check_in ? new Date(r.check_in).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                        <TableCell>{r.check_out ? new Date(r.check_out).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                        <TableCell><Badge variant={statusColor(r.status) as any}>{r.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

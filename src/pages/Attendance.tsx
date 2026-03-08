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
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { toast } from "sonner";
import { Plus, Clock, Pencil, Trash2, Users, UserX, AlertTriangle, UsersRound } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { StatsSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function calcHours(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return "-";
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (diff <= 0) return "-";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function Attendance() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ employee_id: "", date: new Date().toISOString().split("T")[0], check_in: "", check_out: "", status: "present" });
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  // Bulk attendance
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkCheckIn, setBulkCheckIn] = useState("08:00");
  const [bulkStatus, setBulkStatus] = useState("present");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const pagination = usePagination(records, 10);

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

  useEffect(() => { fetchData(); pagination.resetPage(); }, [dateFilter]);

  const openAdd = () => { setEditingId(null); setForm({ employee_id: "", date: dateFilter, check_in: "", check_out: "", status: "present" }); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      employee_id: r.employee_id, date: r.date,
      check_in: r.check_in ? new Date(r.check_in).toTimeString().slice(0, 5) : "",
      check_out: r.check_out ? new Date(r.check_out).toTimeString().slice(0, 5) : "",
      status: r.status || "present",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_id) { toast.error(language === "ar" ? "اختر الموظف" : "Select employee"); return; }
    setSaving(true);
    const payload: any = { employee_id: form.employee_id, date: form.date, status: form.status, company_id: companyId };
    if (form.check_in) payload.check_in = `${form.date}T${form.check_in}:00`;
    else payload.check_in = null;
    if (form.check_out) payload.check_out = `${form.date}T${form.check_out}:00`;
    else payload.check_out = null;

    if (editingId) {
      const { error } = await supabase.from("attendance").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("attendance").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم تسجيل الحضور" : "Attendance recorded");
    }
    setSaving(false); setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleBulkSave = async () => {
    if (selectedEmployees.length === 0) { toast.error(language === "ar" ? "اختر الموظفين" : "Select employees"); return; }
    setBulkSaving(true);
    const rows = selectedEmployees.map(eid => ({
      employee_id: eid, date: bulkDate, status: bulkStatus, company_id: companyId,
      check_in: bulkCheckIn ? `${bulkDate}T${bulkCheckIn}:00` : null,
      check_out: null,
    }));
    const { error } = await supabase.from("attendance").insert(rows);
    if (error) toast.error(error.message);
    else toast.success(language === "ar" ? `تم تسجيل حضور ${selectedEmployees.length} موظف` : `Recorded attendance for ${selectedEmployees.length} employees`);
    setBulkSaving(false); setBulkOpen(false); setSelectedEmployees([]); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("attendance").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  const empName = (emp: any) => language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;
  const statusColor = (s: string) => { if (s === "present") return "default"; if (s === "late") return "secondary"; if (s === "absent") return "destructive"; return "outline"; };
  const statusLabel = (s: string) => {
    const map: Record<string, { ar: string; en: string }> = { present: { ar: "حاضر", en: "Present" }, late: { ar: "متأخر", en: "Late" }, absent: { ar: "غائب", en: "Absent" } };
    return language === "ar" ? map[s]?.ar || s : map[s]?.en || s;
  };

  const presentCount = records.filter(r => r.status === "present").length;
  const absentCount = records.filter(r => r.status === "absent").length;
  const lateCount = records.filter(r => r.status === "late").length;

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelectedEmployees(prev => prev.length === employees.length ? [] : employees.map(e => e.id));
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label={language === "ar" ? "إجمالي السجلات" : "Total Records"} value={records.length} />
        <StatCard icon={Clock} label={language === "ar" ? "حاضر" : "Present"} value={presentCount} color="text-green-600" />
        <StatCard icon={UserX} label={language === "ar" ? "غائب" : "Absent"} value={absentCount} color="text-destructive" />
        <StatCard icon={AlertTriangle} label={language === "ar" ? "متأخر" : "Late"} value={lateCount} color="text-yellow-600" />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "الحضور والانصراف" : "Attendance"}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "تسجيل حضور" : "Record"}</Button>
          <Button size="sm" variant="outline" onClick={() => { setBulkDate(dateFilter); setBulkOpen(true); }}><UsersRound className="h-4 w-4 me-2" />{language === "ar" ? "تسجيل جماعي" : "Bulk"}</Button>
        </div>
      </div>

      {/* Single record dialog */}
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
            {form.check_in && form.check_out && (
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {language === "ar" ? "ساعات العمل:" : "Hours:"} {calcHours(`${form.date}T${form.check_in}:00`, `${form.date}T${form.check_out}:00`)}</p>
            )}
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
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk attendance dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{language === "ar" ? "تسجيل حضور جماعي" : "Bulk Attendance"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "التاريخ" : "Date"}</Label><Input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} /></div>
              <div><Label>{language === "ar" ? "وقت الحضور" : "Check In"}</Label><Input type="time" value={bulkCheckIn} onChange={(e) => setBulkCheckIn(e.target.value)} /></div>
            </div>
            <div>
              <Label>{language === "ar" ? "الحالة" : "Status"}</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">{language === "ar" ? "حاضر" : "Present"}</SelectItem>
                  <SelectItem value="late">{language === "ar" ? "متأخر" : "Late"}</SelectItem>
                  <SelectItem value="absent">{language === "ar" ? "غائب" : "Absent"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{language === "ar" ? "الموظفين" : "Employees"} ({selectedEmployees.length}/{employees.length})</Label>
                <Button variant="ghost" size="sm" onClick={toggleAll}>{selectedEmployees.length === employees.length ? (language === "ar" ? "إلغاء الكل" : "Deselect All") : (language === "ar" ? "تحديد الكل" : "Select All")}</Button>
              </div>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {employees.map(e => (
                  <label key={e.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer border-b last:border-0">
                    <Checkbox checked={selectedEmployees.includes(e.id)} onCheckedChange={() => toggleEmployee(e.id)} />
                    <span className="text-sm">{e.employee_number} - {empName(e)}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleBulkSave} disabled={bulkSaving} className="w-full">
              {bulkSaving ? (language === "ar" ? "جاري التسجيل..." : "Recording...") : (language === "ar" ? `تسجيل حضور ${selectedEmployees.length} موظف` : `Record ${selectedEmployees.length} employees`)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure you want to delete this record?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete} />

      <Card>
        <CardContent className="pt-6">
          {loading ? <StatsSkeleton count={4} /> : records.length === 0 ? (
            <EmptyState icon={Clock} title={language === "ar" ? "لا توجد سجلات لهذا اليوم" : "No records for this date"} description={language === "ar" ? "قم بتسجيل حضور الموظفين" : "Record employee attendance"} actionLabel={language === "ar" ? "تسجيل حضور" : "Record"} onAction={openAdd} />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                <div className="min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "الرقم الوظيفي" : "ID"}</TableHead>
                        <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                        <TableHead>{language === "ar" ? "الحضور" : "Check In"}</TableHead>
                        <TableHead>{language === "ar" ? "الانصراف" : "Check Out"}</TableHead>
                        <TableHead>{language === "ar" ? "الساعات" : "Hours"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="w-20">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.items.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono">{r.employees?.employee_number}</TableCell>
                          <TableCell>{r.employees ? empName(r.employees) : "-"}</TableCell>
                          <TableCell>{r.check_in ? new Date(r.check_in).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                          <TableCell>{r.check_out ? new Date(r.check_out).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{calcHours(r.check_in, r.check_out)}</TableCell>
                          <TableCell><Badge variant={statusColor(r.status) as any}>{statusLabel(r.status)}</Badge></TableCell>
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

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {pagination.items.map((r: any) => (
                  <div key={r.id} className="border rounded-lg p-3 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.employees ? empName(r.employees) : "-"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.employees?.employee_number}</p>
                      </div>
                      <Badge variant={statusColor(r.status) as any}>{statusLabel(r.status)}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground">{language === "ar" ? "حضور" : "In"}</span><p className="font-medium">{r.check_in ? new Date(r.check_in).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</p></div>
                      <div><span className="text-muted-foreground">{language === "ar" ? "انصراف" : "Out"}</span><p className="font-medium">{r.check_out ? new Date(r.check_out).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</p></div>
                      <div><span className="text-muted-foreground">{language === "ar" ? "الساعات" : "Hours"}</span><p className="font-medium">{calcHours(r.check_in, r.check_out)}</p></div>
                    </div>
                    <div className="flex gap-1 pt-1 border-t">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5 me-1" />{language === "ar" ? "تعديل" : "Edit"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5 me-1" />{language === "ar" ? "حذف" : "Delete"}</Button>
                    </div>
                  </div>
                ))}
              </div>

              <TablePagination {...pagination} language={language} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

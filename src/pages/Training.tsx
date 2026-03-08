import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, GraduationCap, Calendar, Pencil, Trash2, UserPlus, Users } from "lucide-react";

export default function Training() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title_ar: "", title_en: "", description: "", trainer: "", start_date: "", end_date: "", max_participants: "" });

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState<string | null>(null);
  const [enrollEmployeeId, setEnrollEmployeeId] = useState("");
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [viewCourseId, setViewCourseId] = useState<string | null>(null);
  const [deleteEnrollId, setDeleteEnrollId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [cRes, eRes, enRes] = await Promise.all([
      supabase.from("training_courses").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number").eq("status", "active"),
      supabase.from("training_enrollments").select("*, employees(first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number)").order("created_at", { ascending: false }),
    ]);
    if (cRes.data) setCourses(cRes.data);
    if (eRes.data) setEmployees(eRes.data);
    if (enRes.data) setEnrollments(enRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const empName = (emp: any) => language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;

  const openAdd = () => { setEditingId(null); setForm({ title_ar: "", title_en: "", description: "", trainer: "", start_date: "", end_date: "", max_participants: "" }); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ title_ar: c.title_ar || "", title_en: c.title_en || "", description: c.description || "", trainer: c.trainer || "", start_date: c.start_date || "", end_date: c.end_date || "", max_participants: c.max_participants?.toString() || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title_ar) { toast.error(language === "ar" ? "يرجى إدخال العنوان" : "Title required"); return; }
    setSaving(true);
    const payload = { ...form, company_id: companyId, max_participants: form.max_participants ? parseInt(form.max_participants) : null, start_date: form.start_date || null, end_date: form.end_date || null };
    if (editingId) {
      const { error } = await supabase.from("training_courses").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("training_courses").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم إضافة الدورة" : "Course added");
    }
    setSaving(false); setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("training_courses").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  const openEnroll = (courseId: string) => { setEnrollCourseId(courseId); setEnrollEmployeeId(""); setEnrollOpen(true); };

  const handleEnroll = async () => {
    if (!enrollEmployeeId || !enrollCourseId) { toast.error(language === "ar" ? "اختر الموظف" : "Select employee"); return; }
    const exists = enrollments.find(e => e.course_id === enrollCourseId && e.employee_id === enrollEmployeeId);
    if (exists) { toast.error(language === "ar" ? "الموظف مسجل بالفعل" : "Already enrolled"); return; }
    setEnrollSaving(true);
    const { error } = await supabase.from("training_enrollments").insert({ course_id: enrollCourseId, employee_id: enrollEmployeeId, company_id: companyId });
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم التسجيل" : "Enrolled"); setEnrollOpen(false); fetchData(); }
    setEnrollSaving(false);
  };

  const handleDeleteEnroll = async () => {
    if (!deleteEnrollId) return;
    const { error } = await supabase.from("training_enrollments").delete().eq("id", deleteEnrollId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم إلغاء التسجيل" : "Unenrolled"); fetchData(); }
    setDeleteEnrollId(null);
  };

  const getEnrollmentCount = (courseId: string) => enrollments.filter(e => e.course_id === courseId).length;
  const getCourseEnrollments = (courseId: string) => enrollments.filter(e => e.course_id === courseId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "التدريب" : "Training"}</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "دورة جديدة" : "New Course"}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل الدورة" : "Edit Course") : (language === "ar" ? "إضافة دورة تدريبية" : "Add Training Course")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "العنوان بالعربي *" : "Title (AR) *"}</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "العنوان بالإنجليزي" : "Title (EN)"}</Label><Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "المدرب" : "Trainer"}</Label><Input value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "تاريخ البدء" : "Start"}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>{language === "ar" ? "تاريخ الانتهاء" : "End"}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label>{language === "ar" ? "الحد الأقصى" : "Max Participants"}</Label><Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === "ar" ? "تسجيل موظف في الدورة" : "Enroll Employee"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{language === "ar" ? "الموظف" : "Employee"}</Label>
              <Select value={enrollEmployeeId} onValueChange={setEnrollEmployeeId}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر الموظف" : "Select employee"} /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employee_number} - {empName(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleEnroll} disabled={enrollSaving} className="w-full">{enrollSaving ? (language === "ar" ? "جاري التسجيل..." : "Enrolling...") : (language === "ar" ? "تسجيل" : "Enroll")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewCourseId} onOpenChange={(o) => !o && setViewCourseId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === "ar" ? "المسجلين في الدورة" : "Course Enrollments"}</DialogTitle></DialogHeader>
          {viewCourseId && getCourseEnrollments(viewCourseId).length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">{language === "ar" ? "لا يوجد مسجلين" : "No enrollments"}</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead><TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
              <TableBody>
                {viewCourseId && getCourseEnrollments(viewCourseId).map((en) => (
                  <TableRow key={en.id}>
                    <TableCell>{en.employees ? empName(en.employees) : "-"}</TableCell>
                    <TableCell><Badge variant={en.status === "completed" ? "default" : "secondary"}>{en.status === "enrolled" ? (language === "ar" ? "مسجل" : "Enrolled") : en.status === "completed" ? (language === "ar" ? "مكتمل" : "Completed") : en.status}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => setDeleteEnrollId(en.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذه الدورة؟" : "Are you sure you want to delete this course?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete} />

      <ConfirmDialog open={!!deleteEnrollId} onOpenChange={(o) => !o && setDeleteEnrollId(null)}
        title={language === "ar" ? "إلغاء التسجيل" : "Remove Enrollment"}
        description={language === "ar" ? "هل أنت متأكد من إلغاء تسجيل هذا الموظف؟" : "Remove this employee from the course?"}
        confirmLabel={language === "ar" ? "إلغاء التسجيل" : "Remove"} cancelLabel={language === "ar" ? "تراجع" : "Cancel"}
        onConfirm={handleDeleteEnroll} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : courses.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد دورات" : "No courses"}</p>
        ) : courses.map((c) => {
          const count = getEnrollmentCount(c.id);
          return (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{language === "ar" ? c.title_ar : (c.title_en || c.title_ar)}</CardTitle>
                  <Badge variant={c.status === "scheduled" ? "default" : "secondary"}>{c.status === "scheduled" ? (language === "ar" ? "مجدول" : "Scheduled") : c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.trainer && <p className="text-sm"><span className="text-muted-foreground">{language === "ar" ? "المدرب:" : "Trainer:"}</span> {c.trainer}</p>}
                {c.start_date && <p className="text-sm flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.start_date} → {c.end_date}</p>}
                <p className="text-sm flex items-center gap-1"><Users className="h-3 w-3" /> {count}{c.max_participants ? `/${c.max_participants}` : ""} {language === "ar" ? "مسجل" : "enrolled"}</p>
                {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                <div className="flex gap-1 border-t pt-3 mt-3 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => openEnroll(c.id)}><UserPlus className="h-4 w-4 me-1" />{language === "ar" ? "تسجيل" : "Enroll"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setViewCourseId(c.id)}><Users className="h-4 w-4 me-1" />{language === "ar" ? "المسجلين" : "View"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4 me-1" />{language === "ar" ? "تعديل" : "Edit"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 me-1" />{language === "ar" ? "حذف" : "Delete"}</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

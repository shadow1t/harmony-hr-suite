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
import { Plus, TrendingUp, Target, Pencil, Trash2, UserPlus, Users, Star, BarChart3, ClipboardCheck } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function Performance() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [cycles, setCycles] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_ar: "", name_en: "", start_date: "", end_date: "" });

  const [evalOpen, setEvalOpen] = useState(false);
  const [evalCycleId, setEvalCycleId] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState({ employee_id: "", score: "", comments: "", self_score: "", self_comments: "" });
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [evalSaving, setEvalSaving] = useState(false);
  const [viewCycleId, setViewCycleId] = useState<string | null>(null);
  const [deleteEvalId, setDeleteEvalId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [cRes, evRes, eRes] = await Promise.all([
      supabase.from("evaluation_cycles").select("*").order("created_at", { ascending: false }),
      supabase.from("evaluations").select("*, employees(first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number)").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number").eq("status", "active"),
    ]);
    if (cRes.data) setCycles(cRes.data);
    if (evRes.data) setEvaluations(evRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const empName = (emp: any) => language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;

  const openAdd = () => { setEditingId(null); setForm({ name_ar: "", name_en: "", start_date: "", end_date: "" }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditingId(c.id); setForm({ name_ar: c.name_ar || "", name_en: c.name_en || "", start_date: c.start_date || "", end_date: c.end_date || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name_ar || !form.start_date || !form.end_date) { toast.error(language === "ar" ? "يرجى تعبئة الحقول" : "Fill all fields"); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("evaluation_cycles").update(form).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("evaluation_cycles").insert({ ...form, company_id: companyId });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم إنشاء الدورة" : "Cycle created");
    }
    setSaving(false); setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleDeleteCycle = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("evaluation_cycles").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  const openAddEval = (cycleId: string) => {
    setEvalCycleId(cycleId); setEditingEvalId(null);
    setEvalForm({ employee_id: "", score: "", comments: "", self_score: "", self_comments: "" });
    setEvalOpen(true);
  };

  const openEditEval = (ev: any) => {
    setEvalCycleId(ev.cycle_id); setEditingEvalId(ev.id);
    setEvalForm({ employee_id: ev.employee_id, score: ev.score?.toString() || "", comments: ev.comments || "", self_score: ev.self_score?.toString() || "", self_comments: ev.self_comments || "" });
    setEvalOpen(true);
  };

  const handleSaveEval = async () => {
    if (!evalForm.employee_id || !evalCycleId) { toast.error(language === "ar" ? "اختر الموظف" : "Select employee"); return; }
    setEvalSaving(true);
    const payload = {
      cycle_id: evalCycleId, employee_id: evalForm.employee_id, company_id: companyId,
      score: evalForm.score ? parseFloat(evalForm.score) : null, comments: evalForm.comments || null,
      self_score: evalForm.self_score ? parseFloat(evalForm.self_score) : null, self_comments: evalForm.self_comments || null,
      status: evalForm.score ? "completed" : "pending",
    };
    if (editingEvalId) {
      const { error } = await supabase.from("evaluations").update(payload).eq("id", editingEvalId);
      if (error) { toast.error(error.message); setEvalSaving(false); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const exists = evaluations.find(e => e.cycle_id === evalCycleId && e.employee_id === evalForm.employee_id);
      if (exists) { toast.error(language === "ar" ? "يوجد تقييم لهذا الموظف بالفعل" : "Evaluation already exists"); setEvalSaving(false); return; }
      const { error } = await supabase.from("evaluations").insert(payload);
      if (error) { toast.error(error.message); setEvalSaving(false); return; }
      toast.success(language === "ar" ? "تم إضافة التقييم" : "Evaluation added");
    }
    setEvalSaving(false); setEvalOpen(false); setEditingEvalId(null); fetchData();
  };

  const handleDeleteEval = async () => {
    if (!deleteEvalId) return;
    const { error } = await supabase.from("evaluations").delete().eq("id", deleteEvalId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteEvalId(null);
  };

  const getCycleEvals = (cycleId: string) => evaluations.filter(e => e.cycle_id === cycleId);
  const getAvgScore = (cycleId: string) => {
    const evals = getCycleEvals(cycleId).filter(e => e.score);
    if (evals.length === 0) return null;
    return (evals.reduce((s, e) => s + Number(e.score), 0) / evals.length).toFixed(1);
  };

  const completedEvals = evaluations.filter(e => e.status === "completed").length;
  const pendingEvals = evaluations.filter(e => e.status === "pending").length;
  const allScores = evaluations.filter(e => e.score).map(e => Number(e.score));
  const avgAllScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "-";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Target} label={language === "ar" ? "دورات التقييم" : "Cycles"} value={cycles.length} />
        <StatCard icon={ClipboardCheck} label={language === "ar" ? "تقييمات مكتملة" : "Completed"} value={completedEvals} color="text-green-600" />
        <StatCard icon={Users} label={language === "ar" ? "تقييمات معلقة" : "Pending"} value={pendingEvals} color="text-yellow-600" />
        <StatCard icon={BarChart3} label={language === "ar" ? "متوسط الدرجات" : "Avg Score"} value={avgAllScore} color="text-primary" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "تقييم الأداء" : "Performance"}</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "دورة تقييم جديدة" : "New Cycle"}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل دورة التقييم" : "Edit Cycle") : (language === "ar" ? "دورة تقييم جديدة" : "New Evaluation Cycle")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "الاسم بالعربي *" : "Name (AR) *"}</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم بالإنجليزي" : "Name (EN)"}</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "تاريخ البدء *" : "Start *"}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>{language === "ar" ? "تاريخ الانتهاء *" : "End *"}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEvalId ? (language === "ar" ? "تعديل التقييم" : "Edit Evaluation") : (language === "ar" ? "إضافة تقييم موظف" : "Add Evaluation")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{language === "ar" ? "الموظف" : "Employee"}</Label>
              <Select value={evalForm.employee_id} onValueChange={(v) => setEvalForm({ ...evalForm, employee_id: v })} disabled={!!editingEvalId}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر الموظف" : "Select employee"} /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employee_number} - {empName(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "درجة التقييم (1-10)" : "Score (1-10)"}</Label><Input type="number" min="1" max="10" value={evalForm.score} onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })} /></div>
              <div><Label>{language === "ar" ? "التقييم الذاتي (1-10)" : "Self Score (1-10)"}</Label><Input type="number" min="1" max="10" value={evalForm.self_score} onChange={(e) => setEvalForm({ ...evalForm, self_score: e.target.value })} /></div>
            </div>
            <div><Label>{language === "ar" ? "ملاحظات المقيّم" : "Evaluator Comments"}</Label><Textarea value={evalForm.comments} onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "ملاحظات الموظف" : "Self Comments"}</Label><Textarea value={evalForm.self_comments} onChange={(e) => setEvalForm({ ...evalForm, self_comments: e.target.value })} /></div>
            <Button onClick={handleSaveEval} disabled={evalSaving} className="w-full">{evalSaving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewCycleId} onOpenChange={(o) => !o && setViewCycleId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{language === "ar" ? "التقييمات" : "Evaluations"}</DialogTitle></DialogHeader>
          {viewCycleId && getCycleEvals(viewCycleId).length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">{language === "ar" ? "لا توجد تقييمات" : "No evaluations"}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                  <TableHead>{language === "ar" ? "الدرجة" : "Score"}</TableHead>
                  <TableHead>{language === "ar" ? "التقييم الذاتي" : "Self"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewCycleId && getCycleEvals(viewCycleId).map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{ev.employees ? empName(ev.employees) : "-"}</TableCell>
                    <TableCell className="font-bold">{ev.score ?? "-"}/10</TableCell>
                    <TableCell>{ev.self_score ?? "-"}/10</TableCell>
                    <TableCell><Badge variant={ev.status === "completed" ? "default" : "secondary"}>{ev.status === "completed" ? (language === "ar" ? "مكتمل" : "Done") : (language === "ar" ? "معلق" : "Pending")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setViewCycleId(null); openEditEval(ev); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteEvalId(ev.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف دورة التقييم وجميع تقييماتها؟" : "Delete this cycle and all its evaluations?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDeleteCycle} />

      <ConfirmDialog open={!!deleteEvalId} onOpenChange={(o) => !o && setDeleteEvalId(null)}
        title={language === "ar" ? "حذف التقييم" : "Delete Evaluation"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا التقييم؟" : "Are you sure you want to delete this evaluation?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDeleteEval} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : cycles.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد دورات تقييم" : "No evaluation cycles"}</p>
        ) : cycles.map((c) => {
          const evalCount = getCycleEvals(c.id).length;
          const avg = getAvgScore(c.id);
          return (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{language === "ar" ? c.name_ar : (c.name_en || c.name_ar)}</CardTitle>
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status === "active" ? (language === "ar" ? "نشط" : "Active") : c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.start_date} → {c.end_date}</p>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-sm flex items-center gap-1"><Users className="h-3 w-3" /> {evalCount} {language === "ar" ? "تقييم" : "evaluations"}</p>
                  {avg && <p className="text-sm flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {language === "ar" ? "المعدل:" : "Avg:"} {avg}/10</p>}
                </div>
                <div className="flex gap-1 border-t pt-3 mt-3 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => openAddEval(c.id)}><UserPlus className="h-4 w-4 me-1" />{language === "ar" ? "تقييم" : "Evaluate"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setViewCycleId(c.id)}><Users className="h-4 w-4 me-1" />{language === "ar" ? "التقييمات" : "View"}</Button>
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

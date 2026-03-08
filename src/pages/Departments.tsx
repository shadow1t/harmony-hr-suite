import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, Building2, Trash2, Pencil } from "lucide-react";

export default function Departments() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dept state
  const [deptOpen, setDeptOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({ name_ar: "", name_en: "", description_ar: "", description_en: "" });

  // Branch state
  const [branchOpen, setBranchOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [deleteBranchId, setDeleteBranchId] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({ name_ar: "", name_en: "", city: "", address: "", phone: "" });

  const fetchData = async () => {
    setLoading(true);
    const [d, b] = await Promise.all([
      supabase.from("departments").select("*").order("created_at"),
      supabase.from("branches").select("*").order("created_at"),
    ]);
    if (d.data) setDepartments(d.data);
    if (b.data) setBranches(b.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Department CRUD
  const openAddDept = () => { setEditingDeptId(null); setDeptForm({ name_ar: "", name_en: "", description_ar: "", description_en: "" }); setDeptOpen(true); };
  const openEditDept = (d: any) => { setEditingDeptId(d.id); setDeptForm({ name_ar: d.name_ar, name_en: d.name_en, description_ar: d.description_ar || "", description_en: d.description_en || "" }); setDeptOpen(true); };

  const saveDept = async () => {
    if (!deptForm.name_ar || !deptForm.name_en) { toast.error(language === "ar" ? "يرجى تعبئة الاسم" : "Name required"); return; }
    if (editingDeptId) {
      const { error } = await supabase.from("departments").update(deptForm).eq("id", editingDeptId);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("departments").insert({ ...deptForm, company_id: companyId });
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم إضافة القسم" : "Department added");
    }
    setDeptOpen(false); setEditingDeptId(null); fetchData();
  };

  const confirmDeleteDept = async () => {
    if (!deleteDeptId) return;
    const { error } = await supabase.from("departments").delete().eq("id", deleteDeptId);
    if (error) toast.error(error.message); else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteDeptId(null);
  };

  // Branch CRUD
  const openAddBranch = () => { setEditingBranchId(null); setBranchForm({ name_ar: "", name_en: "", city: "", address: "", phone: "" }); setBranchOpen(true); };
  const openEditBranch = (b: any) => { setEditingBranchId(b.id); setBranchForm({ name_ar: b.name_ar, name_en: b.name_en, city: b.city || "", address: b.address || "", phone: b.phone || "" }); setBranchOpen(true); };

  const saveBranch = async () => {
    if (!branchForm.name_ar || !branchForm.name_en) { toast.error(language === "ar" ? "يرجى تعبئة الاسم" : "Name required"); return; }
    if (editingBranchId) {
      const { error } = await supabase.from("branches").update(branchForm).eq("id", editingBranchId);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("branches").insert({ ...branchForm, company_id: companyId });
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم إضافة الفرع" : "Branch added");
    }
    setBranchOpen(false); setEditingBranchId(null); fetchData();
  };

  const confirmDeleteBranch = async () => {
    if (!deleteBranchId) return;
    const { error } = await supabase.from("branches").delete().eq("id", deleteBranchId);
    if (error) toast.error(error.message); else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteBranchId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{language === "ar" ? "الأقسام والفروع" : "Departments & Branches"}</h1>

      {/* Department Dialog */}
      <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDeptId ? (language === "ar" ? "تعديل القسم" : "Edit Department") : (language === "ar" ? "إضافة قسم" : "Add Department")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "الاسم بالعربي *" : "Name (AR) *"}</Label><Input value={deptForm.name_ar} onChange={(e) => setDeptForm({ ...deptForm, name_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم بالإنجليزي *" : "Name (EN) *"}</Label><Input value={deptForm.name_en} onChange={(e) => setDeptForm({ ...deptForm, name_en: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الوصف بالعربي" : "Description (AR)"}</Label><Input value={deptForm.description_ar} onChange={(e) => setDeptForm({ ...deptForm, description_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الوصف بالإنجليزي" : "Description (EN)"}</Label><Input value={deptForm.description_en} onChange={(e) => setDeptForm({ ...deptForm, description_en: e.target.value })} /></div>
            <Button onClick={saveDept} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branch Dialog */}
      <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBranchId ? (language === "ar" ? "تعديل الفرع" : "Edit Branch") : (language === "ar" ? "إضافة فرع" : "Add Branch")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "الاسم بالعربي *" : "Name (AR) *"}</Label><Input value={branchForm.name_ar} onChange={(e) => setBranchForm({ ...branchForm, name_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم بالإنجليزي *" : "Name (EN) *"}</Label><Input value={branchForm.name_en} onChange={(e) => setBranchForm({ ...branchForm, name_en: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "المدينة" : "City"}</Label><Input value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "العنوان" : "Address"}</Label><Input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الهاتف" : "Phone"}</Label><Input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
            <Button onClick={saveBranch} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <ConfirmDialog open={!!deleteDeptId} onOpenChange={(o) => !o && setDeleteDeptId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا القسم؟" : "Are you sure you want to delete this department?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={confirmDeleteDept} />
      <ConfirmDialog open={!!deleteBranchId} onOpenChange={(o) => !o && setDeleteBranchId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا الفرع؟" : "Are you sure you want to delete this branch?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={confirmDeleteBranch} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {language === "ar" ? "الأقسام" : "Departments"}</CardTitle>
            <Button size="sm" onClick={openAddDept}><Plus className="h-4 w-4 me-1" />{language === "ar" ? "إضافة" : "Add"}</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-center py-4">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead><TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {departments.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{language === "ar" ? d.name_ar : d.name_en}</TableCell>
                        <TableCell className="text-muted-foreground">{language === "ar" ? d.description_ar : d.description_en}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDept(d)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteDeptId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {language === "ar" ? "الفروع" : "Branches"}</CardTitle>
            <Button size="sm" onClick={openAddBranch}><Plus className="h-4 w-4 me-1" />{language === "ar" ? "إضافة" : "Add"}</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-center py-4">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead><TableHead>{language === "ar" ? "المدينة" : "City"}</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {branches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{language === "ar" ? b.name_ar : b.name_en}</TableCell>
                        <TableCell>{b.city || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditBranch(b)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteBranchId(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

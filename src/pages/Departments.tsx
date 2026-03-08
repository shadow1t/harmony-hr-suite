import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Building2, Trash2 } from "lucide-react";

export default function Departments() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptOpen, setDeptOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name_ar: "", name_en: "", description_ar: "", description_en: "" });
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

  const addDepartment = async () => {
    if (!deptForm.name_ar || !deptForm.name_en) { toast.error(language === "ar" ? "يرجى تعبئة الاسم" : "Name required"); return; }
    const { error } = await supabase.from("departments").insert({ ...deptForm, company_id: companyId });
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم إضافة القسم" : "Department added"); setDeptOpen(false); setDeptForm({ name_ar: "", name_en: "", description_ar: "", description_en: "" }); fetchData(); }
  };

  const addBranch = async () => {
    if (!branchForm.name_ar || !branchForm.name_en) { toast.error(language === "ar" ? "يرجى تعبئة الاسم" : "Name required"); return; }
    const { error } = await supabase.from("branches").insert({ ...branchForm, company_id: companyId });
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم إضافة الفرع" : "Branch added"); setBranchOpen(false); setBranchForm({ name_ar: "", name_en: "", city: "", address: "", phone: "" }); fetchData(); }
  };

  const deleteDept = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast.error(error.message); else fetchData();
  };

  const deleteBranch = async (id: string) => {
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) toast.error(error.message); else fetchData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{language === "ar" ? "الأقسام والفروع" : "Departments & Branches"}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {language === "ar" ? "الأقسام" : "Departments"}</CardTitle>
            <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 me-1" />{language === "ar" ? "إضافة" : "Add"}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{language === "ar" ? "إضافة قسم" : "Add Department"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>{language === "ar" ? "الاسم بالعربي" : "Name (AR)"}</Label><Input value={deptForm.name_ar} onChange={(e) => setDeptForm({ ...deptForm, name_ar: e.target.value })} /></div>
                  <div><Label>{language === "ar" ? "الاسم بالإنجليزي" : "Name (EN)"}</Label><Input value={deptForm.name_en} onChange={(e) => setDeptForm({ ...deptForm, name_en: e.target.value })} /></div>
                  <div><Label>{language === "ar" ? "الوصف" : "Description"}</Label><Input value={deptForm.description_ar} onChange={(e) => setDeptForm({ ...deptForm, description_ar: e.target.value })} /></div>
                  <Button onClick={addDepartment} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-center py-4">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead><TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {departments.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{language === "ar" ? d.name_ar : d.name_en}</TableCell>
                        <TableCell className="text-muted-foreground">{language === "ar" ? d.description_ar : d.description_en}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteDept(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
            <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 me-1" />{language === "ar" ? "إضافة" : "Add"}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{language === "ar" ? "إضافة فرع" : "Add Branch"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>{language === "ar" ? "الاسم بالعربي" : "Name (AR)"}</Label><Input value={branchForm.name_ar} onChange={(e) => setBranchForm({ ...branchForm, name_ar: e.target.value })} /></div>
                  <div><Label>{language === "ar" ? "الاسم بالإنجليزي" : "Name (EN)"}</Label><Input value={branchForm.name_en} onChange={(e) => setBranchForm({ ...branchForm, name_en: e.target.value })} /></div>
                  <div><Label>{language === "ar" ? "المدينة" : "City"}</Label><Input value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
                  <div><Label>{language === "ar" ? "العنوان" : "Address"}</Label><Input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
                  <div><Label>{language === "ar" ? "الهاتف" : "Phone"}</Label><Input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
                  <Button onClick={addBranch} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-center py-4">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead><TableHead>{language === "ar" ? "المدينة" : "City"}</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {branches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{language === "ar" ? b.name_ar : b.name_en}</TableCell>
                        <TableCell>{b.city || "-"}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteBranch(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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

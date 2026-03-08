import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Ban, CheckCircle } from "lucide-react";

export default function TenantsManagement() {
  const { language } = useLanguage();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (data) {
      // Fetch employee counts per company
      const withCounts = await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", c.id);
          return { ...c, employee_count: count || 0 };
        })
      );
      setCompanies(withCounts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "suspended" : "active";
    const { error } = await supabase.from("companies").update({ status: newStatus }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(language === "ar" ? "تم تحديث الحالة" : "Status updated");
      fetchData();
    }
  };

  const changePlan = async (id: string, plan: string) => {
    const { error } = await supabase.from("companies").update({ subscription_plan: plan }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(language === "ar" ? "تم تحديث الباقة" : "Plan updated");
      fetchData();
    }
  };

  const planBadge = (plan: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      enterprise: "default",
      pro: "secondary",
      basic: "outline",
    };
    return <Badge variant={variants[plan] || "outline"}>{plan}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{language === "ar" ? "إدارة الشركات" : "Tenants Management"}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                  <TableHead>{language === "ar" ? "الباقة" : "Plan"}</TableHead>
                  <TableHead>{language === "ar" ? "الموظفين" : "Employees"}</TableHead>
                  <TableHead>{language === "ar" ? "الحد الأقصى" : "Max"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{language === "ar" ? "تغيير الباقة" : "Change Plan"}</TableHead>
                  <TableHead>{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{language === "ar" ? c.name_ar : c.name_en}</p>
                        {c.domain && <p className="text-xs text-muted-foreground">{c.domain}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{planBadge(c.subscription_plan)}</TableCell>
                    <TableCell>{c.employee_count}</TableCell>
                    <TableCell>{c.max_employees}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "destructive"}>
                        {c.status === "active" ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "موقوف" : "Suspended")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={c.subscription_plan} onValueChange={(v) => changePlan(c.id, v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={c.status === "active" ? "destructive" : "default"}
                        onClick={() => toggleStatus(c.id, c.status)}
                      >
                        {c.status === "active" ? (
                          <><Ban className="h-3 w-3 me-1" />{language === "ar" ? "إيقاف" : "Suspend"}</>
                        ) : (
                          <><CheckCircle className="h-3 w-3 me-1" />{language === "ar" ? "تفعيل" : "Activate"}</>
                        )}
                      </Button>
                    </TableCell>
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

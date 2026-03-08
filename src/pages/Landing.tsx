import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Globe,
  Users,
  Clock,
  Wallet,
  Shield,
  BarChart3,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Star,
  Building2,
} from "lucide-react";

const PLANS = {
  basic: {
    price_id: "price_1T8nO80pFaEvd0qM8KvudOKA",
    product_id: "prod_U71RPQkbyCI2sM",
    price: 29,
    maxEmployees: 20,
  },
  pro: {
    price_id: "price_1T8nP30pFaEvd0qMcOswzli2",
    product_id: "prod_U71R4MRP2FGI9S",
    price: 79,
    maxEmployees: 100,
  },
  enterprise: {
    price_id: "price_1T8nPS0pFaEvd0qMzBzavv8o",
    product_id: "prod_U71S3ch3hz7wBr",
    price: 199,
    maxEmployees: -1,
  },
};

export default function Landing() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const isAr = language === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      navigate("/register");
      return;
    }
    setLoadingPlan(planKey);
    try {
      const plan = PLANS[planKey as keyof typeof PLANS];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    { icon: Users, titleAr: "إدارة الموظفين", titleEn: "Employee Management", descAr: "ملفات شاملة، عقود، وثائق", descEn: "Complete profiles, contracts, documents" },
    { icon: Clock, titleAr: "الحضور والانصراف", titleEn: "Time & Attendance", descAr: "تسجيل تلقائي بنقرة واحدة", descEn: "One-click check-in/out system" },
    { icon: Wallet, titleAr: "مسيرات الرواتب", titleEn: "Payroll Processing", descAr: "حساب تلقائي مع التأمينات", descEn: "Auto-calculate with social insurance" },
    { icon: Shield, titleAr: "عزل البيانات", titleEn: "Data Isolation", descAr: "أمان على مستوى المؤسسة", descEn: "Enterprise-grade tenant isolation" },
    { icon: BarChart3, titleAr: "تقارير ذكية", titleEn: "Smart Reports", descAr: "تصدير CSV وكشوف PDF", descEn: "CSV export & PDF payslips" },
    { icon: GraduationCap, titleAr: "التدريب والتطوير", titleEn: "Training & Development", descAr: "دورات، تقييمات أداء", descEn: "Courses, performance evaluations" },
  ];

  const plans = [
    {
      key: "basic",
      nameAr: "الأساسية",
      nameEn: "Basic",
      icon: Zap,
      featured: false,
      featuresAr: ["حتى 20 موظف", "الحضور والإجازات", "مسيرات الرواتب", "تصدير CSV"],
      featuresEn: ["Up to 20 employees", "Attendance & Leaves", "Payroll processing", "CSV export"],
    },
    {
      key: "pro",
      nameAr: "الاحترافية",
      nameEn: "Pro",
      icon: Star,
      featured: true,
      featuresAr: ["حتى 100 موظف", "كل مميزات الأساسية", "التوظيف والتدريب", "تقييم الأداء", "إشعارات ذكية", "كشوف PDF"],
      featuresEn: ["Up to 100 employees", "All Basic features", "Recruitment & Training", "Performance reviews", "Smart alerts", "PDF payslips"],
    },
    {
      key: "enterprise",
      nameAr: "المؤسسات",
      nameEn: "Enterprise",
      icon: Building2,
      featured: false,
      featuresAr: ["موظفين غير محدود", "كل مميزات الاحترافية", "دعم فني أولوي", "تكاملات مخصصة", "مدير حساب مخصص"],
      featuresEn: ["Unlimited employees", "All Pro features", "Priority support", "Custom integrations", "Dedicated account manager"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">HR</div>
            <span className="font-bold text-lg">HR SaaS</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLanguage(isAr ? "en" : "ar")}>
              <Globe className="h-4 w-4 me-1" /> {isAr ? "EN" : "عربي"}
            </Button>
            {user ? (
              <Button size="sm" onClick={() => navigate("/")}>{isAr ? "لوحة التحكم" : "Dashboard"}</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>{isAr ? "دخول" : "Login"}</Button>
                <Button size="sm" onClick={() => navigate("/register")}>{isAr ? "ابدأ مجاناً" : "Start Free"}</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            {isAr ? "🚀 منصة SaaS متعددة الشركات" : "🚀 Multi-Tenant B2B SaaS Platform"}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            {isAr ? (
              <>أدِر موارد شركتك البشرية <span className="text-primary">بذكاء وكفاءة</span></>
            ) : (
              <>Manage Your HR Operations <span className="text-primary">Smarter & Faster</span></>
            )}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "نظام موارد بشرية سحابي شامل: حضور، إجازات، رواتب، توظيف، وتدريب — كل شيء في مكان واحد."
              : "All-in-one cloud HR system: attendance, leaves, payroll, recruitment, and training — everything in one place."}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="text-base px-8 h-12" onClick={() => navigate(user ? "/" : "/register")}>
              {isAr ? "ابدأ الآن مجاناً" : "Start Free Trial"}
              <Arrow className="h-4 w-4 ms-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              {isAr ? "عرض الباقات" : "View Pricing"}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">{isAr ? "كل ما تحتاجه لإدارة فريقك" : "Everything You Need to Manage Your Team"}</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{isAr ? "مميزات شاملة مصممة للشركات في المنطقة العربية" : "Comprehensive features designed for businesses in the MENA region"}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{isAr ? f.titleAr : f.titleEn}</h3>
                  <p className="text-sm text-muted-foreground">{isAr ? f.descAr : f.descEn}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">{isAr ? "خطط أسعار مرنة" : "Flexible Pricing Plans"}</h2>
            <p className="mt-3 text-muted-foreground">{isAr ? "اختر الباقة المناسبة لحجم شركتك" : "Choose the plan that fits your company size"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const p = PLANS[plan.key as keyof typeof PLANS];
              return (
                <Card key={plan.key} className={`relative flex flex-col ${plan.featured ? "border-primary shadow-xl scale-[1.02]" : ""}`}>
                  {plan.featured && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <Badge className="bg-primary text-primary-foreground px-4">{isAr ? "الأكثر شعبية" : "Most Popular"}</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <plan.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{isAr ? plan.nameAr : plan.nameEn}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold">${p.price}</span>
                      <span className="text-muted-foreground text-sm">/{isAr ? "شهر" : "mo"}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-4">
                    <ul className="space-y-3 flex-1">
                      {(isAr ? plan.featuresAr : plan.featuresEn).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={plan.featured ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={loadingPlan === plan.key}
                    >
                      {loadingPlan === plan.key
                        ? (isAr ? "جاري التحميل..." : "Loading...")
                        : (isAr ? "اشترك الآن" : "Subscribe Now")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">{isAr ? "جاهز لتحويل إدارة الموارد البشرية؟" : "Ready to Transform Your HR?"}</h2>
          <p className="mt-4 text-muted-foreground">{isAr ? "ابدأ تجربتك المجانية اليوم بدون بطاقة ائتمان" : "Start your free trial today — no credit card required"}</p>
          <Button size="lg" className="mt-8 text-base px-8 h-12" onClick={() => navigate(user ? "/" : "/register")}>
            {isAr ? "ابدأ مجاناً" : "Get Started Free"}
            <Arrow className="h-4 w-4 ms-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 HR SaaS Platform. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</a>
            <a href="#" className="hover:text-foreground">{isAr ? "الشروط والأحكام" : "Terms of Service"}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

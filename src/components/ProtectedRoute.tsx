import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [roleChecked, setRoleChecked] = useState(false);
  const [isEmployeeOnly, setIsEmployeeOnly] = useState(false);

  useEffect(() => {
    if (!user) { setRoleChecked(true); return; }

    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (data) {
        const roles = data.map((r) => r.role);
        setIsEmployeeOnly(roles.length === 1 && roles[0] === "employee");
      }
      setRoleChecked(true);
    };
    checkRole();
  }, [user]);

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('app.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect employee-only users to /my-portal when accessing admin routes
  if (isEmployeeOnly && window.location.pathname === "/") {
    return <Navigate to="/my-portal" replace />;
  }

  return <>{children}</>;
}

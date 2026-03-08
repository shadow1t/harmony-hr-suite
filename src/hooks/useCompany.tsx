import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Company {
  id: string;
  name_ar: string;
  name_en: string;
  logo_url: string | null;
  domain: string | null;
  subscription_plan: string;
  status: string;
  max_employees: number;
  currency: string;
  social_insurance_pct: number;
}

interface CompanyContextType {
  company: Company | null;
  companyId: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async () => {
    if (!user) {
      setCompany(null);
      setCompanyId(null);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, is_super_admin')
      .eq('id', user.id)
      .single();

    if (profile) {
      setCompanyId(profile.company_id);
      setIsSuperAdmin(profile.is_super_admin || false);

      if (profile.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        
        if (companyData) setCompany(companyData as Company);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompany();
  }, [user]);

  return (
    <CompanyContext.Provider value={{ company, companyId, isSuperAdmin, loading, refetch: fetchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

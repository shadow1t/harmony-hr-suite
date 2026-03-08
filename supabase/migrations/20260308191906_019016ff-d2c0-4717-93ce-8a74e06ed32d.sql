
-- =============================================
-- Phase 1: Multi-Tenancy Database Architecture
-- =============================================

-- 1. Create subscription_plan enum
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'pro', 'enterprise');

-- 2. Create company_status enum
CREATE TYPE public.company_status AS ENUM ('active', 'suspended');

-- 3. Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  logo_url TEXT,
  domain TEXT UNIQUE,
  subscription_plan public.subscription_plan NOT NULL DEFAULT 'basic',
  status public.company_status NOT NULL DEFAULT 'active',
  max_employees INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 4. Add company_id and is_super_admin to profiles
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- 5. Add company_id to all existing tables
ALTER TABLE public.employees ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.departments ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.branches ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.attendance ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.leave_requests ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.leave_balances ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.payroll ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.loans ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.job_postings ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.training_courses ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.training_enrollments ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.evaluation_cycles ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.evaluations ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- 6. Security definer functions
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = _user_id LIMIT 1),
    false
  )
$$;

-- 7. Update handle_new_user to create company on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create a default company for the new user
  INSERT INTO public.companies (name_ar, name_en)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'شركتي') || ' - شركة',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'My') || '''s Company'
  )
  RETURNING id INTO new_company_id;

  -- Create profile with company_id
  INSERT INTO public.profiles (id, full_name, company_id)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', new_company_id);
  
  -- Assign admin role for their company
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- 8. RLS for companies table
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (
    id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Super admin can manage all companies" ON public.companies
  FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE USING (id = get_user_company_id(auth.uid()));

-- 9. Drop all old RLS policies and create tenant-isolated ones

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "View profiles in same company" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR company_id = get_user_company_id(auth.uid())
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- employees
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
DROP POLICY IF EXISTS "HR can manage employees" ON public.employees;

CREATE POLICY "Tenant view employees" ON public.employees
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage employees" ON public.employees
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- departments
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

CREATE POLICY "Tenant view departments" ON public.departments
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage departments" ON public.departments
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- branches
DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;

CREATE POLICY "Tenant view branches" ON public.branches
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage branches" ON public.branches
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- attendance
DROP POLICY IF EXISTS "HR can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "View own attendance" ON public.attendance;

CREATE POLICY "Tenant view attendance" ON public.attendance
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage attendance" ON public.attendance
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- leave_requests
DROP POLICY IF EXISTS "Create own leave request" ON public.leave_requests;
DROP POLICY IF EXISTS "HR can manage leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "View own leave requests" ON public.leave_requests;

CREATE POLICY "Tenant view leave_requests" ON public.leave_requests
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage leave_requests" ON public.leave_requests
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant insert leave_requests" ON public.leave_requests
  FOR INSERT WITH CHECK (
    company_id = get_user_company_id(auth.uid())
  );

-- leave_balances
DROP POLICY IF EXISTS "HR can manage leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "View own leave balances" ON public.leave_balances;

CREATE POLICY "Tenant view leave_balances" ON public.leave_balances
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage leave_balances" ON public.leave_balances
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- payroll
DROP POLICY IF EXISTS "HR can manage payroll" ON public.payroll;
DROP POLICY IF EXISTS "View own payroll" ON public.payroll;

CREATE POLICY "Tenant view payroll" ON public.payroll
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage payroll" ON public.payroll
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- loans
DROP POLICY IF EXISTS "Create own loan request" ON public.loans;
DROP POLICY IF EXISTS "HR can manage loans" ON public.loans;
DROP POLICY IF EXISTS "View own loans" ON public.loans;

CREATE POLICY "Tenant view loans" ON public.loans
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage loans" ON public.loans
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- job_postings
DROP POLICY IF EXISTS "Anyone can view job postings" ON public.job_postings;
DROP POLICY IF EXISTS "HR can manage job postings" ON public.job_postings;

CREATE POLICY "Tenant view job_postings" ON public.job_postings
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage job_postings" ON public.job_postings
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- training_courses
DROP POLICY IF EXISTS "HR can manage training" ON public.training_courses;
DROP POLICY IF EXISTS "View training courses" ON public.training_courses;

CREATE POLICY "Tenant view training_courses" ON public.training_courses
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage training_courses" ON public.training_courses
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- training_enrollments
DROP POLICY IF EXISTS "HR can manage enrollments" ON public.training_enrollments;
DROP POLICY IF EXISTS "View own enrollments" ON public.training_enrollments;

CREATE POLICY "Tenant view training_enrollments" ON public.training_enrollments
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage training_enrollments" ON public.training_enrollments
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- evaluation_cycles
DROP POLICY IF EXISTS "HR can manage cycles" ON public.evaluation_cycles;
DROP POLICY IF EXISTS "View evaluation cycles" ON public.evaluation_cycles;

CREATE POLICY "Tenant view evaluation_cycles" ON public.evaluation_cycles
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage evaluation_cycles" ON public.evaluation_cycles
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- evaluations
DROP POLICY IF EXISTS "HR can manage evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "View own evaluations" ON public.evaluations;

CREATE POLICY "Tenant view evaluations" ON public.evaluations
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant manage evaluations" ON public.evaluations
  FOR ALL USING (
    (company_id = get_user_company_id(auth.uid()) AND is_hr_or_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

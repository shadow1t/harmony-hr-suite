
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'hr_manager', 'manager', 'employee');

-- Enum for employee status
CREATE TYPE public.employee_status AS ENUM ('active', 'on_leave', 'terminated');

-- Enum for contract type
CREATE TYPE public.contract_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary');

-- Enum for leave status
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Enum for leave type
CREATE TYPE public.leave_type_enum AS ENUM ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity');

-- Enum for loan status
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'paid');

-- Enum for payroll status
CREATE TYPE public.payroll_status AS ENUM ('draft', 'processing', 'completed', 'paid');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE(user_id, role)
);

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  manager_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_number TEXT UNIQUE NOT NULL,
  first_name_ar TEXT NOT NULL,
  last_name_ar TEXT NOT NULL,
  first_name_en TEXT,
  last_name_en TEXT,
  email TEXT,
  phone TEXT,
  national_id TEXT,
  nationality TEXT,
  date_of_birth DATE,
  gender TEXT,
  marital_status TEXT,
  address TEXT,
  department_id UUID REFERENCES public.departments(id),
  branch_id UUID REFERENCES public.branches(id),
  position_ar TEXT,
  position_en TEXT,
  contract_type contract_type DEFAULT 'full_time',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  status employee_status DEFAULT 'active',
  basic_salary NUMERIC(12,2) DEFAULT 0,
  housing_allowance NUMERIC(12,2) DEFAULT 0,
  transport_allowance NUMERIC(12,2) DEFAULT 0,
  other_allowances NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type leave_type_enum NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leave balances table
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type leave_type_enum NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  UNIQUE(employee_id, leave_type, year)
);

-- Payroll table
CREATE TABLE public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  basic_salary NUMERIC(12,2) DEFAULT 0,
  housing_allowance NUMERIC(12,2) DEFAULT 0,
  transport_allowance NUMERIC(12,2) DEFAULT 0,
  other_allowances NUMERIC(12,2) DEFAULT 0,
  overtime_amount NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  social_insurance NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) DEFAULT 0,
  status payroll_status DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- Loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  monthly_deduction NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER DEFAULT 0,
  reason TEXT,
  status loan_status DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job postings table
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  department_id UUID REFERENCES public.departments(id),
  requirements TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closing_date DATE
);

-- Training courses table
CREATE TABLE public.training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  trainer TEXT,
  start_date DATE,
  end_date DATE,
  max_participants INTEGER,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Training enrollments
CREATE TABLE public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled',
  completion_date DATE,
  score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, employee_id)
);

-- Evaluation cycles
CREATE TABLE public.evaluation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluations
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.evaluation_cycles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES auth.users(id),
  score NUMERIC(5,2),
  comments TEXT,
  self_score NUMERIC(5,2),
  self_comments TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or hr_manager
CREATE OR REPLACE FUNCTION public.is_hr_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'hr_manager')
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can read/update own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_hr_or_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles: only admins can manage, users can view own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Departments: authenticated users can view, admins can manage
CREATE POLICY "Authenticated users can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Branches: same as departments
CREATE POLICY "Authenticated users can view branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Employees: authenticated can view, hr/admin can manage
CREATE POLICY "Authenticated users can view employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR can manage employees" ON public.employees FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Attendance: employees can view own, hr/admin can manage all
CREATE POLICY "View own attendance" ON public.attendance FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "HR can manage attendance" ON public.attendance FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Leave requests: employees can view/create own, hr/admin manage all
CREATE POLICY "View own leave requests" ON public.leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "Create own leave request" ON public.leave_requests FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "HR can manage leave requests" ON public.leave_requests FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Leave balances: view own or hr/admin
CREATE POLICY "View own leave balances" ON public.leave_balances FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "HR can manage leave balances" ON public.leave_balances FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Payroll: view own or hr/admin
CREATE POLICY "View own payroll" ON public.payroll FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "HR can manage payroll" ON public.payroll FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Loans: view own or hr/admin
CREATE POLICY "View own loans" ON public.loans FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "Create own loan request" ON public.loans FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "HR can manage loans" ON public.loans FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Job postings: public view, hr/admin manage
CREATE POLICY "Anyone can view job postings" ON public.job_postings FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR can manage job postings" ON public.job_postings FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Training: authenticated view, hr/admin manage
CREATE POLICY "View training courses" ON public.training_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR can manage training" ON public.training_courses FOR ALL USING (public.is_hr_or_admin(auth.uid()));

CREATE POLICY "View own enrollments" ON public.training_enrollments FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "HR can manage enrollments" ON public.training_enrollments FOR ALL USING (public.is_hr_or_admin(auth.uid()));

-- Evaluations: view own or hr/admin
CREATE POLICY "View evaluation cycles" ON public.evaluation_cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR can manage cycles" ON public.evaluation_cycles FOR ALL USING (public.is_hr_or_admin(auth.uid()));

CREATE POLICY "View own evaluations" ON public.evaluations FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "HR can manage evaluations" ON public.evaluations FOR ALL USING (public.is_hr_or_admin(auth.uid()));

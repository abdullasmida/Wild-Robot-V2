-- 1. Create Profiles Table (Links Auth User to a Role)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'coach', -- 'super_admin', 'branch_manager', 'coach'
    assigned_branch TEXT,      -- If null, can see all (for super_admin)
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS (Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 3. Policies (Simple logic for now)
-- Super Admin sees all
CREATE POLICY "Super Admin All" ON public.players 
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Branch Manager sees their branch
CREATE POLICY "Manager Branch" ON public.players 
FOR ALL USING (
  (SELECT assigned_branch FROM public.profiles WHERE id = auth.uid()) = branch
);

-- Coach sees their branch (Read-Only on sensitive data - though here it says FOR SELECT, effectively read-only for this policy)
CREATE POLICY "Coach View" ON public.players 
FOR SELECT USING (
  (SELECT assigned_branch FROM public.profiles WHERE id = auth.uid()) = branch
);

-- Policy to allow users to read their own profile
CREATE POLICY "Read Own Profile" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
);

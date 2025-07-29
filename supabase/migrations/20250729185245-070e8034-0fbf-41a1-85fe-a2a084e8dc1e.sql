-- ================================
-- COMPREHENSIVE SECURITY MIGRATION
-- ================================

-- 1. Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Add user_id columns to all existing tables
ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.deliverables ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.time_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.phases ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create secure function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- 4. Create trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Update RLS policies for profiles (users can only see/edit their own profile)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be created by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be deleted by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Update RLS policies for projects (user-specific access)
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Projects can be created by everyone" ON public.projects;
DROP POLICY IF EXISTS "Projects can be updated by everyone" ON public.projects;
DROP POLICY IF EXISTS "Projects can be deleted by everyone" ON public.projects;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Update RLS policies for deliverables (user-specific access)
DROP POLICY IF EXISTS "Deliverables are viewable by everyone" ON public.deliverables;
DROP POLICY IF EXISTS "Deliverables can be created by everyone" ON public.deliverables;
DROP POLICY IF EXISTS "Deliverables can be updated by everyone" ON public.deliverables;
DROP POLICY IF EXISTS "Deliverables can be deleted by everyone" ON public.deliverables;

CREATE POLICY "Users can view own deliverables" ON public.deliverables
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deliverables" ON public.deliverables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deliverables" ON public.deliverables
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deliverables" ON public.deliverables
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Update RLS policies for tasks (user-specific access)
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be created by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be updated by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be deleted by everyone" ON public.tasks;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Update RLS policies for time_entries (user-specific access)
DROP POLICY IF EXISTS "Time entries are viewable by everyone" ON public.time_entries;
DROP POLICY IF EXISTS "Time entries can be created by everyone" ON public.time_entries;
DROP POLICY IF EXISTS "Time entries can be updated by everyone" ON public.time_entries;
DROP POLICY IF EXISTS "Time entries can be deleted by everyone" ON public.time_entries;

CREATE POLICY "Users can view own time entries" ON public.time_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON public.time_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries" ON public.time_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Update RLS policies for phases (user-specific access)
DROP POLICY IF EXISTS "Phases are viewable by everyone" ON public.phases;
DROP POLICY IF EXISTS "Phases can be created by everyone" ON public.phases;
DROP POLICY IF EXISTS "Phases can be updated by everyone" ON public.phases;
DROP POLICY IF EXISTS "Phases can be deleted by everyone" ON public.phases;

CREATE POLICY "Users can view own phases" ON public.phases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own phases" ON public.phases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phases" ON public.phases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phases" ON public.phases
  FOR DELETE USING (auth.uid() = user_id);

-- 11. Create updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
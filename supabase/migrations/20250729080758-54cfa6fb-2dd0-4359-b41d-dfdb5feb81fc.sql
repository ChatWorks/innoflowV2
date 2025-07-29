-- Add project_value column to projects table
ALTER TABLE public.projects 
ADD COLUMN project_value NUMERIC;

-- Add target_date column to deliverables table
ALTER TABLE public.deliverables 
ADD COLUMN target_date DATE;

-- Create phases table
CREATE TABLE public.phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on phases table
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phases table
CREATE POLICY "Phases are viewable by everyone" 
ON public.phases 
FOR SELECT 
USING (true);

CREATE POLICY "Phases can be created by everyone" 
ON public.phases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Phases can be updated by everyone" 
ON public.phases 
FOR UPDATE 
USING (true);

CREATE POLICY "Phases can be deleted by everyone" 
ON public.phases 
FOR DELETE 
USING (true);

-- Add phase_id column to deliverables table
ALTER TABLE public.deliverables 
ADD COLUMN phase_id UUID;

-- Create trigger for phases updated_at
CREATE TRIGGER update_phases_updated_at
BEFORE UPDATE ON public.phases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Nieuw' CHECK (status IN ('Nieuw', 'In Progress', 'Review', 'Voltooid')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_entries table for timer functionality
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deliverables table
CREATE TABLE public.deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public access for now - can be restricted later with auth)
CREATE POLICY "Projects are viewable by everyone" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Projects can be created by everyone" 
ON public.projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Projects can be updated by everyone" 
ON public.projects 
FOR UPDATE 
USING (true);

CREATE POLICY "Projects can be deleted by everyone" 
ON public.projects 
FOR DELETE 
USING (true);

CREATE POLICY "Time entries are viewable by everyone" 
ON public.time_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Time entries can be created by everyone" 
ON public.time_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Time entries can be updated by everyone" 
ON public.time_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "Time entries can be deleted by everyone" 
ON public.time_entries 
FOR DELETE 
USING (true);

CREATE POLICY "Deliverables are viewable by everyone" 
ON public.deliverables 
FOR SELECT 
USING (true);

CREATE POLICY "Deliverables can be created by everyone" 
ON public.deliverables 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Deliverables can be updated by everyone" 
ON public.deliverables 
FOR UPDATE 
USING (true);

CREATE POLICY "Deliverables can be deleted by everyone" 
ON public.deliverables 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_client ON public.projects(client);
CREATE INDEX idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX idx_time_entries_start_time ON public.time_entries(start_time);
CREATE INDEX idx_deliverables_project_id ON public.deliverables(project_id);

-- Enable realtime for live updates
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.time_entries REPLICA IDENTITY FULL;
ALTER TABLE public.deliverables REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverables;

-- Insert sample data
INSERT INTO public.projects (name, client, description, status, progress, budget) VALUES
('Website Redesign', 'Acme Corp', 'Complete website overhaul with modern design', 'In Progress', 65, 15000.00),
('Mobile App Development', 'TechStart BV', 'Native iOS and Android app development', 'In Progress', 30, 25000.00),
('Brand Identity', 'StartUp Inc', 'Logo design and brand guidelines', 'Review', 90, 5000.00),
('E-commerce Platform', 'Retail Pro', 'Custom e-commerce solution', 'Nieuw', 0, 35000.00),
('AI Integration', 'DataCorp', 'Machine learning model integration', 'Voltooid', 100, 18000.00);

INSERT INTO public.deliverables (project_id, title, description, status, due_date) VALUES
((SELECT id FROM public.projects WHERE name = 'Website Redesign'), 'Homepage Design', 'Design for main landing page', 'Completed', '2024-01-15'),
((SELECT id FROM public.projects WHERE name = 'Website Redesign'), 'Component Library', 'Reusable UI components', 'In Progress', '2024-01-25'),
((SELECT id FROM public.projects WHERE name = 'Mobile App Development'), 'User Authentication', 'Login and registration system', 'In Progress', '2024-02-01'),
((SELECT id FROM public.projects WHERE name = 'Brand Identity'), 'Logo Concepts', 'Initial logo design concepts', 'Completed', '2024-01-10');
-- Add tasks table with billable hours and completion tracking
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  billable_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Tasks are viewable by everyone" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Tasks can be created by everyone" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Tasks can be updated by everyone" 
ON public.tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Tasks can be deleted by everyone" 
ON public.tasks 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates on tasks
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint linking tasks to deliverables
ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_deliverable 
FOREIGN KEY (deliverable_id) 
REFERENCES public.deliverables(id) 
ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_tasks_deliverable_id ON public.tasks(deliverable_id);
CREATE INDEX idx_tasks_completed ON public.tasks(completed);

-- Add project timer functionality to time_entries
ALTER TABLE public.time_entries 
ADD COLUMN is_active BOOLEAN DEFAULT FALSE;

-- Create index for active timers
CREATE INDEX idx_time_entries_active ON public.time_entries(is_active, project_id);
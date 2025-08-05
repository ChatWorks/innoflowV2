-- Create enum types for goals
CREATE TYPE public.goal_type AS ENUM ('numeric', 'percentage', 'boolean', 'milestone');
CREATE TYPE public.goal_category AS ENUM ('sales', 'projects', 'personal', 'team', 'financial');
CREATE TYPE public.goal_status AS ENUM ('not_started', 'in_progress', 'completed', 'overdue', 'paused');

-- Create goals table
CREATE TABLE public.goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    goal_type public.goal_type NOT NULL DEFAULT 'numeric',
    category public.goal_category NOT NULL DEFAULT 'personal',
    status public.goal_status NOT NULL DEFAULT 'not_started',
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    target_unit TEXT, -- e.g., 'euros', 'leads', 'hours', etc.
    deadline DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notification_settings JSONB DEFAULT '{"enabled": true, "frequency": "daily", "time": "09:00"}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_deadline ON public.goals(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_category ON public.goals(category);
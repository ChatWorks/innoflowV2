-- Create project messages table for client communications
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'team')),
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID
);

-- Enable Row Level Security
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for project messages
CREATE POLICY "Users can view messages for their projects" 
ON public.project_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_messages.project_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages for their projects" 
ON public.project_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_messages.project_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages for their projects" 
ON public.project_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_messages.project_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Public can create client messages via portal" 
ON public.project_messages 
FOR INSERT 
WITH CHECK (
  sender_type = 'client' AND
  EXISTS (
    SELECT 1 FROM public.client_portals cp 
    WHERE cp.project_id = project_messages.project_id 
    AND cp.is_active = true 
    AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_messages_updated_at
BEFORE UPDATE ON public.project_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
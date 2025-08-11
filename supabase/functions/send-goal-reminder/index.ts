import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import React from 'npm:react@18.3.1';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GoalReminderEmail } from './_templates/goal-reminder.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Service-role client for secure DB operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReminderRequest {
  goalId: string;
  userEmail: string;
  type: 'daily' | 'weekly' | 'monthly' | 'deadline' | 'manual';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalId, userEmail, type }: SendReminderRequest = await req.json();

    console.log(`Sending ${type} reminder for goal ${goalId} to ${userEmail}`);

    // Authenticate caller via JWT and ensure goal ownership
    const authHeader = req.headers.get('Authorization') || '';
    const sbUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await sbUser.auth.getUser();
    const user = userData?.user || null;
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch goal data securely and verify ownership
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      throw new Error(`Goal not found: ${goalError?.message}`);
    }

    if (goal.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: Goal does not belong to user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate progress percentage
    let progressPercentage = 0;
    if (goal.goal_type === 'boolean') {
      progressPercentage = goal.is_completed ? 100 : 0;
    } else if (goal.goal_type === 'percentage') {
      progressPercentage = Math.min(goal.current_value, 100);
    } else if (goal.target_value && goal.target_value > 0) {
      progressPercentage = Math.min((goal.current_value / goal.target_value) * 100, 100);
    }

    // Parse notification settings
    const notificationSettings = typeof goal.notification_settings === 'string' 
      ? JSON.parse(goal.notification_settings) 
      : goal.notification_settings;

    // Generate email subject based on type
    let subject = '';
    switch (type) {
      case 'daily':
        subject = `🎯 Dagelijkse Reminder: ${goal.title}`;
        break;
      case 'weekly':
        subject = `📊 Wekelijkse Voortgang: ${goal.title}`;
        break;
      case 'monthly':
        subject = `📈 Maandelijkse Review: ${goal.title}`;
        break;
      case 'deadline':
        subject = `⏰ Deadline Waarschuwing: ${goal.title}`;
        break;
      default:
        subject = `🎯 Goal Reminder: ${goal.title}`;
    }

    // Render email template
    const html = await renderAsync(
      React.createElement(GoalReminderEmail, {
        goalTitle: goal.title,
        goalProgress: progressPercentage,
        targetValue: goal.target_value,
        currentValue: goal.current_value,
        deadline: goal.deadline,
        customMessage: notificationSettings.customMessage,
        goalType: goal.goal_type,
        category: goal.category,
        appUrl: supabaseUrl.replace('.supabase.co', '.lovableproject.com'), // Adjust for your domain
      })
    );

    // Send email
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Innoflow Goals <goals@innoflow.nl>',
      to: [userEmail],
      subject: subject,
      html: html,
    });

    if (emailError) {
      throw emailError;
    }

    console.log('Email sent successfully:', emailResult);

    // Log the notification (optional - you could add a notifications table)
    const { error: logError } = await supabase
      .from('notifications')
      .insert({
        user_id: goal.user_id,
        type: 'goal_reminder',
        title: subject,
        message: `Reminder sent for goal: ${goal.title}`,
        lead_id: null,
        is_read: false
      });

    if (logError) {
      console.warn('Failed to log notification:', logError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResult?.id,
      goalTitle: goal.title 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-goal-reminder function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
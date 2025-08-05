import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Starting notification scheduler...');

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDate = now.getDate();

    // Fetch goals with enabled notifications
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select(`
        *,
        profiles!inner(email)
      `)
      .eq('is_completed', false);

    if (goalsError) {
      throw new Error(`Failed to fetch goals: ${goalsError.message}`);
    }

    console.log(`Found ${goals?.length || 0} active goals`);

    const remindersToSend = [];

    for (const goal of goals || []) {
      const notificationSettings = typeof goal.notification_settings === 'string' 
        ? JSON.parse(goal.notification_settings) 
        : goal.notification_settings;

      // Skip if notifications are disabled
      if (!notificationSettings.enabled) {
        continue;
      }

      const notificationTime = notificationSettings.time || '09:00';
      
      // Check if it's time to send a notification
      let shouldSend = false;
      let reminderType = 'daily';

      if (notificationTime === currentTime) {
        switch (notificationSettings.frequency) {
          case 'daily':
            shouldSend = true;
            reminderType = 'daily';
            break;
          case 'weekly':
            // Send on Monday (day 1)
            shouldSend = currentDay === 1;
            reminderType = 'weekly';
            break;
          case 'monthly':
            // Send on the 1st of each month
            shouldSend = currentDate === 1;
            reminderType = 'monthly';
            break;
        }
      }

      // Check for deadline warnings (3 days before deadline)
      if (goal.deadline && notificationSettings.deadlineWarnings !== false) {
        const deadline = new Date(goal.deadline);
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline === 3 && currentTime === '09:00') {
          shouldSend = true;
          reminderType = 'deadline';
        }
      }

      // Check for progress reminders (if no progress for 7 days)
      if (notificationSettings.progressReminders !== false) {
        const lastUpdate = new Date(goal.updated_at);
        const daysSinceUpdate = Math.ceil((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpdate >= 7 && currentTime === '12:00') {
          shouldSend = true;
          reminderType = 'progress_reminder';
        }
      }

      if (shouldSend && goal.profiles?.email) {
        remindersToSend.push({
          goalId: goal.id,
          userEmail: goal.profiles.email,
          type: reminderType,
          goalTitle: goal.title
        });
      }
    }

    console.log(`Sending ${remindersToSend.length} reminders`);

    // Send all reminders
    const results = [];
    for (const reminder of remindersToSend) {
      try {
        console.log(`Sending ${reminder.type} reminder for "${reminder.goalTitle}" to ${reminder.userEmail}`);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/send-goal-reminder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            goalId: reminder.goalId,
            userEmail: reminder.userEmail,
            type: reminder.type
          })
        });

        const result = await response.json();
        results.push({
          ...reminder,
          success: response.ok,
          result: result
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to send reminder for goal ${reminder.goalId}:`, error);
        results.push({
          ...reminder,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Notification scheduler completed: ${successCount} sent, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      totalReminders: remindersToSend.length,
      successCount,
      failureCount,
      results: results,
      timestamp: now.toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in notification scheduler:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
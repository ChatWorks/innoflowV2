import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, projectContext, chatHistory, model = 'gpt-5-mini', useWebSearch = false } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key niet gevonden');
    }

    // Prepare enriched project context with complete hierarchy
    const enrichedContext = prepareProjectContext(projectContext);
    
    console.log('Project AI Chat - Processing message for project:', projectId);
    console.log('Using model:', model, 'Web search:', useWebSearch);

    // Use OpenAI Responses API
    const systemPrompt = createSystemPrompt(enrichedContext);
    const conversationHistory = formatChatHistoryForResponses(chatHistory);
    
    // Construct full input according to Responses API format
    let fullInput = systemPrompt + '\n\n';
    if (conversationHistory.length > 0) {
      fullInput += 'GESPREKSGESCHIEDENIS:\n' + conversationHistory + '\n\n';
    }
    fullInput += 'HUIDIGE VRAAG: ' + message;

    const requestBody: any = {
      model: model || 'gpt-5-mini-2025-08-07',
      input: [
        {
          role: "user",
          content: fullInput
        }
      ],
      text: {
        format: {
          type: "text"
        },
        verbosity: "medium"
      },
      reasoning: {
        effort: "medium",
        summary: "auto"
      },
      max_output_tokens: 4000,
      store: true
    };

    // Add web search tool if requested
    if (useWebSearch) {
      requestBody.tools = [
        {
          type: "web_search_preview",
          user_location: {
            type: "approximate"
          },
          search_context_size: "medium"
        }
      ];
    }

    console.log('System prompt length:', systemPrompt.length, 'characters');
    console.log('Full input length:', fullInput.length, 'characters');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Responses API error:', response.status, errorText);
      throw new Error(`OpenAI Responses API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI Responses API - Response received for project:', projectId);
    console.log('Full OpenAI Response:', JSON.stringify(data, null, 2));
    
    // Handle Responses API response structure
    let aiResponse = '';
    
    if (data.output && Array.isArray(data.output)) {
      // Find the text content in the output array
      const textOutput = data.output.find((item: any) => 
        item.type === 'message' && item.content && Array.isArray(item.content)
      );
      
      if (textOutput && textOutput.content.length > 0) {
        const textContent = textOutput.content.find((content: any) => content.type === 'text');
        if (textContent && textContent.text) {
          aiResponse = textContent.text;
        }
      }
    }
    
    // Check for empty response and provide fallback
    if (!aiResponse || aiResponse.trim() === '') {
      console.log('Empty response detected from Responses API');
      aiResponse = 'Het antwoord kon niet worden gegenereerd. Probeer je vraag korter of specifieker te maken.';
    }
    
    console.log('Extracted AI Response length:', aiResponse.length, 'characters');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in project-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Er is een fout opgetreden bij de AI Project Assistent',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function prepareProjectContext(context: any) {
  const { project, deliverables, tasks, phases, timeEntries, meetings, manualTimeEntries } = context;
  
  // Helper function to calculate total time for a task (matches frontend logic exactly)
  const getTaskTotalTime = (taskId: string) => {
    const task = tasks.find((t: any) => t.id === taskId);
    const timerSeconds = timeEntries
      .filter((entry: any) => entry.task_id === taskId)
      .reduce((sum: number, entry: any) => sum + (entry.duration_seconds || 0), 0);
    const manualSeconds = task?.manual_time_seconds || 0;
    
    return {
      timer_seconds: timerSeconds,
      manual_seconds: manualSeconds,
      total_seconds: timerSeconds + manualSeconds,
      total_hours: (timerSeconds + manualSeconds) / 3600
    };
  };

  // Helper function to calculate total time for a deliverable (matches frontend logic exactly)
  const getDeliverableTotalTime = (deliverableId: string) => {
    const deliverable = deliverables.find((d: any) => d.id === deliverableId);
    const deliverableTasks = tasks.filter((task: any) => task.deliverable_id === deliverableId);
    
    // Sum all task times + deliverable manual time (matches frontend progressCalculations.ts)
    const taskTimes = deliverableTasks.map((task: any) => getTaskTotalTime(task.id));
    const taskTimerSeconds = taskTimes.reduce((sum, time) => sum + time.timer_seconds, 0);
    const taskManualSeconds = taskTimes.reduce((sum, time) => sum + time.manual_seconds, 0);
    
    // Add deliverable-level manual time (matches frontend)
    const deliverableManualSeconds = deliverable?.manual_time_seconds || 0;
    
    const totalSeconds = taskTimerSeconds + taskManualSeconds + deliverableManualSeconds;
    
    return {
      timer_seconds: taskTimerSeconds,
      manual_seconds: taskManualSeconds + deliverableManualSeconds,
      total_seconds: totalSeconds,
      total_hours: totalSeconds / 3600
    };
  };

  // Helper function to calculate total time for a phase (matches frontend logic exactly)
  const getPhaseTotalTime = (phaseId: string) => {
    const phaseDeliverables = deliverables.filter((del: any) => del.phase_id === phaseId);
    
    // Sum all deliverable times (which already include deliverable manual time)
    const deliverableTimes = phaseDeliverables.map((del: any) => getDeliverableTotalTime(del.id));
    const deliverableTimerSeconds = deliverableTimes.reduce((sum, time) => sum + time.timer_seconds, 0);
    const deliverableManualSeconds = deliverableTimes.reduce((sum, time) => sum + time.manual_seconds, 0);
    
    const totalSeconds = deliverableTimerSeconds + deliverableManualSeconds;
    
    return {
      timer_seconds: deliverableTimerSeconds,
      manual_seconds: deliverableManualSeconds,
      total_seconds: totalSeconds,
      total_hours: totalSeconds / 3600
    };
  };

  // Calculate project-level totals (matches frontend logic exactly)
  const allPhaseTimes = phases.map((phase: any) => getPhaseTotalTime(phase.id));
  
  const projectTotalTimerSeconds = allPhaseTimes.reduce((sum, time) => sum + time.timer_seconds, 0);
  const projectTotalManualSeconds = allPhaseTimes.reduce((sum, time) => sum + time.manual_seconds, 0);
  const projectTotalSeconds = projectTotalTimerSeconds + projectTotalManualSeconds;
  const projectTotalHours = projectTotalSeconds / 3600;
  
  const totalDeclarableHours = deliverables.reduce((sum: number, del: any) => 
    sum + (del.declarable_hours || 0), 0) + phases.reduce((sum: number, phase: any) => 
    sum + (phase.declarable_hours || 0), 0);
  
  const efficiency = totalDeclarableHours > 0 ? (totalDeclarableHours / projectTotalHours) * 100 : 0;
  
  const completedTasks = tasks.filter((task: any) => task.completed);
  const taskCompletionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Build hierarchical structure with complete time data
  const enrichedPhases = phases.map((phase: any) => {
    const phaseTime = getPhaseTotalTime(phase.id);
    const phaseDeliverables = deliverables.filter((del: any) => del.phase_id === phase.id);
    const phaseTasks = tasks.filter((task: any) => 
      phaseDeliverables.some((del: any) => del.id === task.deliverable_id)
    );
    
    const phaseDeclarableHours = phaseDeliverables.reduce((sum: number, del: any) => 
      sum + (del.declarable_hours || 0), 0) + (phase.declarable_hours || 0);

    return {
      ...phase,
      deliverables: phaseDeliverables.map((del: any) => {
        const deliverableTime = getDeliverableTotalTime(del.id);
        const deliverableTasks = tasks.filter((task: any) => task.deliverable_id === del.id);
        
        return {
          ...del,
          tasks: deliverableTasks.map((task: any) => {
            const taskTime = getTaskTotalTime(task.id);
            return {
              ...task,
          time_breakdown: {
            timer_hours: taskTime.timer_seconds / 3600,
            manual_hours: taskTime.manual_seconds / 3600,
            total_hours: taskTime.total_hours
          }
            };
          }),
        time_breakdown: {
          timer_hours: deliverableTime.timer_seconds / 3600,
          manual_hours: deliverableTime.manual_seconds / 3600,
          total_hours: deliverableTime.total_hours
        },
          completion_rate: deliverableTasks.length > 0 ? 
            (deliverableTasks.filter((t: any) => t.completed).length / deliverableTasks.length) * 100 : 0
        };
      }),
      time_breakdown: {
        timer_hours: phaseTime.timer_seconds / 3600,
        manual_hours: phaseTime.manual_seconds / 3600,
        total_hours: phaseTime.total_hours
      },
      declarable_hours_total: phaseDeclarableHours,
      completion_rate: phaseTasks.length > 0 ? 
        (phaseTasks.filter((t: any) => t.completed).length / phaseTasks.length) * 100 : 0
    };
  });

  // Standalone deliverables (not in phases)
  const standaloneDeliverables = deliverables.filter((del: any) => !del.phase_id);

  return {
    project: {
      ...project,
      statistics: {
        progress_percentage: project.progress || 0,
        time_breakdown: {
          timer_hours: projectTotalTimerSeconds / 3600,
          manual_hours: projectTotalManualSeconds / 3600,
          total_hours: projectTotalHours
        },
        declarable_hours_total: totalDeclarableHours,
        efficiency_percentage: Math.round(efficiency),
        task_completion_rate: Math.round(taskCompletionRate),
        total_tasks: tasks.length,
        completed_tasks: completedTasks.length,
        total_deliverables: deliverables.length,
        total_phases: phases.length
      }
    },
    hierarchy: {
      phases: enrichedPhases,
      standalone_deliverables: standaloneDeliverables.map((del: any) => {
        const deliverableTime = getDeliverableTotalTime(del.id);
        const deliverableTasks = tasks.filter((task: any) => task.deliverable_id === del.id);
        
        return {
          ...del,
          tasks: deliverableTasks.map((task: any) => {
            const taskTime = getTaskTotalTime(task.id);
            return {
              ...task,
              time_breakdown: {
                timer_hours: taskTime.timer_seconds / 3600,
                manual_hours: taskTime.manual_seconds / 3600,
                total_hours: taskTime.total_hours
              }
            };
          }),
          time_breakdown: {
            timer_hours: deliverableTime.timer_seconds / 3600,
            manual_hours: deliverableTime.manual_seconds / 3600,
            total_hours: deliverableTime.total_hours
          },
          completion_rate: deliverableTasks.length > 0 ? 
            (deliverableTasks.filter((t: any) => t.completed).length / deliverableTasks.length) * 100 : 0
        };
      })
    },
    meetings: meetings,
    recent_activity: generateRecentActivity(tasks, timeEntries, deliverables, manualTimeEntries)
  };
}

// Helper function to format seconds to precise time format
function formatTimeSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function createSystemPrompt(enrichedContext: any) {
  const { project, hierarchy } = enrichedContext;
  
  // Get active/incomplete tasks only
  const activeTasks = hierarchy.phases
    .flatMap((phase: any) => phase.deliverables)
    .concat(hierarchy.standalone_deliverables)
    .flatMap((del: any) => del.tasks || [])
    .filter((task: any) => !task.completed)
    .slice(0, 10); // Limit to 10 most important active tasks

  const projectStats = project.statistics;

  return `Je bent een AI Project Assistent voor "${project.name}" (${project.client}).

📊 PROJECT STATUS:
- Voortgang: ${projectStats.progress_percentage}%
- Taken: ${projectStats.completed_tasks}/${projectStats.total_tasks} voltooid
- Bestede tijd: ${Math.round(projectStats.time_breakdown.total_hours)}h
- Efficiency: ${projectStats.efficiency_percentage}%
- Budget: €${project.budget?.toLocaleString() || 'onbekend'}

🎯 ACTIEVE TAKEN (${activeTasks.length}):
${activeTasks.map((task: any) => `• ${task.title} (${Math.round(task.time_breakdown.total_hours)}h besteed)`).join('\n')}

Als expert project assistent help je met:
- Project analyse & voortgang tracking
- Efficiency optimalisatie & knelpunten identificeren  
- Planning & prioritering van taken
- Budget & tijd management
- Concrete, data-gedreven adviezen

Antwoord in het Nederlands met specifieke verwijzingen naar taken en deliverables.`;
}

function formatChatHistory(chatHistory: any[]) {
  return chatHistory.slice(-8).map((msg: any) => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: [
      {
        type: msg.type === 'user' ? 'input_text' : 'output_text',
        text: msg.content
      }
    ]
  }));
}

function formatChatHistoryForResponses(chatHistory: any[]): string {
  if (!chatHistory || chatHistory.length === 0) {
    return '';
  }
  
  return chatHistory.slice(-6).map((msg: any) => {
    const role = msg.message_type === 'user' ? 'Gebruiker' : 'AI Assistent';
    return `${role}: ${msg.content}`;
  }).join('\n');
}

function formatChatHistoryForChat(chatHistory: any[]) {
  return chatHistory.slice(-8).map((msg: any) => ({
    role: msg.message_type === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}

function generateRecentActivity(tasks: any[], timeEntries: any[], deliverables: any[], manualTimeEntries: any[]) {
  const recent = [];
  
  // Recent task completions
  const recentCompletions = tasks
    .filter(task => task.completed && task.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 3);
  
  recentCompletions.forEach(task => {
    recent.push({
      type: 'task_completed',
      description: `Taak "${task.title}" voltooid`,
      date: task.completed_at
    });
  });
  
  // Recent time entries (timer)
  const recentTimeEntries = timeEntries
    .filter(entry => entry.end_time)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  recentTimeEntries.forEach(entry => {
    recent.push({
      type: 'time_logged',
      description: `${formatTimeSeconds(entry.duration_seconds)} tijd geregistreerd (timer)`,
      date: entry.created_at
    });
  });
  
  // Recent manual time entries
  const recentManualEntries = manualTimeEntries
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  recentManualEntries.forEach(entry => {
    recent.push({
      type: 'manual_time_logged',
      description: `${formatTimeSeconds(entry.time_seconds)} handmatig tijd toegevoegd`,
      date: entry.created_at
    });
  });
  
  return recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
}
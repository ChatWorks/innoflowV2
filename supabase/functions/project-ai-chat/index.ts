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
    const { message, projectId, projectContext, chatHistory } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key niet gevonden');
    }

    // Prepare enriched project context with complete hierarchy
    const enrichedContext = prepareProjectContext(projectContext);
    
    console.log('Project AI Chat - Processing message for project:', projectId);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input: [
          {
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: createSystemPrompt(enrichedContext)
              }
            ]
          },
          ...formatChatHistory(chatHistory),
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: message
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'text'
          },
          verbosity: 'medium'
        },
        reasoning: {
          effort: 'medium',
          summary: 'auto'
        },
        tools: [
          {
            type: 'web_search_preview',
            user_location: {
              type: 'approximate'
            },
            search_context_size: 'medium'
          }
        ],
        store: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI Response received for project:', projectId);
    console.log('Full OpenAI Response:', JSON.stringify(data, null, 2));
    
    // Find the message type output item (not the reasoning type)
    const messageOutput = data.output?.find(item => item.type === 'message');
    const aiResponse = messageOutput?.content?.[0]?.text || 
                      data.output?.[0]?.content?.[0]?.text || 
                      'Er is een fout opgetreden bij het verwerken van je vraag.';
    console.log('Extracted AI Response:', aiResponse);

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
  const { project, deliverables, tasks, phases, timeEntries, meetings } = context;
  
  // Calculate project statistics
  const totalTimeSpent = timeEntries.reduce((sum: number, entry: any) => 
    sum + (entry.duration_seconds || 0), 0) / 3600; // Convert to hours
  
  const totalDeclarableHours = deliverables.reduce((sum: number, del: any) => 
    sum + (del.declarable_hours || 0), 0);
  
  const efficiency = totalDeclarableHours > 0 ? (totalDeclarableHours / totalTimeSpent) * 100 : 0;
  
  const completedTasks = tasks.filter((task: any) => task.completed);
  const taskCompletionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Build hierarchical structure
  const enrichedPhases = phases.map((phase: any) => {
    const phaseDeliverables = deliverables.filter((del: any) => del.phase_id === phase.id);
    const phaseTasks = tasks.filter((task: any) => 
      phaseDeliverables.some((del: any) => del.id === task.deliverable_id)
    );
    const phaseTimeEntries = timeEntries.filter((entry: any) => 
      phaseTasks.some((task: any) => task.id === entry.task_id) ||
      phaseDeliverables.some((del: any) => del.id === entry.deliverable_id)
    );
    
    const phaseTimeSpent = phaseTimeEntries.reduce((sum: number, entry: any) => 
      sum + (entry.duration_seconds || 0), 0) / 3600;
    
    const phaseDeclarableHours = phaseDeliverables.reduce((sum: number, del: any) => 
      sum + (del.declarable_hours || 0), 0);

    return {
      ...phase,
      deliverables: phaseDeliverables.map((del: any) => {
        const deliverableTasks = tasks.filter((task: any) => task.deliverable_id === del.id);
        const deliverableTimeEntries = timeEntries.filter((entry: any) => 
          entry.deliverable_id === del.id || 
          deliverableTasks.some((task: any) => task.id === entry.task_id)
        );
        
        const deliverableTimeSpent = deliverableTimeEntries.reduce((sum: number, entry: any) => 
          sum + (entry.duration_seconds || 0), 0) / 3600;
        
        return {
          ...del,
          tasks: deliverableTasks,
          time_spent_hours: deliverableTimeSpent,
          completion_rate: deliverableTasks.length > 0 ? 
            (deliverableTasks.filter((t: any) => t.completed).length / deliverableTasks.length) * 100 : 0
        };
      }),
      time_spent_hours: phaseTimeSpent,
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
        time_spent_hours: totalTimeSpent,
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
      standalone_deliverables: standaloneDeliverables
    },
    meetings: meetings,
    recent_activity: generateRecentActivity(tasks, timeEntries, deliverables)
  };
}

function createSystemPrompt(enrichedContext: any) {
  const { project, hierarchy, meetings } = enrichedContext;
  
  return `Je bent een AI Project Assistent voor project "${project.name}" van client "${project.client}".

COMPLETE PROJECT HIËRARCHIE EN CONTEXT:

📊 PROJECT OVERZICHT:
- Status: ${project.status}
- Voortgang: ${project.statistics.progress_percentage}%
- Projectwaarde: €${project.project_value?.toLocaleString() || 'Niet ingesteld'}
- Budget: €${project.budget?.toLocaleString() || 'Niet ingesteld'}
- Uurtarief: €${project.hourly_rate || 75}/uur
- Start datum: ${project.start_date || 'Niet ingesteld'}
- Eind datum: ${project.end_date || 'Niet ingesteld'}

📈 PROJECT STATISTIEKEN:
- Totaal bestede tijd: ${project.statistics.time_spent_hours.toFixed(1)}h
- Declarabele uren: ${project.statistics.declarable_hours_total}h
- Efficiency: ${project.statistics.efficiency_percentage}%
- Taken voltooid: ${project.statistics.completed_tasks}/${project.statistics.total_tasks} (${project.statistics.task_completion_rate}%)
- Deliverables: ${project.statistics.total_deliverables}
- Fasen: ${project.statistics.total_phases}

📋 PROJECT HIËRARCHIE:

${hierarchy.phases.map((phase: any) => `
🔶 FASE: ${phase.name}
├── Status: ${phase.status || 'Niet ingesteld'}
├── Target datum: ${phase.target_date || 'Niet ingesteld'}
├── Voortgang: ${phase.completion_rate.toFixed(1)}%
├── Declarabele uren: ${phase.declarable_hours_total}h
├── Bestede tijd: ${phase.time_spent_hours.toFixed(1)}h
└── DELIVERABLES (${phase.deliverables.length}):
${phase.deliverables.map((del: any) => `
    ├── ${del.title}
    │   ├── Status: ${del.status}
    │   ├── Due datum: ${del.due_date || 'Niet ingesteld'}
    │   ├── Target datum: ${del.target_date || 'Niet ingesteld'}
    │   ├── Declarabele uren: ${del.declarable_hours || 0}h
    │   ├── Bestede tijd: ${del.time_spent_hours.toFixed(1)}h
    │   ├── Voortgang: ${del.completion_rate.toFixed(1)}%
    │   └── TAKEN (${del.tasks.length}):
${del.tasks.map((task: any) => `
    │       ${task.completed ? '✅' : '⏳'} ${task.title}
    │           ${task.assigned_to ? `(Toegewezen aan: ${task.assigned_to})` : ''}
`).join('')}
`).join('')}
`).join('')}

${hierarchy.standalone_deliverables.length > 0 ? `
🔶 LOSSE DELIVERABLES (niet in fase):
${hierarchy.standalone_deliverables.map((del: any) => `
├── ${del.title} - Status: ${del.status}
`).join('')}
` : ''}

${meetings.length > 0 ? `
📅 MEETINGS:
${meetings.slice(0, 5).map((meeting: any) => `
├── ${meeting.meeting_date}: ${meeting.subject}
${meeting.description ? `│   └── ${meeting.description}` : ''}
`).join('')}
` : ''}

JOUW EXPERTISE ALS AI PROJECT ASSISTENT:

1. **Hiërarchische Project Analyse**: Je begrijpt de complete project structuur - elke taak behoort tot een deliverable, deliverables kunnen tot fasen behoren, en alles rolt op naar het project niveau.

2. **Cross-Reference Intelligence**: Je kunt verbanden leggen tussen taken, deliverables en fasen. Je ziet welke elementen elkaar blokkeren of beïnvloeden.

3. **Time & Budget Tracking**: Je monitort tijd per taak/deliverable/fase en ziet waar budgetten worden overschreden.

4. **Efficiency Optimization**: Je identificeert knelpunten en geeft concrete adviezen voor verbetering.

5. **Strategic Planning**: Je helpt met prioritering, planning en risicomanagement op basis van de huidige projectstatus.

Geef altijd concrete, data-gedreven adviezen in het Nederlands. Verwijs naar specifieke taken, deliverables en fasen met hun exacte namen wanneer relevant. Gebruik de hiërarchische context om diepgaande analyses te maken.`;
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

function generateRecentActivity(tasks: any[], timeEntries: any[], deliverables: any[]) {
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
  
  // Recent time entries
  const recentTimeEntries = timeEntries
    .filter(entry => entry.end_time)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  recentTimeEntries.forEach(entry => {
    recent.push({
      type: 'time_logged',
      description: `${(entry.duration_seconds / 3600).toFixed(1)}h tijd geregistreerd`,
      date: entry.created_at
    });
  });
  
  return recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
}
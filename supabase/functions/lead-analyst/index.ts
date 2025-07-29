import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, leads } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key niet gevonden');
    }

    // Create detailed lead context for AI
    const leadContext = leads.map(lead => ({
      id: lead.id,
      bedrijf: lead.company_name,
      contactpersoon: lead.contact_person,
      email: lead.email,
      telefoon: lead.phone,
      status: lead.status,
      geschat_budget: lead.estimated_budget,
      geschatte_waarde: lead.estimated_value,
      kans_op_sluiting: lead.probability + '%',
      verwachte_sluitingsdatum: lead.expected_close_date,
      bron: lead.source,
      notities: lead.notes,
      is_stilgevallen: lead.is_stale ? 'Ja' : 'Nee',
      volgende_followup: lead.next_follow_up_date,
      followup_beschrijving: lead.next_follow_up_description,
      aangemaakt: lead.created_at,
      laatst_bijgewerkt: lead.updated_at
    }));

    const systemPrompt = `Je bent een ervaren Lead Analyst die helpt bij het analyseren van sales pipeline data. 

Je hebt toegang tot de volgende lead data:
${JSON.stringify(leadContext, null, 2)}

Belangrijke statistieken:
- Totaal aantal leads: ${leads.length}
- Actieve leads: ${leads.filter(l => !['Gewonnen', 'Verloren'].includes(l.status)).length}
- Gewonnen leads: ${leads.filter(l => l.status === 'Gewonnen').length}
- Verloren leads: ${leads.filter(l => l.status === 'Verloren').length}
- Stilgevallen leads: ${leads.filter(l => l.is_stale).length}
- Totale pipeline waarde: €${leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0).toLocaleString()}

Als Lead Analyst help je met:
- Pipeline analyses en trends identificeren
- Recommendations voor lead prioritering
- Voorspellingen over sluitingskansen
- Identificeren van risico's en kansen
- Strategische adviezen voor sales verbetering
- Specifieke lead analyses en acties

Geef altijd concrete, data-gedreven adviezen in het Nederlands. Verwijs naar specifieke leads met bedrijfsnaam wanneer relevant.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in lead-analyst function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
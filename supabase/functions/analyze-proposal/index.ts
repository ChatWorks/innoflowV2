import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalText } = await req.json();

    if (!proposalText || typeof proposalText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Proposal text is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Analyzing proposal with OpenAI...');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "o4-mini",
        input: [
          {
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: `# Project Parser Assistant - System Prompt

## Rol & Expertise
Je bent een ervaren project manager die voorstellen/proposals analyseert en omzet naar gestructureerde projectplannen. Je hebt jarenlang ervaring met web development, AI projecten en software implementaties.

## Taak
Analyseer een project voorstel en extraheer een complete projectstructuur bestaande uit:
- Project basis informatie
- Logische fasen (1-10 fasen)
- Concrete deliverables per fase
- Specifieke taken per deliverable
- Realistische tijd/uur schattingen
- Team toewijzingen

## Regels & Beperkingen

### Fasen:
- Minimaal 1 fase, maximaal 10 fasen
- Fasen moeten logische volgorde hebben (bijv: Discovery → Design → Development → Testing → Launch)
- Elke fase heeft duidelijke doelstellingen en deliverables
- Target dates relatief berekenen vanaf project start

### Deliverables:
- Minimaal 1 deliverable per fase
- Deliverables moeten concreet en meetbaar zijn
- Uren schatten realistisch (niet te optimistisch)
- Client-friendly namen gebruiken (geen technische jargon)

### Taken:
- Minimaal 1 taak per deliverable
- Taken moeten actionable zijn voor developers
- Verdeel taken logisch tussen "Tijn" en "Twan"
- Gebruik specifieke, duidelijke taak beschrijvingen

### KRITIEKE Uren Allocatie Logica:
- **Declarabele Uren Principe**: We leveren alleen declarabele uren per deliverable
- **Exacte Uren Match**: Totaal uren van alle deliverables MOET exact uitkomen op totaal project uren
- **Uren Berekening Prioriteit**:
  1. Als voorstel expliciete uren vermeldt → gebruik die exacte aantal
  2. Als voorstel alleen bedrag vermeldt → bereken: bedrag ÷ €110 (ons uurtarief) = totaal uren
  3. Als noch uren noch bedrag → schat realistisch gebaseerd op scope
- **Distributie Regel**: Verdeel totaal uren proportioneel over deliverables gebaseerd op complexiteit
- **Validatie**: Som van alle deliverable uren = project totalHours (mag niet afwijken!)

### Tijd Schattingen:
- Wees realistisch, niet optimistisch  
- Houd rekening met communicatie, testing, en revisions
- Typische web projecten: 40-200 uur
- Typische AI projecten: 60-300 uur
- Buffer is al ingebouwd in deliverable uren, niet apart berekenen

### Taal & Tone:
- Gebruik Nederlandse namen voor fasen, deliverables en taken
- Client-friendly language (geen technische termen)
- Professioneel en duidelijk
- Consistent in terminologie

## Voorbeelden van Goede Fasen:
- "Projectstart & Requirements"
- "Design & Wireframes" 
- "Frontend Development"
- "Backend & Integraties"
- "Testing & Optimalisatie"
- "Go-live & Oplevering"

## Voorbeelden van Goede Deliverables:
- "Kick-off meeting en project planning"
- "Wireframes en design concepten"
- "Werkende website homepage"
- "User login en registratie systeem"
- "Uitgebreide test rapportage"

## Voorbeelden van Goede Taken:
- "Requirements gathering sessie met stakeholders"
- "Homepage design maken in Figma"
- "React componenten bouwen voor navbar"
- "Database schema ontwerpen"
- "API endpoints implementeren"
- "Cross-browser testing uitvoeren"

## Special Instructions:
- Als het voorstel onduidelijk is, maak logische aannames
- Altijd een "Projectstart & Requirements" fase toevoegen
- Altijd een "Testing & Oplevering" fase aan het eind toevoegen
- Verdeel complexe projecten over meer fasen
- Eenvoudige projecten kunnen met 2-3 fasen

## Output Requirements:
- Gebruik EXACT het gespecificeerde JSON schema
- Alle required fields moeten ingevuld zijn
- Uren moeten realistisch en consistent zijn
- Target dates logisch berekenen (week 1, week 2, etc.)
- Team assignments eerlijk verdelen tussen Tijn en Twan

## Kwaliteits Check:
Voordat je het JSON retourneert, controleer:
✓ Alle fasen hebben een logische volgorde
✓ Alle deliverables zijn concreet en meetbaar  
✓ Alle taken zijn actionable en specifiek
✓ **KRITIEK: Som van alle deliverable uren = exacte project totalHours**
✓ Uren verdeling is realistisch per deliverable complexiteit
✓ Nederlandse taal is gebruikt
✓ JSON is valid en compleet

## Uren Rekenvoorbeeld:
**Scenario 1 - Expliciete uren:**
"Project: 120 uur, budget €13.200"
→ totalHours: 120, projectValue: 13200
→ Deliverable uren moeten optellen tot exact 120h

**Scenario 2 - Alleen bedrag:**  
"Project budget: €8.800, geen uren vermeld"
→ totalHours: 80 (€8.800 ÷ €110), projectValue: 8800
→ Deliverable uren moeten optellen tot exact 80h

**Scenario 3 - Schatting:**
"Simpele website, geen budget/uren vermeld"
→ Schat realistisch: totalHours: 60, projectValue: 6600
→ Deliverable uren moeten optellen tot exact 60h

Analyseer nu dit projectvoorstel: ${proposalText}`
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "project_parser_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                project_info: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Voorgestelde project naam"
                    },
                    client: {
                      type: "string",
                      description: "Klant naam uit voorstel"
                    },
                    totalHours: {
                      type: "number",
                      description: "Totaal declarabele uren"
                    },
                    projectValue: {
                      type: "number",
                      description: "Project waarde in EUR"
                    },
                    numberOfPhases: {
                      type: "number",
                      minimum: 1,
                      maximum: 10,
                      description: "Aantal fasen voor dit project"
                    }
                  },
                  required: [
                    "name",
                    "client",
                    "totalHours",
                    "projectValue",
                    "numberOfPhases"
                  ],
                  additionalProperties: false
                },
                phases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Fase naam (bijv. Fase 1, Fase 2)"
                      },
                      targetDate: {
                        type: "string",
                        description: "Target datum in YYYY-MM-DD formaat, leeg laten als onbekend"
                      },
                      deliverables: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              description: "Deliverable naam"
                            },
                            hours: {
                              type: "string",
                              description: "Aantal uren als string"
                            },
                            targetDate: {
                              type: "string",
                              description: "Target datum in YYYY-MM-DD formaat, leeg laten als onbekend"
                            },
                            tasks: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: {
                                    type: "string",
                                    description: "Taak naam"
                                  },
                                  assignedTo: {
                                    type: "string",
                                    enum: [
                                      "Tijn",
                                      "Twan"
                                    ],
                                    description: "Toegewezen aan Tijn of Twan"
                                  }
                                },
                                required: [
                                  "name",
                                  "assignedTo"
                                ],
                                additionalProperties: false
                              }
                            }
                          },
                          required: [
                            "name",
                            "hours",
                            "targetDate",
                            "tasks"
                          ],
                          additionalProperties: false
                        }
                      }
                    },
                    required: [
                      "name",
                      "targetDate",
                      "deliverables"
                    ],
                    additionalProperties: false
                  }
                }
              },
              required: [
                "project_info",
                "phases"
              ],
              additionalProperties: false
            }
          }
        },
        reasoning: {
          effort: "medium",
          summary: "auto"
        },
        tools: [],
        store: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', JSON.stringify(data, null, 2));

    // Extract the JSON from the response
    let parsedData;
    try {
      // Handle the new OpenAI response structure
      if (data.output && Array.isArray(data.output)) {
        // Find the message output
        const messageOutput = data.output.find((item: any) => item.type === 'message');
        if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
          // Find the output_text content
          const textContent = messageOutput.content.find((item: any) => item.type === 'output_text');
          if (textContent && textContent.text) {
            parsedData = JSON.parse(textContent.text);
          }
        }
      }
      
      // Fallback for other response formats
      if (!parsedData) {
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          parsedData = JSON.parse(data.choices[0].message.content);
        } else if (data.content) {
          parsedData = JSON.parse(data.content);
        } else if (data.text) {
          parsedData = JSON.parse(data.text);
        } else {
          // Direct response
          parsedData = data;
        }
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response data:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response format from OpenAI');
    }

    console.log('Successfully parsed project data:', JSON.stringify(parsedData, null, 2));

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-proposal function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze proposal',
        details: 'Please check if your proposal text is valid and try again.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
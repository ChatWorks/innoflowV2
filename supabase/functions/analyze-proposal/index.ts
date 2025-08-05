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
        prompt: {
          id: "pmpt_6891dcc450408195bd0f42d5958046d3030a5fee7ef5fd47",
          version: "2"
        },
        input: [
          {
            role: "user",
            content: proposalText
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
          summary: null
        },
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

    // Extract the JSON from the response using the correct structure
    let parsedData;
    try {
      // Handle the OpenAI responses API structure
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

    if (!parsedData) {
      throw new Error('Could not extract data from OpenAI response');
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
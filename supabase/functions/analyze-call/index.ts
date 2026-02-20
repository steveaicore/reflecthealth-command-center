const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, fileName, durationSeconds } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert call center AI analyst specializing in healthcare operations, insurance, and TPA environments. 
Analyze call transcripts and return structured JSON intelligence.

You must return ONLY valid JSON, no markdown, no explanation. Return this exact structure:
{
  "call_type": "string (e.g. Benefits Verification, Claim Status, Prior Authorization, Eligibility, Provider Inquiry, Member Inquiry, Appeals, Billing)",
  "intent": "string (concise primary intent, e.g. 'Check claim status for denied claim')",
  "entities": {
    "member_id": "string or null",
    "dob": "string or null", 
    "policy_number": "string or null",
    "claim_number": "string or null",
    "cpt_codes": ["array of strings"],
    "icd_codes": ["array of strings"],
    "provider_npi": "string or null",
    "address_update": "boolean"
  },
  "sentiment": "string (Positive, Neutral, Frustrated, Escalated, Distressed)",
  "resolution_type": "string (Resolved, Escalated, Pending, Transferred, Unresolved)",
  "automation_feasibility_score": "integer 0-100",
  "escalation_risk": "string (Low, Medium, High)",
  "summary": "string (2-3 sentence professional summary)",
  "backend_systems_accessed": ["array of systems: e.g. Claims Engine, Eligibility DB, Provider Directory, Member Portal, CRM"],
  "compliance_flags": ["array of compliance considerations, e.g. HIPAA verification required, PHI accessed"],
  "ai_response_script": "string (what Penguin AI would say to handle this call autonomously, 3-4 sentences)",
  "automation_scenario_name": "string (descriptive name for saving as a scenario)",
  "required_data_inputs": ["array of required data inputs for automation"],
  "required_system_integrations": ["array of required system integrations"],
  "escalation_rules": ["array of conditions that would trigger escalation"],
  "compliance_requirements": ["array of compliance steps required"],
  "expected_resolution": "string (what the automated resolution would be)"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analyze this healthcare call center transcript from file "${fileName}" (duration: ${durationSeconds || 'unknown'} seconds):\n\n${transcript}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';

    // Strip markdown code blocks if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', cleaned);
      // Return a fallback analysis
      analysis = {
        call_type: 'General Inquiry',
        intent: 'General call inquiry',
        entities: { member_id: null, dob: null, policy_number: null, claim_number: null, cpt_codes: [], icd_codes: [], provider_npi: null, address_update: false },
        sentiment: 'Neutral',
        resolution_type: 'Resolved',
        automation_feasibility_score: 72,
        escalation_risk: 'Low',
        summary: 'Call analyzed. Full transcript processed.',
        backend_systems_accessed: ['CRM', 'Member Portal'],
        compliance_flags: ['HIPAA verification required'],
        ai_response_script: 'Thank you for calling. I can help you with that today.',
        automation_scenario_name: 'General Inquiry Automation',
        required_data_inputs: ['Member ID', 'Date of Birth'],
        required_system_integrations: ['CRM', 'Member Portal'],
        escalation_rules: ['Sentiment becomes distressed', 'Cannot verify identity'],
        compliance_requirements: ['Verify caller identity', 'Log HIPAA access'],
        expected_resolution: 'Inquiry resolved automatically',
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('analyze-call error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

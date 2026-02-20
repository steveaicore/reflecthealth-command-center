const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { callerTurns, callType, intent, entities, summary } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build a numbered list of caller utterances
    const callerScript = (callerTurns as string[])
      .map((t, i) => `[Caller turn ${i + 1}]: "${t}"`)
      .join('\n');

    const systemPrompt = `You are Penguin AI, an expert AI voice agent for healthcare call centers (TPAs, insurance carriers, provider offices).
Your job is to generate EXACTLY ${callerTurns.length} AI responses — one for each caller turn provided.

Rules:
- Each response must directly and precisely address what the caller just said in that turn.
- Be fast, confident, and professional. Resolve the call in as few words as possible.
- Verify identity early, pull data quickly, give a clear answer, and wrap up.
- Do NOT be generic. Reference specifics from the call context (entities, call type, intent).
- Each response should be 1-2 sentences max. Short. Efficient. No filler.
- The overall call should reach a clean resolution by the final turn.
- Return ONLY a JSON array of strings, one per caller turn. No markdown, no explanation.
Example: ["Response to turn 1.", "Response to turn 2.", ...]`;

    const userPrompt = `Call context:
- Call type: ${callType}
- Intent: ${intent}
- Summary: ${summary}
- Entities: ${JSON.stringify(entities)}

Caller turns to respond to (in order):
${callerScript}

Generate exactly ${callerTurns.length} Penguin AI responses, one per turn, as a JSON array.`;

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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('AI gateway error:', response.status, err);
      return new Response(JSON.stringify({ error: 'AI dialogue generation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '[]';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let responses: string[];
    try {
      responses = JSON.parse(cleaned);
      if (!Array.isArray(responses)) throw new Error('Not an array');
    } catch {
      // Fallback: split by newlines and clean up
      responses = cleaned.split('\n').filter((l: string) => l.trim() && !l.startsWith('[')).map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim());
    }

    // Ensure we have the right count
    while (responses.length < (callerTurns as string[]).length) {
      responses.push("I've verified your information and the request has been processed successfully.");
    }

    return new Response(JSON.stringify({ responses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-replay-dialogue error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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

    const turns = callerTurns as string[];

    // Build a numbered conversation sequence so the AI sees what the caller said
    // at each step and can generate a CONTEXTUALLY CORRECT response to that specific utterance.
    const conversationContext = turns
      .map((t, i) => `Turn ${i + 1} — Caller says: "${t}"`)
      .join('\n');

    const systemPrompt = `You are Penguin AI, a highly efficient AI voice agent for healthcare call centers (TPAs, insurance carriers, provider offices).

You are being given a sequence of things a CALLER said during an actual call — in the EXACT ORDER they said them.
Your job is to write what Penguin AI would have said IN RESPONSE to each caller utterance, one response per turn.

CRITICAL RULES:
1. Read each caller utterance CAREFULLY. Your response must DIRECTLY acknowledge or react to what the caller JUST SAID in that specific turn.
2. Do NOT ask a question that the caller has already answered in a PREVIOUS turn.
3. Do NOT ask for information that was just provided. If the caller gave a phone number, acknowledge it. If they gave a name, acknowledge it. If they gave an ID, confirm receipt.
4. The conversation must be LOGICALLY SEQUENTIAL — your response in turn N should naturally lead to what the caller says in turn N+1.
5. Penguin AI moves FAST: acknowledge → verify → retrieve → resolve. Minimal back-and-forth.
6. 1-2 sentences max per response. Professional, confident, warm.
7. Think of it as: the caller's turns are already locked in — you are FILLING IN the AI's side of the conversation to make it coherent and sensible.
8. End the call resolved and efficiently. No open loops.
9. If the caller says something like a number or code, treat it as the answer to your PREVIOUS question and acknowledge it before asking the next thing.

Return ONLY a JSON array of strings — one response per caller turn, in order.
Example format: ["Response to turn 1.", "Response to turn 2.", "Response to turn 3."]`;

    const userPrompt = `Call context:
- Call type: ${callType}
- Intent: ${intent}
- Summary: ${summary}
- Entities extracted: ${JSON.stringify(entities)}

Here is the full caller sequence (in the exact order they spoke during the call):
${conversationContext}

Generate exactly ${turns.length} Penguin AI responses — one per turn — where each response:
- DIRECTLY reacts to what the caller said in that specific turn
- Makes logical sense given what was said before and what comes after
- Keeps the call moving efficiently toward resolution

Return as a JSON array of exactly ${turns.length} strings. Nothing else.`;

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
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('AI gateway error:', response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
      // Fallback: try extracting quoted strings line by line
      const matches = cleaned.match(/"([^"\\]*(\\.[^"\\]*)*)"/g);
      responses = matches
        ? matches.map((m: string) => m.replace(/^"|"$/g, ''))
        : cleaned.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^\d+\.\s*/, '').trim());
    }

    // Pad to correct count if needed
    while (responses.length < turns.length) {
      responses.push("I've noted that, thank you. Let me pull up the details for you now.");
    }
    // Trim to correct count
    responses = responses.slice(0, turns.length);

    console.log(`Generated ${responses.length} aligned responses for ${turns.length} caller turns`);

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

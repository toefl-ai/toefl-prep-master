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
    const { taskType } = await req.json();
    
    console.log('Generating content for task type:', taskType);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate system prompt based on task type
    const systemPrompt = taskType === 'lecture' 
      ? `You are an expert TOEFL test creator. Generate a high-quality academic lecture following this exact structure:

REQUIREMENTS:
- Length: 650-750 words
- Duration: ~4-5 minutes when spoken
- Style: Academic, clear, informative
- Include: Introduction, body with examples/details, conclusion
- Topics: Science, history, art, technology, social sciences

Generate ONLY valid JSON with this exact structure:
{
  "title": "Lecture title",
  "transcript": "Full lecture text (650-750 words)",
  "questions": [
    {
      "text": "Question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "type": "gist|detail|inference|organization"
    }
  ]
}

Create 6 questions covering:
- 2 gist/main idea questions
- 2 detail questions
- 1 inference question
- 1 organization/purpose question`
      : `You are an expert TOEFL test creator. Generate a realistic campus conversation following this exact structure:

REQUIREMENTS:
- Length: 12-25 dialogue turns
- Duration: ~2.5-3.5 minutes when spoken
- Participants: Student + Professor/Advisor/Staff
- Topics: Academic issues, assignments, campus life
- Natural dialogue with realistic problems/solutions

CRITICAL: Use newline characters (\\n) for line breaks in the transcript. DO NOT use HTML tags like <br> or <br/>.

Generate ONLY valid JSON with this exact structure:
{
  "title": "Conversation title",
  "transcript": "Full conversation with Speaker labels. Each speaker line should be separated by \\n. Example: 'Student: Hello professor\\nProfessor: Hi, how can I help you?\\n'",
  "questions": [
    {
      "text": "Question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "type": "gist|detail|inference|purpose"
    }
  ]
}

Create 5 questions covering:
- 1 gist/main topic question
- 2 detail questions
- 1 inference question
- 1 purpose/attitude question`;

    // Call Lovable AI (Gemini)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a ${taskType === 'lecture' ? 'lecture' : 'conversation'} for TOEFL Listening practice.` }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Generated content:', content.substring(0, 200));
    
    const parsedContent = JSON.parse(content);

    return new Response(
      JSON.stringify(parsedContent),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

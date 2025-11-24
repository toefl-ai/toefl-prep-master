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
    let systemPrompt = '';
    
    if (taskType === 'lecture') {
      systemPrompt = `You are an expert TOEFL test creator. Generate a high-quality academic lecture following this exact structure:

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
- 1 organization/purpose question`;
    } else if (taskType === 'conversation') {
      systemPrompt = `You are an expert TOEFL test creator. Generate a realistic campus conversation following this exact structure:

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
    } else if (taskType === 'reading') {
      systemPrompt = `You are an expert TOEFL test creator. Generate a high-quality academic reading passage following these EXACT RULES:

PASSAGE REQUIREMENTS:
- Length: 300-700 words
- Structure: Clear introduction, body paragraphs with development, conclusion (can be implicit)
- Academic level: University-level vocabulary and concepts
- Topics MUST be from TOEFL academic subjects:
  * Biology (evolution, ecosystems, genetics)
  * Anthropology (cultural development, human origins)
  * History (civilizations, historical events, social movements)
  * Archaeology (excavations, ancient cultures, artifacts)
  * Astronomy (celestial bodies, space exploration, cosmology)
  * Social Sciences (sociology, psychology, human behavior)
  * Geology (earth formation, geological processes, natural phenomena)
  * Economics (trade, markets, economic systems)
  * Education (learning theories, pedagogical methods)
- Style: Academic prose similar to university textbooks with formal vocabulary
- Include transition phrases and cohesive structure

QUESTIONS - CREATE EXACTLY 10 QUESTIONS:
Must include these TOEFL question types:
1. Factual Information (2-3 questions): "According to the passage...", "The author mentions X because..."
2. Negative Factual (1 question): "All of the following are mentioned EXCEPT...", "The passage discusses all of the following EXCEPT..."
3. Inference (2 questions): "What can be inferred about...", "The passage suggests that..."
4. Rhetorical Purpose (1 question): "Why does the author mention X?", "The author discusses X in order to..."
5. Vocabulary (1-2 questions): "The word X in paragraph Y is closest in meaning to..."
6. Reference (0-1 question): "The word 'it' in paragraph X refers to..."
7. Sentence Simplification (1 question): "Which sentence best expresses the essential information in the highlighted sentence?"
8. Insert Sentence (0-1 question): "Where would the following sentence best fit?"
9. Summary/Fill-in Table (1 question): "An introductory sentence for a brief summary... Complete the summary by selecting THREE answer choices..."

Generate ONLY valid JSON with this exact structure:
{
  "title": "Academic passage title (topic-focused)",
  "transcript": "Full reading passage (300-700 words). Write as continuous academic prose with clear paragraph breaks using \\n\\n between paragraphs.",
  "questions": [
    {
      "text": "Question text (clear and specific)",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
      "type": "factual|negative-factual|inference|rhetorical-purpose|vocabulary|reference|sentence-simplification|insert-sentence|summary"
    }
  ]
}

CRITICAL: 
- Each question must have EXACTLY 4 options (A, B, C, D)
- Only ONE correct answer per question
- Explanations should reference specific parts of the passage
- Questions should test different cognitive skills
- Difficulty should vary from medium to challenging (university level)`;
    }

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
          { role: 'user', content: `Generate a ${taskType === 'reading' ? 'reading passage' : taskType === 'lecture' ? 'lecture' : 'conversation'} for TOEFL practice.` }
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

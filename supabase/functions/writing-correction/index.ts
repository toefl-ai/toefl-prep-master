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
    const { userResponse, taskType, readingPassage, lectureSummary, prompt } = await req.json();
    
    console.log('Correcting writing task:', taskType);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let correctionPrompt = '';
    
    if (taskType === 'integrated') {
      correctionPrompt = `You are an expert TOEFL Writing evaluator. Evaluate this Task 1 Integrated Writing response.

READING PASSAGE:
${readingPassage}

LECTURE SUMMARY:
${lectureSummary}

STUDENT'S RESPONSE:
${userResponse}

Provide a detailed evaluation following the official TOEFL Writing rubric (0-5 scale) with these criteria:

1. CONTENT / TASK ACHIEVEMENT (0-5):
   - Did the student accurately summarize the lecture points?
   - Did they clearly explain how the lecture responds to/challenges the reading?
   - Are all 3 main points covered?
   - No personal opinion included (as required)?

2. ORGANIZATION & COHERENCE (0-5):
   - Clear introduction and structure?
   - Logical flow between ideas?
   - Effective use of transitions?
   - Cohesive paragraphing?

3. GRAMMAR & VOCABULARY (0-5):
   - Grammar accuracy and variety?
   - Vocabulary range and precision?
   - Sentence structure complexity?
   - Minor vs major errors?

4. ACADEMIC STYLE (0-5):
   - Formal tone maintained?
   - Objective, analytical voice?
   - Appropriate academic language?
   - Paraphrasing quality (not copying)?

5. OVERALL SCORE (0-5): Average of above categories

6. DETAILED FEEDBACK:
   - Specific strengths
   - Specific weaknesses with examples
   - Suggestions for improvement

7. REWRITE SUGGESTION:
   - Provide an improved version (150-225 words) that demonstrates how to better express the same ideas

Generate ONLY valid JSON response:
{
  "scores": {
    "content": 0-5,
    "organization": 0-5,
    "grammar": 0-5,
    "style": 0-5,
    "overall": 0-5
  },
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1 with example", "weakness 2 with example", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "rewriteSuggestion": "Improved version of the response"
}`;
    } else {
      correctionPrompt = `You are an expert TOEFL Writing evaluator. Evaluate this Task 2 Independent Writing response.

PROMPT:
${prompt}

STUDENT'S RESPONSE:
${userResponse}

Provide a detailed evaluation following the official TOEFL Writing rubric (0-5 scale) with these criteria:

1. CONTENT / TASK ACHIEVEMENT (0-5):
   - Clear thesis statement?
   - Direct response to the prompt?
   - Well-developed ideas with specific examples?
   - Adequate length (300+ words)?

2. ORGANIZATION & COHERENCE (0-5):
   - Clear introduction, body, conclusion?
   - Topic sentences in paragraphs?
   - Logical progression of ideas?
   - Effective transitions and cohesion?

3. GRAMMAR & VOCABULARY (0-5):
   - Grammar accuracy and variety?
   - Lexical range and sophistication?
   - Sentence complexity and variation?
   - Error frequency and severity?

4. ACADEMIC STYLE (0-5):
   - Formal academic tone?
   - No contractions or informal language?
   - Appropriate register throughout?
   - Persuasive and analytical voice?

5. OVERALL SCORE (0-5): Average of above categories

6. DETAILED FEEDBACK:
   - Specific strengths with examples
   - Specific weaknesses with examples
   - Concrete suggestions for improvement

7. REWRITE SUGGESTION:
   - Provide an improved version (300-350 words) that demonstrates better organization, development, and language

Generate ONLY valid JSON response:
{
  "scores": {
    "content": 0-5,
    "organization": 0-5,
    "grammar": 0-5,
    "style": 0-5,
    "overall": 0-5
  },
  "strengths": ["strength 1 with example", "strength 2 with example", ...],
  "weaknesses": ["weakness 1 with example", "weakness 2 with example", ...],
  "suggestions": ["concrete suggestion 1", "concrete suggestion 2", ...],
  "rewriteSuggestion": "Improved version demonstrating excellent TOEFL writing",
  "wordCount": actual_word_count_of_student_response
}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert TOEFL Writing evaluator with deep knowledge of the official TOEFL rubric.' },
          { role: 'user', content: correctionPrompt }
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
    
    console.log('Correction generated:', content.substring(0, 200));
    
    const parsedContent = JSON.parse(content);

    return new Response(
      JSON.stringify(parsedContent),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in writing-correction:', error);
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

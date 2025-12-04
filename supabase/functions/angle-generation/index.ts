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
    const { image, angle } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    console.log('Generating angle view:', angle);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const anglePrompts: Record<string, string> = {
      'profile-left': 'Generate a realistic left profile view of this face. Show the complete side view from the left with accurate facial structure, maintaining all distinctive features.',
      'profile-right': 'Generate a realistic right profile view of this face. Show the complete side view from the right with accurate facial structure, maintaining all distinctive features.',
      'three-quarter-left': 'Generate a realistic three-quarter left view of this face. Show the face turned 45 degrees to the left, revealing both front and side features.',
      'three-quarter-right': 'Generate a realistic three-quarter right view of this face. Show the face turned 45 degrees to the right, revealing both front and side features.',
      'top-down': 'Generate a realistic top-down view of this face, as if looking down from above at a 30-degree angle.',
      'bottom-up': 'Generate a realistic view of this face from below, looking up at a 30-degree angle.'
    };

    const prompt = anglePrompts[angle] || 'Generate alternative viewing angles of this face while maintaining all distinctive features and realistic proportions.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Angle generation completed successfully');

    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      throw new Error('No image generated from AI response');
    }

    return new Response(
      JSON.stringify({ image: generatedImage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in angle-generation function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frameImage, caseId, location } = await req.json();
    
    if (!frameImage) {
      throw new Error('frameImage is required');
    }

    console.log('Processing realtime frame', caseId ? `for case: ${caseId}` : '(standalone CCTV)');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active criminals from database
    const { data: criminals, error: criminalsError } = await supabase
      .from('criminals')
      .select('*')
      .eq('is_active', true);

    if (criminalsError) {
      console.error('Error fetching criminals:', criminalsError);
      throw criminalsError;
    }

    // Get evidence images from this case (only if caseId provided)
    let evidence: any[] = [];
    if (caseId) {
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .eq('case_id', caseId);

      if (evidenceError) {
        console.error('Error fetching evidence:', evidenceError);
      } else {
        evidence = evidenceData || [];
      }
    }

    console.log(`Checking frame against ${criminals?.length || 0} active criminals and ${evidence.length} evidence images`);

    if (!criminals || criminals.length === 0) {
      console.log('No active criminals in database to match against');
      return new Response(
        JSON.stringify({ 
          success: true,
          detections: [],
          facesDetected: 0,
          message: 'No active criminals in database'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect faces in the frame using Lovable AI
    const faceDetectionResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Detect and describe all faces in this image. For each face provide:
1. Detailed description (estimated age, gender, ethnicity if visible, distinguishing features)
2. Position in frame (left, center, right)

Respond ONLY in valid JSON:
{
  "faces": [
    {
      "description": "detailed description here",
      "position": "location in frame"
    }
  ]
}

If no faces detected: {"faces": []}`
              },
              {
                type: 'image_url',
                image_url: { url: frameImage }
              }
            ]
          }
        ]
      }),
    });

    if (!faceDetectionResponse.ok) {
      const errorText = await faceDetectionResponse.text();
      console.error('AI API error:', faceDetectionResponse.status, errorText);
      
      if (faceDetectionResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.', detections: [], facesDetected: 0 }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${faceDetectionResponse.status}`);
    }

    const faceData = await faceDetectionResponse.json();
    const faceAnalysisText = faceData.choices?.[0]?.message?.content;
    console.log('Face detection response:', faceAnalysisText?.substring(0, 200));

    let faceAnalysis;
    try {
      const jsonMatch = faceAnalysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        faceAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        faceAnalysis = { faces: [] };
      }
    } catch {
      console.log('Could not parse face detection response');
      faceAnalysis = { faces: [] };
    }

    const detections: any[] = [];
    console.log(`Detected ${faceAnalysis.faces?.length || 0} faces in frame`);

    // For each detected face, compare with criminals
    for (const face of faceAnalysis.faces || []) {
      for (const criminal of criminals || []) {
        if (!criminal.photo_url) continue;

        console.log(`Comparing face with criminal: ${criminal.name}`);

        const matchResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Compare person in first image with criminal photo in second image.

Detected: ${face.description}
Criminal: ${criminal.name}, ${criminal.age_range || 'unknown age'}, ${criminal.gender || 'unknown gender'}
Marks: ${criminal.distinguishing_marks || 'none'}

Provide match probability 0-100. Respond with ONLY a number.`
                  },
                  {
                    type: 'image_url',
                    image_url: { url: frameImage }
                  },
                  {
                    type: 'image_url',
                    image_url: { url: criminal.photo_url }
                  }
                ]
              }
            ]
          }),
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          const matchText = matchData.choices?.[0]?.message?.content;
          const matchScore = parseInt(matchText?.match(/\d+/)?.[0] || '0');

          console.log(`Match score for ${criminal.name}: ${matchScore}%`);

          if (matchScore > 60) {
            console.log(`🚨 ALERT: ${criminal.name} detected (${matchScore}% match)`);
            
            // Create detection record
            const { error: detectionError } = await supabase
              .from('detections')
              .insert({
                criminal_id: criminal.id,
                case_id: caseId || null,
                detection_type: 'realtime',
                confidence_score: matchScore,
                snapshot_url: frameImage.substring(0, 100) + '...',
                location: location || 'CCTV Detection',
                alerted: true,
              });

            if (detectionError) {
              console.error('Error creating detection:', detectionError);
            }

            detections.push({
              type: 'criminal',
              criminalName: criminal.name,
              criminalId: criminal.id,
              threatLevel: criminal.threat_level,
              confidence: matchScore / 100,
              timestamp: new Date().toISOString(),
              location: location || 'CCTV Detection'
            });
          }
        }
      }
    }

    console.log(`Detection completed. Found ${detections.length} matches.`);

    return new Response(
      JSON.stringify({ 
        success: true,
        detections: detections,
        facesDetected: faceAnalysis.faces?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in realtime-detection:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

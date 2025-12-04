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
    
    if (!frameImage || !caseId) {
      throw new Error('frameImage and caseId are required');
    }

    console.log('Processing realtime frame for case:', caseId);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
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

    // Get evidence images from this case
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('*')
      .eq('case_id', caseId);

    if (evidenceError) {
      console.error('Error fetching evidence:', evidenceError);
    }

    console.log(`Checking frame against ${criminals?.length || 0} active criminals and ${evidence?.length || 0} evidence images`);

    // Detect faces in the frame
    const faceDetectionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                text: `Detect and describe all faces in this image. For each face provide:
1. Detailed description (age, gender, ethnicity, distinguishing features)
2. Position in frame

Respond in JSON:
{
  "faces": [
    {
      "description": "detailed description",
      "position": "location in frame"
    }
  ]
}`
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
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (faceDetectionResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${faceDetectionResponse.status}`);
    }

    const faceData = await faceDetectionResponse.json();
    const faceAnalysisText = faceData.choices?.[0]?.message?.content;

    let faceAnalysis;
    try {
      const jsonMatch = faceAnalysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        faceAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        faceAnalysis = { faces: [] };
      }
    } catch {
      faceAnalysis = { faces: [] };
    }

    const detections = [];

    // For each detected face, compare with criminals
    for (const face of faceAnalysis.faces || []) {
      for (const criminal of criminals || []) {
        // Compare face with criminal using AI
        const matchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    text: `Compare this detected person with this criminal profile. Provide match probability (0-100):

Detected: ${face.description}

Criminal: ${criminal.name}
- Age: ${criminal.age_range}
- Gender: ${criminal.gender}
- Ethnicity: ${criminal.ethnicity}
- Height: ${criminal.height}
- Build: ${criminal.build}
- Marks: ${criminal.distinguishing_marks}

Respond with only a number 0-100.`
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

          // If high confidence match, record it
          if (matchScore > 70) {
            console.log(`🚨 ALERT: ${criminal.name} detected (${matchScore}% match)`);
            
            // Save snapshot to storage
            const timestamp = new Date().getTime();
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('detection-snapshots')
              .upload(`${caseId}/${timestamp}.jpg`, 
                Uint8Array.from(atob(frameImage.split(',')[1]), c => c.charCodeAt(0)),
                { contentType: 'image/jpeg' }
              );

            let snapshotUrl = frameImage;
            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage
                .from('detection-snapshots')
                .getPublicUrl(uploadData.path);
              snapshotUrl = urlData.publicUrl;
            }

            // Create detection record
            const { error: detectionError } = await supabase
              .from('detections')
              .insert({
                criminal_id: criminal.id,
                case_id: caseId,
                detection_type: 'realtime',
                confidence_score: matchScore,
                snapshot_url: snapshotUrl,
                location: location,
                alerted: true,
              });

            if (detectionError) {
              console.error('Error creating detection:', detectionError);
            } else {
              detections.push({
                criminal: criminal,
                confidence: matchScore,
                snapshotUrl: snapshotUrl,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
    }

    // Also check against case evidence images
    for (const face of faceAnalysis.faces || []) {
      for (const evidenceItem of evidence || []) {
        // Only check image evidence
        if (!evidenceItem.image_url || !evidenceItem.image_url.startsWith('data:image')) continue;

        // Use AI to compare the detected face with evidence image
        const matchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    text: 'Compare these two faces and provide a match probability (0-100). Respond with just a number.'
                  },
                  {
                    type: 'image_url',
                    image_url: { url: frameImage }
                  },
                  {
                    type: 'image_url',
                    image_url: { url: evidenceItem.image_url }
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

          // If high confidence match
          if (matchScore > 75) {
            console.log(`🚨 Evidence match detected (${matchScore}% match)`);
            
            // Save snapshot to storage
            const timestamp = new Date().getTime();
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('detection-snapshots')
              .upload(`${caseId}/${timestamp}_evidence.jpg`, 
                Uint8Array.from(atob(frameImage.split(',')[1]), c => c.charCodeAt(0)),
                { contentType: 'image/jpeg' }
              );

            let snapshotUrl = frameImage;
            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage
                .from('detection-snapshots')
                .getPublicUrl(uploadData.path);
              snapshotUrl = urlData.publicUrl;
            }

            detections.push({
              type: 'evidence',
              evidence: evidenceItem,
              confidence: matchScore,
              snapshotUrl: snapshotUrl,
              timestamp: new Date().toISOString(),
              message: `Matches evidence from case`
            });
          }
        }
      }
    }

    console.log(`Realtime detection completed. Found ${detections.length} matches.`);

    return new Response(
      JSON.stringify({ 
        success: true,
        detections: detections,
        facesDetected: faceAnalysis.faces?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in realtime-detection function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

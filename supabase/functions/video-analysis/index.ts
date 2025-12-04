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
    const { videoUrl, caseId } = await req.json();
    
    if (!videoUrl || !caseId) {
      throw new Error('videoUrl and caseId are required');
    }

    console.log('Starting video analysis for case:', caseId);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download image from storage and convert to base64
    let imageBase64 = videoUrl;
    
    // If it's a storage URL, download and convert to base64
    if (videoUrl.includes('supabase.co/storage')) {
      try {
        console.log('Downloading media from storage...');
        
        // Check if it's a video file
        if (videoUrl.match(/\.(mp4|avi|mov|webm)$/i)) {
          throw new Error('Video files are not supported yet. Please upload an image (JPG, PNG) instead.');
        }
        
        const imageResponse = await fetch(videoUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Convert to base64 in chunks to avoid stack overflow
        console.log(`Converting ${bytes.length} bytes to base64...`);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);
        
        // Determine mime type from URL
        const mimeType = videoUrl.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 'image/png';
        imageBase64 = `data:${mimeType};base64,${base64}`;
        console.log('Image converted to base64 successfully');
      } catch (error) {
        console.error('Error processing image:', error);
        throw error;
      }
    }

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

    console.log(`Found ${criminals?.length || 0} active criminals and ${evidence?.length || 0} evidence images to match against`);

    // Analyze video frame using AI
    // In a real implementation, you would:
    // 1. Extract frames from video at intervals
    // 2. For each frame, detect faces
    // 3. Compare each detected face against criminal database
    // For this demo, we'll simulate frame analysis

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
                text: `Analyze this image/video frame for faces. For each face detected, provide:
1. Description of the person (approximate age, gender, ethnicity, distinguishing features)
2. Location in frame (approximate position)
3. Confidence level

Provide your analysis in JSON format:
{
  "faces": [
    {
      "description": "detailed description",
      "position": "center/left/right/top/bottom",
      "confidence": <0-100>
    }
  ]
}`
              },
              {
                type: 'image_url',
                image_url: { url: imageBase64 }
              }
            ]
          }
        ]
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
      
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis generated from AI response');
    }

    console.log('Frame analysis completed');

    // Parse the analysis
    let faceAnalysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        faceAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        faceAnalysis = { faces: [] };
      }
    } catch {
      faceAnalysis = { faces: [] };
    }

    // Now compare detected faces with criminals database AND case evidence
    const detections = [];

    for (const face of faceAnalysis.faces || []) {
      // Check against criminals database
      for (const criminal of criminals || []) {
        // Use AI to compare the face description with criminal profile
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
                content: `Compare this detected person with this criminal profile and provide a match probability (0-100):

Detected Person: ${face.description}

Criminal Profile:
Name: ${criminal.name}
Age Range: ${criminal.age_range}
Gender: ${criminal.gender}
Ethnicity: ${criminal.ethnicity}
Height: ${criminal.height}
Weight: ${criminal.weight}
Build: ${criminal.build}
Distinguishing Marks: ${criminal.distinguishing_marks}

Respond with just a number 0-100 representing match probability.`
              }
            ]
          }),
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          const matchText = matchData.choices?.[0]?.message?.content;
          const matchScore = parseInt(matchText?.match(/\d+/)?.[0] || '0');

          // If match score is above threshold, record detection
          if (matchScore > 60) {
            console.log(`Potential match found: ${criminal.name} (${matchScore}% confidence)`);
            
            // Create detection record
            const { error: detectionError } = await supabase
              .from('detections')
              .insert({
                criminal_id: criminal.id,
                case_id: caseId,
                detection_type: 'video',
                video_url: videoUrl,
                confidence_score: matchScore,
                snapshot_url: videoUrl, // In real implementation, extract specific frame
                alerted: true,
              });

            if (detectionError) {
              console.error('Error creating detection:', detectionError);
            } else {
              detections.push({
                criminal: criminal,
                confidence: matchScore,
                face: face
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
                    image_url: { url: imageBase64 }
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

          // If match score is above threshold
          if (matchScore > 70) {
            console.log(`Evidence match found (${matchScore}% confidence)`);
            
            detections.push({
              type: 'evidence',
              evidence: evidenceItem,
              confidence: matchScore,
              face: face,
              message: `Matches evidence from case`
            });
          }
        }
      }
    }

    console.log(`Video analysis completed. Found ${detections.length} potential matches.`);

    return new Response(
      JSON.stringify({ 
        success: true,
        detections: detections,
        facesDetected: faceAnalysis.faces?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in video-analysis function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const FacialMatchingTool = () => {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSelect = (imageNum: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (imageNum === 1) {
          setImage1(reader.result as string);
        } else {
          setImage2(reader.result as string);
        }
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image1 || !image2) {
      toast.error("Please upload both images");
      return;
    }

    setIsProcessing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('facial-matching', {
        body: { image1, image2 }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast.success("Analysis completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze images");
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'high') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (confidence === 'medium') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label>First Photo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(1, e)}
              className="mt-2"
            />
          </div>

          {image1 && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={image1} alt="Image 1" className="w-full" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label>Second Photo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(2, e)}
              className="mt-2"
            />
          </div>

          {image2 && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={image2} alt="Image 2" className="w-full" />
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleProcess}
        disabled={!image1 || !image2 || isProcessing}
        className="w-full bg-gradient-hero"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          "Compare Faces"
        )}
      </Button>

      {analysis && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {analysis.matchProbability !== undefined && (
              <div className="flex items-center justify-between">
                <span className="font-semibold">Match Probability:</span>
                <Badge className="text-lg px-4 py-1">
                  {analysis.matchProbability}%
                </Badge>
              </div>
            )}

            {analysis.confidence && (
              <div className="flex items-center justify-between">
                <span className="font-semibold">Confidence:</span>
                <Badge variant="outline" className={getConfidenceColor(analysis.confidence)}>
                  {analysis.confidence}
                </Badge>
              </div>
            )}

            {analysis.matchingFeatures && analysis.matchingFeatures.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Matching Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {analysis.matchingFeatures.map((feature: string, i: number) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.differences && analysis.differences.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Differences:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {analysis.differences.map((diff: string, i: number) => (
                    <li key={i}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.assessment && (
              <div>
                <h4 className="font-semibold mb-2">Assessment:</h4>
                <p className="text-sm text-muted-foreground">{analysis.assessment}</p>
              </div>
            )}

            {analysis.rawAnalysis && (
              <div>
                <h4 className="font-semibold mb-2">Analysis:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.rawAnalysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

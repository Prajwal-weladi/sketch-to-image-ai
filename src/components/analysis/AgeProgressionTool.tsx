import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export const AgeProgressionTool = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [targetAge, setTargetAge] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!originalImage) {
      toast.error("Please upload an image first");
      return;
    }

    setIsProcessing(true);
    setResultImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('age-progression', {
        body: { image: originalImage, targetAge: targetAge || null }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultImage(data.image);
      toast.success("Age progression completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label>Upload Photo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="mt-2"
            />
          </div>

          {originalImage && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={originalImage} alt="Original" className="w-full" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="targetAge">Target Age (Optional)</Label>
            <Input
              id="targetAge"
              type="number"
              placeholder="e.g., 60"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
              min="1"
              max="120"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for automatic 20-year progression
            </p>
          </div>

          {resultImage && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={resultImage} alt="Result" className="w-full" />
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleProcess}
        disabled={!originalImage || isProcessing}
        className="w-full bg-gradient-hero"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Generate Age Progression"
        )}
      </Button>
    </div>
  );
};

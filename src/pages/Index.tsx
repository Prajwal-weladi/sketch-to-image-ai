import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SketchUploader } from "@/components/SketchUploader";
import { ImageDisplay } from "@/components/ImageDisplay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!originalImage) {
      toast.error('Please upload a sketch first');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('sketch-to-image', {
        body: { image: originalImage }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.image) {
        throw new Error('No image returned from API');
      }

      setGeneratedImage(data.image);
      toast.success('Image generated successfully!');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="absolute top-4 right-4">
            <Button onClick={() => navigate("/auth")} variant="outline">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Image Generation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
              Sketch to Reality
            </h1>
            <p className="text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Transform your hand-drawn sketches into stunning, realistic colored images with the power of AI
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {!originalImage ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SketchUploader
              onImageSelect={setOriginalImage}
              onGenerating={setIsGenerating}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <ImageDisplay
              originalImage={originalImage}
              generatedImage={generatedImage}
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-hero hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg shadow-glow"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="px-8 py-6 text-lg border-border hover:bg-muted"
              >
                Upload New Sketch
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { title: 'AI-Powered', desc: 'Advanced AI transforms sketches into realistic images' },
            { title: 'High Quality', desc: 'Generate detailed, vibrant, and professional results' },
            { title: 'Instant Results', desc: 'Get your transformed image in seconds' }
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-gradient-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
            >
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
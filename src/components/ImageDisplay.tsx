import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageDisplayProps {
  originalImage: string;
  generatedImage: string | null;
}

export const ImageDisplay = ({ originalImage, generatedImage }: ImageDisplayProps) => {
  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded successfully!');
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Original Sketch */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-semibold text-primary">
          Original Sketch
        </h3>
        <div className="relative rounded-2xl overflow-hidden bg-card shadow-card border border-border">
          <img
            src={originalImage}
            alt="Original sketch"
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Generated Image */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold text-secondary">
            Generated Image
          </h3>
          {generatedImage && (
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="gap-2 border-secondary text-secondary hover:bg-secondary/10"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </div>
        <div className="relative rounded-2xl overflow-hidden bg-card shadow-card border border-border min-h-[300px] flex items-center justify-center">
          {generatedImage ? (
            <img
              src={generatedImage}
              alt="Generated colored image"
              className="w-full h-auto animate-in fade-in duration-700"
            />
          ) : (
            <div className="text-muted-foreground">
              Generated image will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
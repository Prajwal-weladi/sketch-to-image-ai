import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SketchUploaderProps {
  onImageSelect: (image: string) => void;
  onGenerating: (generating: boolean) => void;
}

export const SketchUploader = ({ onImageSelect, onGenerating }: SketchUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
        isDragging
          ? 'border-primary bg-primary/5 scale-105'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
          <Upload className="w-10 h-10 text-background" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-display font-semibold text-foreground">
            Upload Your Sketch
          </h3>
          <p className="text-muted-foreground">
            Drag & drop or click to select an image
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-hero hover:opacity-90 text-primary-foreground font-semibold px-8 shadow-glow"
        >
          Choose File
        </Button>
      </div>
    </div>
  );
};
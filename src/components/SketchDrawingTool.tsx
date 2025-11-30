import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Line, Ellipse } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Pencil, Eraser, Circle as CircleIcon, Square, Minus, 
  Trash2, Download, Undo, RotateCcw, Palette, MousePointer
} from "lucide-react";
import { toast } from "sonner";

const SKIN_TONES = ["#FFDFC4", "#F0C8A0", "#DEB887", "#C68642", "#8D5524", "#5C4033"];
const COLORS = ["#000000", "#FFFFFF", "#4A4A4A", "#808080", "#C0C0C0", "#2C1810"];

export const SketchDrawingTool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "eraser" | "circle" | "rectangle" | "line" | "ellipse">("draw");
  const [brushSize, setBrushSize] = useState(2);
  const [activeColor, setActiveColor] = useState("#000000");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 500,
      height: 600,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushSize;

    // Save initial state
    const initialState = JSON.stringify(canvas.toJSON());
    setHistory([initialState]);
    setHistoryIndex(0);

    // Track changes for undo
    canvas.on('object:added', () => {
      const json = JSON.stringify(canvas.toJSON());
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, json];
      });
      setHistoryIndex(prev => prev + 1);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    if (activeTool === "draw" || activeTool === "eraser") {
      fabricCanvas.isDrawingMode = true;
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = activeTool === "eraser" ? "#ffffff" : activeColor;
        fabricCanvas.freeDrawingBrush.width = activeTool === "eraser" ? brushSize * 3 : brushSize;
      }
    } else {
      fabricCanvas.isDrawingMode = false;
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    if (!fabricCanvas) return;
    setActiveTool(tool);

    if (tool === "circle") {
      const circle = new Circle({
        left: 200,
        top: 150,
        radius: 50,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
      });
      fabricCanvas.add(circle);
    } else if (tool === "rectangle") {
      const rect = new Rect({
        left: 200,
        top: 150,
        width: 100,
        height: 80,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
      });
      fabricCanvas.add(rect);
    } else if (tool === "ellipse") {
      const ellipse = new Ellipse({
        left: 200,
        top: 150,
        rx: 60,
        ry: 40,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
      });
      fabricCanvas.add(ellipse);
    } else if (tool === "line") {
      const line = new Line([200, 200, 350, 200], {
        stroke: activeColor,
        strokeWidth: brushSize,
      });
      fabricCanvas.add(line);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    setHistory([JSON.stringify(fabricCanvas.toJSON())]);
    setHistoryIndex(0);
    toast.success("Canvas cleared");
  };

  const handleUndo = () => {
    if (!fabricCanvas || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement("a");
    link.download = `sketch-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Sketch downloaded");
  };

  const handleExportToUploader = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    // Store in sessionStorage for the sketch uploader to access
    sessionStorage.setItem("drawnSketch", dataURL);
    toast.success("Sketch ready for AI transformation! Go to the home page to generate.");
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Pencil className="w-5 h-5 text-primary" />
          Sketch Drawing Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeTool === "select" ? "default" : "outline"}
            onClick={() => handleToolClick("select")}
            title="Select"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "draw" ? "default" : "outline"}
            onClick={() => handleToolClick("draw")}
            title="Pencil"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "eraser" ? "default" : "outline"}
            onClick={() => handleToolClick("eraser")}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "line" ? "default" : "outline"}
            onClick={() => handleToolClick("line")}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "circle" ? "default" : "outline"}
            onClick={() => handleToolClick("circle")}
            title="Circle"
          >
            <CircleIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "ellipse" ? "default" : "outline"}
            onClick={() => handleToolClick("ellipse")}
            title="Ellipse (Face shape)"
          >
            <CircleIcon className="w-4 h-4 scale-x-125" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "rectangle" ? "default" : "outline"}
            onClick={() => handleToolClick("rectangle")}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </Button>
          <div className="border-l border-border mx-1" />
          <Button size="sm" variant="outline" onClick={handleUndo} title="Undo">
            <Undo className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear} title="Clear">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-20">Brush Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={1}
            max={20}
            step={1}
            className="flex-1 max-w-[200px]"
          />
          <span className="text-sm text-muted-foreground w-8">{brushSize}px</span>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Drawing Colors:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  activeColor === color ? "border-primary ring-2 ring-primary/50" : "border-border"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Skin Tones:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  activeColor === color ? "border-primary ring-2 ring-primary/50" : "border-border"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download Sketch
          </Button>
          <Button onClick={handleExportToUploader} className="gap-2 bg-gradient-hero hover:opacity-90">
            <Pencil className="w-4 h-4" />
            Use for AI Transform
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

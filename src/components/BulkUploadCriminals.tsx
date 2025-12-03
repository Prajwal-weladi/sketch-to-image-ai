import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";

interface BulkUploadCriminalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CriminalRow {
  name: string;
  photo_url?: string;
  threat_level?: string;
  aliases?: string;
  age_range?: string;
  gender?: string;
  ethnicity?: string;
  height?: string;
  weight?: string;
  build?: string;
  distinguishing_marks?: string;
  criminal_history?: string;
  conviction_dates?: string;
  warrant_status?: string;
  known_offenses?: string;
  special_instructions?: string;
  known_associates?: string;
  last_known_location?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

export function BulkUploadCriminals({ open, onOpenChange, onSuccess }: BulkUploadCriminalsProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [parsedData, setParsedData] = useState<CriminalRow[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      {
        name: "John Doe",
        photo_filename: "john_doe.jpg",
        threat_level: "medium",
        aliases: "JD, Johnny",
        age_range: "25-30",
        gender: "Male",
        ethnicity: "Caucasian",
        height: "5'10\"",
        weight: "170 lbs",
        build: "Athletic",
        distinguishing_marks: "Scar on left cheek",
        criminal_history: "Prior robbery convictions",
        conviction_dates: "2020-01-15, 2022-06-20",
        warrant_status: "Active warrant",
        known_offenses: "Robbery, Assault",
        special_instructions: "Approach with caution",
        known_associates: "Jane Smith, Bob Wilson",
        last_known_location: "Downtown Area"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Criminals");
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 20 },
      { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 30 },
      { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
      { wch: 25 }, { wch: 25 }
    ];

    XLSX.writeFile(wb, "criminal_upload_template.xlsx");
    toast.success("Template downloaded");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<CriminalRow>(sheet);

      if (jsonData.length === 0) {
        toast.error("No data found in Excel file");
        return;
      }

      setParsedData(jsonData);
      toast.success(`Found ${jsonData.length} records in Excel file`);
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast.error("Failed to parse Excel file");
    }
  };

  const handleImageFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setImageFiles(Array.from(files));
      toast.success(`${files.length} images selected`);
    }
  };

  const processUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("Please upload an Excel file first");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setResult(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadResult: UploadResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Create a map of image files by name
      const imageMap = new Map<string, File>();
      imageFiles.forEach(file => {
        imageMap.set(file.name.toLowerCase(), file);
      });

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        try {
          if (!row.name) {
            throw new Error(`Row ${i + 1}: Name is required`);
          }

          let photoUrl = row.photo_url || "";

          // Check if there's a matching image file
          const photoFilename = (row as any).photo_filename?.toLowerCase();
          if (photoFilename && imageMap.has(photoFilename)) {
            const imageFile = imageMap.get(photoFilename)!;
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('criminal-photos')
              .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('criminal-photos')
              .getPublicUrl(uploadData.path);

            photoUrl = urlData.publicUrl;
          }

          if (!photoUrl) {
            throw new Error(`Row ${i + 1}: No photo URL or matching image file found`);
          }

          // Validate threat level
          const validThreatLevels = ['low', 'medium', 'high', 'critical'];
          const threatLevel = row.threat_level?.toLowerCase() || 'medium';
          if (!validThreatLevels.includes(threatLevel)) {
            throw new Error(`Row ${i + 1}: Invalid threat level "${row.threat_level}"`);
          }

          const insertData: any = {
            name: row.name,
            photo_url: photoUrl,
            threat_level: threatLevel,
            created_by: user.id,
          };

          // Add optional fields
          if (row.aliases) insertData.aliases = row.aliases.split(',').map(a => a.trim());
          if (row.age_range) insertData.age_range = row.age_range;
          if (row.gender) insertData.gender = row.gender;
          if (row.ethnicity) insertData.ethnicity = row.ethnicity;
          if (row.height) insertData.height = row.height;
          if (row.weight) insertData.weight = row.weight;
          if (row.build) insertData.build = row.build;
          if (row.distinguishing_marks) insertData.distinguishing_marks = row.distinguishing_marks;
          if (row.criminal_history) insertData.criminal_history = row.criminal_history;
          if (row.conviction_dates) insertData.conviction_dates = row.conviction_dates.split(',').map(d => d.trim());
          if (row.warrant_status) insertData.warrant_status = row.warrant_status;
          if (row.known_offenses) insertData.known_offenses = row.known_offenses.split(',').map(o => o.trim());
          if (row.special_instructions) insertData.special_instructions = row.special_instructions;
          if (row.known_associates) insertData.known_associates = row.known_associates.split(',').map(a => a.trim());
          if (row.last_known_location) insertData.last_known_location = row.last_known_location;

          const { error: insertError } = await supabase
            .from('criminals')
            .insert(insertData);

          if (insertError) throw insertError;

          uploadResult.success++;
        } catch (error: any) {
          uploadResult.failed++;
          uploadResult.errors.push(error.message || `Row ${i + 1}: Unknown error`);
        }

        setProgress(((i + 1) / parsedData.length) * 100);
      }

      setResult(uploadResult);

      if (uploadResult.success > 0) {
        toast.success(`Successfully added ${uploadResult.success} criminals`);
        onSuccess();
      }

      if (uploadResult.failed > 0) {
        toast.error(`${uploadResult.failed} records failed to upload`);
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error("Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setParsedData([]);
    setImageFiles([]);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Criminals
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with criminal data and their photos to add multiple records at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Download Template</p>
              <p className="text-sm text-muted-foreground">
                Get the Excel template with required columns
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>

          {/* Excel Upload */}
          <div className="space-y-2">
            <Label>Excel File (.xlsx)</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              disabled={loading}
            />
            {parsedData.length > 0 && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {parsedData.length} records ready to upload
              </p>
            )}
          </div>

          {/* Image Files Upload */}
          <div className="space-y-2">
            <Label>Criminal Photos</Label>
            <Input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFilesUpload}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Upload images with filenames matching the "photo_filename" column in your Excel
            </p>
            {imageFiles.length > 0 && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {imageFiles.length} images selected
              </p>
            )}
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Processing... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{result.success} successful</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{result.failed} failed</span>
                  </div>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium text-destructive">Errors:</p>
                  <ul className="text-sm text-destructive list-disc list-inside">
                    {result.errors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>...and {result.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Close
            </Button>
            <Button 
              onClick={processUpload} 
              disabled={loading || parsedData.length === 0}
            >
              {loading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {parsedData.length} Records
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

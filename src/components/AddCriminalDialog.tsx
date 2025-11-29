import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface AddCriminalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddCriminalDialog({ open, onOpenChange, onSuccess }: AddCriminalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    aliases: "",
    threat_level: "medium",
    age_range: "",
    gender: "",
    ethnicity: "",
    height: "",
    weight: "",
    build: "",
    distinguishing_marks: "",
    criminal_history: "",
    conviction_dates: "",
    warrant_status: "",
    known_offenses: "",
    special_instructions: "",
    known_associates: "",
    last_known_location: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a photo");
      return;
    }

    try {
      setLoading(true);

      // Upload photo
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('criminal-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('criminal-photos')
        .getPublicUrl(uploadData.path);

      // Create criminal record
      const insertData: any = {
        name: formData.name,
        photo_url: urlData.publicUrl,
        threat_level: formData.threat_level,
        created_by: user.id,
      };

      // Add optional fields
      if (formData.aliases) insertData.aliases = formData.aliases.split(',').map((a: string) => a.trim());
      if (formData.age_range) insertData.age_range = formData.age_range;
      if (formData.gender) insertData.gender = formData.gender;
      if (formData.ethnicity) insertData.ethnicity = formData.ethnicity;
      if (formData.height) insertData.height = formData.height;
      if (formData.weight) insertData.weight = formData.weight;
      if (formData.build) insertData.build = formData.build;
      if (formData.distinguishing_marks) insertData.distinguishing_marks = formData.distinguishing_marks;
      if (formData.criminal_history) insertData.criminal_history = formData.criminal_history;
      if (formData.conviction_dates) insertData.conviction_dates = formData.conviction_dates.split(',').map((d: string) => d.trim());
      if (formData.warrant_status) insertData.warrant_status = formData.warrant_status;
      if (formData.known_offenses) insertData.known_offenses = formData.known_offenses.split(',').map((o: string) => o.trim());
      if (formData.special_instructions) insertData.special_instructions = formData.special_instructions;
      if (formData.known_associates) insertData.known_associates = formData.known_associates.split(',').map((a: string) => a.trim());
      if (formData.last_known_location) insertData.last_known_location = formData.last_known_location;

      const { error: insertError } = await supabase
        .from('criminals')
        .insert(insertData);

      if (insertError) throw insertError;

      toast.success("Criminal added to database");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        aliases: "",
        threat_level: "medium",
        age_range: "",
        gender: "",
        ethnicity: "",
        height: "",
        weight: "",
        build: "",
        distinguishing_marks: "",
        criminal_history: "",
        conviction_dates: "",
        warrant_status: "",
        known_offenses: "",
        special_instructions: "",
        known_associates: "",
        last_known_location: "",
      });
      setSelectedFile(null);
      setPreviewUrl("");
    } catch (error) {
      console.error('Error adding criminal:', error);
      toast.error("Failed to add criminal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Criminal to Database</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photo *</Label>
            <div className="flex items-center gap-4">
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded" />
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aliases">Aliases (comma-separated)</Label>
              <Input
                id="aliases"
                value={formData.aliases}
                onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                placeholder="Alias 1, Alias 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threat_level">Threat Level</Label>
              <Select
                value={formData.threat_level}
                onValueChange={(value) => setFormData({ ...formData, threat_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Physical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age_range">Age Range</Label>
              <Input
                id="age_range"
                value={formData.age_range}
                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                placeholder="25-30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ethnicity">Ethnicity</Label>
              <Input
                id="ethnicity"
                value={formData.ethnicity}
                onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="5'10&quot;"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="170 lbs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="build">Build</Label>
              <Input
                id="build"
                value={formData.build}
                onChange={(e) => setFormData({ ...formData, build: e.target.value })}
                placeholder="Athletic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distinguishing_marks">Distinguishing Marks</Label>
            <Textarea
              id="distinguishing_marks"
              value={formData.distinguishing_marks}
              onChange={(e) => setFormData({ ...formData, distinguishing_marks: e.target.value })}
              placeholder="Tattoos, scars, birthmarks..."
            />
          </div>

          {/* Criminal History */}
          <div className="space-y-2">
            <Label htmlFor="criminal_history">Criminal History</Label>
            <Textarea
              id="criminal_history"
              value={formData.criminal_history}
              onChange={(e) => setFormData({ ...formData, criminal_history: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="known_offenses">Known Offenses (comma-separated)</Label>
              <Input
                id="known_offenses"
                value={formData.known_offenses}
                onChange={(e) => setFormData({ ...formData, known_offenses: e.target.value })}
                placeholder="Theft, Assault"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrant_status">Warrant Status</Label>
              <Input
                id="warrant_status"
                value={formData.warrant_status}
                onChange={(e) => setFormData({ ...formData, warrant_status: e.target.value })}
                placeholder="Active warrant"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <Label htmlFor="special_instructions">Special Instructions</Label>
            <Textarea
              id="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Approach with caution, armed and dangerous..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_known_location">Last Known Location</Label>
            <Input
              id="last_known_location"
              value={formData.last_known_location}
              onChange={(e) => setFormData({ ...formData, last_known_location: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Criminal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddSuspectDialogProps {
  caseId: string;
  onSuspectAdded: () => void;
}

export const AddSuspectDialog = ({ caseId, onSuspectAdded }: AddSuspectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age_range: "",
    gender: "",
    ethnicity: "",
    height: "",
    build: "",
    distinguishing_marks: "",
    is_wanted: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("suspects").insert({
        case_id: caseId,
        name: formData.name || null,
        age_range: formData.age_range || null,
        gender: formData.gender || null,
        ethnicity: formData.ethnicity || null,
        height: formData.height || null,
        build: formData.build || null,
        distinguishing_marks: formData.distinguishing_marks || null,
        is_wanted: formData.is_wanted,
      });

      if (error) throw error;

      toast.success("Suspect added successfully");
      setFormData({
        name: "",
        age_range: "",
        gender: "",
        ethnicity: "",
        height: "",
        build: "",
        distinguishing_marks: "",
        is_wanted: false,
      });
      setOpen(false);
      onSuspectAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to add suspect");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Suspect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Suspect</DialogTitle>
          <DialogDescription>
            Enter the suspect's details for this case
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (if known)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age_range">Age Range</Label>
              <Select
                value={formData.age_range}
                onValueChange={(value) => setFormData({ ...formData, age_range: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-55">46-55</SelectItem>
                  <SelectItem value="56-65">56-65</SelectItem>
                  <SelectItem value="65+">65+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ethnicity">Ethnicity</Label>
            <Input
              id="ethnicity"
              value={formData.ethnicity}
              onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
              placeholder="e.g., Caucasian, Asian, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder={'e.g., 5\'10"'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="build">Build</Label>
              <Select
                value={formData.build}
                onValueChange={(value) => setFormData({ ...formData, build: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Slim">Slim</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Athletic">Athletic</SelectItem>
                  <SelectItem value="Heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distinguishing_marks">Distinguishing Marks</Label>
            <Textarea
              id="distinguishing_marks"
              value={formData.distinguishing_marks}
              onChange={(e) => setFormData({ ...formData, distinguishing_marks: e.target.value })}
              placeholder="Tattoos, scars, birthmarks, etc."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_wanted">Mark as Wanted</Label>
            <Switch
              id="is_wanted"
              checked={formData.is_wanted}
              onCheckedChange={(checked) => setFormData({ ...formData, is_wanted: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Suspect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, FileText } from "lucide-react";

interface Note {
  id: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface CaseNotesProps {
  caseId: string;
}

export const CaseNotes = ({ caseId }: CaseNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [caseId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("case_notes")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast.error("Failed to load notes");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setIsAdding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to add notes");
        return;
      }

      const { error } = await supabase.from("case_notes").insert({
        case_id: caseId,
        note: newNote.trim(),
        created_by: userData.user.email || userData.user.id,
      });

      if (error) throw error;

      toast.success("Note added successfully");
      setNewNote("");
      setShowAddForm(false);
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Failed to add note");
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Case Notes</h3>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Enter your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={isAdding}>
                {isAdding ? "Adding..." : "Save Note"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No notes added yet
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{note.note}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span>{note.created_by}</span>
                      <span>•</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

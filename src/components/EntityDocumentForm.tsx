import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EntityDocument {
  id?: string;
  title: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  notes: string;
}

interface EntityDocumentFormProps {
  entityId: string;
  document?: EntityDocument | null;
  onSave: () => void;
  onCancel: () => void;
}

const ALLOWED_TYPES = [
  "text/plain",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "application/x-rar-compressed",
  "application/vnd.oasis.opendocument.text",
  "application/msword"
];

const EntityDocumentForm = ({ entityId, document, onSave, onCancel }: EntityDocumentFormProps) => {
  const [title, setTitle] = useState(document?.title || "");
  const [notes, setNotes] = useState(document?.notes || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        toast({
          title: "Tipo de archivo no permitido",
          description: "Solo se permiten archivos .txt, .json, .docx, .pdf, .rar, .odt",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const uploadDocument = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${entityId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document && !file) {
      toast({
        title: "Error",
        description: "Debes seleccionar un archivo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let fileUrl = document?.file_url || "";
      let fileName = document?.file_name || "";
      let fileType = document?.file_type || "";
      let fileSize = document?.file_size || 0;

      if (file) {
        fileUrl = await uploadDocument(file);
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
      }

      const documentData = {
        entity_id: entityId,
        title: title || fileName,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        notes: notes,
      };

      if (document?.id) {
        const { error } = await supabase
          .from("entity_documents")
          .update(documentData)
          .eq("id", document.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("entity_documents")
          .insert([documentData]);

        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: document?.id ? "Documento actualizado" : "Documento añadido",
      });

      onSave();
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="doc-title">Título</Label>
        <Input
          id="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título del documento (opcional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-file">Archivo</Label>
        <Input
          id="doc-file"
          type="file"
          onChange={handleFileChange}
          accept=".txt,.json,.docx,.pdf,.rar,.odt,.doc"
          required={!document}
        />
        <p className="text-sm text-muted-foreground">
          Formatos permitidos: .txt, .json, .docx, .pdf, .rar, .odt
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-notes">Notas</Label>
        <Textarea
          id="doc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas sobre el documento..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Guardando..." : document?.id ? "Actualizar" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EntityDocumentForm;

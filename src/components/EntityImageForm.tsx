import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface EntityImage {
  id: string;
  entity_id: string;
  image_url: string;
  title: string | null;
  notes: string | null;
}

interface EntityImageFormProps {
  image?: EntityImage | null;
  entityId: string;
  onSubmit: (data: Partial<EntityImage>) => void;
  onCancel: () => void;
}

const EntityImageForm = ({ image, entityId, onSubmit, onCancel }: EntityImageFormProps) => {
  const [formData, setFormData] = useState({
    title: image?.title || "",
    image_url: image?.image_url || "",
    notes: image?.notes || "",
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(image?.image_url || "");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${entityId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        toast({
          title: "Error",
          description: "Debes subir una imagen o proporcionar una URL",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      onSubmit({
        title: formData.title || null,
        image_url: imageUrl,
        notes: formData.notes || null,
      });
    } catch (error) {
      toast({
        title: "Error al subir imagen",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePreview = () => {
    setImageFile(null);
    setPreviewUrl("");
    setFormData({ ...formData, image_url: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título (opcional)</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Título de la imagen"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image-upload">Subir Imagen</Label>
        <div className="flex gap-2">
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Formatos soportados: JPG, PNG, WEBP (máx. 5MB)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">O proporciona una URL</Label>
        <Input
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://ejemplo.com/imagen.jpg"
          disabled={!!imageFile}
        />
      </div>

      {previewUrl && (
        <div className="space-y-2">
          <Label>Vista previa</Label>
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto max-h-64 rounded-lg border border-primary/20"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removePreview}
              className="absolute top-2 right-2"
            >
              Eliminar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Información adicional sobre la imagen"
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={uploading} className="gradient-primary">
          {uploading ? "Subiendo..." : image ? "Actualizar" : "Agregar"}
        </Button>
      </div>
    </form>
  );
};

export default EntityImageForm;

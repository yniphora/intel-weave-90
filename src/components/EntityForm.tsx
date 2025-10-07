import { useState, useEffect } from "react";
import { Entity } from "@/types/osint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface EntityFormProps {
  entity?: Entity | null;
  onSubmit: (data: Partial<Entity>, selectedTags: string[]) => void;
  onCancel: () => void;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

const PREDEFINED_TAGS = [
  { name: "Scammer", color: "#ef4444" },
  { name: "Fraude", color: "#dc2626" },
  { name: "Posible Scammer", color: "#f97316" },
  { name: "Sospechoso", color: "#f59e0b" },
  { name: "Investigación en curso", color: "#3b82f6" },
  { name: "Reincidente", color: "#8b5cf6" },
  { name: "Detenido", color: "#991b1b" },
];

const EntityForm = ({ entity, onSubmit, onCancel }: EntityFormProps) => {
  const [formData, setFormData] = useState<Partial<Entity>>({
    name: "",
    type: "person",
    avatar_url: "",
    notes: "",
    ips: "",
    domains: "",
    hosting_info: "",
    web_archive_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (entity) {
      setFormData(entity);
      setPreviewUrl(entity.avatar_url || "");
      loadEntityTags();
    }
    loadOrCreateTags();
  }, [entity]);

  const loadEntityTags = async () => {
    if (!entity) return;
    
    const { data } = await supabase
      .from("entity_tags")
      .select("tag_id")
      .eq("entity_id", entity.id);
    
    if (data) {
      setSelectedTags(data.map(t => t.tag_id));
    }
  };

  const loadOrCreateTags = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get existing tags
    const { data: existingTags } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id);

    const existingTagNames = existingTags?.map(t => t.name) || [];
    const tagsToCreate = PREDEFINED_TAGS.filter(
      pt => !existingTagNames.includes(pt.name)
    );

    // Create missing predefined tags
    if (tagsToCreate.length > 0) {
      await supabase
        .from("tags")
        .insert(
          tagsToCreate.map(tag => ({
            name: tag.name,
            color: tag.color,
            user_id: user.id,
          }))
        );
    }

    // Load all tags
    const { data: allTags } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    setAvailableTags(allTags || []);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Error al subir la imagen");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let avatarUrl = formData.avatar_url;

    if (avatarFile) {
      const uploadedUrl = await uploadAvatar(avatarFile);
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      }
    }

    onSubmit({ ...formData, avatar_url: avatarUrl }, selectedTags);
    setUploading(false);
  };

  const removePreview = () => {
    setAvatarFile(null);
    setPreviewUrl("");
    setFormData({ ...formData, avatar_url: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Nombre de la entidad"
          className="border-primary/20 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="border-primary/20 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="person">Persona</SelectItem>
            <SelectItem value="group">Grupo</SelectItem>
            <SelectItem value="organization">Organización</SelectItem>
            <SelectItem value="website">Página Web</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar</Label>
        <div className="flex flex-col gap-4">
          {previewUrl && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/30">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removePreview}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border-primary/20 focus:border-primary"
            />
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <Input
            id="avatar_url"
            type="url"
            value={formData.avatar_url || ""}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            placeholder="O pega una URL: https://..."
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {formData.type === "website" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="domains">Dominios</Label>
            <Input
              id="domains"
              value={formData.domains || ""}
              onChange={(e) => setFormData({ ...formData, domains: e.target.value })}
              placeholder="example.com, subdomain.example.com"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ips">Direcciones IP</Label>
            <Input
              id="ips"
              value={formData.ips || ""}
              onChange={(e) => setFormData({ ...formData, ips: e.target.value })}
              placeholder="192.168.1.1, 10.0.0.1"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hosting_info">Información de Hosting</Label>
            <Textarea
              id="hosting_info"
              value={formData.hosting_info || ""}
              onChange={(e) => setFormData({ ...formData, hosting_info: e.target.value })}
              placeholder="Proveedor, ubicación del servidor, tecnologías..."
              className="border-primary/20 focus:border-primary min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="web_archive_url">Enlace Web Archive / Wayback Machine</Label>
            <Input
              id="web_archive_url"
              type="url"
              value={formData.web_archive_url || ""}
              onChange={(e) => setFormData({ ...formData, web_archive_url: e.target.value })}
              placeholder="https://web.archive.org/web/..."
              className="border-primary/20 focus:border-primary"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Información adicional, capturas de pantalla, observaciones..."
          className="border-primary/20 focus:border-primary min-h-[100px]"
        />
      </div>

      <div className="space-y-3">
        <Label>Etiquetas</Label>
        <div className="space-y-2">
          {availableTags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={selectedTags.includes(tag.id)}
                onCheckedChange={() => toggleTag(tag.id)}
              />
              <label
                htmlFor={`tag-${tag.id}`}
                className="flex-1 cursor-pointer"
              >
                <Badge
                  style={{ backgroundColor: tag.color }}
                  className="text-white border-0"
                >
                  {tag.name}
                </Badge>
              </label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="gradient-primary" disabled={uploading}>
          {uploading ? "Subiendo..." : entity ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EntityForm;

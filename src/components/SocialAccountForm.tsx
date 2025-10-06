import { useState, useEffect } from "react";
import { SocialAccount } from "@/types/osint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

interface SocialAccountFormProps {
  account?: SocialAccount | null;
  entityId: string;
  onSubmit: (data: Partial<SocialAccount>) => void;
  onCancel: () => void;
}

const platforms = [
  "telegram", "discord", "twitter", "instagram", "facebook",
  "linkedin", "github", "reddit", "tiktok", "youtube",
  "whatsapp", "signal", "snapchat", "twitch", "steam", "tox", "session", "forums", "other"
];

const SocialAccountForm = ({ account, entityId, onSubmit, onCancel }: SocialAccountFormProps) => {
  const [formData, setFormData] = useState<Partial<SocialAccount>>({
    entity_id: entityId,
    platform: "telegram",
    username: "",
    user_id_platform: "",
    display_name: "",
    profile_url: "",
    avatar_url: "",
    notes: "",
  });

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="platform">Plataforma *</Label>
        <Select
          value={formData.platform}
          onValueChange={(value: any) => setFormData({ ...formData, platform: value })}
        >
          <SelectTrigger className="border-primary/20 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {platforms.map((platform) => (
              <SelectItem key={platform} value={platform} className="capitalize">
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username || ""}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="@username"
            className="border-primary/20 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user_id_platform">ID de Usuario</Label>
          <Input
            id="user_id_platform"
            value={formData.user_id_platform || ""}
            onChange={(e) => setFormData({ ...formData, user_id_platform: e.target.value })}
            placeholder="123456789"
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">
          {formData.platform === "forums" ? "Nombre del Foro" : "Nombre Mostrado"}
        </Label>
        <Input
          id="display_name"
          value={formData.display_name || ""}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          placeholder={formData.platform === "forums" ? "Nombre del foro" : "Display Name"}
          className="border-primary/20 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile_url">
          {formData.platform === "other" 
            ? "Página Web" 
            : formData.platform === "forums" 
            ? "URL del Foro" 
            : "URL del Perfil"}
        </Label>
        <Input
          id="profile_url"
          type="url"
          value={formData.profile_url || ""}
          onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
          placeholder="https://..."
          className="border-primary/20 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar_url">URL del Avatar</Label>
        <Input
          id="avatar_url"
          type="url"
          value={formData.avatar_url || ""}
          onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
          placeholder="https://..."
          className="border-primary/20 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Información adicional..."
          className="border-primary/20 focus:border-primary"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="gradient-primary">
          {account ? "Actualizar" : "Agregar"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SocialAccountForm;

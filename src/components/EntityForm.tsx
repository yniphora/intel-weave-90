import { useState, useEffect } from "react";
import { Entity } from "@/types/osint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

interface EntityFormProps {
  entity?: Entity | null;
  onSubmit: (data: Partial<Entity>) => void;
  onCancel: () => void;
}

const EntityForm = ({ entity, onSubmit, onCancel }: EntityFormProps) => {
  const [formData, setFormData] = useState<Partial<Entity>>({
    name: "",
    type: "person",
    avatar_url: "",
    notes: "",
  });

  useEffect(() => {
    if (entity) {
      setFormData(entity);
    }
  }, [entity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
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
          className="border-primary/20 focus:border-primary min-h-[100px]"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="gradient-primary">
          {entity ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EntityForm;

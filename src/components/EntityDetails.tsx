import { useState, useEffect } from "react";
import { Entity, SocialAccount } from "@/types/osint";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SocialAccountForm from "./SocialAccountForm";
import EntityImageForm from "./EntityImageForm";

interface EntityImage {
  id: string;
  entity_id: string;
  image_url: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EntityDetailsProps {
  entity: Entity;
  onUpdate: () => void;
}

const EntityDetails = ({ entity, onUpdate }: EntityDetailsProps) => {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [editingSocial, setEditingSocial] = useState<SocialAccount | null>(null);
  const [entityImages, setEntityImages] = useState<EntityImage[]>([]);
  const [showImageForm, setShowImageForm] = useState(false);
  const [editingImage, setEditingImage] = useState<EntityImage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSocialAccounts();
    loadEntityImages();
  }, [entity.id]);

  const loadSocialAccounts = async () => {
    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("entity_id", entity.id)
      .order("platform");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSocialAccounts(data || []);
    }
  };

  const handleSaveSocial = async (data: Partial<SocialAccount>) => {
    if (!data.platform) return;
    
    if (editingSocial) {
      const { error } = await supabase
        .from("social_accounts")
        .update(data)
        .eq("id", editingSocial.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cuenta actualizada exitosamente" });
        loadSocialAccounts();
        setShowSocialForm(false);
        setEditingSocial(null);
      }
    } else {
      const { error } = await supabase
        .from("social_accounts")
        .insert([{ 
          platform: data.platform,
          entity_id: entity.id,
          username: data.username || null,
          user_id_platform: data.user_id_platform || null,
          display_name: data.display_name || null,
          profile_url: data.profile_url || null,
          avatar_url: data.avatar_url || null,
          notes: data.notes || null,
        }]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cuenta agregada exitosamente" });
        loadSocialAccounts();
        setShowSocialForm(false);
      }
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta de red social?")) return;

    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cuenta eliminada" });
      loadSocialAccounts();
    }
  };

  const loadEntityImages = async () => {
    const { data, error } = await supabase
      .from("entity_images")
      .select("*")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEntityImages(data || []);
    }
  };

  const handleSaveImage = async (data: Partial<EntityImage>) => {
    if (!data.image_url) return;

    if (editingImage) {
      const { error } = await supabase
        .from("entity_images")
        .update(data)
        .eq("id", editingImage.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Imagen actualizada exitosamente" });
        loadEntityImages();
        setShowImageForm(false);
        setEditingImage(null);
      }
    } else {
      const { error } = await supabase
        .from("entity_images")
        .insert([{
          entity_id: entity.id,
          image_url: data.image_url,
          title: data.title || null,
          notes: data.notes || null,
        }]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Imagen agregada exitosamente" });
        loadEntityImages();
        setShowImageForm(false);
      }
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;

    const { error } = await supabase
      .from("entity_images")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Imagen eliminada" });
      loadEntityImages();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/30">
            <AvatarImage src={entity.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {entity.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{entity.name}</CardTitle>
            <Badge variant="outline" className="mt-2 capitalize border-primary/30">
              {entity.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {entity.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Notas</h3>
              <p className="text-sm">{entity.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cuentas de Redes Sociales</CardTitle>
          <Button
            onClick={() => setShowSocialForm(true)}
            size="sm"
            className="gradient-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {socialAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay cuentas de redes sociales registradas
            </p>
          ) : (
            <div className="space-y-3">
              {socialAccounts.map((account) => (
                <Card key={account.id} className="border-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {account.platform}
                          </Badge>
                          {account.username && (
                            <span className="text-sm font-mono text-primary">
                              {account.username}
                            </span>
                          )}
                        </div>
                        {account.display_name && (
                          <p className="text-sm">{account.display_name}</p>
                        )}
                        {account.user_id_platform && (
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {account.user_id_platform}
                          </p>
                        )}
                        {account.profile_url && (
                          <a
                            href={account.profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Ver perfil <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {account.notes && (
                          <p className="text-xs text-muted-foreground">{account.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSocial(account);
                            setShowSocialForm(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSocial(account.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Imágenes</CardTitle>
          <Button
            onClick={() => setShowImageForm(true)}
            size="sm"
            className="gradient-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {entityImages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay imágenes registradas
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entityImages.map((image) => (
                <Card key={image.id} className="border-primary/10 overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={image.image_url}
                      alt={image.title || "Entity image"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    {image.title && (
                      <h4 className="font-semibold text-sm">{image.title}</h4>
                    )}
                    {image.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {image.notes}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingImage(image);
                          setShowImageForm(true);
                        }}
                        className="flex-1"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteImage(image.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSocialForm} onOpenChange={setShowSocialForm}>
        <DialogContent className="max-w-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle>
              {editingSocial ? "Editar Cuenta" : "Agregar Cuenta de Red Social"}
            </DialogTitle>
          </DialogHeader>
          <SocialAccountForm
            account={editingSocial}
            entityId={entity.id}
            onSubmit={handleSaveSocial}
            onCancel={() => {
              setShowSocialForm(false);
              setEditingSocial(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showImageForm} onOpenChange={setShowImageForm}>
        <DialogContent className="max-w-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle>
              {editingImage ? "Editar Imagen" : "Agregar Imagen"}
            </DialogTitle>
          </DialogHeader>
          <EntityImageForm
            image={editingImage}
            entityId={entity.id}
            onSubmit={handleSaveImage}
            onCancel={() => {
              setShowImageForm(false);
              setEditingImage(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntityDetails;

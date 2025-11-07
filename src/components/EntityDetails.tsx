import { useState, useEffect } from "react";
import { Entity, SocialAccount } from "@/types/osint";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, Image as ImageIcon, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SocialAccountForm from "./SocialAccountForm";
import EntityImageForm from "./EntityImageForm";
import EntityDocumentForm from "./EntityDocumentForm";
import jsPDF from "jspdf";

interface EntityImage {
  id: string;
  entity_id: string;
  image_url: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EntityDocument {
  id: string;
  entity_id: string;
  title: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
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
  const [viewingImage, setViewingImage] = useState<EntityImage | null>(null);
  const [entityDocuments, setEntityDocuments] = useState<EntityDocument[]>([]);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EntityDocument | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSocialAccounts();
    loadEntityImages();
    loadEntityDocuments();
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

  const loadEntityDocuments = async () => {
    const { data, error } = await supabase
      .from("entity_documents")
      .select("*")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEntityDocuments(data || []);
    }
  };

  const handleExportJSON = async () => {
    try {
      // Get all related data
      const [tagsResult, relationshipsResult] = await Promise.all([
        supabase
          .from("entity_tags")
          .select("tag_id, tags(name, color)")
          .eq("entity_id", entity.id),
        supabase
          .from("relationships")
          .select("*, entities!relationships_entity_b_id_fkey(name)")
          .or(`entity_a_id.eq.${entity.id},entity_b_id.eq.${entity.id}`)
      ]);

      const exportData = {
        entity: {
          id: entity.id,
          name: entity.name,
          type: entity.type,
          avatar_url: entity.avatar_url,
          notes: entity.notes,
          ips: entity.ips,
          domains: entity.domains,
          hosting_info: entity.hosting_info,
          web_archive_url: entity.web_archive_url,
          created_at: entity.created_at,
          updated_at: entity.updated_at
        },
        social_accounts: socialAccounts,
        images: entityImages,
        documents: entityDocuments,
        tags: tagsResult.data || [],
        relationships: relationshipsResult.data || []
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${entity.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Datos exportados exitosamente" });
    } catch (error) {
      toast({ 
        title: "Error al exportar", 
        description: "No se pudo exportar los datos",
        variant: "destructive" 
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      // Get all related data
      const [tagsResult, relationshipsResult] = await Promise.all([
        supabase
          .from("entity_tags")
          .select("tag_id, tags(name, color)")
          .eq("entity_id", entity.id),
        supabase
          .from("relationships")
          .select("*, entities!relationships_entity_b_id_fkey(name)")
          .or(`entity_a_id.eq.${entity.id},entity_b_id.eq.${entity.id}`)
      ]);

      const doc = new jsPDF();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.text(`Entidad: ${entity.name}`, 20, yPosition);
      yPosition += 10;

      // Entity type
      doc.setFontSize(12);
      doc.text(`Tipo: ${entity.type}`, 20, yPosition);
      yPosition += 10;

      // Notes
      if (entity.notes) {
        doc.text("Notas:", 20, yPosition);
        yPosition += 7;
        doc.setFontSize(10);
        const splitNotes = doc.splitTextToSize(entity.notes, 170);
        doc.text(splitNotes, 20, yPosition);
        yPosition += splitNotes.length * 5 + 5;
      }

      // Website fields
      if (entity.type === 'website') {
        doc.setFontSize(12);
        if (entity.domains) {
          doc.text(`Dominios: ${entity.domains}`, 20, yPosition);
          yPosition += 7;
        }
        if (entity.ips) {
          doc.text(`IPs: ${entity.ips}`, 20, yPosition);
          yPosition += 7;
        }
        if (entity.hosting_info) {
          doc.text(`Hosting: ${entity.hosting_info}`, 20, yPosition);
          yPosition += 7;
        }
        if (entity.web_archive_url) {
          doc.text(`Archivo Web: ${entity.web_archive_url}`, 20, yPosition);
          yPosition += 7;
        }
      }

      // Social accounts
      if (socialAccounts.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text("Cuentas de Redes Sociales:", 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        
        socialAccounts.forEach((account) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`- ${account.platform}: ${account.username || account.display_name || 'N/A'}`, 25, yPosition);
          yPosition += 5;
          if (account.profile_url) {
            doc.text(`  URL: ${account.profile_url}`, 25, yPosition);
            yPosition += 5;
          }
          if (account.notes) {
            const splitAccountNotes = doc.splitTextToSize(`  Notas: ${account.notes}`, 160);
            doc.text(splitAccountNotes, 25, yPosition);
            yPosition += splitAccountNotes.length * 5;
          }
          yPosition += 3;
        });
      }

      // Documents
      if (entityDocuments.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text("Documentos:", 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        
        entityDocuments.forEach((document) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`- ${document.title || document.file_name}`, 25, yPosition);
          yPosition += 5;
          doc.text(`  Tipo: ${document.file_type}`, 25, yPosition);
          yPosition += 5;
          if (document.notes) {
            const splitDocNotes = doc.splitTextToSize(`  Notas: ${document.notes}`, 160);
            doc.text(splitDocNotes, 25, yPosition);
            yPosition += splitDocNotes.length * 5;
          }
          yPosition += 3;
        });
      }

      // Images
      if (entityImages.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text("Imágenes:", 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        
        entityImages.forEach((image) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`- ${image.title || 'Sin título'}`, 25, yPosition);
          yPosition += 5;
          if (image.notes) {
            const splitImageNotes = doc.splitTextToSize(`  Notas: ${image.notes}`, 160);
            doc.text(splitImageNotes, 25, yPosition);
            yPosition += splitImageNotes.length * 5;
          }
          yPosition += 3;
        });
      }

      // Tags
      if (tagsResult.data && tagsResult.data.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text("Etiquetas:", 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        
        tagsResult.data.forEach((tagData: any) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          const tag = tagData.tags;
          if (tag) {
            doc.text(`- ${tag.name}`, 25, yPosition);
            yPosition += 5;
          }
        });
      }

      // Relationships
      if (relationshipsResult.data && relationshipsResult.data.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text("Relaciones:", 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        
        relationshipsResult.data.forEach((rel: any) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          const relatedEntity = rel.entities?.name || 'Entidad desconocida';
          doc.text(`- ${rel.relationship_type}: ${relatedEntity}`, 25, yPosition);
          yPosition += 5;
          if (rel.notes) {
            const splitRelNotes = doc.splitTextToSize(`  Notas: ${rel.notes}`, 160);
            doc.text(splitRelNotes, 25, yPosition);
            yPosition += splitRelNotes.length * 5;
          }
          yPosition += 3;
        });
      }

      // Save PDF
      doc.save(`${entity.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({ title: "PDF exportado exitosamente" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ 
        title: "Error al exportar PDF", 
        description: "No se pudo generar el PDF",
        variant: "destructive" 
      });
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

  const handleSaveDocument = async () => {
    loadEntityDocuments();
    setShowDocumentForm(false);
    setEditingDocument(null);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("¿Eliminar este documento?")) return;

    const { error } = await supabase
      .from("entity_documents")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Documento eliminado" });
      loadEntityDocuments();
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
          <div className="flex gap-2">
            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
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
          <CardTitle>Documentos</CardTitle>
          <Button
            onClick={() => setShowDocumentForm(true)}
            size="sm"
            className="gradient-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {entityDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay documentos registrados
            </p>
          ) : (
            <div className="space-y-3">
              {entityDocuments.map((doc) => (
                <Card key={doc.id} className="border-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">
                            {doc.title || doc.file_name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tipo: {doc.file_type}
                        </p>
                        {doc.file_size && (
                          <p className="text-xs text-muted-foreground">
                            Tamaño: {(doc.file_size / 1024).toFixed(2)} KB
                          </p>
                        )}
                        {doc.notes && (
                          <p className="text-xs text-muted-foreground">{doc.notes}</p>
                        )}
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Descargar <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDocument(doc);
                            setShowDocumentForm(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
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
                  <div 
                    className="relative aspect-video bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setViewingImage(image)}
                  >
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

      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl border-primary/20">
          <DialogHeader>
            <DialogTitle>
              {viewingImage?.title || "Imagen"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative w-full bg-muted rounded-lg overflow-hidden">
              <img
                src={viewingImage?.image_url}
                alt={viewingImage?.title || "Entity image"}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            {viewingImage?.notes && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Notas</h4>
                <p className="text-sm">{viewingImage.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDocumentForm} onOpenChange={setShowDocumentForm}>
        <DialogContent className="max-w-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? "Editar Documento" : "Agregar Documento"}
            </DialogTitle>
          </DialogHeader>
          <EntityDocumentForm
            entityId={entity.id}
            document={editingDocument}
            onSave={handleSaveDocument}
            onCancel={() => {
              setShowDocumentForm(false);
              setEditingDocument(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntityDetails;

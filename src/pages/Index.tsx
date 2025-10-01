import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Entity } from "@/types/osint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, LogOut, Shield, Database } from "lucide-react";
import EntityCard from "@/components/EntityCard";
import EntityForm from "@/components/EntityForm";
import EntityDetails from "@/components/EntityDetails";

const Index = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [viewingEntity, setViewingEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (entities.length > 0) {
      filterEntities();
    }
  }, [searchQuery, entities]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadEntities();
  };

  const loadEntities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEntities(data || []);
      setFilteredEntities(data || []);
    }
    setLoading(false);
  };

  const filterEntities = () => {
    if (!searchQuery.trim()) {
      setFilteredEntities(entities);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(query) ||
        entity.type.toLowerCase().includes(query) ||
        (entity.notes && entity.notes.toLowerCase().includes(query))
    );
    setFilteredEntities(filtered);
  };

  const handleSaveEntity = async (data: Partial<Entity>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !data.name) return;

    if (editingEntity) {
      const { error } = await supabase
        .from("entities")
        .update(data)
        .eq("id", editingEntity.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Entidad actualizada exitosamente" });
        loadEntities();
        setShowForm(false);
        setEditingEntity(null);
      }
    } else {
      const { error } = await supabase
        .from("entities")
        .insert([{ 
          name: data.name,
          type: data.type || "person",
          avatar_url: data.avatar_url || null,
          notes: data.notes || null,
          user_id: user.id 
        }]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Entidad creada exitosamente" });
        loadEntities();
        setShowForm(false);
      }
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta entidad?")) return;

    const { error } = await supabase
      .from("entities")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entidad eliminada" });
      loadEntities();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen gradient-dark">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 glow-primary">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  OSINT Intelligence Hub
                </h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestión de Entidades</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-primary/20 hover:bg-destructive/10 hover:border-destructive/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar entidades por nombre, tipo o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-primary/20 focus:border-primary bg-card"
            />
          </div>
          <Button
            onClick={() => {
              setEditingEntity(null);
              setShowForm(true);
            }}
            className="gradient-primary glow-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Entidad
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-primary/20 rounded-lg p-4 glow-primary">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{entities.length}</p>
                <p className="text-sm text-muted-foreground">Total Entidades</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">
                  {entities.filter((e) => e.type === "person").length}
                </p>
                <p className="text-sm text-muted-foreground">Personas</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">
                  {entities.filter((e) => e.type === "group" || e.type === "organization").length}
                </p>
                <p className="text-sm text-muted-foreground">Grupos/Orgs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Entities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No se encontraron entidades" : "No hay entidades creadas"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onView={setViewingEntity}
                onEdit={(entity) => {
                  setEditingEntity(entity);
                  setShowForm(true);
                }}
                onDelete={handleDeleteEntity}
              />
            ))}
          </div>
        )}
      </main>

      {/* Entity Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="border-primary/20">
          <DialogHeader>
            <DialogTitle>
              {editingEntity ? "Editar Entidad" : "Nueva Entidad"}
            </DialogTitle>
          </DialogHeader>
          <EntityForm
            entity={editingEntity}
            onSubmit={handleSaveEntity}
            onCancel={() => {
              setShowForm(false);
              setEditingEntity(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Entity Details Sheet */}
      <Sheet open={!!viewingEntity} onOpenChange={(open) => !open && setViewingEntity(null)}>
        <SheetContent className="w-full sm:max-w-2xl border-primary/20 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalles de la Entidad</SheetTitle>
          </SheetHeader>
          {viewingEntity && (
            <div className="mt-6">
              <EntityDetails entity={viewingEntity} onUpdate={loadEntities} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;

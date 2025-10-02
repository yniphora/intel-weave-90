import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Entity, Relationship } from "@/types/osint";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Custom node component
const EntityNode = ({ data }: any) => {
  return (
    <div className="bg-card border-2 border-primary/30 rounded-lg p-4 shadow-glow min-w-[200px]">
      <div className="flex items-center gap-3">
        {data.avatar_url && (
          <img
            src={data.avatar_url}
            alt={data.label}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
          />
        )}
        <div className="flex-1">
          <div className="font-bold text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground capitalize">{data.type}</div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  entity: EntityNode,
};

const RelationshipGraph = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [newRelationship, setNewRelationship] = useState({
    entity_a_id: "",
    entity_b_id: "",
    relationship_type: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: entitiesData, error: entitiesError } = await supabase
      .from("entities")
      .select("*")
      .eq("user_id", user.id);

    const { data: relationshipsData, error: relationshipsError } = await supabase
      .from("relationships")
      .select("*")
      .eq("user_id", user.id);

    if (entitiesError) {
      toast.error("Error al cargar entidades");
      return;
    }

    if (relationshipsError) {
      toast.error("Error al cargar relaciones");
      return;
    }

    setEntities(entitiesData || []);
    setRelationships(relationshipsData || []);
    buildGraph(entitiesData || [], relationshipsData || []);
  };

  const buildGraph = (entitiesData: Entity[], relationshipsData: Relationship[]) => {
    // Create nodes from entities
    const newNodes: Node[] = entitiesData.map((entity, index) => ({
      id: entity.id,
      type: "entity",
      position: {
        x: Math.cos((index / entitiesData.length) * 2 * Math.PI) * 300 + 400,
        y: Math.sin((index / entitiesData.length) * 2 * Math.PI) * 300 + 300,
      },
      data: {
        label: entity.name,
        type: entity.type,
        avatar_url: entity.avatar_url,
      },
    }));

    // Create edges from relationships
    const newEdges: Edge[] = relationshipsData.map((rel) => ({
      id: rel.id,
      source: rel.entity_a_id,
      target: rel.entity_b_id,
      label: rel.relationship_type,
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#7C3AED",
      },
      style: {
        stroke: "#7C3AED",
        strokeWidth: 2,
      },
      labelStyle: {
        fill: "#fff",
        fontWeight: 700,
      },
      labelBgStyle: {
        fill: "#1a1625",
        fillOpacity: 0.9,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setNewRelationship({
        entity_a_id: params.source || "",
        entity_b_id: params.target || "",
        relationship_type: "",
        notes: "",
      });
      setShowDialog(true);
    },
    []
  );

  const handleCreateRelationship = async () => {
    if (!newRelationship.relationship_type) {
      toast.error("Por favor especifica el tipo de relación");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("relationships").insert({
      user_id: user.id,
      entity_a_id: newRelationship.entity_a_id,
      entity_b_id: newRelationship.entity_b_id,
      relationship_type: newRelationship.relationship_type,
      notes: newRelationship.notes || null,
    });

    if (error) {
      toast.error("Error al crear la relación");
      return;
    }

    toast.success("Relación creada exitosamente");
    setShowDialog(false);
    fetchData();
  };

  const handleDeleteRelationship = async (edgeId: string) => {
    const { error } = await supabase
      .from("relationships")
      .delete()
      .eq("id", edgeId);

    if (error) {
      toast.error("Error al eliminar la relación");
      return;
    }

    toast.success("Relación eliminada");
    fetchData();
  };

  const onEdgeClick = (_: any, edge: Edge) => {
    setSelectedEdge(edge.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Grafo de Relaciones</h1>
              <p className="text-muted-foreground">
                Conecta entidades arrastrando entre nodos
              </p>
            </div>
          </div>
          {selectedEdge && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteRelationship(selectedEdge)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Relación
            </Button>
          )}
        </div>

        <div className="h-[calc(100vh-200px)] bg-card rounded-lg border-2 border-primary/20 shadow-glow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background/5"
          >
            <Background color="#7C3AED" gap={20} />
            <Controls className="bg-card border border-primary/20" />
          </ReactFlow>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nueva Relación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Relación *</Label>
              <Input
                value={newRelationship.relationship_type}
                onChange={(e) =>
                  setNewRelationship({
                    ...newRelationship,
                    relationship_type: e.target.value,
                  })
                }
                placeholder="ej: Socio, Amigo, Familiar..."
                className="border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={newRelationship.notes}
                onChange={(e) =>
                  setNewRelationship({
                    ...newRelationship,
                    notes: e.target.value,
                  })
                }
                placeholder="Información adicional..."
                className="border-primary/20"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="gradient-primary"
                onClick={handleCreateRelationship}
              >
                Crear Relación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelationshipGraph;

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
  Handle,
  Position,
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
  DialogDescription,
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
import { Card } from "@/components/ui/card";

// Custom node component with connection handles
const EntityNode = ({ data }: any) => {
  return (
    <div className="bg-card border-2 border-primary/30 rounded-lg p-4 shadow-glow min-w-[200px] hover:border-primary transition-all relative">
      {/* Connection handles - required for ReactFlow to create edges */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      
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
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [newRelationship, setNewRelationship] = useState({
    entity_a_id: "",
    entity_b_id: "",
    relationship_type: "",
    notes: "",
  });

  // Save node positions to localStorage
  const saveNodePositions = useCallback((nodes: Node[]) => {
    const positions = nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.position.x, y: node.position.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);
    localStorage.setItem('graph-node-positions', JSON.stringify(positions));
  }, []);

  // Load saved node positions from localStorage
  const loadNodePositions = useCallback(() => {
    const saved = localStorage.getItem('graph-node-positions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  }, []);

  // Custom onNodesChange that saves positions when nodes are moved
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      // Save positions after nodes are moved
      const moveChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);
      if (moveChange) {
        // Use setTimeout to ensure state is updated
        setTimeout(() => {
          setNodes((currentNodes) => {
            saveNodePositions(currentNodes);
            return currentNodes;
          });
        }, 0);
      }
    },
    [onNodesChange, setNodes, saveNodePositions]
  );

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
    // Load saved positions
    const savedPositions = loadNodePositions();
    
    // Create nodes from entities with better spacing for more entities
    const radius = Math.max(300, entitiesData.length * 50);
    const newNodes: Node[] = entitiesData.map((entity, index) => {
      // Use saved position if available, otherwise calculate new position
      const position = savedPositions[entity.id] || {
        x: Math.cos((index / entitiesData.length) * 2 * Math.PI) * radius + 500,
        y: Math.sin((index / entitiesData.length) * 2 * Math.PI) * radius + 400,
      };

      return {
        id: entity.id,
        type: "entity",
        position,
        data: {
          label: entity.name,
          type: entity.type,
          avatar_url: entity.avatar_url,
        },
      };
    });

    // Optimized edge creation - count pairs first in single pass
    const pairCounts = new Map<string, number>();
    const pairIndices = new Map<string, number>();
    
    relationshipsData.forEach((rel) => {
      const pairKey = [rel.entity_a_id, rel.entity_b_id].sort().join('-');
      pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
    });

    // Create edges with curvature for multiple connections
    const newEdges: Edge[] = relationshipsData.map((rel) => {
      const pairKey = [rel.entity_a_id, rel.entity_b_id].sort().join('-');
      const currentIdx = (pairIndices.get(pairKey) || 0);
      pairIndices.set(pairKey, currentIdx + 1);
      
      const total = pairCounts.get(pairKey) || 1;
      
      // Calculate curvature for multiple edges between same nodes
      let pathOptions = {};
      if (total > 1) {
        const offsetFactor = (currentIdx - (total - 1) / 2) * 0.5;
        pathOptions = {
          curvature: offsetFactor,
        };
      }

      return {
        id: rel.id,
        source: rel.entity_a_id,
        target: rel.entity_b_id,
        label: rel.relationship_type,
        type: "default",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#A855F7",
          width: 30,
          height: 30,
        },
        style: {
          stroke: "#A855F7",
          strokeWidth: 4,
          filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))",
        },
        labelStyle: {
          fill: "#fff",
          fontWeight: 700,
          fontSize: 14,
        },
        labelBgStyle: {
          fill: "#1a1625",
          fillOpacity: 0.95,
        },
        labelBgPadding: [10, 6] as [number, number],
        labelBgBorderRadius: 4,
        ...pathOptions,
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent connecting to itself
      if (params.source === params.target) {
        toast.error("No puedes conectar una entidad consigo misma");
        return;
      }
      
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

    if (!newRelationship.entity_a_id || !newRelationship.entity_b_id) {
      toast.error("Selecciona ambas entidades");
      return;
    }

    if (newRelationship.entity_a_id === newRelationship.entity_b_id) {
      toast.error("No puedes conectar una entidad consigo misma");
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
    setNewRelationship({
      entity_a_id: "",
      entity_b_id: "",
      relationship_type: "",
      notes: "",
    });
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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
                  Visualiza y conecta todas tus entidades
                </p>
              </div>
            </div>
            <div className="flex gap-2">
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
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowManualDialog(true)}
                className="gradient-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Relación
              </Button>
            </div>
          </div>

          {/* Instructions Card */}
          <Card className="border-primary/20 bg-card/50 p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">
              💡 Cómo conectar entidades:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Arrastra</strong> desde cualquier nodo a otro para crear una conexión morada</li>
              <li>• Conecta <strong>Personas, Grupos y Organizaciones</strong> sin restricciones</li>
              <li>• Puedes crear <strong>múltiples relaciones</strong> entre las mismas entidades</li>
              <li>• Haz clic en "Añadir Relación" para conectar manualmente</li>
              <li>• Haz clic en una línea morada para seleccionarla y eliminarla</li>
            </ul>
          </Card>
        </div>

        <div className="h-[calc(100vh-200px)] bg-card rounded-lg border-2 border-primary/20 shadow-glow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background/5"
            defaultEdgeOptions={{
              type: "default",
              animated: true,
              style: { 
                stroke: "#A855F7", 
                strokeWidth: 4,
                filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))",
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#A855F7",
                width: 30,
                height: 30,
              },
            }}
            connectionLineStyle={{
              stroke: "#A855F7",
              strokeWidth: 4,
            }}
          >
            <Background color="#A855F7" gap={20} size={1} />
            <Controls className="bg-card border border-primary/20" />
          </ReactFlow>
        </div>
      </div>

      {/* Quick dialog when dragging connection */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nueva Relación</DialogTitle>
            <DialogDescription>
              Conectando{" "}
              <strong>
                {entities.find((e) => e.id === newRelationship.entity_a_id)?.name}
              </strong>
              {" → "}
              <strong>
                {entities.find((e) => e.id === newRelationship.entity_b_id)?.name}
              </strong>
            </DialogDescription>
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

      {/* Manual relationship creation dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-foreground">Añadir Relación Manualmente</DialogTitle>
            <DialogDescription>
              Conecta cualquier persona, grupo u organización
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Entidad de Origen *</Label>
              <Select
                value={newRelationship.entity_a_id}
                onValueChange={(value) =>
                  setNewRelationship({ ...newRelationship, entity_a_id: value })
                }
              >
                <SelectTrigger className="border-primary/20">
                  <SelectValue placeholder="Selecciona una entidad" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-xs text-muted-foreground">
                          [{entity.type}]
                        </span>
                        {entity.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entidad de Destino *</Label>
              <Select
                value={newRelationship.entity_b_id}
                onValueChange={(value) =>
                  setNewRelationship({ ...newRelationship, entity_b_id: value })
                }
              >
                <SelectTrigger className="border-primary/20">
                  <SelectValue placeholder="Selecciona una entidad" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-xs text-muted-foreground">
                          [{entity.type}]
                        </span>
                        {entity.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                placeholder="ej: Socio, Amigo, Miembro, Subsidiaria..."
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
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualDialog(false);
                  setNewRelationship({
                    entity_a_id: "",
                    entity_b_id: "",
                    relationship_type: "",
                    notes: "",
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                className="gradient-primary"
                onClick={() => {
                  handleCreateRelationship();
                  setShowManualDialog(false);
                }}
                disabled={
                  !newRelationship.entity_a_id ||
                  !newRelationship.entity_b_id ||
                  !newRelationship.relationship_type
                }
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

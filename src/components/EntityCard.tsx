import { useState, useEffect } from "react";
import { Entity } from "@/types/osint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, User, Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EntityCardProps {
  entity: Entity;
  onView: (entity: Entity) => void;
  onEdit: (entity: Entity) => void;
  onDelete: (id: string) => void;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case "person":
      return <User className="h-4 w-4" />;
    case "group":
      return <Users className="h-4 w-4" />;
    case "organization":
      return <Building2 className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const EntityCard = ({ entity, onView, onEdit, onDelete }: EntityCardProps) => {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    loadTags();
  }, [entity.id]);

  const loadTags = async () => {
    const { data } = await supabase
      .from("entity_tags")
      .select("tag_id, tags(id, name, color)")
      .eq("entity_id", entity.id);

    if (data) {
      const entityTags = data
        .map((item: any) => item.tags)
        .filter((tag: any) => tag !== null);
      setTags(entityTags);
    }
  };

  return (
    <Card className="border-primary/20 hover:border-primary/50 transition-all hover:glow-primary group animate-fade-in">
      <CardHeader className="flex flex-row items-center gap-4 pb-3">
        <Avatar className="h-12 w-12 border-2 border-primary/30">
          <AvatarImage src={entity.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {entity.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 flex-wrap">
            {entity.name}
            <Badge variant="outline" className="text-xs border-primary/30">
              {getEntityIcon(entity.type)}
              <span className="ml-1 capitalize">{entity.type}</span>
            </Badge>
          </CardTitle>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color }}
                  className="text-white border-0 text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          {entity.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {entity.notes}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(entity)}
          className="flex-1 border-primary/20 hover:bg-primary/10 hover:border-primary/50"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(entity)}
          className="border-primary/20 hover:bg-primary/10 hover:border-primary/50"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(entity.id)}
          className="border-destructive/20 hover:bg-destructive/10 hover:border-destructive/50 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default EntityCard;

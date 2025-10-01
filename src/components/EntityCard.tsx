import { Entity } from "@/types/osint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, User, Users, Building2 } from "lucide-react";

interface EntityCardProps {
  entity: Entity;
  onView: (entity: Entity) => void;
  onEdit: (entity: Entity) => void;
  onDelete: (id: string) => void;
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
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {entity.name}
            <Badge variant="outline" className="text-xs border-primary/30">
              {getEntityIcon(entity.type)}
              <span className="ml-1 capitalize">{entity.type}</span>
            </Badge>
          </CardTitle>
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

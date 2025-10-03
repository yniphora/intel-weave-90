-- Create entity_images table
CREATE TABLE public.entity_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entity_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view images of their entities"
ON public.entity_images
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.entities
  WHERE entities.id = entity_images.entity_id
  AND entities.user_id = auth.uid()
));

CREATE POLICY "Users can create images for their entities"
ON public.entity_images
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.entities
  WHERE entities.id = entity_images.entity_id
  AND entities.user_id = auth.uid()
));

CREATE POLICY "Users can update images of their entities"
ON public.entity_images
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.entities
  WHERE entities.id = entity_images.entity_id
  AND entities.user_id = auth.uid()
));

CREATE POLICY "Users can delete images of their entities"
ON public.entity_images
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.entities
  WHERE entities.id = entity_images.entity_id
  AND entities.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_entity_images_updated_at
BEFORE UPDATE ON public.entity_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
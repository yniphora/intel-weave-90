-- Create entity_documents table
CREATE TABLE public.entity_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  title TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entity_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for entity_documents
CREATE POLICY "Users can view documents of their entities"
ON public.entity_documents
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM entities
  WHERE entities.id = entity_documents.entity_id
  AND entities.user_id = auth.uid()
));

CREATE POLICY "Users can create documents for their entities"
ON public.entity_documents
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM entities
  WHERE entities.id = entity_documents.entity_id
  AND entities.user_id = auth.uid()
));

CREATE POLICY "Users can update documents of their entities"
ON public.entity_documents
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM entities
  WHERE entities.id = entity_documents.entity_id
  AND entities.user_id = auth.uid()
));

CREATE POLICY "Users can delete documents of their entities"
ON public.entity_documents
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM entities
  WHERE entities.id = entity_documents.entity_id
  AND entities.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_entity_documents_updated_at
BEFORE UPDATE ON public.entity_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Create policies for document storage
CREATE POLICY "Users can view their entity documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM entities
    WHERE entities.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload documents for their entities"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM entities
    WHERE entities.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their entity documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM entities
    WHERE entities.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their entity documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM entities
    WHERE entities.user_id = auth.uid()
  )
);
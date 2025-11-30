-- Create storage bucket for criminal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('criminal-photos', 'criminal-photos', true);

-- Policy to allow authenticated users to upload their own criminal photos
CREATE POLICY "Users can upload criminal photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'criminal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow public viewing of criminal photos
CREATE POLICY "Public can view criminal photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'criminal-photos');

-- Policy to allow users to update their own uploads
CREATE POLICY "Users can update their criminal photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'criminal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to delete their own uploads
CREATE POLICY "Users can delete their criminal photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'criminal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
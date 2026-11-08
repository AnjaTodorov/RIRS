BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('domora-properties','domora-properties',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE FUNCTION public.can_read_property_photo(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.property_photos photo JOIN public.properties p ON p.id=photo.property_id
    WHERE photo.storage_path=object_name AND (
      p.status='PUBLISHED' OR p.advertiser_id=auth.uid()
      OR EXISTS(SELECT 1 FROM public.profiles u WHERE u.id=auth.uid() AND u.role='ADMIN')
    )
  );
$$;
CREATE FUNCTION public.can_manage_property_photo(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT split_part(object_name,'/',1)=auth.uid()::text AND EXISTS (
    SELECT 1 FROM public.properties p JOIN public.profiles u ON u.id=p.advertiser_id
    WHERE p.id::text=split_part(object_name,'/',2) AND p.advertiser_id=auth.uid()
      AND u.role='ADVERTISER' AND p.status IN ('DRAFT','REJECTED')
  );
$$;
REVOKE ALL ON FUNCTION public.can_read_property_photo(text), public.can_manage_property_photo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_property_photo(text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_property_photo(text) TO anon,authenticated;
CREATE POLICY domora_photo_read ON storage.objects FOR SELECT TO anon,authenticated
  USING(bucket_id='domora-properties' AND (public.can_read_property_photo(name) OR public.can_manage_property_photo(name)));
CREATE POLICY domora_photo_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK(bucket_id='domora-properties' AND public.can_manage_property_photo(name));
CREATE POLICY domora_photo_delete ON storage.objects FOR DELETE TO authenticated
  USING(bucket_id='domora-properties' AND public.can_manage_property_photo(name));
COMMIT;

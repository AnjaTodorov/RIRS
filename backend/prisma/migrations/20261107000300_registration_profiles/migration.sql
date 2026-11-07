BEGIN;

-- Account and profile are created in the SAME Auth transaction. Invalid profile
-- metadata or a taken username rolls the entire signup back.
CREATE FUNCTION public.create_registration_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    metadata JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
    IF COALESCE(metadata->>'role', '') NOT IN ('SEEKER', 'ADVERTISER') THEN
        RAISE EXCEPTION 'Registration role must be SEEKER or ADVERTISER' USING ERRCODE = '23514';
    END IF;
    IF COALESCE(btrim(metadata->>'first_name'), '') = ''
        OR COALESCE(btrim(metadata->>'last_name'), '') = ''
        OR COALESCE(btrim(metadata->>'username'), '') = ''
        OR COALESCE(btrim(metadata->>'phone_number'), '') = '' THEN
        RAISE EXCEPTION 'Registration profile fields are required' USING ERRCODE = '23514';
    END IF;
    INSERT INTO public.profiles(id, first_name, last_name, username, phone_number, role)
    VALUES (NEW.id, btrim(metadata->>'first_name'), btrim(metadata->>'last_name'),
        btrim(metadata->>'username'), btrim(metadata->>'phone_number'),
        (metadata->>'role')::public.user_role);
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_registration_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_domora_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_registration_profile();

COMMIT;

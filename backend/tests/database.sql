-- Integration checks against Supabase. Everything, including test auth users,
-- is rolled back. Never use migrate reset on a shared Supabase database.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE FUNCTION pg_temp.expect_rejected(statement TEXT, expected_state TEXT)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual_state TEXT;
BEGIN
    BEGIN
        EXECUTE statement;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS actual_state = RETURNED_SQLSTATE;
        IF actual_state <> expected_state THEN
            RAISE EXCEPTION 'Expected SQLSTATE %, received %', expected_state, actual_state;
        END IF;
        RETURN;
    END;
    RAISE EXCEPTION 'Expected SQLSTATE %, but statement succeeded', expected_state;
END;
$$;

DO $$
DECLARE
    advertiser UUID := gen_random_uuid();
    seeker_a UUID := gen_random_uuid();
    seeker_b UUID := gen_random_uuid();
    listing UUID;
    other_listing UUID;
    slot UUID;
    suffix TEXT := gen_random_uuid()::text;
    table_name TEXT;
BEGIN
    INSERT INTO auth.users(id) VALUES (advertiser), (seeker_a), (seeker_b);
    INSERT INTO public.profiles(id, first_name, last_name, username, phone_number, role)
    VALUES
        (advertiser, 'Test', 'Advertiser', 'advertiser-' || suffix, '000000000', 'ADVERTISER'),
        (seeker_a, 'Test', 'Seeker A', 'seeker-a-' || suffix, '000000001', 'SEEKER'),
        (seeker_b, 'Test', 'Seeker B', 'seeker-b-' || suffix, '000000002', 'SEEKER');

    PERFORM pg_temp.expect_rejected(format(
        'INSERT INTO public.profiles VALUES (%L, %L, %L, %L, %L, %L)',
        gen_random_uuid(), 'Test', 'Missing auth', 'missing-' || suffix, '000', 'SEEKER'), '23503');
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.profiles SET username = %L WHERE id = %L',
        'seeker-a-' || suffix, seeker_b), '23505');
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.profiles SET phone_number = %L WHERE id = %L', ' ', seeker_a), '23514');

    -- A draft may be incomplete; submission requires complete business data.
    INSERT INTO public.properties(advertiser_id) VALUES (advertiser) RETURNING id INTO listing;
    IF (SELECT status FROM public.properties WHERE id = listing) <> 'DRAFT' THEN
        RAISE EXCEPTION 'New listing must be DRAFT';
    END IF;
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.properties SET status = %L WHERE id = %L', 'PENDING_REVIEW', listing), '23514');
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.properties SET price = 0 WHERE id = %L', listing), '23514');
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.properties SET area_m2 = -1 WHERE id = %L', listing), '23514');
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.properties SET price = %L WHERE id = %L', 'NaN', listing), '23514');

    UPDATE public.properties SET title = 'Test property', description = 'Test description',
        city = 'Maribor', public_location = 'Maribor', exact_address = 'Private test address',
        property_type = 'APARTMENT', listing_type = 'SALE', price = 120000, area_m2 = 60,
        status = 'PENDING_REVIEW' WHERE id = listing;
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.properties SET status = %L WHERE id = %L', 'REJECTED', listing), '23514');
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.properties SET status = %L WHERE id = %L', 'RENTED', listing), '23514');

    INSERT INTO public.property_photos(property_id, storage_path)
    VALUES (listing, 'test/' || suffix || '.jpg');
    PERFORM pg_temp.expect_rejected(format(
        'INSERT INTO public.property_photos(property_id, storage_path, position) VALUES (%L, %L, -1)',
        listing, 'test/invalid-' || suffix), '23514');

    INSERT INTO public.viewing_slots(property_id, starts_at, ends_at)
    VALUES (listing, '2099-01-01 10:00+00', '2099-01-01 11:00+00') RETURNING id INTO slot;
    PERFORM pg_temp.expect_rejected(format(
        'INSERT INTO public.viewing_slots(property_id, starts_at, ends_at) VALUES (%L, %L, %L)',
        listing, '2099-01-01 10:30+00', '2099-01-01 11:30+00'), '23P01');
    PERFORM pg_temp.expect_rejected(format(
        'INSERT INTO public.viewing_slots(property_id, starts_at, ends_at) VALUES (%L, %L, %L)',
        listing, '2099-01-01 12:00+00', '2099-01-01 11:00+00'), '23514');
    -- Adjacent slots are valid, and different properties may share a time.
    INSERT INTO public.viewing_slots(property_id, starts_at, ends_at)
    VALUES (listing, '2099-01-01 11:00+00', '2099-01-01 12:00+00');
    INSERT INTO public.properties(advertiser_id) VALUES (advertiser) RETURNING id INTO other_listing;
    INSERT INTO public.viewing_slots(property_id, starts_at, ends_at)
    VALUES (other_listing, '2099-01-01 10:30+00', '2099-01-01 11:30+00');

    INSERT INTO public.viewing_requests(slot_id, seeker_id) VALUES (slot, seeker_a), (slot, seeker_b);
    UPDATE public.viewing_requests SET status = 'REJECTED' WHERE slot_id = slot AND seeker_id = seeker_a;
    -- Even a rejected request prevents a duplicate for the same person and slot.
    PERFORM pg_temp.expect_rejected(format(
        'INSERT INTO public.viewing_requests(slot_id, seeker_id) VALUES (%L, %L)', slot, seeker_a), '23505');
    UPDATE public.viewing_requests SET status = 'PENDING' WHERE slot_id = slot;
    UPDATE public.viewing_requests SET status = 'CONFIRMED' WHERE slot_id = slot AND seeker_id = seeker_a;
    PERFORM pg_temp.expect_rejected(format(
        'UPDATE public.viewing_requests SET status = %L WHERE slot_id = %L AND seeker_id = %L',
        'CONFIRMED', slot, seeker_b), '23505');

    FOREACH table_name IN ARRAY ARRAY['profiles', 'properties', 'property_photos', 'viewing_slots', 'viewing_requests', '_prisma_migrations'] LOOP
        IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || table_name)::regclass) THEN
            RAISE EXCEPTION 'RLS missing on %', table_name;
        END IF;
        IF has_table_privilege('anon', 'public.' || table_name, 'SELECT')
            OR has_table_privilege('authenticated', 'public.' || table_name, 'SELECT') THEN
            RAISE EXCEPTION 'Direct browser access should be disabled on %', table_name;
        END IF;
    END LOOP;
END;
$$;

-- Check actual execution as the two browser roles, including private addresses.
DO $$
BEGIN
    SET LOCAL ROLE anon;
    BEGIN
        PERFORM exact_address FROM public.properties LIMIT 1;
        RAISE EXCEPTION 'Anonymous role unexpectedly read private addresses';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    RESET ROLE;
    SET LOCAL ROLE authenticated;
    BEGIN
        PERFORM exact_address FROM public.properties LIMIT 1;
        RAISE EXCEPTION 'Authenticated role unexpectedly read private addresses';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    RESET ROLE;
END;
$$;

ROLLBACK;

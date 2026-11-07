BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

CREATE TYPE public.user_role AS ENUM ('SEEKER', 'ADVERTISER', 'ADMIN');
CREATE TYPE public.listing_type AS ENUM ('SALE', 'RENT');
CREATE TYPE public.property_status AS ENUM (
    'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'INACTIVE', 'SOLD', 'RENTED'
);
CREATE TYPE public.viewing_request_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

CREATE TABLE public.profiles (
    id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    role public.user_role NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_auth_user_fkey FOREIGN KEY (id)
        REFERENCES auth.users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT profiles_contact_required CHECK (
        btrim(first_name) <> '' AND btrim(last_name) <> ''
        AND btrim(username) <> '' AND btrim(phone_number) <> ''
    )
);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles(username);

-- Incomplete data is allowed while an advertiser prepares a draft.
CREATE TABLE public.properties (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    public_location TEXT NOT NULL DEFAULT '',
    exact_address TEXT NOT NULL DEFAULT '',
    property_type TEXT NOT NULL DEFAULT '',
    listing_type public.listing_type,
    price NUMERIC(14, 2),
    area_m2 NUMERIC(12, 2),
    status public.property_status NOT NULL DEFAULT 'DRAFT',
    reviewed_by UUID,
    review_reason TEXT,
    CONSTRAINT properties_pkey PRIMARY KEY (id),
    CONSTRAINT properties_advertiser_id_fkey FOREIGN KEY (advertiser_id)
        REFERENCES public.profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT properties_reviewed_by_fkey FOREIGN KEY (reviewed_by)
        REFERENCES public.profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT properties_positive_price CHECK (price > 0 AND price <> 'NaN'::numeric),
    CONSTRAINT properties_positive_area CHECK (area_m2 > 0 AND area_m2 <> 'NaN'::numeric),
    CONSTRAINT properties_complete_after_draft CHECK (
        status = 'DRAFT' OR (
            btrim(title) <> '' AND btrim(description) <> '' AND btrim(city) <> ''
            AND btrim(public_location) <> '' AND btrim(exact_address) <> ''
            AND btrim(property_type) <> '' AND listing_type IS NOT NULL
            AND price IS NOT NULL AND area_m2 IS NOT NULL
        )
    ),
    CONSTRAINT properties_completed_listing_type CHECK (
        (status <> 'SOLD' OR listing_type = 'SALE')
        AND (status <> 'RENTED' OR listing_type = 'RENT')
    ),
    CONSTRAINT properties_rejection_reason CHECK (
        status <> 'REJECTED' OR (review_reason IS NOT NULL AND btrim(review_reason) <> '')
    )
);
CREATE INDEX properties_advertiser_id_idx ON public.properties(advertiser_id);
CREATE INDEX properties_reviewed_by_idx ON public.properties(reviewed_by);
CREATE INDEX properties_status_city_listing_type_idx ON public.properties(status, city, listing_type);

CREATE TABLE public.property_photos (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    storage_path TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT property_photos_pkey PRIMARY KEY (id),
    CONSTRAINT property_photos_property_id_fkey FOREIGN KEY (property_id)
        REFERENCES public.properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT property_photos_path_required CHECK (btrim(storage_path) <> ''),
    CONSTRAINT property_photos_position_nonnegative CHECK (position >= 0)
);
CREATE UNIQUE INDEX property_photos_storage_path_key ON public.property_photos(storage_path);
CREATE INDEX property_photos_property_id_position_idx ON public.property_photos(property_id, position);

CREATE TABLE public.viewing_slots (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    starts_at TIMESTAMPTZ(6) NOT NULL,
    ends_at TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT viewing_slots_pkey PRIMARY KEY (id),
    CONSTRAINT viewing_slots_property_id_fkey FOREIGN KEY (property_id)
        REFERENCES public.properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT viewing_slots_valid_time_range CHECK (ends_at > starts_at),
    -- Half-open ranges allow adjacent appointments, e.g. 10:00-11:00 and 11:00-12:00.
    CONSTRAINT viewing_slots_no_overlap EXCLUDE USING gist (
        property_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
    )
);
CREATE INDEX viewing_slots_property_id_starts_at_idx ON public.viewing_slots(property_id, starts_at);

CREATE TABLE public.viewing_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL,
    seeker_id UUID NOT NULL,
    status public.viewing_request_status NOT NULL DEFAULT 'PENDING',
    message TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMPTZ(6),
    CONSTRAINT viewing_requests_pkey PRIMARY KEY (id),
    CONSTRAINT viewing_requests_slot_id_fkey FOREIGN KEY (slot_id)
        REFERENCES public.viewing_slots(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT viewing_requests_seeker_id_fkey FOREIGN KEY (seeker_id)
        REFERENCES public.profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX viewing_requests_slot_id_seeker_id_key ON public.viewing_requests(slot_id, seeker_id);
CREATE UNIQUE INDEX viewing_requests_one_confirmed_per_slot ON public.viewing_requests(slot_id)
    WHERE status = 'CONFIRMED';
CREATE INDEX viewing_requests_seeker_id_status_idx ON public.viewing_requests(seeker_id, status);

-- Business data is served by the backend, not directly by the browser.
-- In particular, a public listing must never expose exact_address via PostgREST.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles, public.properties, public.property_photos,
    public.viewing_slots, public.viewing_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles, public.properties,
    public.property_photos, public.viewing_slots, public.viewing_requests TO service_role;

COMMENT ON TABLE public.profiles IS 'Domora profiles linked to Supabase Auth. Backend-only access.';
COMMENT ON COLUMN public.properties.exact_address IS 'Private. API may reveal only to owner, reviewer or confirmed viewer of an active listing.';
COMMENT ON TABLE public.viewing_requests IS 'Confirm and reject competing requests within one backend transaction.';

COMMIT;

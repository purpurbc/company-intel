-- Baseline 4/5: product-owned users, segments, offers, customers and caches.

CREATE TABLE app.app_user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_provider text,
    auth_subject text,
    email text,
    display_name text,
    role text NOT NULL DEFAULT 'user',
    company_id bigint REFERENCES core.company(company_id),
    company_description text,
    ideal_customer_description text,
    settings jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX app_user_auth ON app.app_user(auth_provider, auth_subject)
    WHERE auth_provider IS NOT NULL AND auth_subject IS NOT NULL;
CREATE UNIQUE INDEX app_user_email ON app.app_user(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX app_user_company ON app.app_user(company_id);
INSERT INTO app.app_user(id, display_name) VALUES ('00000000-0000-0000-0000-000000000001', 'MVP User');

CREATE TABLE app.saved_segment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app.app_user(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    filters jsonb NOT NULL DEFAULT '{}',
    sort jsonb NOT NULL DEFAULT '{}',
    visibility text NOT NULL DEFAULT 'private',
    intent text,
    notes text,
    match_profile_id uuid,
    source text NOT NULL DEFAULT 'manual',
    result_count bigint,
    last_result_count_at timestamptz,
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, id)
);
CREATE INDEX saved_segment_user_updated ON app.saved_segment(user_id, updated_at DESC);

CREATE TABLE app.sales_offer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app.app_user(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    target text,
    saved_segment_id uuid REFERENCES app.saved_segment(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, id)
);
CREATE INDEX sales_offer_user_updated ON app.sales_offer(user_id, updated_at DESC);
CREATE TABLE app.customer_account (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app.app_user(id) ON DELETE CASCADE,
    company_id bigint NOT NULL REFERENCES core.company(company_id),
    connection_text text,
    fit_score smallint NOT NULL DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 10),
    customer_labels jsonb NOT NULL DEFAULT '[]',
    why_fit text,
    pain_points text,
    buying_trigger text,
    outcome text,
    tags jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, company_id),
    UNIQUE (user_id, id)
);
CREATE INDEX customer_account_user_updated ON app.customer_account(user_id, updated_at DESC);
CREATE TABLE app.sales_offer_customer (
    offer_id uuid NOT NULL REFERENCES app.sales_offer(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES app.customer_account(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (offer_id, customer_id)
);
CREATE INDEX sales_offer_customer_customer ON app.sales_offer_customer(customer_id);

-- Reject cross-user links even when a caller bypasses the API checks.
CREATE FUNCTION app.check_link_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME = 'sales_offer_customer' THEN
        IF NOT EXISTS (
            SELECT 1 FROM app.sales_offer o JOIN app.customer_account c ON c.user_id = o.user_id
            WHERE o.id = NEW.offer_id AND c.id = NEW.customer_id
        ) THEN
            RAISE EXCEPTION 'Offer and customer must belong to the same user' USING ERRCODE = '23503';
        END IF;
    ELSE
        IF NEW.saved_segment_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM app.saved_segment s WHERE s.id = NEW.saved_segment_id AND s.user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Offer and segment must belong to the same user' USING ERRCODE = '23503';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER sales_offer_owner BEFORE INSERT OR UPDATE ON app.sales_offer
    FOR EACH ROW EXECUTE FUNCTION app.check_link_owner();
CREATE TRIGGER sales_offer_customer_owner BEFORE INSERT OR UPDATE ON app.sales_offer_customer
    FOR EACH ROW EXECUTE FUNCTION app.check_link_owner();

CREATE TABLE app.overview_cache (
    scope text PRIMARY KEY,
    payload jsonb NOT NULL,
    refreshed_at timestamptz NOT NULL DEFAULT now()
);

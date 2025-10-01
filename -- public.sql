-- public.hero_images definition

-- Drop table

-- DROP TABLE public.hero_images;

CREATE TABLE public.hero_images (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	title varchar(255) NOT NULL,
	description text NULL,
	image_url text NOT NULL,
	alt_text varchar(255) NULL,
	display_order int4 NOT NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
	updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
	CONSTRAINT hero_images_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_hero_images_order_active ON public.hero_images USING btree (display_order) WHERE (is_active = true);


-- public.studios definition

-- Drop table

-- DROP TABLE public.studios;

CREATE TABLE public.studios (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	"name" varchar(255) NOT NULL,
	description text NULL,
	address text NOT NULL,
	phone varchar(20) NULL,
	email varchar(255) NULL,
	operating_hours jsonb NULL,
	is_active bool NULL DEFAULT true,
	settings jsonb NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT studios_pkey PRIMARY KEY (id)
);


-- public.facilities definition

-- Drop table

-- DROP TABLE public.facilities;

CREATE TABLE public.facilities (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	capacity int4 NULL DEFAULT 1,
	equipment jsonb NULL,
	hourly_rate numeric(10, 2) NULL,
	is_available bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	icon varchar(50) NULL,
	CONSTRAINT facilities_pkey PRIMARY KEY (id),
	CONSTRAINT facilities_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_facilities_studio_available ON public.facilities USING btree (studio_id, is_available) WHERE (is_available = true);


-- public.homepage_banners definition

-- Drop table

-- DROP TABLE public.homepage_banners;

CREATE TABLE public.homepage_banners (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	title varchar(255) NOT NULL,
	subtitle text NULL,
	description text NULL,
	banner_type varchar(50) NULL DEFAULT 'promotional'::character varying,
	background_image_url text NULL,
	icon_name varchar(100) NULL,
	gradient_from varchar(20) NULL DEFAULT '#b0834d'::character varying,
	gradient_to varchar(20) NULL DEFAULT '#00052e'::character varying,
	text_color varchar(20) NULL DEFAULT 'text-white'::character varying,
	cta_text varchar(100) NULL,
	cta_link text NULL,
	is_active bool NULL DEFAULT true,
	priority int4 NULL DEFAULT 0,
	auto_rotate bool NULL DEFAULT true,
	rotation_duration int4 NULL DEFAULT 5000,
	start_date timestamptz NULL,
	end_date timestamptz NULL,
	click_count int4 NULL DEFAULT 0,
	view_count int4 NULL DEFAULT 0,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_banners_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_banners_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_homepage_banners_priority ON public.homepage_banners USING btree (priority DESC, created_at DESC);
CREATE INDEX idx_homepage_banners_studio_active ON public.homepage_banners USING btree (studio_id, is_active);


-- public.homepage_facilities definition

-- Drop table

-- DROP TABLE public.homepage_facilities;

CREATE TABLE public.homepage_facilities (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	image_url text NULL,
	icon_name varchar(100) NULL,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	featured bool NULL DEFAULT false,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_facilities_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_facilities_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_homepage_facilities_studio_order ON public.homepage_facilities USING btree (studio_id, order_index);


-- public.homepage_hero definition

-- Drop table

-- DROP TABLE public.homepage_hero;

CREATE TABLE public.homepage_hero (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	badge_text varchar(255) NULL,
	badge_icon varchar(100) NULL,
	main_title text NOT NULL,
	highlight_text text NULL,
	subtitle text NULL,
	primary_cta_text varchar(100) NULL,
	primary_cta_link text NULL,
	primary_cta_icon varchar(100) NULL,
	secondary_cta_text varchar(100) NULL,
	secondary_cta_link text NULL,
	secondary_cta_icon varchar(100) NULL,
	stats_1_number varchar(50) NULL,
	stats_1_text varchar(100) NULL,
	stats_1_icon varchar(100) NULL,
	stats_2_number varchar(50) NULL,
	stats_2_text varchar(100) NULL,
	stats_2_icon varchar(100) NULL,
	rating_display numeric(2, 1) NULL DEFAULT 4.9,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_hero_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_hero_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.homepage_hero_images definition

-- Drop table

-- DROP TABLE public.homepage_hero_images;

CREATE TABLE public.homepage_hero_images (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	image_url text NOT NULL,
	alt_text varchar(255) NULL,
	caption varchar(255) NULL,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_hero_images_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_hero_images_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_homepage_hero_images_studio ON public.homepage_hero_images USING btree (studio_id, order_index);


-- public.homepage_lighting definition

-- Drop table

-- DROP TABLE public.homepage_lighting;

CREATE TABLE public.homepage_lighting (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	image_url text NULL,
	icon_name varchar(100) NULL,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_lighting_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_lighting_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.homepage_properties definition

-- Drop table

-- DROP TABLE public.homepage_properties;

CREATE TABLE public.homepage_properties (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	property_name varchar(255) NOT NULL,
	description text NULL,
	icon_name varchar(100) NULL,
	image_url text NULL,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_properties_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_properties_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.homepage_services definition

-- Drop table

-- DROP TABLE public.homepage_services;

CREATE TABLE public.homepage_services (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	service_name varchar(255) NOT NULL,
	description text NULL,
	icon_name varchar(100) NULL DEFAULT 'Camera'::character varying,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	featured bool NULL DEFAULT false,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_services_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_services_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_homepage_services_studio_order ON public.homepage_services USING btree (studio_id, order_index);


-- public.homepage_specifications definition

-- Drop table

-- DROP TABLE public.homepage_specifications;

CREATE TABLE public.homepage_specifications (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	spec_name varchar(255) NOT NULL,
	dimensions varchar(255) NULL,
	category varchar(50) NOT NULL,
	description text NULL,
	icon_name varchar(100) NULL,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_specifications_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_specifications_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_homepage_specs_studio_category ON public.homepage_specifications USING btree (studio_id, category, order_index);


-- public.homepage_terms definition

-- Drop table

-- DROP TABLE public.homepage_terms;

CREATE TABLE public.homepage_terms (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	term_text text NOT NULL,
	category varchar(100) NULL,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	important bool NULL DEFAULT false,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_terms_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_terms_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.homepage_testimonials definition

-- Drop table

-- DROP TABLE public.homepage_testimonials;

CREATE TABLE public.homepage_testimonials (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	customer_name varchar(255) NOT NULL,
	customer_type varchar(100) NULL,
	customer_image_url text NULL,
	testimonial_text text NOT NULL,
	rating int4 NULL DEFAULT 5,
	order_index int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	featured bool NULL DEFAULT false,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT homepage_testimonials_pkey PRIMARY KEY (id),
	CONSTRAINT homepage_testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
	CONSTRAINT homepage_testimonials_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.package_categories definition

-- Drop table

-- DROP TABLE public.package_categories;

CREATE TABLE public.package_categories (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	display_order int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	CONSTRAINT package_categories_pkey PRIMARY KEY (id),
	CONSTRAINT package_categories_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.packages definition

-- Drop table

-- DROP TABLE public.packages;

CREATE TABLE public.packages (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	category_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	duration_minutes int4 NOT NULL,
	price numeric(10, 2) NOT NULL,
	dp_percentage numeric(5, 2) NULL DEFAULT 30.00,
	includes jsonb NULL,
	is_popular bool NULL DEFAULT false,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT packages_pkey PRIMARY KEY (id),
	CONSTRAINT packages_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.package_categories(id) ON DELETE SET NULL,
	CONSTRAINT packages_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_packages_popular ON public.packages USING btree (is_popular, is_active) WHERE (is_popular = true);
CREATE INDEX idx_packages_studio_active ON public.packages USING btree (studio_id, is_active) WHERE (is_active = true);


-- public.payment_methods definition

-- Drop table

-- DROP TABLE public.payment_methods;

CREATE TABLE public.payment_methods (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	provider varchar(100) NULL,
	account_details jsonb NULL,
	xendit_config jsonb NULL,
	fee_percentage numeric(5, 2) NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	fee_type varchar(20) NULL DEFAULT 'percentage'::character varying,
	fee_amount numeric(10, 2) NULL DEFAULT 0,
	CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
	CONSTRAINT valid_fee_type CHECK (((fee_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[]))),
	CONSTRAINT payment_methods_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.portfolio_categories definition

-- Drop table

-- DROP TABLE public.portfolio_categories;

CREATE TABLE public.portfolio_categories (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	display_order int4 NULL DEFAULT 0,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	CONSTRAINT portfolio_categories_pkey PRIMARY KEY (id),
	CONSTRAINT portfolio_categories_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);


-- public.portfolios definition

-- Drop table

-- DROP TABLE public.portfolios;

CREATE TABLE public.portfolios (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	category_id uuid NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	image_url text NOT NULL,
	alt_text varchar(255) NULL,
	display_order int4 NULL DEFAULT 0,
	is_featured bool NULL DEFAULT false,
	is_active bool NULL DEFAULT true,
	metadata jsonb NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT portfolios_pkey PRIMARY KEY (id),
	CONSTRAINT portfolios_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.portfolio_categories(id) ON DELETE SET NULL,
	CONSTRAINT portfolios_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_portfolios_featured ON public.portfolios USING btree (is_featured, is_active) WHERE (is_featured = true);
CREATE INDEX idx_portfolios_studio_category ON public.portfolios USING btree (studio_id, category_id);


-- public.time_slots definition

-- Drop table

-- DROP TABLE public.time_slots;

CREATE TABLE public.time_slots (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	facility_id uuid NULL,
	slot_date date NOT NULL,
	start_time time NOT NULL,
	end_time time NOT NULL,
	is_available bool NULL DEFAULT true,
	is_blocked bool NULL DEFAULT false,
	notes text NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT time_slots_pkey PRIMARY KEY (id),
	CONSTRAINT unique_facility_time UNIQUE (facility_id, slot_date, start_time),
	CONSTRAINT time_slots_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE,
	CONSTRAINT time_slots_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_time_slots_date_available ON public.time_slots USING btree (slot_date, is_available) WHERE (is_available = true);
CREATE INDEX idx_time_slots_facility_date ON public.time_slots USING btree (facility_id, slot_date);


-- public.addons definition

-- Drop table

-- DROP TABLE public.addons;

CREATE TABLE public.addons (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	studio_id uuid NULL,
	facility_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	price numeric(10, 2) NOT NULL,
	"type" varchar(100) NULL,
	max_quantity int4 NULL DEFAULT 1,
	is_conditional bool NULL DEFAULT false,
	conditional_logic jsonb NULL,
	is_active bool NULL DEFAULT true,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT addons_pkey PRIMARY KEY (id),
	CONSTRAINT addons_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE SET NULL,
	CONSTRAINT addons_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE
);
CREATE INDEX idx_addons_facility ON public.addons USING btree (facility_id) WHERE (facility_id IS NOT NULL);
CREATE INDEX idx_addons_studio_active ON public.addons USING btree (studio_id, is_active) WHERE (is_active = true);


-- public.package_addons definition

-- Drop table

-- DROP TABLE public.package_addons;

CREATE TABLE public.package_addons (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	package_id uuid NULL,
	addon_id uuid NULL,
	is_included bool NULL DEFAULT false,
	discount_percentage numeric(5, 2) NULL DEFAULT 0,
	display_order int4 NULL DEFAULT 0,
	is_recommended bool NULL DEFAULT false,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT package_addons_pkey PRIMARY KEY (id),
	CONSTRAINT unique_package_addon UNIQUE (package_id, addon_id),
	CONSTRAINT package_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES public.addons(id) ON DELETE CASCADE,
	CONSTRAINT package_addons_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE
);
CREATE INDEX idx_package_addons_addon_id ON public.package_addons USING btree (addon_id);
CREATE INDEX idx_package_addons_display_order ON public.package_addons USING btree (package_id, display_order);
CREATE INDEX idx_package_addons_package_id ON public.package_addons USING btree (package_id);


-- public.package_facilities definition

-- Drop table

-- DROP TABLE public.package_facilities;

CREATE TABLE public.package_facilities (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	package_id uuid NULL,
	facility_id uuid NULL,
	is_included bool NULL DEFAULT true,
	additional_cost numeric(10, 2) NULL DEFAULT 0,
	created_at timestamptz NULL DEFAULT now(),
	CONSTRAINT package_facilities_pkey PRIMARY KEY (id),
	CONSTRAINT unique_package_facility UNIQUE (package_id, facility_id),
	CONSTRAINT package_facilities_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE,
	CONSTRAINT package_facilities_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE
);


-- public.customers definition

-- Drop table

-- DROP TABLE public.customers;

CREATE TABLE public.customers (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	user_id uuid NULL,
	full_name varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	phone varchar(20) NOT NULL,
	address text NULL,
	birth_date date NULL,
	notes text NULL,
	is_guest bool NULL DEFAULT false,
	guest_token varchar(255) NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT customers_pkey PRIMARY KEY (id),
	CONSTRAINT unique_user_email UNIQUE (user_id, email) DEFERRABLE INITIALLY DEFERRED
);


-- public.discounts definition

-- Drop table

-- DROP TABLE public.discounts;

CREATE TABLE public.discounts (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	studio_id uuid NULL,
	code varchar(50) NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"type" varchar(20) NOT NULL,
	value numeric(10, 2) NOT NULL,
	minimum_amount numeric(15, 2) NULL DEFAULT 0,
	maximum_discount numeric(15, 2) NULL,
	is_active bool NULL DEFAULT true,
	valid_from timestamp NULL,
	valid_until timestamp NULL,
	usage_limit int4 NULL,
	used_count int4 NULL DEFAULT 0,
	applies_to varchar(20) NULL DEFAULT 'all'::character varying,
	created_by uuid NULL,
	created_at timestamp NULL DEFAULT now(),
	updated_at timestamp NULL DEFAULT now(),
	CONSTRAINT discounts_applies_to_check CHECK (((applies_to)::text = ANY ((ARRAY['all'::character varying, 'packages'::character varying, 'addons'::character varying])::text[]))),
	CONSTRAINT discounts_code_key UNIQUE (code),
	CONSTRAINT discounts_pkey PRIMARY KEY (id),
	CONSTRAINT discounts_type_check CHECK (((type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed_amount'::character varying])::text[])))
);
CREATE INDEX idx_discounts_active ON public.discounts USING btree (is_active, valid_from, valid_until);
CREATE INDEX idx_discounts_code ON public.discounts USING btree (code) WHERE (code IS NOT NULL);
CREATE INDEX idx_discounts_studio_id ON public.discounts USING btree (studio_id);


-- public.payments definition

-- Drop table

-- DROP TABLE public.payments;

CREATE TABLE public.payments (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	reservation_id uuid NULL,
	payment_method_id uuid NULL,
	amount numeric(10, 2) NOT NULL,
	payment_type varchar(50) NOT NULL,
	status public."payment_status" NULL DEFAULT 'pending'::payment_status,
	external_payment_id varchar(255) NULL,
	external_status varchar(100) NULL,
	payment_url text NULL,
	callback_data jsonb NULL,
	gateway_fee numeric(10, 2) NULL DEFAULT 0,
	net_amount numeric(10, 2) NULL,
	paid_at timestamptz NULL,
	expires_at timestamptz NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT payments_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_payments_external_id ON public.payments USING btree (external_payment_id);
CREATE INDEX idx_payments_reservation ON public.payments USING btree (reservation_id);
CREATE INDEX idx_payments_status ON public.payments USING btree (status);


-- public.reservation_addons definition

-- Drop table

-- DROP TABLE public.reservation_addons;

CREATE TABLE public.reservation_addons (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	reservation_id uuid NULL,
	addon_id uuid NULL,
	quantity int4 NULL DEFAULT 1,
	unit_price numeric(10, 2) NOT NULL,
	total_price numeric(10, 2) NOT NULL,
	created_at timestamptz NULL DEFAULT now(),
	CONSTRAINT reservation_addons_pkey PRIMARY KEY (id),
	CONSTRAINT unique_reservation_addon UNIQUE (reservation_id, addon_id)
);


-- public.reservation_discounts definition

-- Drop table

-- DROP TABLE public.reservation_discounts;

CREATE TABLE public.reservation_discounts (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	reservation_id uuid NULL,
	discount_id uuid NULL,
	discount_name varchar(255) NULL,
	discount_type varchar(20) NULL,
	discount_value numeric(10, 2) NULL,
	discount_amount numeric(15, 2) NOT NULL,
	applied_by uuid NULL,
	applied_at timestamp NULL DEFAULT now(),
	CONSTRAINT reservation_discounts_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_reservation_discounts_reservation_id ON public.reservation_discounts USING btree (reservation_id);


-- public.reservations definition

-- Drop table

-- DROP TABLE public.reservations;

CREATE TABLE public.reservations (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	booking_code varchar(20) NOT NULL,
	invoice_number varchar(50) NULL,
	studio_id uuid NULL,
	customer_id uuid NULL,
	user_id uuid NULL,
	package_id uuid NULL,
	is_guest_booking bool NULL DEFAULT false,
	guest_email varchar(255) NULL,
	guest_phone varchar(20) NULL,
	reservation_date date NOT NULL,
	start_time time NOT NULL,
	end_time time NOT NULL,
	total_duration int4 NOT NULL,
	selected_facilities jsonb NULL,
	package_price numeric(10, 2) NOT NULL,
	facility_addon_total numeric(10, 2) NULL DEFAULT 0,
	other_addon_total numeric(10, 2) NULL DEFAULT 0,
	subtotal numeric(10, 2) NOT NULL,
	tax_amount numeric(10, 2) NULL DEFAULT 0,
	discount_amount numeric(10, 2) NULL DEFAULT 0,
	total_amount numeric(10, 2) NOT NULL,
	dp_amount numeric(10, 2) NOT NULL,
	remaining_amount numeric(10, 2) NOT NULL,
	status public."reservation_status" NULL DEFAULT 'pending'::reservation_status,
	"payment_status" public."payment_status" NULL DEFAULT 'pending'::payment_status,
	special_requests text NULL,
	notes text NULL,
	internal_notes text NULL,
	confirmed_at timestamptz NULL,
	completed_at timestamptz NULL,
	cancelled_at timestamptz NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	discount_id uuid NULL,
	CONSTRAINT reservations_booking_code_key UNIQUE (booking_code),
	CONSTRAINT reservations_invoice_number_key UNIQUE (invoice_number),
	CONSTRAINT reservations_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_reservations_booking_code ON public.reservations USING btree (booking_code);
CREATE INDEX idx_reservations_customer ON public.reservations USING btree (customer_id);
CREATE INDEX idx_reservations_guest_email ON public.reservations USING btree (guest_email) WHERE (is_guest_booking = true);
CREATE INDEX idx_reservations_status ON public.reservations USING btree (status);
CREATE INDEX idx_reservations_studio_date ON public.reservations USING btree (studio_id, reservation_date);
CREATE INDEX idx_reservations_user ON public.reservations USING btree (user_id) WHERE (user_id IS NOT NULL);


-- public.reviews definition

-- Drop table

-- DROP TABLE public.reviews;

CREATE TABLE public.reviews (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	reservation_id uuid NULL,
	customer_id uuid NULL,
	rating int4 NULL,
	title varchar(255) NULL,
	"comment" text NULL,
	photos jsonb NULL,
	is_featured bool NULL DEFAULT false,
	is_approved bool NULL DEFAULT false,
	replied_at timestamptz NULL,
	reply_text text NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT reviews_pkey PRIMARY KEY (id),
	CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE INDEX idx_reviews_reservation_approved ON public.reviews USING btree (reservation_id) WHERE (is_approved = true);


-- public.user_profiles definition

-- Drop table

-- DROP TABLE public.user_profiles;

CREATE TABLE public.user_profiles (
	id uuid NOT NULL,
	studio_id uuid NULL,
	"role" public."user_role" NULL DEFAULT 'customer'::user_role,
	full_name varchar(255) NULL,
	phone varchar(20) NULL,
	address text NULL,
	birth_date date NULL,
	preferences jsonb NULL DEFAULT '{}'::jsonb,
	avatar_url text NULL,
	is_active bool NULL DEFAULT true,
	last_login timestamptz NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamptz NULL DEFAULT now(),
	CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (id) WHERE (role = 'customer'::user_role);
CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role);
CREATE INDEX idx_user_profiles_studio_role ON public.user_profiles USING btree (studio_id, role);


-- public.customers foreign keys

ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


-- public.discounts foreign keys

ALTER TABLE public.discounts ADD CONSTRAINT discounts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);
ALTER TABLE public.discounts ADD CONSTRAINT discounts_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;


-- public.payments foreign keys

ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);
ALTER TABLE public.payments ADD CONSTRAINT payments_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


-- public.reservation_addons foreign keys

ALTER TABLE public.reservation_addons ADD CONSTRAINT reservation_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES public.addons(id) ON DELETE CASCADE;
ALTER TABLE public.reservation_addons ADD CONSTRAINT reservation_addons_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


-- public.reservation_discounts foreign keys

ALTER TABLE public.reservation_discounts ADD CONSTRAINT reservation_discounts_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES public.user_profiles(id);
ALTER TABLE public.reservation_discounts ADD CONSTRAINT reservation_discounts_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id);
ALTER TABLE public.reservation_discounts ADD CONSTRAINT reservation_discounts_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


-- public.reservations foreign keys

ALTER TABLE public.reservations ADD CONSTRAINT reservations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE SET NULL;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE SET NULL;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


-- public.reviews foreign keys

ALTER TABLE public.reviews ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


-- public.user_profiles foreign keys

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
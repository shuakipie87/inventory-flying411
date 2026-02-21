--
-- PostgreSQL database dump
--

\restrict l3tB0B4JM4jlRbfFfbx0KC2TiKaTIbzEXitrWrdPM3jyh2OUCgmKTTSBbVoqYTx

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ListingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ListingStatus" AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'SOLD',
    'ARCHIVED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    details jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    admin_id text NOT NULL
);


--
-- Name: listing_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_images (
    id text NOT NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    thumbnail_path text,
    webp_path text,
    category text,
    is_primary boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    listing_id text NOT NULL
);


--
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listings (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    category text NOT NULL,
    subcategory text,
    condition text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    status public."ListingStatus" DEFAULT 'DRAFT'::public."ListingStatus" NOT NULL,
    rejection_reason text,
    flying411_listing_id text,
    synced_at timestamp(3) without time zone,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    published_at timestamp(3) without time zone,
    user_id text NOT NULL
);


--
-- Name: parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts (
    id text NOT NULL,
    part_number text NOT NULL,
    manufacturer text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    model text,
    alternates text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: price_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_history (
    id text NOT NULL,
    condition text NOT NULL,
    price numeric(10,2) NOT NULL,
    source text,
    recorded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    part_id text NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    comment text NOT NULL,
    action text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    listing_id text NOT NULL,
    reviewer_id text NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    last_login timestamp(3) without time zone
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, action, entity_type, entity_id, details, created_at, admin_id) FROM stdin;
\.


--
-- Data for Name: listing_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listing_images (id, filename, original_name, mime_type, size, path, thumbnail_path, webp_path, category, is_primary, "order", processed, created_at, listing_id) FROM stdin;
45beca31-fa68-4b0a-8335-32849cacf28f	cessna180_1.jpg	cessna180_1.jpg	image/jpeg	87593	/uploads/cessna180_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	61bc8584-bfba-49b3-8637-c5221862a464
bfff0d9c-3d79-419d-9e7d-de6d15bb43e0	cessna180_2.jpg	cessna180_2.jpg	image/jpeg	115093	/uploads/cessna180_2.jpg	\N	\N	\N	f	1	f	2026-02-10 05:18:09.916	61bc8584-bfba-49b3-8637-c5221862a464
0fc27a10-fa04-4249-9cce-801b59231ac7	cessna180_3.jpg	cessna180_3.jpg	image/jpeg	91756	/uploads/cessna180_3.jpg	\N	\N	\N	f	2	f	2026-02-10 05:18:09.916	61bc8584-bfba-49b3-8637-c5221862a464
bdba57e2-1724-46c0-a969-ed14540ec4ef	aircraft-1.jpg	aircraft-1.jpg	image/jpeg	85520	/uploads/aircraft-1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	257f6447-76bd-4ae0-9dd4-57e8f1170dfd
33c00e2c-e771-45e4-9848-e48f7c7e0d5e	bonanza_1.jpg	bonanza_1.jpg	image/jpeg	79962	/uploads/bonanza_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	349e1b96-ab72-4bf1-a368-4d7e768dac12
2af7dd24-45be-49f0-ad8a-ee3b3f4b37aa	bonanza_2.jpg	bonanza_2.jpg	image/jpeg	69833	/uploads/bonanza_2.jpg	\N	\N	\N	f	1	f	2026-02-10 05:18:09.916	349e1b96-ab72-4bf1-a368-4d7e768dac12
06d96941-fc87-4225-9ce0-92530c10f659	bonanza_3.jpg	bonanza_3.jpg	image/jpeg	102435	/uploads/bonanza_3.jpg	\N	\N	\N	f	2	f	2026-02-10 05:18:09.916	349e1b96-ab72-4bf1-a368-4d7e768dac12
11f5da9f-a918-493f-94d5-3be6732c5306	aircraft-2.jpg	aircraft-2.jpg	image/jpeg	103053	/uploads/aircraft-2.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	e7c32f4f-b737-4df9-ad9c-700fd59ebd21
ea6156e8-a2dd-44d7-bbdc-2cceedf243fe	aircraft-3.jpg	aircraft-3.jpg	image/jpeg	46298	/uploads/aircraft-3.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	4adb23a0-1219-455d-b61e-a5960dd9b74e
8986d854-7c97-45f5-90ad-3a7925f09774	aircraft-4.jpg	aircraft-4.jpg	image/jpeg	70271	/uploads/aircraft-4.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	992cb495-16ec-4da0-a5c7-0f42af6289d8
78b4171a-052f-4ce9-8b0a-dce9c1e6ca55	aircraft-5.jpg	aircraft-5.jpg	image/jpeg	94471	/uploads/aircraft-5.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	69c96e1d-4c25-4515-acd6-c2e41d969835
99a80c3a-e245-4f31-8c58-a168fa617740	aircraft-6.jpg	aircraft-6.jpg	image/jpeg	36891	/uploads/aircraft-6.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	50a4483c-088c-4f30-b570-9957efeebd11
ec4d6d8f-c4a9-4df9-8d36-37ac12ecbec7	seneca_1.jpg	seneca_1.jpg	image/jpeg	84986	/uploads/seneca_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	b3f403e7-4028-4d2d-b80c-d9d2a4e99b4e
b857af83-4778-4258-8710-1726fd4ce854	seneca_2.jpg	seneca_2.jpg	image/jpeg	81431	/uploads/seneca_2.jpg	\N	\N	\N	f	1	f	2026-02-10 05:18:09.916	b3f403e7-4028-4d2d-b80c-d9d2a4e99b4e
b9037e01-6eb7-49d8-9322-4cd352f7e7d7	seneca_3.jpg	seneca_3.jpg	image/jpeg	84869	/uploads/seneca_3.jpg	\N	\N	\N	f	2	f	2026-02-10 05:18:09.916	b3f403e7-4028-4d2d-b80c-d9d2a4e99b4e
f8711b65-95a2-40fa-9c24-e0a6ce3cb1f2	aircraft-7.jpg	aircraft-7.jpg	image/jpeg	63795	/uploads/aircraft-7.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	fc7f9453-7919-44e8-88f5-1262b993e239
0967d411-d607-4da6-a97d-abd7730d0481	aircraft-8.jpg	aircraft-8.jpg	image/jpeg	81954	/uploads/aircraft-8.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	1c664712-37ee-450b-af74-b6689259e461
1d7bc5df-0188-484c-af63-83f901f81f19	cessna180_4.jpg	cessna180_4.jpg	image/jpeg	63606	/uploads/cessna180_4.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	a005783e-bc1f-4122-9ebd-b0f0240de81d
9565aad4-1647-40b0-8ad9-dcce94de9fcc	bonanza_4.jpg	bonanza_4.jpg	image/jpeg	70381	/uploads/bonanza_4.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	4f7e724b-9583-4010-a4a1-ee37a25ca752
bb89ea82-0b41-46ed-a237-15eb853391f2	seneca_4.jpg	seneca_4.jpg	image/jpeg	90227	/uploads/seneca_4.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	bf5afeb1-e594-4fab-a50e-51e5eade7a3a
c13f94c1-5bc1-48e4-9613-3696eb3903e6	aircraft-4.jpg	aircraft-4.jpg	image/jpeg	70271	/uploads/aircraft-4.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	99920bde-7cfd-4454-a2e9-31034dc576cc
05565458-6627-4386-a438-b9c0882b1148	aircraft-5.jpg	aircraft-5.jpg	image/jpeg	94471	/uploads/aircraft-5.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	f93fe404-f7fb-42dc-95f3-58e56c6880b0
6744e15e-c59c-423d-9aad-b60ff4266d4d	cfm56_3c1_1.jpeg	cfm56_3c1_1.jpeg	image/jpeg	481293	/uploads/cfm56_3c1_1.jpeg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	658347c7-f506-4e56-8cd4-4ee6147ddab5
bed88f9a-0218-4883-a257-8447e344507f	cfm56_3c1_2.jpeg	cfm56_3c1_2.jpeg	image/jpeg	461671	/uploads/cfm56_3c1_2.jpeg	\N	\N	\N	f	1	f	2026-02-10 05:18:09.916	658347c7-f506-4e56-8cd4-4ee6147ddab5
651d81fb-e639-4db6-8d27-8509a353c48c	cfm56_7b_1.jpg	cfm56_7b_1.jpg	image/jpeg	8882	/uploads/cfm56_7b_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	a97aca62-4b3e-44c2-a325-425051693c70
51b02a35-a4c5-49f4-ad83-f2768e126206	cfm56_7b_2.jpg	cfm56_7b_2.jpg	image/jpeg	9969	/uploads/cfm56_7b_2.jpg	\N	\N	\N	f	1	f	2026-02-10 05:18:09.916	a97aca62-4b3e-44c2-a325-425051693c70
da079f51-0013-42f3-a19a-3bca6510933e	io320_1.png	io320_1.png	image/png	774979	/uploads/io320_1.png	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	46d5df25-178b-4bfb-a60d-a2d2e2c530d0
7f4feeab-4e33-4df0-bead-335f6286bf50	engine-1.jpg	engine-1.jpg	image/jpeg	99943	/uploads/engine-1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	5b1005e2-4d10-420b-944e-d3004197fe32
394866b3-9d94-4dee-8f7f-010b422b1d44	engine-2.jpg	engine-2.jpg	image/jpeg	43275	/uploads/engine-2.jpg	\N	\N	\N	f	1	f	2026-02-10 05:18:09.916	5b1005e2-4d10-420b-944e-d3004197fe32
87cf0b27-7127-4f1e-9114-fe3050821ebf	windshield_1.jpg	windshield_1.jpg	image/jpeg	1691807	/uploads/windshield_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	7096b2d0-b0d7-4865-9873-a8fcb65e882d
09e7902c-9360-44c6-8ca0-5153023617c2	parts-1.jpg	parts-1.jpg	image/jpeg	66336	/uploads/parts-1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	71fe5261-dfc4-4b5d-86c5-240f044d41eb
6f3f879f-65c3-4ba6-8ebb-dae293eb499e	apu_1.jpg	apu_1.jpg	image/jpeg	1747269	/uploads/apu_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	468a0cf0-d9cd-4936-9ba7-1329c81b7710
0c4e26c2-975f-444b-bc9c-b0d707c8b493	kingair_ws_used_1.jpg	kingair_ws_used_1.jpg	image/jpeg	5446187	/uploads/kingair_ws_used_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	7f6ca258-bf3a-4908-9da1-ec5b6d43e9b8
80f0aafb-8f89-49b3-9007-84b56443f9ed	kingair_ws_new_1.jpg	kingair_ws_new_1.jpg	image/jpeg	3261732	/uploads/kingair_ws_new_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	bd1d0846-c2cc-43ab-ada9-2664b9834571
f6e606ef-e38d-4c51-9b41-c949acebee56	poslight_1.jpg	poslight_1.jpg	image/jpeg	355593	/uploads/poslight_1.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	9deca4f2-49db-4116-ac97-2a7d25452f98
5b2b2778-edbb-45da-b272-91bafe50f353	poslight_2.jpg	poslight_2.jpg	image/jpeg	324497	/uploads/poslight_2.jpg	\N	\N	\N	f	1	f	2026-02-10 05:18:09.916	9deca4f2-49db-4116-ac97-2a7d25452f98
2fac80c1-2f8b-4c14-a3ee-8237486fc329	parts-2.jpg	parts-2.jpg	image/jpeg	48852	/uploads/parts-2.jpg	\N	\N	\N	t	0	f	2026-02-10 05:18:09.916	25a06c83-d98e-41be-ba36-18e11c8b7533
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listings (id, title, description, price, category, subcategory, condition, quantity, status, rejection_reason, flying411_listing_id, synced_at, view_count, created_at, updated_at, published_at, user_id) FROM stdin;
349e1b96-ab72-4bf1-a368-4d7e768dac12	1978 Beechcraft A36 Bonanza	Beautiful 1978 Beechcraft A36 Bonanza with 4,034 hours total time since new. Registration N4738M, Serial E-1258.\n\nEngine: 860 SMOH by Zephyr Aircraft Engines. Propeller: 605 SOH. Useful load: 1,461 lbs. Fresh annual in process, IFR checks due May 2026.\n\nAvionics: Aspen EFD1000 PFD with synthetic vision, Garmin 430W GPS, full IFR panel. Features include factory air conditioning, D'Shannon tip tanks (30 gal additional fuel, 80 gal total capacity), vortex generators, GAMI fuel injectors.\n\nExterior: Jet Glo Matterhorn white with Ming blue and silver accents. Interior: Luxurious beige executive leather seating. Hangar kept and shows beautifully.\n\nLocated in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.	334900.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	87	2026-02-09 23:14:47.195	2026-02-09 23:14:47.195	2025-12-15 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
61bc8584-bfba-49b3-8637-c5221862a464	1956 Cessna 180	Classic 1956 Cessna 180 taildragger with 4,969 hours total time. Registration N7603A, Serial 18032500. SALE PENDING.\n\nEngine: Continental O-470-RCS, 743 SMOH (S/N 133534-6-R). Propeller: 1,047 SOH. 60-amp alternator upgrade.\n\nAvionics: Dual King KX-155 Nav/Com, Garmin 296 GPS, King KR-86 ADF, King KN-64 DME, Collins AMR-350 Audio Panel. Electronics International Digital EGT and C-6 Digital CHT (6-position).\n\nPerformance: Flint Aero 12-gallon auxiliary fuel tanks (total 80-gal capacity), Madras Air "Super Tips" wing upgrades, flap and aileron gap seals, Tanis engine pre-heater.\n\nExterior: Beige with brown and blue accents, hangar-kept. Interior: Brown tweed fabric, good condition. Annual due October 2026.\n\nLocated in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.	139900.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	124	2026-02-09 23:14:47.2	2026-02-09 23:14:47.2	2025-11-20 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
b3f403e7-4028-4d2d-b80c-d9d2a4e99b4e	2002 Piper Seneca V	Low-time 2002 Piper Seneca V multi-engine with only 2,044 hours total time since new. Registration N220TG, Serial 3449265.\n\nEngines: Both at 368 SMOH. Prop 1: 389 SOH, Prop 2: 101 SOH. Useful load: 1,190 lbs. Fuel capacity: 128 gallons (122 usable).\n\nAvionics: S-TEC 55X autopilot, Aspen EFD-1000 Pro display, dual Garmin GTN-650 GPS, Avidyne Flight Max MFD. Full de-ice and known-ice protection.\n\nFactory air conditioning, leather interior with club seating, built-in oxygen system. Recent engine overhaul and propeller replacement completed August 2023. Annual due December 2026.\n\nLocated in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.	589900.00	Aircraft	Multi Engine Piston	Good	1	APPROVED	\N	\N	\N	203	2026-02-09 23:14:47.204	2026-02-09 23:14:47.204	2025-10-05 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
1c664712-37ee-450b-af74-b6689259e461	2005 Piper Saratoga II TC	2005 Piper Saratoga II TC with 2,979 hours total time. Registration N478MD, Serial 3257376.\n\nEngine: 805 SMOH. Propeller: Hartzell 3-blade, 805 SOH. Fuel capacity: 107 gallons.\n\nAvionics: S-TEC 55X autopilot, Avidyne FlightMax integrated glass panel (PFD/MFD), dual Avidyne IFD-440 GPS/COM/NAV with synthetic vision, ADS-B compliant transponder, WX-500 Stormscope, collision avoidance system.\n\nFactory air-conditioning, 6-place built-in oxygen system. Luxurious grey leather club seating, reupholstered rear seats (2020), adjustable crew seats with lumbar support, cabin reading lights.\n\nExterior: Snow white over green metallic with slate grey and silver accents. Hangar-kept and immaculate.\n\nLocated in Sturgis, Michigan. Annual due January 2026. IFR checks due December 2026.	0.01	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	156	2026-02-09 23:14:47.208	2026-02-09 23:14:47.208	2025-11-01 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
fc7f9453-7919-44e8-88f5-1262b993e239	2003 Piper Saratoga II TC	2003 Piper Saratoga II TC single engine piston aircraft. 1,926 hours total time since new.\n\nEngine: 369 SMOH. Well-maintained with modern avionics suite. Factory air conditioning, 6-place seating with oxygen system. Turbocharged for high-altitude performance.\n\nEquipped with advanced glass panel avionics, GPS navigation, and ADS-B compliant transponder. Full IFR capable with autopilot.\n\nLocated in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.	465000.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	98	2026-02-09 23:14:47.211	2026-02-09 23:14:47.211	2025-12-01 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
50a4483c-088c-4f30-b570-9957efeebd11	1999 Piper Saratoga II TC	1999 Piper Saratoga II TC with 2,760 hours total time. Turbocharged single engine piston.\n\nEngine: 770 SMOH. Full IFR-equipped with modern avionics upgrades. Factory air conditioning, leather interior, 6-place oxygen system.\n\nReliable cross-country performer with turbocharging for high-altitude operations. Well-maintained by Bartelt Aviation with comprehensive logbooks.\n\nLocated in Sturgis, Michigan.	525000.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	72	2026-02-09 23:14:47.213	2026-02-09 23:14:47.213	2025-11-15 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
257f6447-76bd-4ae0-9dd4-57e8f1170dfd	1976 Piper Cherokee 140/160	1976 Piper Cherokee 140/160 with 5,198 hours total time. Registration N9439K, Serial 28-7625180. Starting bid $25,000 via AirSpace Auctions.\n\nEngine: 1,381 SMOH. Propeller: 1,297 SNEW. Fresh annual and transponder certification completed.\n\nAvionics: Dual communication systems (Narco MK-12D, TKM MX-170), dual navigation with LOC/GS, IFR capable (not IFR certified). Full instrument panel with horizon, gauges, and autopilot-compatible equipment. Dual toe brakes.\n\nEasy handling, roomy seats, and low operating costs. Perfect for training, recreational flying, or short trips. Well cared for and suitable for both new and experienced pilots.\n\nAuction dates: March 18-25, 2026. Located in Fort Worth, Texas.	25000.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	312	2026-02-09 23:14:47.217	2026-02-09 23:14:47.217	2026-01-10 00:00:00	8fa70fa0-afb3-49b0-87fe-d64628e77cd5
69c96e1d-4c25-4515-acd6-c2e41d969835	1982 Piper Saratoga	1982 Piper Saratoga with 4,375 hours total time. Single engine piston, fixed gear.\n\nEngine: 580 FOH (Factory Overhaul). Modern avionics with GPS navigation and ADS-B compliance. Well-equipped for IFR operations.\n\nSpacious 6-place cabin with comfortable seating. Reliable performer for cross-country flying with good useful load. Complete logbooks and well-maintained.\n\nLocated in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.	189900.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	54	2026-02-09 23:14:47.219	2026-02-09 23:14:47.219	2025-12-20 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
4adb23a0-1219-455d-b61e-a5960dd9b74e	1979 Piper Arrow IV	1979 Piper Arrow IV retractable gear single engine piston. 7,197 hours total time since new.\n\nEngine: 747 SMOH. T-tail configuration with retractable landing gear. Well-equipped IFR platform with modern avionics upgrades.\n\nUpdated panel with GPS navigation, ADS-B compliant transponder, and autopilot. Reliable cross-country aircraft with good speed and efficiency.\n\nLocated in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.	152900.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	89	2026-02-09 23:14:47.222	2026-02-09 23:14:47.222	2025-11-25 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
e7c32f4f-b737-4df9-ad9c-700fd59ebd21	1978 Piper Arrow III	1978 Piper Arrow III retractable single engine piston. Registration N21870, Serial 28R-7837309. 8,753 hours total time.\n\nEngine: 528 SMOH by Custom Airmotive. Propeller: 528 SOH. Useful load: 996 lbs.\n\nAvionics: Piper Auto Control III Autopilot with heading tracking, Aspen Pro EFD-1000 PFD, Aspen Evolution 500 MFD, Avidyne IFD-440 WAAS GPS/Nav/Com, King KX-155 and KI-209 Nav, L3 Lynx NGT-9000 ADS-B Transponder, Garmin Aera 660 GPS, Insight G3 Engine Monitor.\n\nFeatures: Knots 2-U Wing Root Fairings, LED position and landing lights, Rosen sun visors, Cleveland wheels and brakes, GAMI fuel injectors, heated pitot.\n\nExterior: White with red/blue accents, new paint (2017), new windows and windshield. Annual due February 2026. IFR checks due June 2027.\n\nLocated in Texas. Seller: Bartelt Aviation, Inc.	145000.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	143	2026-02-09 23:14:47.224	2026-02-09 23:14:47.224	2025-10-15 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
4f7e724b-9583-4010-a4a1-ee37a25ca752	2008 Robinson R44 Raven II	2008 Robinson R44 Raven II piston helicopter. Serial 1366D. Approximately 1,550 hours total time as of February 2026.\n\nAstro Paint Scheme: Bronze exterior with gold trim. Interior: Tan leather with air conditioning.\n\nAvionics: Garmin 530 GPS/Com with CDI, Garmin GTX330 Mode S Transponder with ADS-B Out, King KY196A Com, NAT AA12S Audio Controller, Kannad 406 ELT. Artificial Horizon with slip skid indicator, 4 bubble windows, Bose wiring, pilot side avionics console.\n\nPartial 12-year inspection completed July 2020 at 1,014 hrs. New 15-year main rotor blades and tail rotor blades installed. New fuel bladders. Last annual February 2025. All ADs and SBs current through February 2026.\n\nLocated in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.	300000.00	Aircraft	Piston Helicopter	Good	1	APPROVED	\N	\N	\N	178	2026-02-09 23:14:47.226	2026-02-09 23:14:47.226	2025-12-05 00:00:00	21989637-6bc7-4090-9241-6420be90c87f
bf5afeb1-e594-4fab-a50e-51e5eade7a3a	2014 Robinson R66 Turbine	2014 Robinson R66 turbine helicopter. Serial 178C. 2,590 hours AFTT as of February 2026.\n\nField overhaul performed at factory-authorized service center in August 2022 (594 TSOH). Last annual/100-hour inspection October 2025. All ADs and SBs current through October 2025.\n\nEquipment: Air conditioning, HeliSAS autopilot (installed during overhaul), custom leather interior with five-point harness. Symmetrical horizontal stabilizer kit (uninstalled, included in sale). Ground handling wheels.\n\nAvionics: Aspen PFD 1000H Pro, Garmin GTR 225B Com, Garmin 750 GPS/Com/Nav, GTX 330ES transponder (ADS-B In/Out), Kannad 406 ELT.\n\nExterior: Black base with yellow trim. N-numbers and trim taped on.\n\nLocated in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.	900000.00	Aircraft	Turbine Helicopter	Overhauled	1	APPROVED	\N	\N	\N	267	2026-02-09 23:14:47.228	2026-02-09 23:14:47.228	2025-09-15 00:00:00	21989637-6bc7-4090-9241-6420be90c87f
99920bde-7cfd-4454-a2e9-31034dc576cc	2018 Robinson R44 Raven II	2018 Robinson R44 Raven II piston helicopter. 2,204 hours total time.\n\nLate model R44 Raven II in excellent condition with modern avionics and low time for year. Air conditioning equipped, leather interior.\n\nFull Garmin avionics suite with ADS-B compliance. All airworthiness directives and service bulletins current. Factory-maintained with complete logbooks.\n\nLocated in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.	600000.00	Aircraft	Piston Helicopter	Good	1	APPROVED	\N	\N	\N	195	2026-02-09 23:14:47.23	2026-02-09 23:14:47.23	2025-11-10 00:00:00	21989637-6bc7-4090-9241-6420be90c87f
a005783e-bc1f-4122-9ebd-b0f0240de81d	2006 Robinson R44 Raven II	2006 Robinson R44 Raven II piston helicopter. 1,681 hours total time.\n\nWell-maintained R44 Raven II with air conditioning and leather interior. Modern avionics with ADS-B compliance. Comprehensive maintenance history with all service bulletins current.\n\nIdeal for personal transportation, aerial photography, or flight training. Factory authorized dealer maintained.\n\nLocated in St. Augustine, Florida. Factory Authorized Dealer: Old City Helicopter Sales, LLC.	249000.00	Aircraft	Piston Helicopter	Good	1	APPROVED	\N	\N	\N	112	2026-02-09 23:14:47.231	2026-02-09 23:14:47.231	2025-12-10 00:00:00	21989637-6bc7-4090-9241-6420be90c87f
f93fe404-f7fb-42dc-95f3-58e56c6880b0	2021 Lockwood AirCam	2021 Lockwood AirCam multi-engine piston. Registration N813BH, Serial AC-282-3. Only 220 hours total time since new.\n\nDual engines: Both at 220 SNEW. Both props at 220 SNEW. Built for fun, safe flying, and amazing views with three inline seats, dual-engine configuration for single-engine safety, and flexible open or fully enclosed cabin options.\n\nAvionics: Dual Dynon Skyview HDX systems, Dynon AOA and independent engine displays, dual uAvionix AV-20 EFIS, PS Engineering PDA 360EX, Trig TN 70 ADS-B.\n\nFeatures: Upgraded tailwheel with shock absorption, 31" Goodyear backcountry tires, Berringer wheels, Black Hooker harness seat belts. Not IFR capable.\n\nStarting bid via AirSpace Auctions, February 25 - March 4, 2026. Located in Alpine, Wyoming.	160000.00	Aircraft	Multi Engine Piston	New	1	APPROVED	\N	\N	\N	445	2026-02-09 23:14:47.233	2026-02-09 23:14:47.233	2026-01-15 00:00:00	8fa70fa0-afb3-49b0-87fe-d64628e77cd5
46d5df25-178b-4bfb-a60d-a2d2e2c530d0	Lycoming IO-320 Series Reciprocating Engine	Lycoming IO-320 Series reciprocating engine, overhauled. 150 HP output.\n\nTotal Time: 4,200 hours. Cycles: 2,000. Hot Section: 2,000 hours. Year: 2004.\n\nOverhauled reciprocating engine suitable for a variety of light aircraft applications. The IO-320 series is one of Lycoming's most popular and reliable engine families, powering aircraft like the Cessna 172, Piper Cherokee, and Grumman Tiger.\n\nNo warranty. Contact seller for documentation and borescope reports.\n\nLocated in Nashville, Tennessee, United States.	32000.00	Engines	Reciprocating	Overhauled	1	APPROVED	\N	\N	\N	89	2026-02-09 23:14:47.236	2026-02-09 23:14:47.236	2026-01-05 00:00:00	b8aca56a-ed77-4614-8770-f19faf59435d
a97aca62-4b3e-44c2-a325-425051693c70	CFM56-7B Turbofan Engine	CFM International CFM56-7B high-bypass turbofan engine. As Removed condition.\n\nThrust: 27,300 lbf. Total Time: 1,233 hours. Cycles: 123. Hot Section: 1,223 hours.\n\nThe CFM56-7B is the exclusive powerplant for the Boeing 737 Next Generation family (737-600/700/800/900). This engine variant delivers outstanding reliability with the lowest fuel consumption in its class.\n\nAs Removed from operational aircraft. Suitable for overhaul, part-out, or return to service. Full records available upon request.\n\nLocated in Uşak, Turkey. International shipping available.	1233344.00	Engines	Jet Engine/Turbofan	As Removed	1	APPROVED	\N	\N	\N	341	2026-02-09 23:14:47.238	2026-02-09 23:14:47.238	2025-12-20 00:00:00	b8aca56a-ed77-4614-8770-f19faf59435d
25a06c83-d98e-41be-ba36-18e11c8b7533	R/H O/B FLAP - P/N 601R14501-2	Right-Hand Outboard Flap assembly. Part Number: 601R14501-2.\n\nCondition: Serviceable. Yellow Tag documentation. Suitable for various commercial aircraft applications.\n\nThis flap assembly has been inspected and certified serviceable with Yellow Tag documentation. Ready for immediate installation or as a rotable spare.\n\nContact seller for pricing, availability, and shipping options.	0.01	Parts	Flight Controls	Serviceable	1	APPROVED	\N	\N	\N	34	2026-02-09 23:14:47.242	2026-02-09 23:14:47.242	2026-01-20 00:00:00	be9774cb-ad4a-4e7d-b137-a6375ea29943
7096b2d0-b0d7-4865-9873-a8fcb65e882d	Aircraft Windshield L.H - P/N NF24016-415	Left-Hand Aircraft Windshield. Part Number: NF24016-415.\n\nCondition: Serviceable. No tag documentation.\n\nHigh-quality replacement windshield panel for left-hand installation. Serviceable condition, ready for installation. Meets all applicable FAA/EASA requirements.\n\n6 product photographs available. Contact seller for fitment verification and shipping arrangements.	32000.00	Parts	Windows & Windshields	Serviceable	1	APPROVED	\N	\N	\N	56	2026-02-09 23:14:47.244	2026-02-09 23:14:47.244	2026-01-18 00:00:00	be9774cb-ad4a-4e7d-b137-a6375ea29943
7f6ca258-bf3a-4908-9da1-ec5b6d43e9b8	King Air Windshield R.H (As Removed) - P/N 101-384025-22	Right-Hand Windshield for Beechcraft King Air. Part Number: 101-384025-22.\n\nCondition: As Removed. No tag documentation.\n\nWindshield panel removed from operational Beechcraft King Air aircraft. Suitable for overhaul/repair or as a core exchange unit. As Removed condition — buyer should inspect or have overhauled before installation.\n\n5 product photographs available showing current condition.	48000.00	Parts	Windows & Windshields	As Removed	1	APPROVED	\N	\N	\N	45	2026-02-09 23:14:47.248	2026-02-09 23:14:47.248	2026-01-10 00:00:00	be9774cb-ad4a-4e7d-b137-a6375ea29943
5b1005e2-4d10-420b-944e-d3004197fe32	Pratt & Whitney PT6A-34 Turboprop Engine	Pratt & Whitney Canada PT6A-34 turboprop engine. 680 SHP. Overhauled condition.\n\nTotal Time: 12,450 hours. Cycles: 8,200. Time Since Overhaul: 2,100 hours.\n\nThe PT6A-34 powers aircraft such as the Beechcraft King Air C90 and Piper Cheyenne. One of the most widely used turboprop engines in aviation history with an outstanding reliability record.\n\nRecently removed for upgrade, full records available. Suitable for return to service after inspection.	185000.00	Engines	Turboprop	Overhauled	1	DRAFT	\N	\N	\N	0	2026-02-09 23:14:47.252	2026-02-09 23:14:47.252	\N	b8aca56a-ed77-4614-8770-f19faf59435d
71fe5261-dfc4-4b5d-86c5-240f044d41eb	Collins Pro Line 21 Avionics Suite	Complete Collins Pro Line 21 integrated avionics suite removed from Beechcraft King Air 350.\n\nIncludes: 2x FMS-3000, 2x CDU-3000, 3x DU-875 displays, ADC-3000, AHC-3000, DME-3000, and all associated wiring harnesses and connectors.\n\nAs Removed condition with full removal records. Suitable for installation or as spares. All units have current 8130-3 tags.	125000.00	Parts	Avionics	As Removed	1	PENDING_APPROVAL	\N	\N	\N	0	2026-02-09 23:14:47.254	2026-02-09 23:14:47.254	\N	be9774cb-ad4a-4e7d-b137-a6375ea29943
658347c7-f506-4e56-8cd4-4ee6147ddab5	CFM56-3C1 Turbofan Engine	CFM International CFM56-3C1 turbofan engine in serviceable condition. Hard to find variant — will go fast!\n\nThrust: 23,515 lbf. Total Time: 59,928 hours. Cycles: 3,797. Hot Section: 3,797 hours. Year: 2015.\n\nThe CFM56-3C1 is the powerplant for the Boeing 737 Classic series (737-300/400/500). This is the highest-thrust variant in the CFM56-3 family, delivering 23,500 pounds of thrust.\n\nServiceable condition with documentation available (CFM56-3C1 ENGINE.pdf). Full borescope and records package available to qualified buyers.\n\nLocated in Frankfurt am Main, Germany. Seller: Hangar 24 (sales@hangar-24.com).	1200000.00	Engines	Jet Engine/Turbofan	Serviceable	1	APPROVED	\N	\N	\N	290	2026-02-09 23:14:47.24	2026-02-10 05:12:54.412	2025-11-30 00:00:00	b8aca56a-ed77-4614-8770-f19faf59435d
bd1d0846-c2cc-43ab-ada9-2664b9834571	King Air Windshield R.H (Factory New) - P/N 101-384025-24	Right-Hand Windshield for Beechcraft King Air. Part Number: 101-384025-24.\n\nCondition: Factory New. No tag — direct from manufacturer.\n\nBrand new, factory-fresh windshield panel for Beechcraft King Air series aircraft (right-hand installation). Never installed, pristine condition with full manufacturer traceability.\n\n4 product photographs available. Fits multiple King Air variants — contact seller to verify specific aircraft compatibility.	90000.00	Parts	Windows & Windshields	Factory New	1	APPROVED	\N	\N	\N	79	2026-02-09 23:14:47.247	2026-02-10 05:13:08.235	2026-01-12 00:00:00	be9774cb-ad4a-4e7d-b137-a6375ea29943
992cb495-16ec-4da0-a5c7-0f42af6289d8	1980 Piper Turbo Saratoga	1980 Piper Turbo Saratoga with 3,395 hours total time since new. Registration N8279Y, Serial 32-8024052. SALE PENDING.\n\nEngine: 520 SMOH. Propeller: 1,005 SOH. Useful load: 1,276 lbs. Fixed gear model.\n\nAvionics: Avidyne IFD-540 WAAS GPS Navigator, L3 Lynx NGT-9000D ADS-B Compliant Transponder. Speed modifications installed with 3-blade propeller.\n\nFactory air-conditioning, luxurious shearling walnut leather seating. Hangar-kept and well-maintained.\n\nAnnual due March 2026. IFR checks due October 2027. ELT battery due October 2029.\n\nLocated in Sturgis, Michigan. Seller: Bartelt Aviation, Inc.	199500.00	Aircraft	Single Engine Piston	Good	1	APPROVED	\N	\N	\N	66	2026-02-09 23:14:47.215	2026-02-10 05:13:19.101	2025-10-20 00:00:00	0c2ea1ff-cdc9-4dcb-aad7-23f57171d882
9deca4f2-49db-4116-ac97-2a7d25452f98	Position Light (RED) L.H - P/N 30-2900-1	Left-Hand Red Position Light (Navigation Light). Part Number: 30-2900-1.\n\nCondition: Overhauled. Certified with 8130/EASA Form 1 documentation.\n\nFully overhauled navigation position light with FAA 8130-3 Airworthiness Approval Tag and EASA Form 1 release certificate. Dual-release documentation for worldwide installation.\n\nReady for immediate shipment and installation. 2 product photographs available.	6000.00	Parts	Lighting	Overhauled	1	APPROVED	\N	\N	\N	42	2026-02-09 23:14:47.245	2026-02-10 05:17:47.22	2026-01-15 00:00:00	b8aca56a-ed77-4614-8770-f19faf59435d
468a0cf0-d9cd-4936-9ba7-1329c81b7710	Honeywell GTCP85 APU - P/N GTCP85-291	Honeywell GTCP85-291 Auxiliary Power Unit (APU). Part Number: GTCP85-291.\n\nCondition: As Removed. No tag documentation.\n\nThe Honeywell GTCP85 series APU is used on a wide range of commercial and military aircraft including the Boeing 737 Classic, Boeing 727, DC-9/MD-80 series, and various military platforms. This unit was removed from an operational aircraft.\n\nAs Removed condition — suitable for overhaul, part-out, or test/inspection for return to service. Contact seller for full removal records and operational history.	250000.00	Parts	APU	As Removed	1	APPROVED	\N	\N	\N	168	2026-02-09 23:14:47.25	2026-02-10 05:18:42.712	2025-12-28 00:00:00	b8aca56a-ed77-4614-8770-f19faf59435d
\.


--
-- Data for Name: parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts (id, part_number, manufacturer, description, category, model, alternates, created_at, updated_at) FROM stdin;
99045c65-0bfb-452f-ad10-3e362dfdb56a	601R14501-2	OEM	Right-Hand Outboard Flap Assembly for commercial aircraft	Flight Controls	Various	{601R14501-1}	2026-02-09 23:14:47.258	2026-02-09 23:14:47.258
2bbf51df-9e17-4021-a300-b1093694cac7	NF24016-415	PPG Aerospace	Left-Hand Aircraft Windshield Panel	Windows & Windshields	Various	{NF24016-416}	2026-02-09 23:14:47.264	2026-02-09 23:14:47.264
ad3edacc-2a34-458a-a5aa-cbda36eaf16b	30-2900-1	Whelen Engineering	Position Light (RED) Left-Hand Navigation Light	Lighting	Various	{30-2900-2}	2026-02-09 23:14:47.269	2026-02-09 23:14:47.269
3b9e9569-c918-411e-836e-2c9b7dce7ea2	101-384025-24	Beechcraft / Textron Aviation	Right-Hand Windshield for King Air Series Aircraft	Windows & Windshields	King Air	{101-384025-22,101-384025-26}	2026-02-09 23:14:47.275	2026-02-09 23:14:47.275
bd74ed54-21ad-484a-ba6a-9f77d3edeb30	101-384025-22	Beechcraft / Textron Aviation	Right-Hand Windshield for King Air Series Aircraft (alternate)	Windows & Windshields	King Air	{101-384025-24}	2026-02-09 23:14:47.279	2026-02-09 23:14:47.279
a2356cb9-3972-42e5-98e3-0ea550f10d6c	GTCP85-291	Honeywell Aerospace	GTCP85 Auxiliary Power Unit for Boeing 737/727, DC-9/MD-80 series	APU	GTCP85	{GTCP85-98D,GTCP85-129}	2026-02-09 23:14:47.283	2026-02-09 23:14:47.283
9b110585-72c9-4db7-9b8e-86893f4c0845	CFM56-7B	CFM International	CFM56-7B High-Bypass Turbofan Engine for Boeing 737NG	Engines	CFM56-7B	{CFM56-7B24,CFM56-7B26,CFM56-7B27}	2026-02-09 23:14:47.29	2026-02-09 23:14:47.29
b80024a9-03d7-4bca-ab39-729a31cb0be7	CFM56-3C1	CFM International	CFM56-3C1 Turbofan Engine for Boeing 737 Classic	Engines	CFM56-3C1	{CFM56-3B1,CFM56-3B2}	2026-02-09 23:14:47.294	2026-02-09 23:14:47.294
bf9e769b-d882-40aa-9c47-142e58d152ac	IO-320	Lycoming	IO-320 Series Reciprocating Engine, 150 HP	Engines	IO-320	{IO-320-B1A,IO-320-D1A,IO-320-E2A}	2026-02-09 23:14:47.299	2026-02-09 23:14:47.299
9da15bb9-b51e-49bf-b919-e023eaf175b0	PT6A-34	Pratt & Whitney Canada	PT6A-34 Turboprop Engine, 680 SHP, for King Air C90 / Piper Cheyenne	Engines	PT6A-34	{PT6A-36,PT6A-42}	2026-02-09 23:14:47.304	2026-02-09 23:14:47.304
\.


--
-- Data for Name: price_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_history (id, condition, price, source, recorded_at, part_id) FROM stdin;
7cc39348-b960-4aa1-a256-a00fefc26b88	Serviceable	15000.00	marketplace	2026-02-09 23:14:47.259	99045c65-0bfb-452f-ad10-3e362dfdb56a
ad0ca3d6-7c83-4622-b855-be725e805887	As Removed	8500.00	marketplace	2026-02-09 23:14:47.262	99045c65-0bfb-452f-ad10-3e362dfdb56a
f520bc71-3274-4fd7-99fa-f4ad19b6469b	Overhauled	22000.00	marketplace	2026-02-09 23:14:47.263	99045c65-0bfb-452f-ad10-3e362dfdb56a
30cf1e14-6444-41b1-a0ef-0c03967aed5b	Serviceable	32000.00	marketplace	2026-02-09 23:14:47.266	2bbf51df-9e17-4021-a300-b1093694cac7
e6e67a64-4282-46bd-8cf4-64898f1a4517	Factory New	45000.00	marketplace	2026-02-09 23:14:47.267	2bbf51df-9e17-4021-a300-b1093694cac7
7c97a2a3-24a6-4ea7-a474-ab414b9b9019	Overhauled	6000.00	marketplace	2026-02-09 23:14:47.27	ad3edacc-2a34-458a-a5aa-cbda36eaf16b
996bd41f-f817-46cd-84f7-bd7362421266	Factory New	9500.00	marketplace	2026-02-09 23:14:47.272	ad3edacc-2a34-458a-a5aa-cbda36eaf16b
63f7ffac-4f85-4292-af2c-8b69c7a71803	Serviceable	4800.00	marketplace	2026-02-09 23:14:47.274	ad3edacc-2a34-458a-a5aa-cbda36eaf16b
c84fa987-6ae5-4bf1-b6a9-fb4cec9da0bd	Factory New	90000.00	marketplace	2026-02-09 23:14:47.276	3b9e9569-c918-411e-836e-2c9b7dce7ea2
c19d329e-c850-4187-a8e9-36324a564880	Serviceable	55000.00	marketplace	2026-02-09 23:14:47.278	3b9e9569-c918-411e-836e-2c9b7dce7ea2
ad0ef3a0-3ccc-4788-9af5-d1b38cc3b6b2	As Removed	48000.00	marketplace	2026-02-09 23:14:47.28	bd74ed54-21ad-484a-ba6a-9f77d3edeb30
daf281c3-0a74-495b-a3aa-a6f746b11483	Overhauled	65000.00	marketplace	2026-02-09 23:14:47.281	bd74ed54-21ad-484a-ba6a-9f77d3edeb30
bf88c6cd-2737-46b2-b9da-6e52c0da0dfa	As Removed	250000.00	marketplace	2026-02-09 23:14:47.285	a2356cb9-3972-42e5-98e3-0ea550f10d6c
9d7ef99a-580a-4300-9a54-2351af3ed88d	Overhauled	425000.00	marketplace	2026-02-09 23:14:47.287	a2356cb9-3972-42e5-98e3-0ea550f10d6c
7fd487a1-43e9-4613-8a56-1dde901b496e	Serviceable	350000.00	marketplace	2026-02-09 23:14:47.288	a2356cb9-3972-42e5-98e3-0ea550f10d6c
66fb5db0-4f34-488d-ac1b-7c6e6103fc1d	As Removed	1233344.00	marketplace	2026-02-09 23:14:47.291	9b110585-72c9-4db7-9b8e-86893f4c0845
8a8aa2e0-8ac7-486e-b142-cd8e55fa8228	Overhauled	3500000.00	marketplace	2026-02-09 23:14:47.292	9b110585-72c9-4db7-9b8e-86893f4c0845
76e02016-b8e4-46e1-a38f-203fdb2671a4	Serviceable	2800000.00	marketplace	2026-02-09 23:14:47.293	9b110585-72c9-4db7-9b8e-86893f4c0845
c03f00f8-6de4-4a7c-b444-3429032729da	Serviceable	1200000.00	marketplace	2026-02-09 23:14:47.296	b80024a9-03d7-4bca-ab39-729a31cb0be7
4e10bb8d-1588-42ca-b599-7c86ff2c98a6	As Removed	750000.00	marketplace	2026-02-09 23:14:47.297	b80024a9-03d7-4bca-ab39-729a31cb0be7
7c2c3466-9835-4ff5-a0a8-c3a873c53725	Overhauled	2200000.00	marketplace	2026-02-09 23:14:47.298	b80024a9-03d7-4bca-ab39-729a31cb0be7
47ced764-42f4-4b44-bc42-0117bcedd4f7	Overhauled	32000.00	marketplace	2026-02-09 23:14:47.3	bf9e769b-d882-40aa-9c47-142e58d152ac
12145e65-e570-4e74-981f-804d501c94e7	Factory New	55000.00	marketplace	2026-02-09 23:14:47.302	bf9e769b-d882-40aa-9c47-142e58d152ac
9af524bd-8ece-47f7-9dbe-ee5b46526588	As Removed	18000.00	marketplace	2026-02-09 23:14:47.303	bf9e769b-d882-40aa-9c47-142e58d152ac
ca4be79b-32ba-4d15-b966-1a893cb85440	Overhauled	185000.00	marketplace	2026-02-09 23:14:47.306	9da15bb9-b51e-49bf-b919-e023eaf175b0
8d67138d-a49c-4387-895e-ee46e1ddb930	Serviceable	145000.00	marketplace	2026-02-09 23:14:47.307	9da15bb9-b51e-49bf-b919-e023eaf175b0
0f8542b1-505e-4576-acea-9d95ff48205a	As Removed	95000.00	marketplace	2026-02-09 23:14:47.308	9da15bb9-b51e-49bf-b919-e023eaf175b0
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, comment, action, created_at, listing_id, reviewer_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, password_hash, role, is_active, email_verified, created_at, updated_at, last_login) FROM stdin;
803572a4-1c1c-490f-994f-3e96952b4287	admin@flying411.com	admin	$2a$10$kGGexTKzuODwEBQ9RSLwR.c8MVRnDTFPF5TOQeuChvVLiMeOIHKce	ADMIN	t	t	2026-02-09 23:14:46.757	2026-02-09 23:14:46.757	\N
0c2ea1ff-cdc9-4dcb-aad7-23f57171d882	kelly@barteltaviation.com	barteltaviation	$2a$10$HfYisnal7GutyHn3tl48R.Y5fTtNN373sE6i.xlI3bgT8YzHnzvcS	USER	t	t	2026-02-09 23:14:46.854	2026-02-09 23:14:46.854	\N
b8aca56a-ed77-4614-8770-f19faf59435d	sales@hangar-24.com	hangar24	$2a$10$bA3exwPBE7VwcolKpwARjOqNEtaXs0RGVhqn2Uwf1Ksoe3zpeBnF6	USER	t	t	2026-02-09 23:14:46.944	2026-02-09 23:14:46.944	\N
21989637-6bc7-4090-9241-6420be90c87f	andres@r44sales.com	oldcityheli	$2a$10$u1iIO/Q67HdQPdS9m55ToeH9Ycd8sHl7CdE.gEspOaHIoR4IkxQXu	USER	t	t	2026-02-09 23:14:47.023	2026-02-09 23:14:47.023	\N
8fa70fa0-afb3-49b0-87fe-d64628e77cd5	juleigh@airspaceauctions.com	airspaceauctions	$2a$10$lewxkjry8DGzHiokawpgGOpcaRuMbz7eHNycckRaGgCjKl9IzXQ2i	USER	t	t	2026-02-09 23:14:47.107	2026-02-09 23:14:47.107	\N
be9774cb-ad4a-4e7d-b137-a6375ea29943	demo@flying411.com	demo	$2a$10$2sDBFT/LQgzYlnbU7t5bieMIwZB8/8yH5yEjWK8rvti6ivsHzepPC	USER	t	t	2026-02-09 23:14:47.186	2026-02-09 23:14:47.186	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: listing_images listing_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_images
    ADD CONSTRAINT listing_images_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: parts parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_pkey PRIMARY KEY (id);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_admin_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_admin_id_idx ON public.audit_logs USING btree (admin_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_entity_type_idx ON public.audit_logs USING btree (entity_type);


--
-- Name: listing_images_listing_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_images_listing_id_idx ON public.listing_images USING btree (listing_id);


--
-- Name: listings_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listings_category_idx ON public.listings USING btree (category);


--
-- Name: listings_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listings_created_at_idx ON public.listings USING btree (created_at);


--
-- Name: listings_flying411_listing_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listings_flying411_listing_id_idx ON public.listings USING btree (flying411_listing_id);


--
-- Name: listings_flying411_listing_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX listings_flying411_listing_id_key ON public.listings USING btree (flying411_listing_id);


--
-- Name: listings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listings_status_idx ON public.listings USING btree (status);


--
-- Name: listings_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listings_user_id_idx ON public.listings USING btree (user_id);


--
-- Name: parts_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parts_category_idx ON public.parts USING btree (category);


--
-- Name: parts_manufacturer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parts_manufacturer_idx ON public.parts USING btree (manufacturer);


--
-- Name: parts_part_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parts_part_number_idx ON public.parts USING btree (part_number);


--
-- Name: parts_part_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX parts_part_number_key ON public.parts USING btree (part_number);


--
-- Name: price_history_condition_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_history_condition_idx ON public.price_history USING btree (condition);


--
-- Name: price_history_part_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_history_part_id_idx ON public.price_history USING btree (part_id);


--
-- Name: reviews_listing_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_listing_id_idx ON public.reviews USING btree (listing_id);


--
-- Name: reviews_reviewer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_reviewer_id_idx ON public.reviews USING btree (reviewer_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_username_idx ON public.users USING btree (username);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: listing_images listing_images_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_images
    ADD CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: listings listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price_history price_history_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict l3tB0B4JM4jlRbfFfbx0KC2TiKaTIbzEXitrWrdPM3jyh2OUCgmKTTSBbVoqYTx


--
-- PostgreSQL database dump
--

\restrict 6heFnZLUwGgy2Xn1Wqn8ltx8fTRtaEfojDIvETDoetVut0UiyPS0jr54HXb1Vn1

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_access_requests_request_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_access_requests_request_type AS ENUM (
    'view_records',
    'add_prescription',
    'view_specific_record',
    'emergency_access'
);


ALTER TYPE public.enum_access_requests_request_type OWNER TO postgres;

--
-- Name: enum_access_requests_scope; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_access_requests_scope AS ENUM (
    'all_records',
    'specific_records',
    'limited_time',
    'read_only'
);


ALTER TYPE public.enum_access_requests_scope OWNER TO postgres;

--
-- Name: enum_access_requests_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_access_requests_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired',
    'cancelled'
);


ALTER TYPE public.enum_access_requests_status OWNER TO postgres;

--
-- Name: enum_access_requests_urgency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_access_requests_urgency AS ENUM (
    'routine',
    'urgent',
    'emergency'
);


ALTER TYPE public.enum_access_requests_urgency OWNER TO postgres;

--
-- Name: enum_audit_logs_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_audit_logs_action AS ENUM (
    'login',
    'logout',
    'password_change',
    'profile_update',
    'user_registration',
    'user_deleted',
    'record_upload',
    'record_view',
    'record_edit',
    'record_delete',
    'access_request',
    'access_granted',
    'access_denied',
    'otp_sent',
    'otp_verified',
    'otp_failed',
    'file_download',
    'file_upload',
    'report_download',
    'search_performed',
    'export_data',
    'admin_action',
    'system_event',
    'viewed_approved_record',
    'viewed_attachment'
);


ALTER TYPE public.enum_audit_logs_action OWNER TO postgres;

--
-- Name: enum_audit_logs_outcome; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_audit_logs_outcome AS ENUM (
    'success',
    'failure',
    'partial',
    'pending'
);


ALTER TYPE public.enum_audit_logs_outcome OWNER TO postgres;

--
-- Name: enum_audit_logs_resource_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_audit_logs_resource_type AS ENUM (
    'user',
    'medical_record',
    'access_request',
    'file',
    'system',
    'otp',
    'audit_log'
);


ALTER TYPE public.enum_audit_logs_resource_type OWNER TO postgres;

--
-- Name: enum_audit_logs_severity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_audit_logs_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.enum_audit_logs_severity OWNER TO postgres;

--
-- Name: enum_medical_records_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_medical_records_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.enum_medical_records_priority OWNER TO postgres;

--
-- Name: enum_medical_records_record_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_medical_records_record_type AS ENUM (
    'lab_report',
    'prescription',
    'medical_note',
    'scan_result',
    'vaccination_record',
    'allergy_info',
    'medication_history',
    'surgery_record',
    'dental_record',
    'other'
);


ALTER TYPE public.enum_medical_records_record_type OWNER TO postgres;

--
-- Name: enum_medical_records_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_medical_records_status AS ENUM (
    'draft',
    'active',
    'archived',
    'deleted'
);


ALTER TYPE public.enum_medical_records_status OWNER TO postgres;

--
-- Name: enum_users_gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_gender AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);


ALTER TYPE public.enum_users_gender OWNER TO postgres;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_role AS ENUM (
    'patient',
    'doctor',
    'admin'
);


ALTER TYPE public.enum_users_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_requests (
    id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    request_type public.enum_access_requests_request_type DEFAULT 'view_records'::public.enum_access_requests_request_type NOT NULL,
    status public.enum_access_requests_status DEFAULT 'pending'::public.enum_access_requests_status NOT NULL,
    otp_code character varying(6) NOT NULL,
    otp_expiry timestamp with time zone NOT NULL,
    otp_attempts integer DEFAULT 0,
    max_otp_attempts integer DEFAULT 3,
    access_granted_at timestamp with time zone,
    access_expires_at timestamp with time zone,
    access_duration integer DEFAULT 60,
    reason text,
    urgency public.enum_access_requests_urgency DEFAULT 'routine'::public.enum_access_requests_urgency,
    specific_record_ids uuid[] DEFAULT ARRAY[]::uuid[],
    scope public.enum_access_requests_scope DEFAULT 'all_records'::public.enum_access_requests_scope,
    patient_notes text,
    doctor_notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.access_requests OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    target_user_id uuid,
    action public.enum_audit_logs_action NOT NULL,
    resource_type public.enum_audit_logs_resource_type NOT NULL,
    resource_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(255),
    user_agent text,
    session_id character varying(255),
    location jsonb,
    severity public.enum_audit_logs_severity DEFAULT 'low'::public.enum_audit_logs_severity,
    outcome public.enum_audit_logs_outcome DEFAULT 'success'::public.enum_audit_logs_outcome,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    "timestamp" timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_records (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid,
    record_type public.enum_medical_records_record_type NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_path character varying(255),
    file_name character varying(255),
    file_size integer,
    file_type character varying(255),
    encrypted_data text,
    encryption_key character varying(255),
    record_date timestamp with time zone NOT NULL,
    expiry_date timestamp with time zone,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT false,
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    metadata jsonb DEFAULT '{}'::jsonb,
    status public.enum_medical_records_status DEFAULT 'active'::public.enum_medical_records_status,
    priority public.enum_medical_records_priority DEFAULT 'medium'::public.enum_medical_records_priority,
    location character varying(255),
    department character varying(255),
    cost numeric(10,2),
    insurance_info jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.medical_records OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.enum_users_role DEFAULT 'patient'::public.enum_users_role NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    phone_number character varying(255),
    date_of_birth date,
    gender public.enum_users_gender,
    address text,
    emergency_contact jsonb,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    last_login_at timestamp with time zone,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    profile_picture character varying(255),
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    specialization character varying(255),
    license_number character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: access_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.access_requests (id, doctor_id, patient_id, request_type, status, otp_code, otp_expiry, otp_attempts, max_otp_attempts, access_granted_at, access_expires_at, access_duration, reason, urgency, specific_record_ids, scope, patient_notes, doctor_notes, metadata, is_active, created_at, updated_at, deleted_at) FROM stdin;
64158c97-c08b-4ffd-b919-4c2d21025333	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	view_records	expired	446655	2025-08-31 17:47:11.531+05:30	0	3	\N	\N	60	Routine checkup	routine	{}	all_records	\N	\N	{}	f	2025-08-31 17:37:11.531+05:30	2025-08-31 17:47:17.346+05:30	\N
a953c218-f7aa-4c9f-a3ac-8d4e7a3b1650	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	view_records	expired	440703	2025-08-31 17:48:16.956+05:30	0	3	\N	\N	60	Routine checkup	routine	{}	all_records	\N	\N	{}	f	2025-08-31 17:38:16.956+05:30	2025-08-31 17:57:10.399+05:30	\N
0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	view_records	approved	429458	2025-08-31 18:58:49.074+05:30	0	3	2025-08-31 18:50:04.302+05:30	2025-09-01 18:50:04.302+05:30	60	Routine checkup	routine	{}	all_records	\N	\N	{}	t	2025-08-31 18:48:49.076+05:30	2025-08-31 18:50:04.305+05:30	\N
0378a4c5-10d4-4a61-95ce-63c76e3abcaf	0fdbb5be-9043-493e-a0c0-0129e4855098	ed677398-a24a-40a5-b132-4efa181f8821	view_records	expired	491148	2025-09-01 13:04:31.123+05:30	0	3	\N	\N	60	Routine checkup	routine	{}	all_records	\N	\N	{}	f	2025-09-01 12:54:31.124+05:30	2025-09-01 13:08:55.585+05:30	\N
f095a0c1-44f6-469a-8d1d-f3855228579e	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	12651c11-529c-472c-9a17-4d2102115425	view_records	approved	132821	2025-09-01 15:57:21.807+05:30	0	3	2025-09-01 15:49:35.624+05:30	2025-09-02 15:49:35.624+05:30	60	Routine checkup	routine	{}	all_records	\N	\N	{}	t	2025-09-01 15:47:21.809+05:30	2025-09-01 15:49:35.625+05:30	\N
8dde92a3-809d-484b-a469-d720f877f199	0fdbb5be-9043-493e-a0c0-0129e4855098	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	view_records	denied	486041	2025-09-01 22:02:29.756+05:30	0	3	\N	\N	60	Routine checkup	routine	{}	all_records	Access denied by patient	\N	{}	t	2025-09-01 21:52:29.759+05:30	2025-09-01 21:53:42.35+05:30	\N
50818141-3b3d-4c59-b72d-023716a4d74a	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	view_records	denied	684456	2025-09-01 22:17:27.819+05:30	0	3	\N	\N	60	Access request for blood report	routine	{}	all_records	Access denied by patient	\N	{}	t	2025-09-01 22:07:27.821+05:30	2025-09-01 22:09:55.105+05:30	\N
2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	view_records	approved	698469	2025-09-01 22:54:47.083+05:30	0	3	2025-09-01 22:54:27.89+05:30	2025-09-02 22:54:27.89+05:30	60	Access request for blood report	routine	{}	all_records	\N	\N	{}	t	2025-09-01 22:44:47.084+05:30	2025-09-01 22:54:27.892+05:30	\N
a02548cb-e72d-438e-baae-dfbdaf75be69	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	view_records	expired	604778	2025-09-04 03:26:42.941+05:30	0	3	\N	\N	60	to review the your record	routine	{}	all_records	\N	\N	{}	f	2025-09-04 03:16:42.942+05:30	2025-09-04 03:28:15.819+05:30	\N
29a33cd8-bab9-47ea-8b28-bc20f4b97e15	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	view_records	approved	390116	2025-09-04 04:39:25.244+05:30	0	3	2025-09-04 04:30:32.344+05:30	2025-09-05 04:30:32.344+05:30	60	it is important for your life	routine	{}	all_records	\N	\N	{}	t	2025-09-04 04:29:25.255+05:30	2025-09-04 04:30:32.345+05:30	\N
42640c5c-6ef2-47d7-8e76-7a79758868b3	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	view_records	approved	754567	2025-09-04 04:54:58.043+05:30	0	3	2025-09-04 04:48:16.373+05:30	2025-09-05 04:48:16.373+05:30	60	follow for more	routine	{}	all_records	\N	\N	{}	t	2025-09-04 04:44:58.044+05:30	2025-09-04 04:48:16.378+05:30	\N
654dfb1d-4dfa-4787-a052-94603acc9222	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	view_records	denied	753973	2025-09-15 16:02:52.862+05:30	0	3	\N	\N	60	i want to access this	routine	{}	all_records	Access denied by patient	\N	{}	t	2025-09-15 15:52:52.863+05:30	2025-09-15 15:54:20.107+05:30	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, target_user_id, action, resource_type, resource_id, details, ip_address, user_agent, session_id, location, severity, outcome, error_message, metadata, "timestamp", created_at, updated_at, deleted_at) FROM stdin;
69f3e012-6c39-4edd-af42-01b3e3afa513	12651c11-529c-472c-9a17-4d2102115425	\N	user_registration	system	\N	{"role": "patient", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 00:43:15.828+05:30	2025-08-26 00:43:15.829+05:30	2025-08-26 00:43:15.829+05:30	\N
b6fc00d9-9405-454b-b8e9-e6b59f0ab7dc	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	user_registration	system	\N	{"role": "patient", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 19:32:39.09+05:30	2025-08-26 19:32:39.093+05:30	2025-08-26 19:32:39.093+05:30	\N
b5b5c822-0aae-4dd7-baee-ac1be78cc53b	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	login	user	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ilX0ahK1Cwqhk3gM_mVzFKazbjHDOaGc	\N	low	success	\N	{}	2025-08-26 19:42:36.656+05:30	2025-08-26 19:42:36.657+05:30	2025-08-26 19:42:36.657+05:30	\N
fb5c6712-abe4-464c-8a4c-eaeca5cf2e24	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	login	user	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	oyAuFKoinTNV-0y0hpuunpSh5lB-AD3X	\N	low	success	\N	{}	2025-08-26 19:43:25.115+05:30	2025-08-26 19:43:25.115+05:30	2025-08-26 19:43:25.115+05:30	\N
81b86196-3741-433e-b983-33dbb8c989da	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	login	user	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	LM2gcg5nWYifMENXln_JuX2883MPexr7	\N	low	success	\N	{}	2025-08-26 19:50:51.175+05:30	2025-08-26 19:50:51.176+05:30	2025-08-26 19:50:51.176+05:30	\N
934e09be-bcc0-442e-b052-df5da7362fa2	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "mUa2zrXvODTMU9JelmvNWkPoHBfnvebx"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 19:51:31.827+05:30	2025-08-26 19:51:31.827+05:30	2025-08-26 19:51:31.827+05:30	\N
eb8933cf-bc3a-469b-98f3-d6bfcd1c4121	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	user_registration	system	\N	{"role": "doctor", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 19:53:35.926+05:30	2025-08-26 19:53:35.926+05:30	2025-08-26 19:53:35.926+05:30	\N
75ad7fda-0290-4894-adea-88795603676a	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	NJwX5-GgyPNVyA6fieNWn1H3BCgF6J9S	\N	low	success	\N	{}	2025-08-26 19:54:05.814+05:30	2025-08-26 19:54:05.814+05:30	2025-08-26 19:54:05.814+05:30	\N
8d1117c6-e11c-46b6-b9f7-ada9cea31b6b	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	EubyJoK_nMcErWqXOOaxtf3pkYUK1400	\N	low	success	\N	{}	2025-08-26 19:59:08.681+05:30	2025-08-26 19:59:08.682+05:30	2025-08-26 19:59:08.682+05:30	\N
a95fe303-67ab-4486-926a-0b0b9da23110	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	uegAAKFmORorAN2AxwbY4PQv02j_YJPq	\N	medium	failure	\N	{}	2025-08-26 20:08:10.387+05:30	2025-08-26 20:08:10.387+05:30	2025-08-26 20:08:10.387+05:30	\N
0de1901a-e19f-4ec9-b6ee-ac5358a43b6e	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	LyMVZotR87lF-bShCAxnt2sEX3VrLg7k	\N	low	success	\N	{}	2025-08-26 20:08:21.183+05:30	2025-08-26 20:08:21.184+05:30	2025-08-26 20:08:21.184+05:30	\N
322f15f5-0847-458b-b139-084e0dcb2b10	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "Ymyaa_BmNRJRmCx5gvay8moFjT158mOw"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 20:09:01.789+05:30	2025-08-26 20:09:01.789+05:30	2025-08-26 20:09:01.789+05:30	\N
142fb33a-72be-46ff-bdd1-5a2f95d361d2	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	login	user	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	HQa9zQfkdrflo1oaJcZrA_BkD5xOHOiB	\N	low	success	\N	{}	2025-08-26 20:09:26.011+05:30	2025-08-26 20:09:26.012+05:30	2025-08-26 20:09:26.012+05:30	\N
62051cc7-ee92-4fb0-b471-171b2e381d71	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	login	user	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	_xa2_xklBeBwj1lcDfxAYSjNzqcZxzcn	\N	low	success	\N	{}	2025-08-26 20:09:53.21+05:30	2025-08-26 20:09:53.211+05:30	2025-08-26 20:09:53.211+05:30	\N
7ac5a853-118e-44a2-8b64-5e5174a4cadf	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	fwG16i11uqe1DeoYrpWcTIO5hfl8PRSl	\N	low	success	\N	{}	2025-08-26 20:26:01.2+05:30	2025-08-26 20:26:01.2+05:30	2025-08-26 20:26:01.2+05:30	\N
0a1853af-774d-4e50-8d4d-dedb555267f5	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ETFghDB70BFI4em9tTnAVxSjf_AGrQYl	\N	low	success	\N	{}	2025-08-26 20:35:01.312+05:30	2025-08-26 20:35:01.314+05:30	2025-08-26 20:35:01.314+05:30	\N
71c94c92-3e54-422f-9e95-f6b721356776	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	TvJWGp7_EV6E1wuMe8kfa0l_WWdFFfhx	\N	low	success	\N	{}	2025-08-26 20:42:15.789+05:30	2025-08-26 20:42:15.79+05:30	2025-08-26 20:42:15.79+05:30	\N
c9631788-6a57-4403-bad3-cb82b3c48bb7	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	NzzChBkC8xPOUggSNY7I7ZLnV7k6jZ15	\N	low	success	\N	{}	2025-08-26 21:41:30.21+05:30	2025-08-26 21:41:30.211+05:30	2025-08-26 21:41:30.211+05:30	\N
b56cf7c4-d6c5-44e4-8049-bacc2ae88456	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "TQe4-ulVMj3ztuY0dq-meUeDTGSSUFbg"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 21:52:02.675+05:30	2025-08-26 21:52:02.676+05:30	2025-08-26 21:52:02.676+05:30	\N
62e0001e-c717-4a22-9456-6238af316482	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	_bfseDMe73xnXzN6DGTKGCJh5Zpxa2ng	\N	low	success	\N	{}	2025-08-26 23:49:42.89+05:30	2025-08-26 23:49:42.891+05:30	2025-08-26 23:49:42.891+05:30	\N
20f9fa37-dd61-48ea-9b31-9b5adc8dceca	ed677398-a24a-40a5-b132-4efa181f8821	\N	user_registration	system	\N	{"role": "patient", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 23:52:03.067+05:30	2025-08-26 23:52:03.067+05:30	2025-08-26 23:52:03.067+05:30	\N
712ee875-5174-43c3-96f9-e980b7681f10	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "fp0GY8RDVdEHrWZKwSt92wnLRsIpZIaM"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 23:54:25.333+05:30	2025-08-26 23:54:25.333+05:30	2025-08-26 23:54:25.333+05:30	\N
74df771a-8b40-440e-af88-40ec6ff185d7	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	-51ylyFEpTBCqrX7sIKSPlG_TORofHHY	\N	low	success	\N	{}	2025-08-26 23:54:48.721+05:30	2025-08-26 23:54:48.721+05:30	2025-08-26 23:54:48.721+05:30	\N
552df626-3e03-47d2-b118-0d375867722e	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "AMUmnijrOTVXfS0eNf6v92kU2O1QA3jJ"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-26 23:55:28.655+05:30	2025-08-26 23:55:28.655+05:30	2025-08-26 23:55:28.655+05:30	\N
a4a7dadf-6feb-4799-a023-9e7533c3e224	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	J5n0k_h7etL03UK4WkjQVdab8r9vrsUn	\N	low	success	\N	{}	2025-08-26 23:59:45.997+05:30	2025-08-26 23:59:45.997+05:30	2025-08-26 23:59:45.997+05:30	\N
83a61421-6f51-4dc5-a16a-45e53fbe5d6e	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ZiFlR9z8n9a09eUDYpeeoU0AEoAiuDjw	\N	low	success	\N	{}	2025-08-27 00:03:05.253+05:30	2025-08-27 00:03:05.254+05:30	2025-08-27 00:03:05.254+05:30	\N
e5da31c9-c0ea-4e52-a1d0-5bdad856da90	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	rjDsKE_83oWBsPFYVCgdFsQ0O9-KNZSg	\N	low	success	\N	{}	2025-08-27 00:19:31.572+05:30	2025-08-27 00:19:31.572+05:30	2025-08-27 00:19:31.572+05:30	\N
95486c8f-4223-4394-8790-92affdc46e2f	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	QHWCDGWVcoEfEFJaKiDt9zyvZdce6ktk	\N	low	success	\N	{}	2025-08-27 00:25:40.748+05:30	2025-08-27 00:25:40.749+05:30	2025-08-27 00:25:40.749+05:30	\N
1d6b0e82-410a-4607-acbf-4084339ccb2a	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	record_upload	medical_record	a9c1ac20-4af9-484e-b941-77d91f53ba54	{"message": "Doctor created medical record: blood report"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Bdc5cajrWVWUE-CyWzU_B-H3f5_ZVvdm	\N	low	success	\N	{}	2025-08-27 00:26:14.191+05:30	2025-08-27 00:26:14.191+05:30	2025-08-27 00:26:14.191+05:30	\N
656e8458-3053-4d1f-b369-0aab96c38346	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	record_upload	medical_record	dd847907-14b2-4605-8d3c-8fcadafb3e3f	{"message": "Doctor created medical record: blood report"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	E33Lj-m_hnjeU7JHQiGQAhSOVGF5S3Va	\N	low	success	\N	{}	2025-08-27 00:28:02.379+05:30	2025-08-27 00:28:02.38+05:30	2025-08-27 00:28:02.38+05:30	\N
aff5f150-b4b9-4528-900a-e4fc3095003c	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	nZNyCcKoaDel9iT4914f4u62ain--EQ3	\N	low	success	\N	{}	2025-08-27 00:36:32.343+05:30	2025-08-27 00:36:32.343+05:30	2025-08-27 00:36:32.343+05:30	\N
06e29f20-836a-491f-9ff5-a32f332d28a5	0fdbb5be-9043-493e-a0c0-0129e4855098	ed677398-a24a-40a5-b132-4efa181f8821	record_upload	medical_record	65a95a4e-aead-4a6d-bdb0-e13b4712ba62	{"message": "Doctor created medical record: covid shield"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Vv3TdsoFhj58AM8khcPYElbLlN9Hw4Qg	\N	low	success	\N	{}	2025-08-27 00:38:52.655+05:30	2025-08-27 00:38:52.656+05:30	2025-08-27 00:38:52.656+05:30	\N
3c852513-fb05-478d-a207-bc93e41aabb3	0fdbb5be-9043-493e-a0c0-0129e4855098	ed677398-a24a-40a5-b132-4efa181f8821	file_download	medical_record	65a95a4e-aead-4a6d-bdb0-e13b4712ba62	{"message": "Doctor downloaded medical record: covid shield"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	I7K17KFFIKSFMD1FYXeqrggklXV6cN8N	\N	low	success	\N	{}	2025-08-27 00:39:03.893+05:30	2025-08-27 00:39:03.893+05:30	2025-08-27 00:39:03.893+05:30	\N
01ce96b0-3fc4-453a-988c-86df767e4297	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	vyD4ssUg7xKAESF4ju6tc8R8hZx2FV6G	\N	low	success	\N	{}	2025-08-27 21:03:58.215+05:30	2025-08-27 21:03:58.216+05:30	2025-08-27 21:03:58.216+05:30	\N
fc74ba2c-6196-4fdd-8da2-5aa512c55e94	0fdbb5be-9043-493e-a0c0-0129e4855098	ed677398-a24a-40a5-b132-4efa181f8821	file_download	medical_record	65a95a4e-aead-4a6d-bdb0-e13b4712ba62	{"message": "Doctor downloaded medical record: covid shield"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	8a5SVBEdG563ERSthdkUlfXsWNW14CP7	\N	low	success	\N	{}	2025-08-27 21:04:15.868+05:30	2025-08-27 21:04:15.869+05:30	2025-08-27 21:04:15.869+05:30	\N
d4614988-9fe5-4c6d-9b7c-2ed4115ac67b	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "vRqxfyXUhyGvChlP-zP2BTSMlA_oVw0r"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-27 21:04:40.127+05:30	2025-08-27 21:04:40.127+05:30	2025-08-27 21:04:40.127+05:30	\N
f8a44eee-3509-4391-afd3-d6171e8e33d3	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	trSH3Gvny4ohbAIxffgEkLLhEYy3vgj1	\N	low	success	\N	{}	2025-08-27 21:04:56.178+05:30	2025-08-27 21:04:56.179+05:30	2025-08-27 21:04:56.179+05:30	\N
d7798f56-2d76-4d7c-897a-247bbb2d85cf	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "CHii2TQe1L4VjA-lyoKmxewSYDcYkgkn"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-27 21:05:27.723+05:30	2025-08-27 21:05:27.724+05:30	2025-08-27 21:05:27.724+05:30	\N
05b1d6cb-8682-40c6-8816-5e4ace7f8f88	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	5XHKRr4VuKVkToFoXmNAQLHDQfM0v0N7	\N	low	success	\N	{}	2025-08-27 21:05:43.921+05:30	2025-08-27 21:05:43.922+05:30	2025-08-27 21:05:43.922+05:30	\N
5ccda5d2-6de5-490e-b3d0-2964a6cb60c3	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	N8tdVx4FsPIouOPlfAxEzUqhul30b36X	\N	low	success	\N	{}	2025-08-30 19:44:38.406+05:30	2025-08-30 19:44:38.407+05:30	2025-08-30 19:44:38.407+05:30	\N
422f19c1-3366-486d-9192-2fe2d664201e	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	3QW3LBMYd6AuuFJUA8S3vgt340-mdsAG	\N	low	success	\N	{}	2025-08-30 21:32:12.932+05:30	2025-08-30 21:32:12.933+05:30	2025-08-30 21:32:12.933+05:30	\N
6f2bc6b0-35ed-40c5-b068-4615a4029f65	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "vs540CwOBhLps5iDb4NqJ9o_HkHyo9Ml"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-30 21:34:28.392+05:30	2025-08-30 21:34:28.393+05:30	2025-08-30 21:34:28.393+05:30	\N
d5483f7f-31e4-4293-8ca9-c85f9f3e28e1	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	kElYUcS1NY635KSuAukY_UnVMUxLF8IM	\N	low	success	\N	{}	2025-08-30 21:39:51.471+05:30	2025-08-30 21:39:51.471+05:30	2025-08-30 21:39:51.471+05:30	\N
03df3397-c5c2-4d09-ad92-386a83007c26	0fdbb5be-9043-493e-a0c0-0129e4855098	1760e03b-bb23-43e2-88c4-5d3b175be8fd	record_upload	medical_record	35cb17c4-bf88-43ce-b4bd-13a551a6bf16	{"message": "Doctor created medical record: CT Scan"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	C8XKgwOoIEpQdCG0SDj1vAkaTr_5HCYW	\N	low	success	\N	{}	2025-08-30 21:40:52.507+05:30	2025-08-30 21:40:52.507+05:30	2025-08-30 21:40:52.507+05:30	\N
5f741a12-3f76-402d-a6ff-500e07d368ce	c12db75a-ec1f-4209-8f1d-2ce59d5ab423	\N	user_registration	system	\N	{"role": "patient", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-30 21:44:13.356+05:30	2025-08-30 21:44:13.356+05:30	2025-08-30 21:44:13.356+05:30	\N
e06e4fc2-ecf6-419b-b563-fd5f77255bce	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	5aROzBZP9b39VNOH2-_D5aEfIlaErWPx	\N	low	success	\N	{}	2025-08-30 21:51:37.114+05:30	2025-08-30 21:51:37.115+05:30	2025-08-30 21:51:37.115+05:30	\N
a187e02c-8ed2-45f2-a478-89067f33ae40	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	LOftbku0ktxlIqPK4PnjtNkSTr4ZgLXY	\N	low	success	\N	{}	2025-08-31 16:52:43.072+05:30	2025-08-31 16:52:43.076+05:30	2025-08-31 16:52:43.076+05:30	\N
a71ddc83-0595-410c-8620-4f40683c48f7	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	pxdIW9o7qh-nRn25F6FbLGY8J5DXKGap	\N	low	success	\N	{}	2025-08-31 17:02:43.313+05:30	2025-08-31 17:02:43.314+05:30	2025-08-31 17:02:43.314+05:30	\N
16efb326-776a-4af3-872a-603e6f03abe9	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	lyk425Vej5kbh5icCBWX8e64rn1zho6j	\N	low	success	\N	{}	2025-08-31 17:34:58.895+05:30	2025-08-31 17:34:58.896+05:30	2025-08-31 17:34:58.896+05:30	\N
b2e41823-5f0b-4f66-a256-4a2fb08f3bf4	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	uLoncjByYTDz4OgSAO-wcpTLybZuXcsM	\N	medium	failure	\N	{}	2025-08-31 17:36:38.935+05:30	2025-08-31 17:36:38.935+05:30	2025-08-31 17:36:38.935+05:30	\N
06900140-2c21-4973-977c-5c5c10707cd9	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	97opsQAMS-nhERy0FgcTlCTzcrkokpwd	\N	low	success	\N	{}	2025-08-31 17:36:55.316+05:30	2025-08-31 17:36:55.316+05:30	2025-08-31 17:36:55.316+05:30	\N
f9a61ac2-bf39-42a9-8a78-cc4a94085f03	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	vyDo8Vmkg-950C7J_Sg11_zYZq4FdWgF	\N	low	success	\N	{}	2025-08-31 17:44:19.311+05:30	2025-08-31 17:44:19.312+05:30	2025-08-31 17:44:19.312+05:30	\N
a13634c2-7f9b-49f4-8f34-06e6a73b5756	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "8IYh5uZSzqkNnKbYQczGjiNV5Oaa-9ZC"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-31 17:44:44.935+05:30	2025-08-31 17:44:44.935+05:30	2025-08-31 17:44:44.935+05:30	\N
9eec3c95-bbed-4ecf-b198-adff6e5c8872	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	dKP1N9D0ISfxf4288k5k9ztgGzCmA3ZN	\N	low	success	\N	{}	2025-08-31 17:44:53.854+05:30	2025-08-31 17:44:53.854+05:30	2025-08-31 17:44:53.854+05:30	\N
f1280162-e909-41fd-9848-f97ad88d2035	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	h2laGny0DYKsdX-8XrXZ61kDiUaraCSm	\N	low	success	\N	{}	2025-08-31 17:54:12.956+05:30	2025-08-31 17:54:12.957+05:30	2025-08-31 17:54:12.957+05:30	\N
0c85a4ae-181e-4461-92e8-c4b029a8459d	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	8BjjVSdwf8KSlimLI-fLd5seQSxDMZ4E	\N	low	success	\N	{}	2025-08-31 18:05:46.621+05:30	2025-08-31 18:05:46.621+05:30	2025-08-31 18:05:46.621+05:30	\N
ca8e66c1-ff2d-4bda-bfd0-cc6b0b93726f	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	4vsEIHQ7yrwd5x5hV07d_OjRvAQgp8AG	\N	low	success	\N	{}	2025-08-31 18:13:53.997+05:30	2025-08-31 18:13:53.997+05:30	2025-08-31 18:13:53.997+05:30	\N
44fff10f-be6d-4502-8eeb-345d4585bba5	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	L7NE-nDlPcy7ztqc7oYRYqd3Zf7d1O3F	\N	low	success	\N	{}	2025-08-31 18:20:41.518+05:30	2025-08-31 18:20:41.519+05:30	2025-08-31 18:20:41.519+05:30	\N
7c0e0673-304d-4a98-9985-821701e8b99e	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	50818141-3b3d-4c59-b72d-023716a4d74a	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 22:07:31.721+05:30	2025-09-01 22:07:31.722+05:30	2025-09-01 22:07:31.722+05:30	\N
680ca9ea-2055-4fe6-bdbf-aaff2132562f	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	46YUsI_zo3Mu3_IF9SXpmw1Urh8DXTYt	\N	low	success	\N	{}	2025-08-31 18:25:56.212+05:30	2025-08-31 18:25:56.212+05:30	2025-08-31 18:25:56.212+05:30	\N
73f1a106-9cc5-4cdf-b653-03f63673186f	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	2vtyMcPqcsaYEx-9BXz6rDhxblRI3LKN	\N	medium	failure	\N	{}	2025-08-31 18:29:01.359+05:30	2025-08-31 18:29:01.359+05:30	2025-08-31 18:29:01.359+05:30	\N
7e8144ea-3953-4383-ae10-1f9c96a1b76e	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	C-vk0he6Bwq2PNYTcVomHSSGfADU9h1f	\N	medium	failure	\N	{}	2025-08-31 18:29:03.311+05:30	2025-08-31 18:29:03.311+05:30	2025-08-31 18:29:03.311+05:30	\N
551dc523-69be-464a-a758-db5b6d80d38b	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	bqNKSGHOETwGRcc1hfNfqTgnuRmQ5JmX	\N	medium	failure	\N	{}	2025-08-31 18:29:17.832+05:30	2025-08-31 18:29:17.832+05:30	2025-08-31 18:29:17.832+05:30	\N
ba1bd232-234d-4995-88f4-6b33689ab7f7	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	D7Mdtn95QK8tv292pn3tVDwkLXcjnA_r	\N	medium	failure	\N	{}	2025-08-31 18:29:42.406+05:30	2025-08-31 18:29:42.406+05:30	2025-08-31 18:29:42.406+05:30	\N
1498866b-0edd-4b26-b4ca-2527691092da	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	Ty_9wDa-Ei2onVkXLK63vI1ddQCVb1oF	\N	low	success	\N	{}	2025-08-31 18:30:01.429+05:30	2025-08-31 18:30:01.429+05:30	2025-08-31 18:30:01.429+05:30	\N
36280a62-d09c-4d8c-a6dc-e5baf3f10165	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	LL8dpdtsgcbvgRrj2Hk3zA2xrdZyWYFR	\N	medium	failure	\N	{}	2025-08-31 18:32:20.274+05:30	2025-08-31 18:32:20.274+05:30	2025-08-31 18:32:20.274+05:30	\N
96219fb4-9b46-4c2f-abb1-ccf28cc916eb	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	r6Gl6PX2cDM4qyeWo5-S8Dr2mKyQo_DA	\N	medium	failure	\N	{}	2025-08-31 18:34:27.166+05:30	2025-08-31 18:34:27.166+05:30	2025-08-31 18:34:27.166+05:30	\N
a8294148-319b-41f5-8a22-24ef2b4013a5	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	StRmhlG4CQ6TbhRb6rwbIpMPeQGaCYa6	\N	low	success	\N	{}	2025-08-31 18:37:26.344+05:30	2025-08-31 18:37:26.344+05:30	2025-08-31 18:37:26.344+05:30	\N
be9c9e75-fd25-4d8f-9c48-9e9d280495f0	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	login	user	b1373e3f-1196-4490-9655-8196e4cb7c1c	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	tYJlxPyIZ5x8VGjT2ALZeZm-uBwmHJR5	\N	low	success	\N	{}	2025-08-31 18:37:39.37+05:30	2025-08-31 18:37:39.371+05:30	2025-08-31 18:37:39.371+05:30	\N
4827bcc0-5e60-43fa-8f65-2f797c12aac6	b1373e3f-1196-4490-9655-8196e4cb7c1c	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "HY-5gU4ogoOyZR8xN-dRialaF-OSWG5l"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-31 18:38:28.756+05:30	2025-08-31 18:38:28.756+05:30	2025-08-31 18:38:28.756+05:30	\N
b03898fc-bd84-4acf-9798-87fb0246f8e6	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	Xo2spppHulV26cexQwwYeZ6R9UmF9EwK	\N	low	success	\N	{}	2025-08-31 18:38:38.519+05:30	2025-08-31 18:38:38.52+05:30	2025-08-31 18:38:38.52+05:30	\N
c1af6af2-c28d-4640-894e-4b727848bc90	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	VcLrKKvmRS5LCMULrrOyZqYuGRUV8K9C	\N	low	success	\N	{}	2025-08-31 18:43:26.976+05:30	2025-08-31 18:43:26.977+05:30	2025-08-31 18:43:26.977+05:30	\N
5a788e91-d20c-4a69-a812-9dddf6fb27bb	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	iJJl1kf0ulKXwogKRfMRygFEQc44RlBd	\N	low	success	\N	{}	2025-08-31 18:47:51.631+05:30	2025-08-31 18:47:51.631+05:30	2025-08-31 18:47:51.631+05:30	\N
381cf14b-af8e-445d-8c78-bb3556c6f7b1	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "yXOXotbkQR2Q9UrhULkfpe1Eo8z-7hIb"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-31 18:48:17.028+05:30	2025-08-31 18:48:17.028+05:30	2025-08-31 18:48:17.028+05:30	\N
0fa86aca-21a3-40be-9e8c-1f0244eff643	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	TA574Bcz502cWRoVljPLULcZEgGy1BIy	\N	low	success	\N	{}	2025-08-31 18:48:31.73+05:30	2025-08-31 18:48:31.731+05:30	2025-08-31 18:48:31.731+05:30	\N
64f20035-4efe-4422-8486-2de4200af13c	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-08-31 18:48:53.694+05:30	2025-08-31 18:48:53.695+05:30	2025-08-31 18:48:53.695+05:30	\N
06bd9611-417e-4e66-9eee-a1050774049c	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-08-31 18:48:53.704+05:30	2025-08-31 18:48:53.704+05:30	2025-08-31 18:48:53.704+05:30	\N
8e6a0fb7-fc9b-4c87-a329-e7479b302554	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "sPPz-GnYG0na93fZvDdtCwoDZMqyH4R2"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-31 18:49:14.326+05:30	2025-08-31 18:49:14.326+05:30	2025-08-31 18:49:14.326+05:30	\N
76bc0115-640a-43b5-9ec7-c700b7b60594	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	z8EoR-YQiqotCimwo1eDkMqzfsqnzdAh	\N	low	success	\N	{}	2025-08-31 18:49:30.273+05:30	2025-08-31 18:49:30.273+05:30	2025-08-31 18:49:30.273+05:30	\N
038be53c-431e-4519-a9fb-5e3a68cd4507	12651c11-529c-472c-9a17-4d2102115425	\N	otp_failed	system	\N	{"doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8"}	\N	\N	\N	\N	medium	success	\N	{}	2025-08-31 18:49:48.551+05:30	2025-08-31 18:49:48.551+05:30	2025-08-31 18:49:48.551+05:30	\N
67f53eff-d165-48b5-a1f9-8b7c24e2e9bc	12651c11-529c-472c-9a17-4d2102115425	\N	access_granted	system	\N	{"doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8"}	\N	\N	\N	\N	medium	success	\N	{}	2025-08-31 18:50:04.317+05:30	2025-08-31 18:50:04.317+05:30	2025-08-31 18:50:04.317+05:30	\N
b860f6e4-eb02-419c-89f8-1633a8bc4e8a	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "bOTa2hd2dpxYV0i66Yk2auTN2nv-zO4j"}	\N	\N	\N	\N	low	success	\N	{}	2025-08-31 18:50:11.417+05:30	2025-08-31 18:50:11.417+05:30	2025-08-31 18:50:11.417+05:30	\N
8d19aa09-fe97-480b-98dc-0726a5275925	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	RXb0X5mU8bvQVrj_hxFkIqJesy4uwfkh	\N	low	success	\N	{}	2025-08-31 18:50:27.831+05:30	2025-08-31 18:50:27.832+05:30	2025-08-31 18:50:27.832+05:30	\N
27f63459-1769-428c-8c9f-4e73c54d483e	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	8x6zZntAxQGtt9MDgk_5gzmCcDLEiic4	\N	low	success	\N	{}	2025-09-01 12:52:29.068+05:30	2025-09-01 12:52:29.069+05:30	2025-09-01 12:52:29.069+05:30	\N
299842ce-2683-4bb9-8982-9436e7ef7070	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	v171X3OsLyXaqv-otKrGMTWCbKehG46A	\N	low	success	\N	{}	2025-09-01 12:53:31.332+05:30	2025-09-01 12:53:31.332+05:30	2025-09-01 12:53:31.332+05:30	\N
1a699ffe-d38d-4a25-976a-beab74ff8495	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	qR_XfEOgRT3BjIeryKfM0RMwqxmit1V3	\N	low	success	\N	{}	2025-09-01 12:53:49.536+05:30	2025-09-01 12:53:49.537+05:30	2025-09-01 12:53:49.537+05:30	\N
0fee5aa0-de22-4ce3-bcaf-1c1e1d76505e	0fdbb5be-9043-493e-a0c0-0129e4855098	ed677398-a24a-40a5-b132-4efa181f8821	access_request	access_request	0378a4c5-10d4-4a61-95ce-63c76e3abcaf	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 12:54:35.309+05:30	2025-09-01 12:54:35.31+05:30	2025-09-01 12:54:35.31+05:30	\N
69fc14e4-31eb-4c4d-9049-2fb4074e991b	0fdbb5be-9043-493e-a0c0-0129e4855098	ed677398-a24a-40a5-b132-4efa181f8821	access_request	access_request	0378a4c5-10d4-4a61-95ce-63c76e3abcaf	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 12:54:35.32+05:30	2025-09-01 12:54:35.32+05:30	2025-09-01 12:54:35.32+05:30	\N
75483eff-827a-4f2b-adb8-fd0c95da6bac	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "jzjJN20w1FrCB38taZaICO2Ums9ZC130"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 12:54:46.82+05:30	2025-09-01 12:54:46.82+05:30	2025-09-01 12:54:46.82+05:30	\N
46c2a2b6-c995-4312-a98c-81cbcd7b9727	ed677398-a24a-40a5-b132-4efa181f8821	\N	login	user	ed677398-a24a-40a5-b132-4efa181f8821	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	xm8gcRCvDNyWoM87xncxd_OgdMpE7Dbq	\N	medium	failure	\N	{}	2025-09-01 12:55:15.222+05:30	2025-09-01 12:55:15.222+05:30	2025-09-01 12:55:15.222+05:30	\N
641454d4-ffd5-4924-bde3-0647471e09b2	ece3ee5e-d170-4928-a685-ce9b28fb08aa	\N	user_registration	system	\N	{"role": "patient", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 13:01:59.537+05:30	2025-09-01 13:01:59.537+05:30	2025-09-01 13:01:59.537+05:30	\N
8daf6b7f-c83d-4d19-b292-53a84043aa22	ece3ee5e-d170-4928-a685-ce9b28fb08aa	\N	login	user	ece3ee5e-d170-4928-a685-ce9b28fb08aa	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	_9Sl9FYz7AMccgWuQr07jcM2otOMO9p1	\N	low	success	\N	{}	2025-09-01 13:02:17.341+05:30	2025-09-01 13:02:17.341+05:30	2025-09-01 13:02:17.341+05:30	\N
35143168-638d-466d-8d5c-d5bf0e0ee7d5	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	WZxmu6h9KeSJWqJb_6eS7kngA6rUPrbv	\N	low	success	\N	{}	2025-09-01 13:02:41.763+05:30	2025-09-01 13:02:41.763+05:30	2025-09-01 13:02:41.763+05:30	\N
df90b69d-534c-4f0b-94ce-ca9624fa14f1	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "2z1uh3c5MZYOpbMb2qEd0haat4I5BkHS"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 15:40:12.907+05:30	2025-09-01 15:40:12.909+05:30	2025-09-01 15:40:12.909+05:30	\N
4e7e83b2-ecfe-41a1-a182-4f42c34678fb	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	\N	user_registration	system	\N	{"role": "doctor", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 15:44:21.967+05:30	2025-09-01 15:44:21.968+05:30	2025-09-01 15:44:21.968+05:30	\N
cfdcf1f4-0029-436b-881e-bc528fafacc2	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	\N	login	user	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	s5f2QoETXCqsOelJWGYZrw9IL39c4s5x	\N	low	success	\N	{}	2025-09-01 15:44:42.334+05:30	2025-09-01 15:44:42.335+05:30	2025-09-01 15:44:42.335+05:30	\N
fa8d5dd2-3d1a-4a06-8b9b-454784ead369	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	12651c11-529c-472c-9a17-4d2102115425	record_upload	medical_record	1451c465-ef8e-4313-8a55-bb55b61f7777	{"message": "Doctor created medical record: rootcanal"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	1H-aiP-BNoZmFAlGenNs1Smngu3whxTz	\N	low	success	\N	{}	2025-09-01 15:47:00.527+05:30	2025-09-01 15:47:00.528+05:30	2025-09-01 15:47:00.528+05:30	\N
fa38b7ec-808d-4774-847c-f3695decc188	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	f095a0c1-44f6-469a-8d1d-f3855228579e	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 15:47:27.333+05:30	2025-09-01 15:47:27.333+05:30	2025-09-01 15:47:27.333+05:30	\N
4367a123-1f1c-41e0-bacf-5fe5e4101118	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	f095a0c1-44f6-469a-8d1d-f3855228579e	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 15:47:27.344+05:30	2025-09-01 15:47:27.344+05:30	2025-09-01 15:47:27.344+05:30	\N
43c503a5-d4d5-4298-b13b-c294eba2c1b9	ece3ee5e-d170-4928-a685-ce9b28fb08aa	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "BFyJSsBlURPhR3mcy_DSt4rikqlkLaqB"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 15:47:51.085+05:30	2025-09-01 15:47:51.085+05:30	2025-09-01 15:47:51.085+05:30	\N
cf838f72-2a56-4a02-bce2-463a1228f31d	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	haZYy0o4zHK9_J8RXbsz2PLsnipXIxwA	\N	low	success	\N	{}	2025-09-01 15:48:00.56+05:30	2025-09-01 15:48:00.56+05:30	2025-09-01 15:48:00.56+05:30	\N
bb6f5648-35e3-46a3-a885-4b86336d494d	12651c11-529c-472c-9a17-4d2102115425	\N	access_granted	system	\N	{"doctorId": "a984ba12-a5c4-4d5e-a7dc-540db1ec9e49", "accessRequestId": "f095a0c1-44f6-469a-8d1d-f3855228579e"}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 15:49:35.925+05:30	2025-09-01 15:49:35.925+05:30	2025-09-01 15:49:35.925+05:30	\N
d1857858-fc3d-4ded-b9b6-01327a749d41	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	1uo7AzNxLGZwEe7sf0lUBUbM6U8ODsJy	\N	low	success	\N	{}	2025-09-01 16:42:38.848+05:30	2025-09-01 16:42:38.849+05:30	2025-09-01 16:42:38.849+05:30	\N
9dce0195-7319-49b7-a9e0-808a3beee1b5	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	WFoO8VbY6h2FZOWSXC4I8S7wASIwgPan	\N	low	success	\N	{}	2025-09-01 16:53:43.936+05:30	2025-09-01 16:53:43.936+05:30	2025-09-01 16:53:43.936+05:30	\N
77ca0352-4492-41f9-b263-92c80a68bebe	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	bmzCvHIHMwPNLHhEjbab-57OCpISU1CR	\N	low	success	\N	{}	2025-09-01 16:54:13.004+05:30	2025-09-01 16:54:13.004+05:30	2025-09-01 16:54:13.004+05:30	\N
2e2c250f-f9d8-40fb-a84d-0585896848e1	12651c11-529c-472c-9a17-4d2102115425	\N	file_download	medical_record	1451c465-ef8e-4313-8a55-bb55b61f7777	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 16:56:27.429+05:30	2025-09-01 16:56:27.429+05:30	2025-09-01 16:56:27.429+05:30	\N
ead61342-92da-4d5b-bb56-d885468577a9	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	UgSUoWPEi0f0lMTN2ytuwDTHvdQW8YRn	\N	low	success	\N	{}	2025-09-01 17:24:36.142+05:30	2025-09-01 17:24:36.143+05:30	2025-09-01 17:24:36.143+05:30	\N
1f8f92c4-c827-4cf7-8f76-bfc36384d7d0	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	lCDiHItOGC0EdUDDGWcq9FU5ESEHt_vP	\N	low	success	\N	{}	2025-09-01 17:26:59.079+05:30	2025-09-01 17:26:59.079+05:30	2025-09-01 17:26:59.079+05:30	\N
5652e077-4b74-4763-967d-b22831ab37e2	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Mqw_UtSGeEwjAx6-He4KsJzEzRrSquVc	\N	low	success	\N	{}	2025-09-01 17:31:08.135+05:30	2025-09-01 17:31:08.135+05:30	2025-09-01 17:31:08.135+05:30	\N
0ee5d829-1572-46b1-b5f5-b4f695bf7089	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	8PjJ-aDaF3G0U70k9kpmR5ER62N-h319	\N	low	success	\N	{}	2025-09-01 17:34:19.715+05:30	2025-09-01 17:34:19.716+05:30	2025-09-01 17:34:19.716+05:30	\N
7ac9fcf2-368a-46f0-844a-14964e1b4d57	12651c11-529c-472c-9a17-4d2102115425	\N	report_download	medical_record	a9c1ac20-4af9-484e-b941-77d91f53ba54	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 17:34:27.95+05:30	2025-09-01 17:34:27.95+05:30	2025-09-01 17:34:27.95+05:30	\N
341b81e4-b950-4e25-9035-6f92b8554844	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ZPVf6YukcCcawoYSDMfjCas5FNHttwtk	\N	low	success	\N	{}	2025-09-01 17:37:44.003+05:30	2025-09-01 17:37:44.003+05:30	2025-09-01 17:37:44.003+05:30	\N
5419a3c6-4a47-4b92-9070-3d65b74ef61b	12651c11-529c-472c-9a17-4d2102115425	\N	report_download	medical_record	a9c1ac20-4af9-484e-b941-77d91f53ba54	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 17:37:49.71+05:30	2025-09-01 17:37:49.71+05:30	2025-09-01 17:37:49.71+05:30	\N
a6fb2ed9-c74a-4d8b-a38f-0e4b5048242b	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	R8y_LE_kvowhWnzHLQaRfTlnkASwAW8C	\N	low	success	\N	{}	2025-09-01 17:40:00.492+05:30	2025-09-01 17:40:00.492+05:30	2025-09-01 17:40:00.492+05:30	\N
7631439d-e554-415e-b53c-8a76dae1a112	12651c11-529c-472c-9a17-4d2102115425	\N	report_download	medical_record	a9c1ac20-4af9-484e-b941-77d91f53ba54	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 17:40:08.059+05:30	2025-09-01 17:40:08.059+05:30	2025-09-01 17:40:08.059+05:30	\N
b6366b09-a6bd-4c02-b007-6cea07c48a0a	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "z_4IVJi70FdwERVUj4UA-fUkPCHexEff"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 21:50:40.035+05:30	2025-09-01 21:50:40.056+05:30	2025-09-01 21:50:40.056+05:30	\N
78c8a390-7737-4827-bf2e-5958b01dc51b	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Ucz0Zwx8-G42K4dSKcKZxylU-kU1RSNP	\N	low	success	\N	{}	2025-09-01 21:50:53.331+05:30	2025-09-01 21:50:53.331+05:30	2025-09-01 21:50:53.331+05:30	\N
79ae805d-f51e-4bf1-b286-e227f1b870f2	0fdbb5be-9043-493e-a0c0-0129e4855098	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	access_request	access_request	8dde92a3-809d-484b-a469-d720f877f199	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 21:52:39.172+05:30	2025-09-01 21:52:39.173+05:30	2025-09-01 21:52:39.173+05:30	\N
f4b932d1-7bca-4cb9-a7c3-151985076877	0fdbb5be-9043-493e-a0c0-0129e4855098	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	access_request	access_request	8dde92a3-809d-484b-a469-d720f877f199	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 21:52:39.19+05:30	2025-09-01 21:52:39.19+05:30	2025-09-01 21:52:39.19+05:30	\N
1e470d36-c0a7-481f-83cb-a935a5ea9e94	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	login	user	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	VCw1ftzce2lHHEujweD49y4NRx6JkUJt	\N	low	success	\N	{}	2025-09-01 21:53:36.663+05:30	2025-09-01 21:53:36.663+05:30	2025-09-01 21:53:36.663+05:30	\N
7c576df9-911e-4f72-87d9-8fe167d46e7a	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	access_denied	system	\N	{"reason": "Access denied by patient", "doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "8dde92a3-809d-484b-a469-d720f877f199"}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 21:53:42.357+05:30	2025-09-01 21:53:42.358+05:30	2025-09-01 21:53:42.358+05:30	\N
cf1180d3-3db1-4ac3-90c1-a2ef31a56924	6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "Y8ZSIvJfJ-MZmf4F-9ZCHwCBFbpksDJ3"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 21:53:46.969+05:30	2025-09-01 21:53:46.969+05:30	2025-09-01 21:53:46.969+05:30	\N
b8f5f8e0-f2a2-49c5-b951-ad66bea087b1	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	oasb_J3Wge6PJr_C0tczu2GqahwrY-0j	\N	low	success	\N	{}	2025-09-01 21:53:57.122+05:30	2025-09-01 21:53:57.122+05:30	2025-09-01 21:53:57.122+05:30	\N
06d65736-a322-40d5-b356-eb895b9f0bbc	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	KC-IwAMZOclw8EnQQq_ueGjBvHL074bq	\N	low	success	\N	{}	2025-09-01 22:07:15.249+05:30	2025-09-01 22:07:15.251+05:30	2025-09-01 22:07:15.251+05:30	\N
ee89f7e9-2a22-469b-b5dc-b55d5559eceb	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	50818141-3b3d-4c59-b72d-023716a4d74a	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 22:07:31.702+05:30	2025-09-01 22:07:31.702+05:30	2025-09-01 22:07:31.702+05:30	\N
d0d37408-fdda-4c31-9e47-782647e456e2	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "eOEe4xUCBH8kGkUHYBmJLkkYcO1IaJKn"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 22:09:10.437+05:30	2025-09-01 22:09:10.438+05:30	2025-09-01 22:09:10.438+05:30	\N
6efcbb2c-e3e6-4fb1-9789-a6e542349433	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	I02LR_JiHwl7cq_6SdhVdmp9PsHhh7DP	\N	medium	failure	\N	{}	2025-09-01 22:09:21.356+05:30	2025-09-01 22:09:21.356+05:30	2025-09-01 22:09:21.356+05:30	\N
60c31bf5-2a0f-4d81-a373-1baa19777bb8	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SOKwUJZ6mfUIwcVaQWBPGdh2ZL341JDC	\N	medium	failure	\N	{}	2025-09-01 22:09:29.626+05:30	2025-09-01 22:09:29.626+05:30	2025-09-01 22:09:29.626+05:30	\N
f7977260-8d2c-4640-ae0e-89d024755ad9	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	g7bE1mJy5Y7BQUGHoDuQ6A1kzQs8QqGX	\N	low	success	\N	{}	2025-09-01 22:09:43.834+05:30	2025-09-01 22:09:43.835+05:30	2025-09-01 22:09:43.835+05:30	\N
106168a2-d9ef-4cb3-86e9-483b42ad3ecc	12651c11-529c-472c-9a17-4d2102115425	\N	access_denied	system	\N	{"reason": "Access denied by patient", "doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "50818141-3b3d-4c59-b72d-023716a4d74a"}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 22:09:55.115+05:30	2025-09-01 22:09:55.115+05:30	2025-09-01 22:09:55.115+05:30	\N
a6bf21cc-68f3-4e6a-9f78-805b0e709748	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "0iE5y-SF1O-4z3nTzzWGyHsrf6MTt_Mb"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 22:10:03.453+05:30	2025-09-01 22:10:03.453+05:30	2025-09-01 22:10:03.453+05:30	\N
b6a32148-ef60-4422-82fb-a5b5e27bf11e	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	q0lmlf2JKTclNnRN2-hpIiCAlO-wpG-A	\N	low	success	\N	{}	2025-09-01 22:10:13.426+05:30	2025-09-01 22:10:13.426+05:30	2025-09-01 22:10:13.426+05:30	\N
ac186dad-2164-4c90-8953-0290db36c0f3	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	JddxE2oVVRo2gz4MnzI9sUplNso17FQ0	\N	low	success	\N	{}	2025-09-01 22:22:44.277+05:30	2025-09-01 22:22:44.277+05:30	2025-09-01 22:22:44.277+05:30	\N
2ec7e728-05bc-4f43-9ceb-cd42f2751175	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	OyAbuclq5iF5Vc_MklHV76AJqddgYzJk	\N	low	success	\N	{}	2025-09-01 22:44:36.837+05:30	2025-09-01 22:44:36.838+05:30	2025-09-01 22:44:36.838+05:30	\N
691aac7b-67b1-4fe2-b131-c3842502ec3c	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 22:44:51.152+05:30	2025-09-01 22:44:51.153+05:30	2025-09-01 22:44:51.153+05:30	\N
596813e2-64e2-4e69-8fb4-fdcf937642a2	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 22:44:51.176+05:30	2025-09-01 22:44:51.177+05:30	2025-09-01 22:44:51.177+05:30	\N
2b6d1527-00f0-4ca2-b675-374220b9636d	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "-YKLFUWEyIDZnkcAH-XEyLaLrzTDYhbB"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 22:53:57.743+05:30	2025-09-01 22:53:57.745+05:30	2025-09-01 22:53:57.745+05:30	\N
44041871-2965-4fb7-89be-a58aa6121ed8	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	gXKGL8F_jjtjW9PCwRvHDMyR75Uvrj3k	\N	low	success	\N	{}	2025-09-01 22:54:06.741+05:30	2025-09-01 22:54:06.741+05:30	2025-09-01 22:54:06.741+05:30	\N
5f73fca5-3a15-4902-9c62-f60f88b9e74b	12651c11-529c-472c-9a17-4d2102115425	\N	access_granted	system	\N	{"doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "2ae37e9a-59ee-43a3-ab02-3ba4828ec70b"}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 22:54:27.901+05:30	2025-09-01 22:54:27.901+05:30	2025-09-01 22:54:27.901+05:30	\N
c07d3fc9-5c4c-4b7a-b148-0f3c6ebe66c9	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "ew3LKMkuhFlMgf-1zpTSH8QV1BMvKEcd"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 22:54:34.948+05:30	2025-09-01 22:54:34.948+05:30	2025-09-01 22:54:34.948+05:30	\N
26bf9f51-9fe4-4140-8efd-15417072213b	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ROHxJ9mWSPtv0akbb5C-X_KUZ2NDUJz_	\N	low	success	\N	{}	2025-09-01 22:54:43.741+05:30	2025-09-01 22:54:43.742+05:30	2025-09-01 22:54:43.742+05:30	\N
5241c3d2-213e-4699-80c2-4d97dc4403ac	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	xrmn5lCLx6N8pWSKnt3fGP8wwH8f3NNG	\N	low	success	\N	{}	2025-09-01 22:59:05.775+05:30	2025-09-01 22:59:05.775+05:30	2025-09-01 22:59:05.775+05:30	\N
d3549819-d6d5-4ced-b966-8fee0f15b486	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	TelU7R3vMUt1WlCxsswSEg-U91J3ePOu	\N	low	success	\N	{}	2025-09-01 23:02:15.346+05:30	2025-09-01 23:02:15.346+05:30	2025-09-01 23:02:15.346+05:30	\N
0da23288-2a7d-4197-9a6c-8242c7969fd0	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	zbKITZTzCUTtAX-CX2Rfg5VD3R13Mz4A	\N	low	success	\N	{}	2025-09-01 23:09:40.734+05:30	2025-09-01 23:09:40.734+05:30	2025-09-01 23:09:40.734+05:30	\N
8d0515d4-06b8-4ea3-b21b-23094308ced8	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	edslK7f0bSNii-wcb41Csv6x5iPkUmCL	\N	low	success	\N	{}	2025-09-01 23:12:04.784+05:30	2025-09-01 23:12:04.784+05:30	2025-09-01 23:12:04.784+05:30	\N
42207188-d6b7-4788-82fd-bf35c55cc34a	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	XsHhTfB8WKJveQj2kEpoo0lqzNfG3A9q	\N	low	success	\N	{}	2025-09-01 23:15:26.799+05:30	2025-09-01 23:15:26.8+05:30	2025-09-01 23:15:26.8+05:30	\N
15b98e2a-ef65-499c-8079-fea64dce1bed	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	HTyjc7JBC5eOmHTAdYMAE2B5itD9Ohw9	\N	low	success	\N	{}	2025-09-01 23:19:19.637+05:30	2025-09-01 23:19:19.637+05:30	2025-09-01 23:19:19.637+05:30	\N
4c145611-c852-438a-8d15-5c08853098ab	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	f_ChZagjiDWI7RICMqwLi-r0Ikza55G-	\N	low	success	\N	{}	2025-09-01 23:41:09.577+05:30	2025-09-01 23:41:09.577+05:30	2025-09-01 23:41:09.577+05:30	\N
e72669f1-cdd3-49fa-9610-3783795b3b6e	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-01T18:11:14.148Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-01 23:41:14.148+05:30	2025-09-01 23:41:14.148+05:30	2025-09-01 23:41:14.148+05:30	\N
7e68d14e-4397-45da-b7c6-745b7727258e	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_attachment	file	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_attachment", "fileName": "ad1.png", "ipAddress": "::1", "timestamp": "2025-09-01T18:11:19.138Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-01 23:41:19.138+05:30	2025-09-01 23:41:19.138+05:30	2025-09-01 23:41:19.138+05:30	\N
d2bd9b6f-6f0e-4d37-8224-78396a81501f	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "JNESDSR5H_VXqE8Ot5pELhQ6Gks0FxFt"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-01 23:43:00.902+05:30	2025-09-01 23:43:00.902+05:30	2025-09-01 23:43:00.902+05:30	\N
6f9fb174-6c42-4d32-ba2e-a590a7730314	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	XE_D_XWF6hbty0bvV7gouB2rTP_kOytC	\N	low	success	\N	{}	2025-09-01 23:43:14.015+05:30	2025-09-01 23:43:14.015+05:30	2025-09-01 23:43:14.015+05:30	\N
80e407b9-e051-43ea-b936-cc16bb4a5292	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	GRIWCiePNu40Y7o6eS21VY5YB5xbD9od	\N	low	success	\N	{}	2025-09-01 23:46:36.317+05:30	2025-09-01 23:46:36.318+05:30	2025-09-01 23:46:36.318+05:30	\N
f130898d-a5b4-4592-8d6e-344e9a3f2673	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Ni_S8vueNw2rdbENKmDcCyCl1NhrMRUp	\N	low	success	\N	{}	2025-09-01 23:48:30.654+05:30	2025-09-01 23:48:30.654+05:30	2025-09-01 23:48:30.654+05:30	\N
b887028c-a0e1-4c39-9f32-0aa4ee95c182	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	1451c465-ef8e-4313-8a55-bb55b61f7777	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 23:48:38.061+05:30	2025-09-01 23:48:38.061+05:30	2025-09-01 23:48:38.061+05:30	\N
2f3b7f43-a16f-4292-8b40-8b9b33480bb1	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	a9c1ac20-4af9-484e-b941-77d91f53ba54	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 23:49:54.007+05:30	2025-09-01 23:49:54.007+05:30	2025-09-01 23:49:54.007+05:30	\N
d7ba773e-1af5-4594-b45c-8553549ac7d7	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	8-sizt7G6xlrkqqmiXOT9ZNutuME2Vnh	\N	low	success	\N	{}	2025-09-01 23:57:31.222+05:30	2025-09-01 23:57:31.222+05:30	2025-09-01 23:57:31.222+05:30	\N
2c8102f1-ac89-45ce-8438-5bd91345f891	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	1451c465-ef8e-4313-8a55-bb55b61f7777	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 23:57:57.473+05:30	2025-09-01 23:57:57.474+05:30	2025-09-01 23:57:57.474+05:30	\N
5c18f0f7-3dbd-4b0d-a3cc-b0e4753fd44f	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	a9c1ac20-4af9-484e-b941-77d91f53ba54	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-01 23:58:08.893+05:30	2025-09-01 23:58:08.894+05:30	2025-09-01 23:58:08.894+05:30	\N
7bd1da5b-4160-477a-adb6-21a8258f441c	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ZprYLUhzyVSHY0fLupn9kPvVr2GEzdGq	\N	low	success	\N	{}	2025-09-02 00:02:49.43+05:30	2025-09-02 00:02:49.43+05:30	2025-09-02 00:02:49.43+05:30	\N
40afa0a8-4eae-468e-8fe7-e63c3d5f81f0	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	a9c1ac20-4af9-484e-b941-77d91f53ba54	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-02 00:03:04.597+05:30	2025-09-02 00:03:04.597+05:30	2025-09-02 00:03:04.597+05:30	\N
1697ca54-334c-4c8d-99c3-bb4d3a4c91b9	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	1451c465-ef8e-4313-8a55-bb55b61f7777	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-02 00:03:23.236+05:30	2025-09-02 00:03:23.236+05:30	2025-09-02 00:03:23.236+05:30	\N
d73e087e-8a82-44ea-84af-94250a85c310	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	-m7rn3iwrJVpELaUZ9GBEgJ-R9G6TC8f	\N	low	success	\N	{}	2025-09-02 11:27:17.883+05:30	2025-09-02 11:27:17.884+05:30	2025-09-02 11:27:17.884+05:30	\N
d5beb036-8c1a-484e-8348-a23d8cb9019a	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-02T05:57:29.624Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-02 11:27:29.624+05:30	2025-09-02 11:27:29.624+05:30	2025-09-02 11:27:29.624+05:30	\N
742276d9-d8c1-4c46-a380-61cdb29068c7	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	DGCWucWNtjAWhAQCjRuAafwfGbTjGG5H	\N	low	success	\N	{}	2025-09-02 11:41:41.046+05:30	2025-09-02 11:41:41.046+05:30	2025-09-02 11:41:41.046+05:30	\N
5ba385bb-be87-4ec7-a972-909ef5659ed6	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	4RrbWYZsioctOA-LeWwlSjhg2-Bqh5Pg	\N	low	success	\N	{}	2025-09-02 12:12:23.924+05:30	2025-09-02 12:12:23.924+05:30	2025-09-02 12:12:23.924+05:30	\N
28be67c5-daec-48da-a327-c729f4ae90be	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-02T06:42:42.478Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-02 12:12:42.478+05:30	2025-09-02 12:12:42.479+05:30	2025-09-02 12:12:42.479+05:30	\N
e7f27d16-be21-49ea-bffb-03d925263e5b	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	W1MB3S3osGV7fiMzGxUj5p3Um738vAih	\N	low	success	\N	{}	2025-09-02 12:42:39.789+05:30	2025-09-02 12:42:39.79+05:30	2025-09-02 12:42:39.79+05:30	\N
0b699dfc-b166-40f4-adf4-87cadbd92349	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-02T07:17:22.006Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-02 12:47:22.006+05:30	2025-09-02 12:47:22.007+05:30	2025-09-02 12:47:22.007+05:30	\N
e5bf7880-60bc-4458-aa27-3c9b7f3ee836	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_attachment	file	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_attachment", "fileName": "ad1.png", "ipAddress": "::1", "timestamp": "2025-09-02T07:19:42.593Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-02 12:49:42.593+05:30	2025-09-02 12:49:42.594+05:30	2025-09-02 12:49:42.594+05:30	\N
8b30df4c-4ce5-438b-8877-fff649657374	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "CjEzfeIJwWsYs4lVP_A9dSWVC9hdZsnV"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-02 13:04:38.449+05:30	2025-09-02 13:04:38.453+05:30	2025-09-02 13:04:38.453+05:30	\N
d8fde09f-5104-40e4-90f7-07ce3c83528a	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	C3YNhGwnVJDsFb-3E8dtosXJvWbZ-_Tz	\N	low	success	\N	{}	2025-09-02 13:04:49.47+05:30	2025-09-02 13:04:49.47+05:30	2025-09-02 13:04:49.47+05:30	\N
68149afc-f3f0-47d5-a493-a8e86344f4c8	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	1451c465-ef8e-4313-8a55-bb55b61f7777	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-02 13:07:07.953+05:30	2025-09-02 13:07:07.954+05:30	2025-09-02 13:07:07.954+05:30	\N
4a9aeefa-971c-41a9-a123-1064397152ec	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	013wVn6SRrpJEyUFfAoW1Jcxg-JNrSKl	\N	low	success	\N	{}	2025-09-02 17:05:45.233+05:30	2025-09-02 17:05:45.235+05:30	2025-09-02 17:05:45.235+05:30	\N
25a4c6ee-4ed7-4ae7-8537-5256b43c44f4	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-02T11:45:39.097Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-02 17:15:39.099+05:30	2025-09-02 17:15:39.1+05:30	2025-09-02 17:15:39.1+05:30	\N
62064b11-ad81-4eb6-8a56-0058f276b778	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	kNB8Ndp33o9z03L7YJSbutOF4RkcHkIU	\N	low	success	\N	{}	2025-09-02 18:38:05.97+05:30	2025-09-02 18:38:05.97+05:30	2025-09-02 18:38:05.97+05:30	\N
24e919c0-c9fb-484e-9b3f-bbb881724ffa	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Zq-wxe7u7_gEl2cJNKzGBf-btXlJVViv	\N	low	success	\N	{}	2025-09-02 18:40:13.658+05:30	2025-09-02 18:40:13.659+05:30	2025-09-02 18:40:13.659+05:30	\N
3606b7de-3e27-4003-8997-ea374896e7e0	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ihEoWplKw20Ih6yqyy5IAvj06ikRQBIh	\N	low	success	\N	{}	2025-09-02 18:44:30.201+05:30	2025-09-02 18:44:30.202+05:30	2025-09-02 18:44:30.202+05:30	\N
62f6cb72-229c-4aff-90b4-12ac7937cdb8	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	1VgcBYVt52_z4nKUz8yl9u3WMUfshKOa	\N	low	success	\N	{}	2025-09-02 18:48:34.459+05:30	2025-09-02 18:48:34.459+05:30	2025-09-02 18:48:34.459+05:30	\N
5a756550-4b4d-4af0-984a-a2b266bf3fdb	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "ask49zru3iMOGAOFD10py45RpzEGi8Ft"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 16:48:50.537+05:30	2025-09-03 16:48:50.537+05:30	2025-09-03 16:48:50.537+05:30	\N
4608b7ac-783c-4c26-83e1-d71bd99a5f2a	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Iz0e_UjmdsqbijyjOti_syolrxVqYigP	\N	low	success	\N	{}	2025-09-03 00:59:42.398+05:30	2025-09-03 00:59:42.399+05:30	2025-09-03 00:59:42.399+05:30	\N
f4026035-4f7a-4984-bb81-5c98351e57e8	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "xBaHsMeMGCmmw3e5A2EsNP4PVKfRWTHO"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 00:59:59.263+05:30	2025-09-03 00:59:59.264+05:30	2025-09-03 00:59:59.264+05:30	\N
a0ce8ab2-4b23-4dd8-8faa-0fcadac886ad	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	-hX_KVlzW5jseeXbtlPEswJjxQtyW4n7	\N	low	success	\N	{}	2025-09-03 01:00:18.16+05:30	2025-09-03 01:00:18.16+05:30	2025-09-03 01:00:18.16+05:30	\N
6cb34ee0-e619-45d1-8147-696960031b41	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-02T19:30:45.572Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-03 01:00:45.573+05:30	2025-09-03 01:00:45.575+05:30	2025-09-03 01:00:45.575+05:30	\N
b92d3358-f8d5-4f7b-990e-27302bac5d53	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "Jenw76zTV2owRqrO0zEiBtojSBhmXkLS"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 01:06:09.586+05:30	2025-09-03 01:06:09.586+05:30	2025-09-03 01:06:09.586+05:30	\N
db1240e0-0e71-42f5-8a47-96f6b459f682	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	r_EWCxDtD9aqho9a3qqpVyBkRwNks3rP	\N	low	success	\N	{}	2025-09-03 01:06:32.116+05:30	2025-09-03 01:06:32.116+05:30	2025-09-03 01:06:32.116+05:30	\N
013b2c6c-6234-4b08-8112-31634831c061	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	sGuzNhEjPEz6WG2HKNFS9sPo9Mhhh0eP	\N	low	success	\N	{}	2025-09-03 01:11:23.046+05:30	2025-09-03 01:11:23.046+05:30	2025-09-03 01:11:23.046+05:30	\N
01dbbd93-aee6-4c7e-b95f-5c4dcba79dd1	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	P8FUqFWvQKSvm122OYvQkVJRazeshHIs	\N	low	success	\N	{}	2025-09-03 01:23:40.188+05:30	2025-09-03 01:23:40.188+05:30	2025-09-03 01:23:40.188+05:30	\N
f797111c-7221-4202-ad18-cef569700eb3	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	bzrtB_MfGPc9IxMnXC-Lo-yDIxJ9a020	\N	low	success	\N	{}	2025-09-03 01:23:40.162+05:30	2025-09-03 01:23:40.162+05:30	2025-09-03 01:23:40.162+05:30	\N
dfef054c-2174-47dd-8839-e35c5ad44589	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	JZr-5Y8Wx-8FVD3i98e1zsWxRGIsi_Il	\N	low	success	\N	{}	2025-09-03 02:20:57.128+05:30	2025-09-03 02:20:57.129+05:30	2025-09-03 02:20:57.129+05:30	\N
38586a61-6704-4f13-8752-733ddfa20572	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "lpXXj6zmeBixbWq3XZd1NTU04dzUAyHT"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 02:21:39.196+05:30	2025-09-03 02:21:39.196+05:30	2025-09-03 02:21:39.196+05:30	\N
77650ac7-f34a-46a1-a0d3-33da36563f98	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	wCD_DYpo3E8crTGF9XwdOhGEy0jBQfN0	\N	low	success	\N	{}	2025-09-03 02:21:52.871+05:30	2025-09-03 02:21:52.871+05:30	2025-09-03 02:21:52.871+05:30	\N
1465366d-f353-4cb8-aaa4-a0bb808647e3	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	cLH5Gxe_FxV2m2_BzzIH78bKArB_xw1r	\N	low	success	\N	{}	2025-09-03 02:35:06.108+05:30	2025-09-03 02:35:06.108+05:30	2025-09-03 02:35:06.108+05:30	\N
3a545f21-f5a0-4cd7-9031-d3049ca7129a	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	t11jzjHVUMkGJaKl22y6sQWJIoVdW4Mp	\N	low	success	\N	{}	2025-09-03 02:35:39.416+05:30	2025-09-03 02:35:39.416+05:30	2025-09-03 02:35:39.416+05:30	\N
0f6e2b17-7169-4ffd-8b12-f5cea8cf5df6	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Gz5iukkf6ex7JDrfSCWf98WH1R_wXW9d	\N	low	success	\N	{}	2025-09-03 13:18:56.447+05:30	2025-09-03 13:18:56.448+05:30	2025-09-03 13:18:56.448+05:30	\N
8330e25d-53ec-4844-90f0-fb01514a715e	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c_sE_ffD42HlKz5wJORiJrLPFYMMapVs	\N	low	success	\N	{}	2025-09-03 13:19:10.182+05:30	2025-09-03 13:19:10.182+05:30	2025-09-03 13:19:10.182+05:30	\N
51093f5f-2d5f-464a-9b7a-6084c559011a	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "YjuXGnZ2kQr3uPVRkoJc4HmpX_Blcufe"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 13:20:03.513+05:30	2025-09-03 13:20:03.513+05:30	2025-09-03 13:20:03.513+05:30	\N
c9b7170a-6bee-480f-a961-6b9f3523136d	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	LQWo-7arpxROspf74Fs8cGHaRjI06k8h	\N	low	success	\N	{}	2025-09-03 13:20:15.947+05:30	2025-09-03 13:20:15.952+05:30	2025-09-03 13:20:15.952+05:30	\N
62e069d9-773d-471d-9b3b-6c11f8348a8d	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	bcWPIWXv7FefDx-1N_6AMurHF53I6er9	\N	low	success	\N	{}	2025-09-03 13:58:43.671+05:30	2025-09-03 13:58:43.671+05:30	2025-09-03 13:58:43.671+05:30	\N
8ec06549-8985-4b33-950d-61d5faba0425	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T08:29:05.038Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-03 13:59:05.038+05:30	2025-09-03 13:59:05.038+05:30	2025-09-03 13:59:05.038+05:30	\N
4b193f71-d1d6-4126-8603-89e59ff98f85	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "wmq9afU3TsFMYX7oNp-bdIq068vHeLor"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 16:24:20.986+05:30	2025-09-03 16:24:21+05:30	2025-09-03 16:24:21+05:30	\N
79de2f31-238b-4610-829b-bd9cfabf5c3c	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	j3W2VQ-cXm01qj9Nl81kmL6QMta1n-hE	\N	low	success	\N	{}	2025-09-03 16:24:30.884+05:30	2025-09-03 16:24:30.884+05:30	2025-09-03 16:24:30.884+05:30	\N
a0257c1c-541c-4c56-b62f-bef8fc887b22	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	iBes3F24-c1ZBOtvShRU7tdhrIoJgNlM	\N	low	success	\N	{}	2025-09-03 16:31:41.438+05:30	2025-09-03 16:31:41.439+05:30	2025-09-03 16:31:41.439+05:30	\N
573333ae-7f8d-49c1-bd0a-9b87330d4273	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "6XzbG7Ihzw8iyWjIYU41wMlGe_6REKdK"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 16:31:45.126+05:30	2025-09-03 16:31:45.126+05:30	2025-09-03 16:31:45.126+05:30	\N
ea7d1a30-3ee1-46c1-a5a5-c5384737de83	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	_3RYAY76jUskK9X_ZH-76FgWnQoEMAkN	\N	low	success	\N	{}	2025-09-03 16:31:55.49+05:30	2025-09-03 16:31:55.491+05:30	2025-09-03 16:31:55.491+05:30	\N
5db3e237-bc70-4c65-8965-05fbdeef2b18	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	5stzJgEwUgwJitx4mRG3yH_2Qhu7U2_I	\N	low	success	\N	{}	2025-09-03 16:39:03.486+05:30	2025-09-03 16:39:03.486+05:30	2025-09-03 16:39:03.486+05:30	\N
ba21c252-cd59-4592-beeb-4babfd0ddac5	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	uAJRxF7Zs5TYaX-5RPSpeFUZl-M5RCvx	\N	low	success	\N	{}	2025-09-03 16:43:05.804+05:30	2025-09-03 16:43:05.804+05:30	2025-09-03 16:43:05.804+05:30	\N
2f80cb6e-ddbc-4fd8-9619-7626e84b8155	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	gVaqXycuKFYyrayLd4trWWawPy2usqqB	\N	low	success	\N	{}	2025-09-03 16:48:44.774+05:30	2025-09-03 16:48:44.774+05:30	2025-09-03 16:48:44.774+05:30	\N
8436457e-be54-4946-abcc-64d3642cbb96	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	E9bvac_W1j1QPdKU2zjmi0T-bUiHlPvA	\N	low	success	\N	{}	2025-09-03 16:49:12.563+05:30	2025-09-03 16:49:12.563+05:30	2025-09-03 16:49:12.563+05:30	\N
c4f3c53b-f37c-4d13-ad49-e387f36e2d8f	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	QYtGt52Cgblc2iBaEAnwO4tS1seE0ZrW	\N	low	success	\N	{}	2025-09-03 17:01:07.02+05:30	2025-09-03 17:01:07.021+05:30	2025-09-03 17:01:07.021+05:30	\N
5bb3697e-64e9-4470-a2c5-e57a30c70fe1	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "RO72_sam4jllj4YVxAmFNygm83dL8twN"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 17:01:27.831+05:30	2025-09-03 17:01:27.832+05:30	2025-09-03 17:01:27.832+05:30	\N
9c8e4d95-47b5-4a30-ab92-35158e777b18	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	kBzX_mPAMszfw18ddZ-9E9Hubw3dnP20	\N	low	success	\N	{}	2025-09-03 17:01:40.466+05:30	2025-09-03 17:01:40.466+05:30	2025-09-03 17:01:40.466+05:30	\N
1baf25fb-a7e9-4c5a-b1c1-42b66d43209d	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T11:32:23.856Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-03 17:02:23.857+05:30	2025-09-03 17:02:23.857+05:30	2025-09-03 17:02:23.857+05:30	\N
b4abda5e-a0ad-4c0b-af73-8ab1821e82c8	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "FwI1697bB39nwFZIy1dajIgR-w8u3pIE"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 17:05:16.294+05:30	2025-09-03 17:05:16.294+05:30	2025-09-03 17:05:16.294+05:30	\N
1b272ce8-0b1b-4f9b-9310-827a97efcf4b	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	GH-1mwjOZPNsjNQIIKLolvK9cbjWaKxG	\N	low	success	\N	{}	2025-09-03 17:05:26.861+05:30	2025-09-03 17:05:26.861+05:30	2025-09-03 17:05:26.861+05:30	\N
1c60f361-7614-4b8e-98ca-25fff9f856c8	12651c11-529c-472c-9a17-4d2102115425	12651c11-529c-472c-9a17-4d2102115425	report_download	access_request	a9c1ac20-4af9-484e-b941-77d91f53ba54	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-03 17:05:44.116+05:30	2025-09-03 17:05:44.117+05:30	2025-09-03 17:05:44.117+05:30	\N
cd73a964-7a2a-467a-9d40-8bd947384660	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "j_S-BqTNWr1FTqB9I-wpf8l7y_-Nlwf2"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 17:06:38.932+05:30	2025-09-03 17:06:38.932+05:30	2025-09-03 17:06:38.932+05:30	\N
6041d2f9-2071-4851-b0ef-b607bebe3204	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	56nzU292OI2fD_q5UZckBVBXgLaC1OPp	\N	low	success	\N	{}	2025-09-03 17:06:49.414+05:30	2025-09-03 17:06:49.415+05:30	2025-09-03 17:06:49.415+05:30	\N
ec7d336d-5fce-4269-b5ab-189b276b9a3b	786a81dd-30ca-4cad-a697-4c51f3a6d1f7	\N	user_registration	system	\N	{"role": "patient", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 17:07:54.332+05:30	2025-09-03 17:07:54.332+05:30	2025-09-03 17:07:54.332+05:30	\N
1103182e-c371-4f23-927e-d01db99673c3	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "ZtGHDH-8ojivvIWz42xvn3ktpvuneurz"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-03 17:18:57.571+05:30	2025-09-03 17:18:57.571+05:30	2025-09-03 17:18:57.571+05:30	\N
f17057eb-fd32-44e3-80c8-98f5c97028e6	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	sT3yphef6LGcdYBLgx0O5QR0NUExtf9j	\N	low	success	\N	{}	2025-09-03 17:21:43.955+05:30	2025-09-03 17:21:43.956+05:30	2025-09-03 17:21:43.956+05:30	\N
b9ba965d-1462-44ac-a4ac-89c07a7ef33b	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	NGtuc5cTVwIiUbovs753FqACegRyGEZj	\N	low	success	\N	{}	2025-09-03 17:43:22.884+05:30	2025-09-03 17:43:22.884+05:30	2025-09-03 17:43:22.884+05:30	\N
0a583986-1cf6-4d5c-bd58-d047a1fff78c	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	gfgeO_e0ptag9NmtpS9qZ-ULYADD8Nep	\N	low	success	\N	{}	2025-09-03 17:43:26.36+05:30	2025-09-03 17:43:26.361+05:30	2025-09-03 17:43:26.361+05:30	\N
27a865f2-fc29-4d4c-959f-30c0f6f679e8	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	9T372g68jLlUb67Vy-yZiVsz7gZagG1h	\N	low	success	\N	{}	2025-09-03 17:51:50.39+05:30	2025-09-03 17:51:50.39+05:30	2025-09-03 17:51:50.39+05:30	\N
4c43647c-2af3-40a2-b097-eef4abf9d15a	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	UxO0YPnIt5WaIhSMa3DebK2xXdNWWYOf	\N	low	success	\N	{}	2025-09-03 17:56:55.439+05:30	2025-09-03 17:56:55.439+05:30	2025-09-03 17:56:55.439+05:30	\N
949dd2be-1be7-4068-9f42-c2691c514919	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	5FWaXQp-Zq-P1VZGKQqxZajI0B3ama8Z	\N	low	success	\N	{}	2025-09-04 01:39:54.24+05:30	2025-09-04 01:39:54.24+05:30	2025-09-04 01:39:54.24+05:30	\N
82dc39a7-c0e0-4115-8899-ccc500df1d70	381349ca-3e04-4a37-b964-84f06049e258	\N	user_registration	system	\N	{"role": "patient", "ipAddress": "::1", "registrationMethod": "email"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 01:42:27.608+05:30	2025-09-04 01:42:27.609+05:30	2025-09-04 01:42:27.609+05:30	\N
52103abc-ae0b-4a7a-a6eb-44ae67f37e4f	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	record_upload	medical_record	ba46230d-f714-4eed-82bb-ce59ad448312	{"message": "Doctor created medical record: heart surgery"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	F9gS7K1C3hyO0CsbfxpWVA7QtUhFFJAg	\N	low	success	\N	{}	2025-09-04 01:45:52.265+05:30	2025-09-04 01:45:52.267+05:30	2025-09-04 01:45:52.267+05:30	\N
abc85c39-020b-4195-85dc-fcd3ee676b4c	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	yJHFYnk9h8Ni1O_VfDkbWal7QDk6VQAa	\N	low	success	\N	{}	2025-09-04 02:39:14.94+05:30	2025-09-04 02:39:14.941+05:30	2025-09-04 02:39:14.941+05:30	\N
5027d8bf-d5eb-4fad-a5a8-a79d6c813074	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	55GlmXY6c7iRlDcESiWuhRh-SX3uWAb0	\N	low	success	\N	{}	2025-09-04 02:42:45.774+05:30	2025-09-04 02:42:45.774+05:30	2025-09-04 02:42:45.774+05:30	\N
4b4c8341-0944-4464-ade5-351d2d64c7bb	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2DBVbH0XW5tnqFtwEbRtFigamLDli-sH	\N	low	success	\N	{}	2025-09-04 02:47:45.544+05:30	2025-09-04 02:47:45.545+05:30	2025-09-04 02:47:45.545+05:30	\N
a6117a89-be84-4bcd-919b-1b9651a0051d	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	pjh_HCnm5iNpnv6nDtLQP6yJgoYD6Rms	\N	low	success	\N	{}	2025-09-04 02:50:18.46+05:30	2025-09-04 02:50:18.46+05:30	2025-09-04 02:50:18.46+05:30	\N
5e2a23d2-3c18-44e1-86f8-eef456c8a653	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	7neyBJQzEFQ5PtxV_jtUj4kESSwn4nCW	\N	low	success	\N	{}	2025-09-04 02:56:11.202+05:30	2025-09-04 02:56:11.202+05:30	2025-09-04 02:56:11.202+05:30	\N
a7e215ae-7dee-4b7b-abfb-d5cd7d34c3d3	0fdbb5be-9043-493e-a0c0-0129e4855098	1760e03b-bb23-43e2-88c4-5d3b175be8fd	user_deleted	user	1760e03b-bb23-43e2-88c4-5d3b175be8fd	{"message": "Doctor removed patient account: jane@example.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	low	success	\N	{}	2025-09-04 02:56:45.048+05:30	2025-09-04 02:56:45.049+05:30	2025-09-04 02:56:45.049+05:30	\N
1ff6fa10-28d3-4559-b53a-a7d05970f875	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	pyjHe1HtMcki6QFef1jElfKjxFgSWjuH	\N	low	success	\N	{}	2025-09-04 03:09:45.848+05:30	2025-09-04 03:09:45.848+05:30	2025-09-04 03:09:45.848+05:30	\N
ca7b21a4-b2c4-49c9-b254-70a31c87186f	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2Lfmvf85tOcqss-c1AxeLXiaVaz-k0cu	\N	low	success	\N	{}	2025-09-04 03:12:51.019+05:30	2025-09-04 03:12:51.019+05:30	2025-09-04 03:12:51.019+05:30	\N
dcea4c11-6d20-4fac-b63f-b7a08ee8731c	0fdbb5be-9043-493e-a0c0-0129e4855098	1760e03b-bb23-43e2-88c4-5d3b175be8fd	record_delete	medical_record	35cb17c4-bf88-43ce-b4bd-13a551a6bf16	{"message": "Doctor permanently deleted medical record: CT Scan"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	high	success	\N	{}	2025-09-04 03:13:04.857+05:30	2025-09-04 03:13:04.857+05:30	2025-09-04 03:13:04.857+05:30	\N
91357ec5-8163-49bd-a1a3-3fece6612110	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	07mJeOLHHYya6G6E8ePEZ9mitxc1Ywhx	\N	low	success	\N	{}	2025-09-04 03:15:52.397+05:30	2025-09-04 03:15:52.398+05:30	2025-09-04 03:15:52.398+05:30	\N
20fda7cb-0fdb-4c09-9165-77582fe810c0	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	a02548cb-e72d-438e-baae-dfbdaf75be69	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 03:16:48.823+05:30	2025-09-04 03:16:48.823+05:30	2025-09-04 03:16:48.823+05:30	\N
2b7ef687-6a21-4c82-be07-f1f96ed917e9	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	a02548cb-e72d-438e-baae-dfbdaf75be69	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 03:16:48.84+05:30	2025-09-04 03:16:48.84+05:30	2025-09-04 03:16:48.84+05:30	\N
3f1aadec-dfba-4819-807e-423174567df9	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "NSTHM3sOdKSq2DfBTg-j5R1K6ucBRaKt"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 03:17:42.037+05:30	2025-09-04 03:17:42.038+05:30	2025-09-04 03:17:42.038+05:30	\N
f754f37b-d9ff-4057-9e1c-0b44f710ac53	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	eFDeU3vKaSu8jhWHhhYLwN1RqaMEVt_y	\N	low	success	\N	{}	2025-09-04 03:17:54.605+05:30	2025-09-04 03:17:54.605+05:30	2025-09-04 03:17:54.605+05:30	\N
ca44da05-0968-4f06-a5be-df8a028c08f8	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Bk-Hbdi8leejM2hvJbggIQM32bKLsJIq	\N	low	success	\N	{}	2025-09-04 03:24:04.067+05:30	2025-09-04 03:24:04.067+05:30	2025-09-04 03:24:04.067+05:30	\N
7286d055-4fb9-4758-95f0-79739114eab5	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T21:56:14.815Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 03:26:14.822+05:30	2025-09-04 03:26:14.823+05:30	2025-09-04 03:26:14.823+05:30	\N
34dcae24-c62a-4f17-b0a8-757267bf1147	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "p88hAVjrTp85mszDpN6ma-0nALYz7dpD"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 03:30:05.885+05:30	2025-09-04 03:30:05.886+05:30	2025-09-04 03:30:05.886+05:30	\N
0460e819-4ac4-4337-be8e-28710276e877	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	5ZLc3VIzG1mo9LLJZfXzX9rBrN0ApDW3	\N	low	success	\N	{}	2025-09-04 03:30:25.892+05:30	2025-09-04 03:30:25.892+05:30	2025-09-04 03:30:25.892+05:30	\N
c2fab03a-2944-4519-a5d1-ebad1e2f0d4f	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	EodLA-azKarC9THsSXKNKPDgEARjd-Cz	\N	low	success	\N	{}	2025-09-04 03:32:49.118+05:30	2025-09-04 03:32:49.118+05:30	2025-09-04 03:32:49.118+05:30	\N
b5b7cbb2-7b9c-4753-9b13-c23f5db4aac9	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "Fbjn3J3-sVvEHmZQVMa3F0iBJ7-zp2Us"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 03:39:52.045+05:30	2025-09-04 03:39:52.045+05:30	2025-09-04 03:39:52.045+05:30	\N
950f9327-a980-49de-b33a-e84d6551137f	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Oto3xNInSrTGGPg16a2vk3fEFJd6U9ZC	\N	low	success	\N	{}	2025-09-04 03:40:05.123+05:30	2025-09-04 03:40:05.124+05:30	2025-09-04 03:40:05.124+05:30	\N
da76e028-d98d-452e-9e6b-52d13d5f2293	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "LVKN5xNpY0-KTEloQTGHwKLfSy8wsPMQ"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 03:55:38.613+05:30	2025-09-04 03:55:38.615+05:30	2025-09-04 03:55:38.615+05:30	\N
cdddf229-94d1-4056-a8b1-cba59a54a290	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	FTfYnR4fE5s8yEeDM9rPFPQy-H-cBhc8	\N	low	success	\N	{}	2025-09-04 03:55:52.434+05:30	2025-09-04 03:55:52.434+05:30	2025-09-04 03:55:52.434+05:30	\N
4277314f-517f-4e1e-a635-bd86329c52e7	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "E20kbba3x91tTnGP9Dqa9_Fyou2WxRus"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 03:57:51.299+05:30	2025-09-04 03:57:51.299+05:30	2025-09-04 03:57:51.299+05:30	\N
59377b2c-d95e-4e6d-90ea-21cfb9c57315	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c4pV0zXUWHZwKnxoDBZhr6OO4GIe-ZrL	\N	low	success	\N	{}	2025-09-04 03:58:04.087+05:30	2025-09-04 03:58:04.087+05:30	2025-09-04 03:58:04.087+05:30	\N
be2c861d-6465-4a8d-af68-85e9377fa287	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "e6uBicsBPMoLTzXgnEN7_YCPXvR9Ubz_"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 04:01:19.867+05:30	2025-09-04 04:01:19.868+05:30	2025-09-04 04:01:19.868+05:30	\N
8d7d11cd-4329-49b6-934c-2b47a51240f2	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	RwlFPnj1LsJc-yVmBqvQOt3xKjzwmOMf	\N	low	success	\N	{}	2025-09-04 04:01:32.246+05:30	2025-09-04 04:01:32.246+05:30	2025-09-04 04:01:32.246+05:30	\N
c3ffd995-da0c-4bc6-8c50-3e4d6a5c60e3	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "4PnrIwPRFXatJTgb3Y1hUSjKprtKJCah"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 04:05:38.773+05:30	2025-09-04 04:05:38.773+05:30	2025-09-04 04:05:38.773+05:30	\N
ca55e523-de5b-4f30-aedd-96f5eb08e456	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	RAC2Js6yImp-5OBx3mODyjIt5tGaYeLd	\N	low	success	\N	{}	2025-09-04 04:05:54.335+05:30	2025-09-04 04:05:54.335+05:30	2025-09-04 04:05:54.335+05:30	\N
1d9c019d-9716-46f3-99fc-82786f65556a	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	nfxh7RCtUlhx9p4Lna1Bn9h9EtnWVnoc	\N	low	success	\N	{}	2025-09-04 04:20:41.234+05:30	2025-09-04 04:20:41.234+05:30	2025-09-04 04:20:41.234+05:30	\N
5d1924cd-1504-46d9-b1a0-08d97000dd5d	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	VjGR1s48F7x-iXBr-glYRO-WKO7RLCpd	\N	low	success	\N	{}	2025-09-04 04:22:03.035+05:30	2025-09-04 04:22:03.035+05:30	2025-09-04 04:22:03.035+05:30	\N
ba4b136b-b3ff-4fe9-9197-2b8cebf62ba9	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	_wcyppskiossxM2o-5k-iACxxT5yZylk	\N	low	success	\N	{}	2025-09-04 04:22:20.543+05:30	2025-09-04 04:22:20.543+05:30	2025-09-04 04:22:20.543+05:30	\N
93f03a7e-96ce-4bd9-aded-aa22bd73df27	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 04:29:29.838+05:30	2025-09-04 04:29:29.839+05:30	2025-09-04 04:29:29.839+05:30	\N
17c22d82-d662-43cb-87c2-ba5fed7283d5	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	access_request	access_request	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 04:29:29.88+05:30	2025-09-04 04:29:29.881+05:30	2025-09-04 04:29:29.881+05:30	\N
66a2ecf0-4b98-4873-a8ad-e8ff0066fbc1	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "MXWR4OGy-NlOwc0O8YolNMVdysDOjpVE"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 04:29:52.246+05:30	2025-09-04 04:29:52.246+05:30	2025-09-04 04:29:52.246+05:30	\N
435f5e58-65c4-4cb3-8e8d-3c35e58e75bd	12651c11-529c-472c-9a17-4d2102115425	\N	login	user	12651c11-529c-472c-9a17-4d2102115425	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	taufhgHNL1YoR-Z_cHsPG9YlxmxPQKIc	\N	low	success	\N	{}	2025-09-04 04:30:05.838+05:30	2025-09-04 04:30:05.838+05:30	2025-09-04 04:30:05.838+05:30	\N
cf3aacbf-2f72-485c-88a3-4a96c7e5b0eb	12651c11-529c-472c-9a17-4d2102115425	\N	access_granted	system	\N	{"doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "29a33cd8-bab9-47ea-8b28-bc20f4b97e15"}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 04:30:32.357+05:30	2025-09-04 04:30:32.357+05:30	2025-09-04 04:30:32.357+05:30	\N
e713472c-c527-4691-8e3d-8c9cbc78f580	12651c11-529c-472c-9a17-4d2102115425	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "4Q7qOaWgGltTUHF6zcVEqRE2H2Fp9sgy"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 04:30:36.334+05:30	2025-09-04 04:30:36.335+05:30	2025-09-04 04:30:36.335+05:30	\N
d151bf35-aeea-459b-a338-bd4779edaaf9	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	mNDEDVUfIG-wv6NLm0r7EupSy3Aw9bBl	\N	low	success	\N	{}	2025-09-04 04:30:47.509+05:30	2025-09-04 04:30:47.509+05:30	2025-09-04 04:30:47.509+05:30	\N
26950e2b-fad5-4864-8949-859debb7abfe	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:00:54.783Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:30:54.784+05:30	2025-09-04 04:30:54.784+05:30	2025-09-04 04:30:54.784+05:30	\N
40e85563-b260-4271-8a63-e2bc04832254	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	cuSqclXiq4HDqkygPVIiXzjujSfcgTWI	\N	low	success	\N	{}	2025-09-04 04:39:37.463+05:30	2025-09-04 04:39:37.464+05:30	2025-09-04 04:39:37.464+05:30	\N
3cd57504-40bc-4532-894f-d77ab1484c31	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:10:19.145Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:40:19.145+05:30	2025-09-04 04:40:19.145+05:30	2025-09-04 04:40:19.145+05:30	\N
1a7be99e-0afd-40a0-9c62-c2f9b5dbd899	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	agxpgCJQeK4g1r9veHBEIpHmXvdX8REU	\N	low	success	\N	{}	2025-09-04 04:41:13.966+05:30	2025-09-04 04:41:13.967+05:30	2025-09-04 04:41:13.967+05:30	\N
1c0dd0ea-96d0-4e39-add0-dd7869836130	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:11:23.124Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:41:23.125+05:30	2025-09-04 04:41:23.125+05:30	2025-09-04 04:41:23.125+05:30	\N
2bb01fd6-8faa-44d1-a87b-ddcbcf24166e	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:11:25.072Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:41:25.072+05:30	2025-09-04 04:41:25.072+05:30	2025-09-04 04:41:25.072+05:30	\N
201b1d8b-c965-4dd8-8602-d251cd6bb7f7	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:11:27.459Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:41:27.46+05:30	2025-09-04 04:41:27.461+05:30	2025-09-04 04:41:27.461+05:30	\N
ab0cd97e-abd1-4453-abe5-f12739048577	0fdbb5be-9043-493e-a0c0-0129e4855098	ece3ee5e-d170-4928-a685-ce9b28fb08aa	record_upload	medical_record	0bde686e-a0ba-4f03-acbb-d2e16587240c	{"message": "Doctor created medical record: fever"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	njMFA8oU7oxBQra-YTcWPlg0YpDaOkvu	\N	low	success	\N	{}	2025-09-04 04:42:29.396+05:30	2025-09-04 04:42:29.397+05:30	2025-09-04 04:42:29.397+05:30	\N
d8d869f9-ae82-466e-92a3-259d854b36d0	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	access_request	access_request	42640c5c-6ef2-47d7-8e76-7a79758868b3	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 04:45:02.557+05:30	2025-09-04 04:45:02.557+05:30	2025-09-04 04:45:02.557+05:30	\N
1d194790-a68e-4d37-afd7-c1e13e933666	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	access_request	access_request	42640c5c-6ef2-47d7-8e76-7a79758868b3	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 04:45:02.593+05:30	2025-09-04 04:45:02.593+05:30	2025-09-04 04:45:02.593+05:30	\N
7b72ab5a-339b-43e5-8751-6758ea53147c	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "2mdBCrok2COV1LXlL9VIfOv5HgprJENA"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 04:47:24.688+05:30	2025-09-04 04:47:24.689+05:30	2025-09-04 04:47:24.689+05:30	\N
1fa1bb4c-3959-4c16-ab87-bf21fbd42c7f	cd658804-9c14-4c10-b2ef-aa1d871d58eb	\N	login	user	cd658804-9c14-4c10-b2ef-aa1d871d58eb	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	9fRtc4sSDNUPC_DvnKHmxUWdOfD3mCDy	\N	low	success	\N	{}	2025-09-04 04:47:39.203+05:30	2025-09-04 04:47:39.203+05:30	2025-09-04 04:47:39.203+05:30	\N
f9662c8f-a3f7-425a-b2ed-626c67d522c2	cd658804-9c14-4c10-b2ef-aa1d871d58eb	\N	access_granted	system	\N	{"doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "42640c5c-6ef2-47d7-8e76-7a79758868b3"}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 04:48:16.693+05:30	2025-09-04 04:48:16.694+05:30	2025-09-04 04:48:16.694+05:30	\N
fa55cea9-9096-4866-ae30-061deb0ca96d	cd658804-9c14-4c10-b2ef-aa1d871d58eb	cd658804-9c14-4c10-b2ef-aa1d871d58eb	report_download	access_request	dd847907-14b2-4605-8d3c-8fcadafb3e3f	{"action": "report_download", "details": "Patient downloaded their own medical report."}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-04 04:48:35.487+05:30	2025-09-04 04:48:35.488+05:30	2025-09-04 04:48:35.488+05:30	\N
6feb6cf3-7e05-4a13-960f-47faea6dadba	cd658804-9c14-4c10-b2ef-aa1d871d58eb	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "ukekENPzZ6Y9kMxpItysjKire-oGTV2v"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 04:48:51.815+05:30	2025-09-04 04:48:51.815+05:30	2025-09-04 04:48:51.815+05:30	\N
b91a2600-5b69-49da-b826-2659fb8913a1	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	zzYsdDV_Zfr3ryWrOrCJnVUfB_ZcrGjp	\N	low	success	\N	{}	2025-09-04 04:49:03.254+05:30	2025-09-04 04:49:03.254+05:30	2025-09-04 04:49:03.254+05:30	\N
1077a28a-e309-4858-89a0-9e4519cc049a	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:19:27.300Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:49:27.3+05:30	2025-09-04 04:49:27.3+05:30	2025-09-04 04:49:27.3+05:30	\N
026078ca-5dac-4189-b5b2-7ee85ed02aca	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:20:41.926Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:50:41.927+05:30	2025-09-04 04:50:41.927+05:30	2025-09-04 04:50:41.927+05:30	\N
9c0c2e95-e74c-4fee-a837-e39bec0cb925	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	NyfEiqSCoHwLzAg0ZBtlxSv-tWr36QER	\N	low	success	\N	{}	2025-09-04 04:53:17.449+05:30	2025-09-04 04:53:17.449+05:30	2025-09-04 04:53:17.449+05:30	\N
9924f8cb-66a5-4abf-b821-883a2b08f1c3	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:23:21.096Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:53:21.097+05:30	2025-09-04 04:53:21.097+05:30	2025-09-04 04:53:21.097+05:30	\N
adc3d4f2-4902-4d2b-9916-155a7c7ba5fc	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:23:26.465Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:53:26.465+05:30	2025-09-04 04:53:26.465+05:30	2025-09-04 04:53:26.465+05:30	\N
71b833dc-d3d4-47c0-8561-5b2a41fa6ab4	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	PZJ4VWkTowKnPeEilo8pu0h-FrKY4OsG	\N	low	success	\N	{}	2025-09-04 04:56:05.249+05:30	2025-09-04 04:56:05.249+05:30	2025-09-04 04:56:05.249+05:30	\N
b9d962cf-460a-4891-98f0-d06b1fb2faa0	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:26:09.410Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 04:56:09.411+05:30	2025-09-04 04:56:09.411+05:30	2025-09-04 04:56:09.411+05:30	\N
29db0061-e2d6-42a8-8995-cfd406945f10	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	t8UezVsv-eYMltd1lrNVjZZRDVsQXv-k	\N	low	success	\N	{}	2025-09-04 05:01:18.653+05:30	2025-09-04 05:01:18.654+05:30	2025-09-04 05:01:18.654+05:30	\N
1b6adc93-4c83-460b-afd6-82af9cfa0253	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:31:30.622Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 05:01:30.623+05:30	2025-09-04 05:01:30.623+05:30	2025-09-04 05:01:30.623+05:30	\N
09bc1b0c-a91f-40e4-aa39-5127dc885879	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "K9ts0llS0ld529wnlNA5I4lUocfv7RYd"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 05:01:47.586+05:30	2025-09-04 05:01:47.587+05:30	2025-09-04 05:01:47.587+05:30	\N
01f36465-c7a0-4b4d-8a03-f0b9ea8a39db	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	prGT5uY6lSxACNF1Gfe0XwulY87ZmzAH	\N	low	success	\N	{}	2025-09-04 05:06:23.987+05:30	2025-09-04 05:06:23.988+05:30	2025-09-04 05:06:23.988+05:30	\N
501aae76-3ba1-4eda-b0ed-68fb052c6507	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:36:31.629Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 05:06:31.63+05:30	2025-09-04 05:06:31.63+05:30	2025-09-04 05:06:31.63+05:30	\N
554823e7-2c11-4892-b408-b8d4faf460d5	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-03T23:36:37.570Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 05:06:37.571+05:30	2025-09-04 05:06:37.572+05:30	2025-09-04 05:06:37.572+05:30	\N
5f8706ee-f51e-4dea-bbbd-dff046e5491d	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	3t0MJ_Fp-N9bjY5gKSM-9m2OwR1Qi_w0	\N	low	success	\N	{}	2025-09-04 14:34:00.449+05:30	2025-09-04 14:34:00.449+05:30	2025-09-04 14:34:00.449+05:30	\N
923f9ea5-e63e-46c9-a68e-51a5eb68cac8	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-04T09:04:32.174Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 14:34:32.175+05:30	2025-09-04 14:34:32.176+05:30	2025-09-04 14:34:32.176+05:30	\N
228c9c61-c27e-44e2-b7e7-ac2ea655edc5	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	sBicaceY6LPC4kWUaRINPdCnhg0_50pZ	\N	low	success	\N	{}	2025-09-04 14:40:54.093+05:30	2025-09-04 14:40:54.094+05:30	2025-09-04 14:40:54.094+05:30	\N
b03a841f-329c-4a7f-b162-587dee6a596c	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-04T09:11:00.176Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 14:41:00.176+05:30	2025-09-04 14:41:00.177+05:30	2025-09-04 14:41:00.177+05:30	\N
f340364f-17b6-4374-a652-193471da8101	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-04T09:11:04.788Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 14:41:04.789+05:30	2025-09-04 14:41:04.789+05:30	2025-09-04 14:41:04.789+05:30	\N
0e52c09d-b36a-4bf7-87d4-8ce42b8123dd	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-04T09:11:08.069Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 14:41:08.069+05:30	2025-09-04 14:41:08.069+05:30	2025-09-04 14:41:08.069+05:30	\N
acae3b6d-6f45-4457-8242-462f69b95d08	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-04T09:11:20.441Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-04 14:41:20.441+05:30	2025-09-04 14:41:20.441+05:30	2025-09-04 14:41:20.441+05:30	\N
9b9487ee-68de-4543-ba16-5ec3d96c03ca	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "YylPZIrGt3h3ibSpGwHa21ov5cg29wsW"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 14:42:10.492+05:30	2025-09-04 14:42:10.492+05:30	2025-09-04 14:42:10.492+05:30	\N
348d9974-8f09-4927-b1a7-d25da93c2767	ece3ee5e-d170-4928-a685-ce9b28fb08aa	\N	login	user	ece3ee5e-d170-4928-a685-ce9b28fb08aa	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Et45vIrGYR5W4-XXAAFZBi3JpG3dtl9b	\N	medium	failure	\N	{}	2025-09-04 14:42:35.6+05:30	2025-09-04 14:42:35.6+05:30	2025-09-04 14:42:35.6+05:30	\N
b34c6944-4fe0-49a4-b368-57335ec01864	ece3ee5e-d170-4928-a685-ce9b28fb08aa	\N	login	user	ece3ee5e-d170-4928-a685-ce9b28fb08aa	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	YiJ1EJ62XNOvWql9wH45ZE6c43iM_U2y	\N	medium	failure	\N	{}	2025-09-04 14:42:43.66+05:30	2025-09-04 14:42:43.66+05:30	2025-09-04 14:42:43.66+05:30	\N
cae995f4-ce46-4721-b918-a18158aa7ecc	ece3ee5e-d170-4928-a685-ce9b28fb08aa	\N	login	user	ece3ee5e-d170-4928-a685-ce9b28fb08aa	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	n0xKGMpb7itOxCkBDmm7ICMnfMoOpXQA	\N	low	success	\N	{}	2025-09-04 14:42:52.086+05:30	2025-09-04 14:42:52.087+05:30	2025-09-04 14:42:52.087+05:30	\N
358d839a-29a8-491d-b69c-dbc4dc05c445	ece3ee5e-d170-4928-a685-ce9b28fb08aa	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "2kdhHECT_mREE14Ekph--hYgj0h7tvvL"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-04 14:43:00.968+05:30	2025-09-04 14:43:00.968+05:30	2025-09-04 14:43:00.968+05:30	\N
4ead13aa-17ac-49a0-8df5-e4e6a77946bd	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	mQSpesZgfJ-tfOFjXteobdHH7iFd9nIL	\N	low	success	\N	{}	2025-09-15 00:14:08.192+05:30	2025-09-15 00:14:08.197+05:30	2025-09-15 00:14:08.197+05:30	\N
acfd4e69-fd7b-4bf3-b622-631e465fcab5	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	w_xRQCvuttCO-ci0hYoP1Rdd5gVEUGnt	\N	low	success	\N	{}	2025-09-15 00:14:11.619+05:30	2025-09-15 00:14:11.62+05:30	2025-09-15 00:14:11.62+05:30	\N
9071b5df-1706-47f0-8c74-e4136831af61	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	login	user	0fdbb5be-9043-493e-a0c0-0129e4855098	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2Vo10OhH9sgniLwPwX51XKF9eoGuaSeZ	\N	low	success	\N	{}	2025-09-15 15:51:16.57+05:30	2025-09-15 15:51:16.571+05:30	2025-09-15 15:51:16.571+05:30	\N
553e34b2-8607-4f17-84d2-73ec5b3b5229	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	2ae37e9a-59ee-43a3-ab02-3ba4828ec70b	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-15T10:21:47.601Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-15 15:51:47.603+05:30	2025-09-15 15:51:47.604+05:30	2025-09-15 15:51:47.604+05:30	\N
420d6782-d19d-49a8-9a15-7bfd3aa6f1ed	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	0a7cb89b-43c2-47c9-b2b1-a7b38ef032d8	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-15T10:21:55.524Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-15 15:51:55.525+05:30	2025-09-15 15:51:55.525+05:30	2025-09-15 15:51:55.525+05:30	\N
0b8870ff-8c8c-4516-b15e-7e78605a97ee	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	viewed_approved_record	medical_record	42640c5c-6ef2-47d7-8e76-7a79758868b3	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-15T10:21:58.130Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-15 15:51:58.13+05:30	2025-09-15 15:51:58.13+05:30	2025-09-15 15:51:58.13+05:30	\N
e3846044-cad9-487f-8790-ee26fc47cd18	0fdbb5be-9043-493e-a0c0-0129e4855098	12651c11-529c-472c-9a17-4d2102115425	viewed_approved_record	medical_record	29a33cd8-bab9-47ea-8b28-bc20f4b97e15	{"action": "viewed_approved_record", "ipAddress": "::1", "timestamp": "2025-09-15T10:22:01.255Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	\N	medium	success	\N	{}	2025-09-15 15:52:01.255+05:30	2025-09-15 15:52:01.255+05:30	2025-09-15 15:52:01.255+05:30	\N
90933df5-6c84-4317-9f5b-b8373ca971ab	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	access_request	access_request	654dfb1d-4dfa-4787-a052-94603acc9222	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-15 15:52:57.807+05:30	2025-09-15 15:52:57.808+05:30	2025-09-15 15:52:57.808+05:30	\N
314c0690-4697-48c9-a554-3144cbdfc93d	0fdbb5be-9043-493e-a0c0-0129e4855098	cd658804-9c14-4c10-b2ef-aa1d871d58eb	access_request	access_request	654dfb1d-4dfa-4787-a052-94603acc9222	{}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-15 15:52:57.825+05:30	2025-09-15 15:52:57.825+05:30	2025-09-15 15:52:57.825+05:30	\N
318f4426-fe4c-4394-8265-9f545cda0e39	0fdbb5be-9043-493e-a0c0-0129e4855098	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "x8IdtpHq_2z3ZNe2ub6bSxYZ7puyV0xu"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-15 15:53:07.646+05:30	2025-09-15 15:53:07.646+05:30	2025-09-15 15:53:07.646+05:30	\N
4bf0fd29-d1cc-45bc-b604-79e9c311f5bf	cd658804-9c14-4c10-b2ef-aa1d871d58eb	\N	login	user	cd658804-9c14-4c10-b2ef-aa1d871d58eb	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	GtPsmtZU6vYWbw1cy0M20ERPmGukzPZG	\N	low	success	\N	{}	2025-09-15 15:53:20.737+05:30	2025-09-15 15:53:20.738+05:30	2025-09-15 15:53:20.738+05:30	\N
75300b94-b16f-4c18-9324-7bdfbbbc434b	cd658804-9c14-4c10-b2ef-aa1d871d58eb	\N	access_denied	system	\N	{"reason": "Access denied by patient", "doctorId": "0fdbb5be-9043-493e-a0c0-0129e4855098", "accessRequestId": "654dfb1d-4dfa-4787-a052-94603acc9222"}	\N	\N	\N	\N	medium	success	\N	{}	2025-09-15 15:54:20.128+05:30	2025-09-15 15:54:20.128+05:30	2025-09-15 15:54:20.128+05:30	\N
d3d1e0a4-28da-48d7-9fe7-d65b9862aa1a	cd658804-9c14-4c10-b2ef-aa1d871d58eb	\N	logout	system	\N	{"ipAddress": "::1", "sessionId": "fah7UCI2wH6K_8JP-5gsopSfFrd2zGJg"}	\N	\N	\N	\N	low	success	\N	{}	2025-09-15 15:54:35.309+05:30	2025-09-15 15:54:35.309+05:30	2025-09-15 15:54:35.309+05:30	\N
\.


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medical_records (id, patient_id, doctor_id, record_type, title, description, file_path, file_name, file_size, file_type, encrypted_data, encryption_key, record_date, expiry_date, is_active, is_public, tags, metadata, status, priority, location, department, cost, insurance_info, created_at, updated_at, deleted_at) FROM stdin;
a9c1ac20-4af9-484e-b941-77d91f53ba54	12651c11-529c-472c-9a17-4d2102115425	0fdbb5be-9043-493e-a0c0-0129e4855098	lab_report	blood report	be safe	uploads\\file-1756234574072-573934513.png	ad1.png	27044	image/png	\N	\N	2004-10-20 05:30:00+05:30	\N	t	f	{}	{}	active	medium	\N	\N	\N	\N	2025-08-27 00:26:14.152+05:30	2025-08-27 00:26:14.152+05:30	\N
dd847907-14b2-4605-8d3c-8fcadafb3e3f	cd658804-9c14-4c10-b2ef-aa1d871d58eb	0fdbb5be-9043-493e-a0c0-0129e4855098	lab_report	blood report	safe	uploads\\file-1756234682200-213902485.png	Screenshot 2025-02-28 184145.png	177244	image/png	\N	\N	2004-12-28 05:30:00+05:30	\N	t	f	{}	{}	active	medium	\N	\N	\N	\N	2025-08-27 00:28:02.358+05:30	2025-08-27 00:28:02.358+05:30	\N
65a95a4e-aead-4a6d-bdb0-e13b4712ba62	ed677398-a24a-40a5-b132-4efa181f8821	0fdbb5be-9043-493e-a0c0-0129e4855098	vaccination_record	covid shield	vaccinated 	uploads\\file-1756235332449-895349280.jpg	timetable1.jpg	142836	image/jpeg	\N	\N	2005-01-22 05:30:00+05:30	\N	t	f	{}	{}	active	medium	\N	\N	\N	\N	2025-08-27 00:38:52.634+05:30	2025-08-27 00:38:52.634+05:30	\N
1451c465-ef8e-4313-8a55-bb55b61f7777	12651c11-529c-472c-9a17-4d2102115425	a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	dental_record	rootcanal	blooding 2-3 days normal	uploads\\file-1756721820307-170662294.png	Screenshot 2025-03-21 122017.png	21118	image/png	\N	\N	2023-04-10 05:30:00+05:30	\N	t	f	{}	{}	active	medium	\N	\N	\N	\N	2025-09-01 15:47:00.458+05:30	2025-09-01 15:47:00.458+05:30	\N
ba46230d-f714-4eed-82bb-ce59ad448312	12651c11-529c-472c-9a17-4d2102115425	0fdbb5be-9043-493e-a0c0-0129e4855098	surgery_record	heart surgery	frequnecy	uploads\\file-1756930552017-792840702.png	Screenshot 2025-02-28 184145.png	177244	image/png	\N	\N	2001-05-02 05:30:00+05:30	\N	t	f	{}	{}	active	medium	\N	\N	\N	\N	2025-09-04 01:45:52.093+05:30	2025-09-04 01:45:52.093+05:30	\N
35cb17c4-bf88-43ce-b4bd-13a551a6bf16	1760e03b-bb23-43e2-88c4-5d3b175be8fd	0fdbb5be-9043-493e-a0c0-0129e4855098	scan_result	CT Scan	be Careful	uploads\\file-1756570252334-184950538.png	Screenshot 2025-02-28 184145.png	177244	image/png	\N	\N	2023-10-20 05:30:00+05:30	\N	t	f	{}	{}	active	medium	\N	\N	\N	\N	2025-08-30 21:40:52.481+05:30	2025-09-04 03:13:04.842+05:30	2025-09-04 03:13:04.841+05:30
0bde686e-a0ba-4f03-acbb-d2e16587240c	ece3ee5e-d170-4928-a685-ce9b28fb08aa	0fdbb5be-9043-493e-a0c0-0129e4855098	prescription	fever	dollo	uploads\\file-1756941149291-107838739.png	Screenshot 2025-03-21 122017.png	21118	image/png	\N	\N	2022-05-01 05:30:00+05:30	\N	t	f	{}	{}	active	medium	\N	\N	\N	\N	2025-09-04 04:42:29.348+05:30	2025-09-04 04:42:29.348+05:30	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, role, first_name, last_name, phone_number, date_of_birth, gender, address, emergency_contact, is_active, is_verified, last_login_at, failed_login_attempts, locked_until, profile_picture, preferences, created_at, updated_at, deleted_at, specialization, license_number) FROM stdin;
a984ba12-a5c4-4d5e-a7dc-540db1ec9e49	devsadisatsowala.co22d2@scet.ac.in	$2a$12$HWzQzjeK/L3/2sHH7MHOwuaU72a/fvvdMbUUzCTLCMxSn6v1lHxBq	doctor	dev	patel	6565656565	2004-12-20	male	12,kharvar nagar ,udhana	\N	t	f	2025-09-01 15:44:42.192+05:30	0	\N	\N	{}	2025-09-01 15:44:20.738+05:30	2025-09-01 15:44:42.192+05:30	\N	\N	\N
0fdbb5be-9043-493e-a0c0-0129e4855098	archigazdar.co22d1@scet.ac.in	$2a$12$1rs5Wgjq03ZpOV5OZI1DbeBpcPP68ZLtBUrXZs85HZHKGY5ZAJ4mS	doctor	Dhruvil	Patel	8734848448	2004-10-20	male	704, West Patel Nagar Road	\N	t	f	2025-09-15 15:51:13.001+05:30	0	\N	\N	{}	2025-08-26 19:53:34.761+05:30	2025-09-15 15:51:13.001+05:30	\N	Cardiology	MD-CARD-8899
cd658804-9c14-4c10-b2ef-aa1d871d58eb	dhruvil20patel@gmail.com	$2a$12$eyk.GEmEzF3ZwanQ5uWdj.OK7GYkD8oUjL/ypqN0piu0YkasI4VqG	patient	Dhruvil	Patel	8734848448	2004-10-20	male	112 main street califonia yew york	\N	t	f	2025-09-15 15:53:20.723+05:30	0	\N	\N	{}	2025-08-25 22:43:31.535+05:30	2025-09-15 15:53:20.723+05:30	\N	\N	\N
ed677398-a24a-40a5-b132-4efa181f8821	mananparekh.co22d2@scet.ac.in	$2a$12$5bzTebNkjle5/0ILCd88rOU2vXGYlANR4ET/PJwEHFKOX2cuQOP6m	patient	dhruvil	parekh	8734848448	\N	\N	\N	\N	f	f	\N	1	\N	\N	{}	2025-08-26 23:52:01.429+05:30	2025-09-04 02:39:22.956+05:30	\N	\N	\N
c12db75a-ec1f-4209-8f1d-2ce59d5ab423	krishtejani.co22d2@scet.ac.in	$2a$12$ceLRv6gSjfv1SI1N982sBe.KPsMKD6osgnY4F7eqltHPGVGAC6meK	patient	manan	Parekh	9879416300	\N	\N	\N	\N	f	f	\N	0	\N	\N	{}	2025-08-30 21:44:11.57+05:30	2025-09-04 02:42:50.837+05:30	\N	\N	\N
6c695b54-2eed-4886-9cc1-c4e98b3f0fe5	dhruvilpatel.co22d2@scet.ac.in	$2a$12$qnslFMgX2W3bBhfaoUovoOwMpo6W2gzWmYd.2Djz/jqfwEZBBBBu2	patient	Dhruvil	Patel	8734848448	2004-10-20	male	704, West Patel Nagar Road	\N	t	f	2025-09-01 21:53:36.538+05:30	0	\N	\N	{}	2025-08-26 19:32:36.969+05:30	2025-09-01 21:53:36.538+05:30	\N	\N	\N
786a81dd-30ca-4cad-a697-4c51f3a6d1f7	jayrangoonwala.co22d2@scet.ac.in	$2a$12$wnrPLItBcZbPUulPCvLpHeq8HRo6Mn0g1ffg66k7JdXnWxYcjFIH2	patient	jay	rangoonwala	6556655665	\N	\N	\N	\N	f	f	\N	0	\N	\N	{}	2025-09-03 17:07:50.725+05:30	2025-09-04 02:47:55.587+05:30	\N	\N	\N
b1373e3f-1196-4490-9655-8196e4cb7c1c	patient@test.com	$2a$12$MKghlZIJRBNs.BBb0fIA4.gXau.wdLm3sS8Pc1omMmMfWL5ZNqfRW	patient	Test	Patient	+1234567890	1990-01-01	male	\N	\N	t	t	2025-08-31 18:37:39.356+05:30	0	\N	\N	{}	2025-08-31 18:25:05.311+05:30	2025-08-31 18:37:39.356+05:30	\N	\N	\N
381349ca-3e04-4a37-b964-84f06049e258	fenilpatel.co22d2@scet.ac.in	$2a$12$ZAKCLOMOuEExbO75kPok.O1JQiNriJpiQvKtHpad8ahKHuZ2ob3yS	patient	fenil	patel	5665566556	2001-01-02	male	\N	\N	f	f	\N	0	\N	\N	{}	2025-09-04 01:42:24.638+05:30	2025-09-04 02:50:32.032+05:30	\N	\N	\N
bcfc9429-5092-4bef-bcd7-aa238db2dfa7	doctor@test.com	$2a$12$USls38.NfaJjAj8oooaWF.X6Vh.bK3QCPqU.OEgXdOrkZu1saKeCq	doctor	Test	Doctor	+1234567891	\N	\N	\N	\N	t	t	\N	0	\N	\N	{}	2025-08-31 18:25:06.44+05:30	2025-08-31 18:25:06.44+05:30	\N	\N	\N
1760e03b-bb23-43e2-88c4-5d3b175be8fd	jane@example.com	$2a$12$rRwzuwQP59/s96NYcKOpzuvsh/Zwhqz3Mqyt.T9Pzlb.gY2EPiwJq	patient	john	doe	+1234567890	2004-10-20	male	123 main street new york	\N	f	f	\N	0	\N	\N	{}	2025-08-25 22:40:06.48+05:30	2025-09-04 02:56:45.033+05:30	\N	\N	\N
ece3ee5e-d170-4928-a685-ce9b28fb08aa	nemesisfinal88@gmail.com	$2a$12$G6BJxKnYyLowIRDapYTMPuxgeFaxDMOXlHX3Oq9WR2RoSU65Uqecq	patient	neme	sis	1245789865	2000-10-10	male	102,bhagal , surat	\N	t	f	2025-09-04 14:42:51.981+05:30	0	\N	\N	{}	2025-09-01 13:01:58.53+05:30	2025-09-04 14:42:51.981+05:30	\N	\N	\N
12651c11-529c-472c-9a17-4d2102115425	dhruvilp059@gmail.com	$2a$12$YwawvNC9AvH8ZR2nGI5qBOIB4NRvNlbJKFR.D7fkdJKG2X.qosIWi	patient	dhruvil	patel	8734848448	2004-10-20	male	123 main street califonia new york	\N	t	f	2025-09-04 04:30:05.831+05:30	0	\N	\N	{}	2025-08-26 00:43:14.432+05:30	2025-09-04 04:30:05.831+05:30	\N	\N	\N
\.


--
-- Name: access_requests access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_email_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key10 UNIQUE (email);


--
-- Name: users users_email_key100; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key100 UNIQUE (email);


--
-- Name: users users_email_key101; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key101 UNIQUE (email);


--
-- Name: users users_email_key102; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key102 UNIQUE (email);


--
-- Name: users users_email_key103; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key103 UNIQUE (email);


--
-- Name: users users_email_key104; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key104 UNIQUE (email);


--
-- Name: users users_email_key105; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key105 UNIQUE (email);


--
-- Name: users users_email_key106; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key106 UNIQUE (email);


--
-- Name: users users_email_key107; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key107 UNIQUE (email);


--
-- Name: users users_email_key108; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key108 UNIQUE (email);


--
-- Name: users users_email_key109; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key109 UNIQUE (email);


--
-- Name: users users_email_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key11 UNIQUE (email);


--
-- Name: users users_email_key110; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key110 UNIQUE (email);


--
-- Name: users users_email_key111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key111 UNIQUE (email);


--
-- Name: users users_email_key112; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key112 UNIQUE (email);


--
-- Name: users users_email_key113; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key113 UNIQUE (email);


--
-- Name: users users_email_key114; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key114 UNIQUE (email);


--
-- Name: users users_email_key115; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key115 UNIQUE (email);


--
-- Name: users users_email_key116; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key116 UNIQUE (email);


--
-- Name: users users_email_key117; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key117 UNIQUE (email);


--
-- Name: users users_email_key118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key118 UNIQUE (email);


--
-- Name: users users_email_key119; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key119 UNIQUE (email);


--
-- Name: users users_email_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key12 UNIQUE (email);


--
-- Name: users users_email_key120; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key120 UNIQUE (email);


--
-- Name: users users_email_key121; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key121 UNIQUE (email);


--
-- Name: users users_email_key122; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key122 UNIQUE (email);


--
-- Name: users users_email_key123; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key123 UNIQUE (email);


--
-- Name: users users_email_key124; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key124 UNIQUE (email);


--
-- Name: users users_email_key125; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key125 UNIQUE (email);


--
-- Name: users users_email_key126; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key126 UNIQUE (email);


--
-- Name: users users_email_key127; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key127 UNIQUE (email);


--
-- Name: users users_email_key128; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key128 UNIQUE (email);


--
-- Name: users users_email_key129; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key129 UNIQUE (email);


--
-- Name: users users_email_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key13 UNIQUE (email);


--
-- Name: users users_email_key130; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key130 UNIQUE (email);


--
-- Name: users users_email_key131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key131 UNIQUE (email);


--
-- Name: users users_email_key132; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key132 UNIQUE (email);


--
-- Name: users users_email_key133; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key133 UNIQUE (email);


--
-- Name: users users_email_key134; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key134 UNIQUE (email);


--
-- Name: users users_email_key135; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key135 UNIQUE (email);


--
-- Name: users users_email_key136; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key136 UNIQUE (email);


--
-- Name: users users_email_key137; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key137 UNIQUE (email);


--
-- Name: users users_email_key138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key138 UNIQUE (email);


--
-- Name: users users_email_key139; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key139 UNIQUE (email);


--
-- Name: users users_email_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key14 UNIQUE (email);


--
-- Name: users users_email_key140; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key140 UNIQUE (email);


--
-- Name: users users_email_key141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key141 UNIQUE (email);


--
-- Name: users users_email_key142; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key142 UNIQUE (email);


--
-- Name: users users_email_key143; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key143 UNIQUE (email);


--
-- Name: users users_email_key144; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key144 UNIQUE (email);


--
-- Name: users users_email_key145; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key145 UNIQUE (email);


--
-- Name: users users_email_key146; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key146 UNIQUE (email);


--
-- Name: users users_email_key147; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key147 UNIQUE (email);


--
-- Name: users users_email_key148; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key148 UNIQUE (email);


--
-- Name: users users_email_key149; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key149 UNIQUE (email);


--
-- Name: users users_email_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key15 UNIQUE (email);


--
-- Name: users users_email_key150; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key150 UNIQUE (email);


--
-- Name: users users_email_key151; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key151 UNIQUE (email);


--
-- Name: users users_email_key152; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key152 UNIQUE (email);


--
-- Name: users users_email_key153; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key153 UNIQUE (email);


--
-- Name: users users_email_key154; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key154 UNIQUE (email);


--
-- Name: users users_email_key155; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key155 UNIQUE (email);


--
-- Name: users users_email_key156; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key156 UNIQUE (email);


--
-- Name: users users_email_key157; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key157 UNIQUE (email);


--
-- Name: users users_email_key158; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key158 UNIQUE (email);


--
-- Name: users users_email_key159; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key159 UNIQUE (email);


--
-- Name: users users_email_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key16 UNIQUE (email);


--
-- Name: users users_email_key160; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key160 UNIQUE (email);


--
-- Name: users users_email_key161; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key161 UNIQUE (email);


--
-- Name: users users_email_key162; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key162 UNIQUE (email);


--
-- Name: users users_email_key163; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key163 UNIQUE (email);


--
-- Name: users users_email_key164; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key164 UNIQUE (email);


--
-- Name: users users_email_key165; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key165 UNIQUE (email);


--
-- Name: users users_email_key166; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key166 UNIQUE (email);


--
-- Name: users users_email_key167; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key167 UNIQUE (email);


--
-- Name: users users_email_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key17 UNIQUE (email);


--
-- Name: users users_email_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key18 UNIQUE (email);


--
-- Name: users users_email_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key19 UNIQUE (email);


--
-- Name: users users_email_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key2 UNIQUE (email);


--
-- Name: users users_email_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key20 UNIQUE (email);


--
-- Name: users users_email_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key21 UNIQUE (email);


--
-- Name: users users_email_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key22 UNIQUE (email);


--
-- Name: users users_email_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key23 UNIQUE (email);


--
-- Name: users users_email_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key24 UNIQUE (email);


--
-- Name: users users_email_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key25 UNIQUE (email);


--
-- Name: users users_email_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key26 UNIQUE (email);


--
-- Name: users users_email_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key27 UNIQUE (email);


--
-- Name: users users_email_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key28 UNIQUE (email);


--
-- Name: users users_email_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key29 UNIQUE (email);


--
-- Name: users users_email_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key3 UNIQUE (email);


--
-- Name: users users_email_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key30 UNIQUE (email);


--
-- Name: users users_email_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key31 UNIQUE (email);


--
-- Name: users users_email_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key32 UNIQUE (email);


--
-- Name: users users_email_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key33 UNIQUE (email);


--
-- Name: users users_email_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key34 UNIQUE (email);


--
-- Name: users users_email_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key35 UNIQUE (email);


--
-- Name: users users_email_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key36 UNIQUE (email);


--
-- Name: users users_email_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key37 UNIQUE (email);


--
-- Name: users users_email_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key38 UNIQUE (email);


--
-- Name: users users_email_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key39 UNIQUE (email);


--
-- Name: users users_email_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key4 UNIQUE (email);


--
-- Name: users users_email_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key40 UNIQUE (email);


--
-- Name: users users_email_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key41 UNIQUE (email);


--
-- Name: users users_email_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key42 UNIQUE (email);


--
-- Name: users users_email_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key43 UNIQUE (email);


--
-- Name: users users_email_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key44 UNIQUE (email);


--
-- Name: users users_email_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key45 UNIQUE (email);


--
-- Name: users users_email_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key46 UNIQUE (email);


--
-- Name: users users_email_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key47 UNIQUE (email);


--
-- Name: users users_email_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key48 UNIQUE (email);


--
-- Name: users users_email_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key49 UNIQUE (email);


--
-- Name: users users_email_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key5 UNIQUE (email);


--
-- Name: users users_email_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key50 UNIQUE (email);


--
-- Name: users users_email_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key51 UNIQUE (email);


--
-- Name: users users_email_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key52 UNIQUE (email);


--
-- Name: users users_email_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key53 UNIQUE (email);


--
-- Name: users users_email_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key54 UNIQUE (email);


--
-- Name: users users_email_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key55 UNIQUE (email);


--
-- Name: users users_email_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key56 UNIQUE (email);


--
-- Name: users users_email_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key57 UNIQUE (email);


--
-- Name: users users_email_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key58 UNIQUE (email);


--
-- Name: users users_email_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key59 UNIQUE (email);


--
-- Name: users users_email_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key6 UNIQUE (email);


--
-- Name: users users_email_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key60 UNIQUE (email);


--
-- Name: users users_email_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key61 UNIQUE (email);


--
-- Name: users users_email_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key62 UNIQUE (email);


--
-- Name: users users_email_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key63 UNIQUE (email);


--
-- Name: users users_email_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key64 UNIQUE (email);


--
-- Name: users users_email_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key65 UNIQUE (email);


--
-- Name: users users_email_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key66 UNIQUE (email);


--
-- Name: users users_email_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key67 UNIQUE (email);


--
-- Name: users users_email_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key68 UNIQUE (email);


--
-- Name: users users_email_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key69 UNIQUE (email);


--
-- Name: users users_email_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key7 UNIQUE (email);


--
-- Name: users users_email_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key70 UNIQUE (email);


--
-- Name: users users_email_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key71 UNIQUE (email);


--
-- Name: users users_email_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key72 UNIQUE (email);


--
-- Name: users users_email_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key73 UNIQUE (email);


--
-- Name: users users_email_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key74 UNIQUE (email);


--
-- Name: users users_email_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key75 UNIQUE (email);


--
-- Name: users users_email_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key76 UNIQUE (email);


--
-- Name: users users_email_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key77 UNIQUE (email);


--
-- Name: users users_email_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key78 UNIQUE (email);


--
-- Name: users users_email_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key79 UNIQUE (email);


--
-- Name: users users_email_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key8 UNIQUE (email);


--
-- Name: users users_email_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key80 UNIQUE (email);


--
-- Name: users users_email_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key81 UNIQUE (email);


--
-- Name: users users_email_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key82 UNIQUE (email);


--
-- Name: users users_email_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key83 UNIQUE (email);


--
-- Name: users users_email_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key84 UNIQUE (email);


--
-- Name: users users_email_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key85 UNIQUE (email);


--
-- Name: users users_email_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key86 UNIQUE (email);


--
-- Name: users users_email_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key87 UNIQUE (email);


--
-- Name: users users_email_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key88 UNIQUE (email);


--
-- Name: users users_email_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key89 UNIQUE (email);


--
-- Name: users users_email_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key9 UNIQUE (email);


--
-- Name: users users_email_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key90 UNIQUE (email);


--
-- Name: users users_email_key91; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key91 UNIQUE (email);


--
-- Name: users users_email_key92; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key92 UNIQUE (email);


--
-- Name: users users_email_key93; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key93 UNIQUE (email);


--
-- Name: users users_email_key94; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key94 UNIQUE (email);


--
-- Name: users users_email_key95; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key95 UNIQUE (email);


--
-- Name: users users_email_key96; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key96 UNIQUE (email);


--
-- Name: users users_email_key97; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key97 UNIQUE (email);


--
-- Name: users users_email_key98; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key98 UNIQUE (email);


--
-- Name: users users_email_key99; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key99 UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: access_requests_doctor_id_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX access_requests_doctor_id_patient_id ON public.access_requests USING btree (doctor_id, patient_id);


--
-- Name: access_requests_otp_expiry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX access_requests_otp_expiry ON public.access_requests USING btree (otp_expiry);


--
-- Name: access_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX access_requests_status ON public.access_requests USING btree (status);


--
-- Name: audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_ip_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_ip_address ON public.audit_logs USING btree (ip_address);


--
-- Name: audit_logs_resource_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- Name: audit_logs_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_severity ON public.audit_logs USING btree (severity);


--
-- Name: audit_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: access_requests access_requests_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: access_requests access_requests_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medical_records medical_records_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medical_records medical_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6heFnZLUwGgy2Xn1Wqn8ltx8fTRtaEfojDIvETDoetVut0UiyPS0jr54HXb1Vn1


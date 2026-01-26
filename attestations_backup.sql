--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: desp
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO desp;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: desp
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CanalNotification; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."CanalNotification" AS ENUM (
    'EMAIL',
    'SMS',
    'WHATSAPP'
);


ALTER TYPE public."CanalNotification" OWNER TO desp;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."Role" AS ENUM (
    'SAISIE',
    'AGENT',
    'DIRECTEUR',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO desp;

--
-- Name: StatutAttestation; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."StatutAttestation" AS ENUM (
    'GENEREE',
    'SIGNEE',
    'DELIVREE'
);


ALTER TYPE public."StatutAttestation" OWNER TO desp;

--
-- Name: StatutDemande; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."StatutDemande" AS ENUM (
    'ENREGISTREE',
    'EN_TRAITEMENT',
    'PIECES_NON_CONFORMES',
    'VALIDEE',
    'EN_ATTENTE_SIGNATURE',
    'SIGNEE',
    'REJETEE',
    'DELIVREE'
);


ALTER TYPE public."StatutDemande" OWNER TO desp;

--
-- Name: StatutIndexation; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."StatutIndexation" AS ENUM (
    'EN_ATTENTE',
    'EN_COURS',
    'INDEXE',
    'ERREUR'
);


ALTER TYPE public."StatutIndexation" OWNER TO desp;

--
-- Name: StatutNotification; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."StatutNotification" AS ENUM (
    'EN_ATTENTE',
    'ENVOYEE',
    'ECHEC'
);


ALTER TYPE public."StatutNotification" OWNER TO desp;

--
-- Name: TypePiece; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."TypePiece" AS ENUM (
    'DEMANDE_MANUSCRITE',
    'CERTIFICAT_ASSIDUITE',
    'CERTIFICAT_CESSATION',
    'CERTIFICAT_PRISE_SERVICE',
    'COPIE_ARRETE'
);


ALTER TYPE public."TypePiece" OWNER TO desp;

--
-- Name: TypeSignature; Type: TYPE; Schema: public; Owner: desp
--

CREATE TYPE public."TypeSignature" AS ENUM (
    'MANUELLE',
    'ELECTRONIQUE'
);


ALTER TYPE public."TypeSignature" OWNER TO desp;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: desp
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


ALTER TABLE public._prisma_migrations OWNER TO desp;

--
-- Name: appeles; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.appeles (
    id text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    "dateNaissance" timestamp(3) without time zone NOT NULL,
    "lieuNaissance" text NOT NULL,
    email text,
    telephone text,
    whatsapp text,
    diplome text NOT NULL,
    promotion text NOT NULL,
    "numeroArrete" text,
    structure text,
    "dateDebutService" timestamp(3) without time zone NOT NULL,
    "dateFinService" timestamp(3) without time zone NOT NULL,
    "demandeId" text NOT NULL
);


ALTER TABLE public.appeles OWNER TO desp;

--
-- Name: appeles_arretes; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.appeles_arretes (
    id text NOT NULL,
    numero integer NOT NULL,
    nom text NOT NULL,
    prenoms text,
    "dateNaissance" timestamp(3) without time zone,
    "lieuNaissance" text,
    diplome text,
    "arreteId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lieuService" text
);


ALTER TABLE public.appeles_arretes OWNER TO desp;

--
-- Name: arretes; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.arretes (
    id text NOT NULL,
    numero text NOT NULL,
    "dateArrete" timestamp(3) without time zone NOT NULL,
    promotion text NOT NULL,
    annee text NOT NULL,
    "fichierPath" text,
    "contenuOCR" text,
    "statutIndexation" public."StatutIndexation" DEFAULT 'EN_ATTENTE'::public."StatutIndexation" NOT NULL,
    "messageErreur" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dateIndexation" timestamp(3) without time zone,
    "lieuService" text,
    "nombreAppeles" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.arretes OWNER TO desp;

--
-- Name: attestation_counter; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.attestation_counter (
    id text DEFAULT 'singleton'::text NOT NULL,
    year integer NOT NULL,
    counter integer NOT NULL
);


ALTER TABLE public.attestation_counter OWNER TO desp;

--
-- Name: attestations; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.attestations (
    id text NOT NULL,
    numero text NOT NULL,
    "dateGeneration" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dateSignature" timestamp(3) without time zone,
    "typeSignature" public."TypeSignature",
    "fichierPath" text NOT NULL,
    "qrCodeData" text NOT NULL,
    statut public."StatutAttestation" DEFAULT 'GENEREE'::public."StatutAttestation" NOT NULL,
    "demandeId" text NOT NULL,
    "signataireId" text
);


ALTER TABLE public.attestations OWNER TO desp;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    action text NOT NULL,
    "userId" text,
    "demandeId" text,
    details text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO desp;

--
-- Name: config_system; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.config_system (
    id text NOT NULL,
    cle text NOT NULL,
    valeur text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.config_system OWNER TO desp;

--
-- Name: demandes; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.demandes (
    id text NOT NULL,
    "numeroEnregistrement" text NOT NULL,
    "dateEnregistrement" timestamp(3) without time zone NOT NULL,
    statut public."StatutDemande" DEFAULT 'ENREGISTREE'::public."StatutDemande" NOT NULL,
    observations text,
    "motifRejet" text,
    "agentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dateValidation" timestamp(3) without time zone,
    "dateSignature" timestamp(3) without time zone
);


ALTER TABLE public.demandes OWNER TO desp;

--
-- Name: directeur_signatures; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.directeur_signatures (
    id text NOT NULL,
    "userId" text NOT NULL,
    "signatureImage" text NOT NULL,
    "positionX" double precision NOT NULL,
    "positionY" double precision NOT NULL,
    "texteSignature" text NOT NULL,
    "pinHash" text NOT NULL,
    "pinAttempts" integer DEFAULT 0 NOT NULL,
    "pinBloqueJusqua" timestamp(3) without time zone,
    "isEnabled" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "qrCodePositionX" double precision DEFAULT 50 NOT NULL,
    "qrCodePositionY" double precision DEFAULT 50 NOT NULL,
    "qrCodeSize" double precision DEFAULT 80 NOT NULL,
    "signatureHeight" double precision DEFAULT 60 NOT NULL,
    "signatureWidth" double precision DEFAULT 150 NOT NULL,
    "totpBackupCodes" text,
    "totpEnabled" boolean DEFAULT false NOT NULL,
    "totpSecret" text,
    "twoFactorMethod" text DEFAULT 'email'::text NOT NULL
);


ALTER TABLE public.directeur_signatures OWNER TO desp;

--
-- Name: historique_statuts; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.historique_statuts (
    id text NOT NULL,
    "demandeId" text NOT NULL,
    statut public."StatutDemande" NOT NULL,
    commentaire text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "modifiePar" text NOT NULL
);


ALTER TABLE public.historique_statuts OWNER TO desp;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "demandeId" text NOT NULL,
    canal public."CanalNotification" NOT NULL,
    destinataire text NOT NULL,
    contenu text NOT NULL,
    statut public."StatutNotification" DEFAULT 'EN_ATTENTE'::public."StatutNotification" NOT NULL,
    "dateEnvoi" timestamp(3) without time zone,
    "messageErreur" text,
    tentatives integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO desp;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO desp;

--
-- Name: pieces_dossier; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.pieces_dossier (
    id text NOT NULL,
    type public."TypePiece" NOT NULL,
    present boolean DEFAULT false NOT NULL,
    conforme boolean,
    observation text,
    "statutVerification" text,
    "dateVerification" timestamp(3) without time zone,
    "verifiePar" text,
    "demandeId" text NOT NULL
);


ALTER TABLE public.pieces_dossier OWNER TO desp;

--
-- Name: templates_attestation; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.templates_attestation (
    id text NOT NULL,
    nom text NOT NULL,
    "fichierPath" text NOT NULL,
    "mappingChamps" text NOT NULL,
    actif boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.templates_attestation OWNER TO desp;

--
-- Name: users; Type: TABLE; Schema: public; Owner: desp
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    role public."Role" NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "derniereConnexion" timestamp(3) without time zone,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockoutUntil" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO desp;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4ec9c8ca-a548-4ab9-83e0-707f0955b655	fd58411a03dbb57687e8f4f08d1e05df53d05fede47a643fdf4c52a254056f3b	2026-01-21 13:59:45.1049+01	20260115112018_add_piece_verification_tracking	\N	\N	2026-01-21 13:59:45.007543+01	1
f3d25049-86e7-4dca-87f6-f613368c0295	f9f7e90ae67162285cd1fcaf59f3cc1cac5c89adad6201fb7215e1d5373a2aa6	2026-01-21 13:59:45.115432+01	20260115142436_add_password_reset_token	\N	\N	2026-01-21 13:59:45.105473+01	1
2cbe7c4d-fa57-455e-9680-e6933938d9bb	7046797b443f34317723a5c50b17988137d7a03907a766d763b96c608924f5b8	2026-01-21 13:59:45.119392+01	20260115145741_add_qrcode_position_to_signature	\N	\N	2026-01-21 13:59:45.116178+01	1
b026d7b4-f5a1-4d2b-ab65-ee7742fec99b	3321355bf04bc654a3704cf05eaaaf29116846bb262cdb454a54133dafaadfde	2026-01-21 13:59:45.12963+01	20260121123106_add_excel_upload_system	\N	\N	2026-01-21 13:59:45.120146+01	1
6d8925e0-5cf5-4fe2-a8ed-eae58ecdf59e	88940d9fcc62440892af8ec47cd0b4721c8013e52078ebcbef292b236f91eea0	2026-01-21 14:17:53.691748+01	20260121131753_add_lieu_service_to_appele_arrete	\N	\N	2026-01-21 14:17:53.678084+01	1
3f7bd213-aec1-4584-9990-acd2ad20a5d5	01354d3af069e9788a015de1854ff769eec3dde3d66db439bbf9b47e4ed39935	2026-01-22 10:21:59.383218+01	20260122092143_add_2fa_totp_support	\N	\N	2026-01-22 10:21:59.367109+01	1
\.


--
-- Data for Name: appeles; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.appeles (id, nom, prenom, "dateNaissance", "lieuNaissance", email, telephone, whatsapp, diplome, promotion, "numeroArrete", structure, "dateDebutService", "dateFinService", "demandeId") FROM stdin;
cmko15oai000gcq24mudppbvd	MAHAMADOU	Fatima	1996-07-20 00:00:00	Maradi	fatima.mahamadou@example.com	+22791234567	+22791234567	Master en Gestion	2023	2023/045/MJS/SCN	Ministère de la Santé Publique	2023-04-01 00:00:00	2024-03-31 00:00:00	cmko15oai000fcq24zykcfkuv
cmko15oa60008cq243v4fcpvo	ABDOU	Ibrahim	1995-03-15 00:00:00	Niamey	roufay_amadou@yahoo.fr	+22796888542	+22790123456	Licence en Informatique	2023	2023/045/MJS/SCN	Ministère de l'Éducation Nationale	2023-04-01 00:00:00	2024-03-31 00:00:00	cmko15oa60007cq244y3qo5xq
cmko15oal000ocq24w40yvwpm	HASSAN	Aïssata	1997-11-05 00:00:00	Zinder	dsi.mesri@gmail.com	+22790905646	\N	Licence en Économie	2024	2024/012/MJS/SCN	Ministère du Commerce	2024-02-01 00:00:00	2025-01-31 00:00:00	cmko15oal000ncq24mksfzs6t
\.


--
-- Data for Name: appeles_arretes; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.appeles_arretes (id, numero, nom, prenoms, "dateNaissance", "lieuNaissance", diplome, "arreteId", "createdAt", "lieuService") FROM stdin;
cmko4szhb0001cqt0r0fb9li3	1	Alhassane Ousmane	Mahamadou	1998-12-31 23:00:00	Koulikoira	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0002cqt0fruh42y6	2	Younouss Dagache	Fatimé	\N	N'guigmi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0003cqt02qqh9lwv	3	Sani Hachimou	Nana Faiza	2001-02-18 23:00:00	Gazaoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0004cqt0w14jj6me	4	Sani Attikou Mahamadou	Achirou	1997-12-31 23:00:00	Tera	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0005cqt0zu6kpkii	5	Sabiou Illiassou	Barira	\N	Dakoro	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0006cqt0me0134ka	6	Mamane Noura Alhassane	Mariama	2000-09-14 23:00:00	Akokan	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0007cqt0zeyzdmmq	7	Dan Tanin Sodo	Maman	1988-09-09 23:00:00	Agadez	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0008cqt0um6m57sc	8	Ibrahim Issa	Aminatou	1999-08-08 23:00:00	Birni N'gaoure	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb0009cqt0qd3ekbif	9	Zakari Hamidou	Rahinatou	1998-08-03 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000acqt08yscprtx	10	Naroua Ango	Mahamadou	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000bcqt0t97cdc6x	11	Hamissou Djibo	Nana Charifa	2000-07-03 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000ccqt0k0tdktvn	12	Oumarou Garba	Bachir	1997-12-31 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000dcqt0ix48hp2m	13	Idi Abdou	Zaharia	1999-12-31 23:00:00	Tchadoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000ecqt0l8d3uf65	14	Youssoufou Manzo	Chaouki	1998-04-02 23:00:00	Mirria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000fcqt00t9xasyu	15	Aboubacar Rabiou Mahaman	Madjid	1998-10-31 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000gcqt04yg7dyrx	16	Kabirou Yaou Zakari Maman	Lawan	2000-05-17 23:00:00	Magaria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000hcqt022cp4cqd	17	Oumarou Djirmey	Assamaou	1994-12-31 23:00:00	Ganki Danghare	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000icqt05zz7g5ga	18	Elh Tidjani Boukar	Ousseini	1992-12-31 23:00:00	Kazoe	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000jcqt00czk5cx3	19	Moustapha Djibo	Bachir	1993-09-08 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000kcqt0xrniuo4b	20	Mohamed Adamou	Charifatou	1998-12-31 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000lcqt0g77suj4j	21	Abdou Idi	Loukmane	2000-12-30 23:00:00	Galmi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000mcqt031e3f0f4	22	Saidou	Ismailou	1997-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000ncqt0en0e5ish	23	Malam Laouali Chaibou	Chérifatou	2001-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000ocqt090dohxwv	24	Koraou Alzouma	Chamsiya	2000-07-23 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000pcqt07v86k8k5	25	Salifou Aboula Halimatou	Sadiya	2001-12-31 23:00:00	Guidan Bado/Bouza	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000qcqt0sru10n2k	26	Djibrilla Soumana	Ibrahim	\N	Kirtachi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000rcqt00bkzd6oe	27	Kabirou Maty Arma Yaou	Kabirou	1999-12-31 23:00:00	Djirataoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000scqt0tjgutmmw	28	Issifi Idrissa	Mahamadou	1996-12-31 23:00:00	Dolbel	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000tcqt0vgguv26d	29	Amadou Mahaman Karami	Halimatou	2002-01-02 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000ucqt0pdoea6kg	30	Mahamadou Amadou	Chamsia	1999-07-11 23:00:00	Yaya/Konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000vcqt03wgbs58k	31	Oumarou Sounna Abdoul	Karim	2000-12-31 23:00:00	Bellande	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000wcqt0h4wewc70	32	Boukari Mounkaila Abdoul	Fataou	1997-12-31 23:00:00	Deya Hondo	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000xcqt0q4n1xmb4	33	Amadou Halidou	Djamila	\N	Doutchi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000ycqt0gh0o2qo3	34	Salifou Bara	Samaila	1998-12-31 23:00:00	Dakoro	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhb000zcqt0idz5a76t	35	Laouali Issaka	Nana Hadizatou	1998-01-03 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0010cqt0qf87ka1t	36	Aboubacar Mamane	Roukayatou	\N	Galmi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0011cqt0nvuunr39	37	Altine Mahamadou Abdoul	Koudous	1996-12-31 23:00:00	Lontia Kaina	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0012cqt0gin1fjor	38	Oumarou Bako	Imrana	1998-04-09 23:00:00	Agadez	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0013cqt07zsl9rm5	39	Hamidou Hassane	Hanafi	1999-12-31 23:00:00	Kollo	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0014cqt0jhs4c8cn	40	Adamou Gatari	Anass	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0015cqt0py8i3nnf	41	Abdoulaye Noga	Boubacar	\N	Makalondi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0016cqt0pfes54di	42	Gali Goulamata Moussa	Kalla	\N	Mirriah	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0017cqt0ce2ybudl	43	Aboubacar Mahamadou	Yacouba	1996-12-31 23:00:00	Katogue/Djirat	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0018cqt0mh3enety	44	Alkairou Oumarou	Aliou	2002-11-15 23:00:00	Garankedey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0019cqt0hgktvkvj	45	Hinsa Issaka	Oumou	1999-01-01 23:00:00	Kouboubi Sory	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001acqt04jfwaejw	46	Abdoulkadre Ibrahim	Mouslim	1996-12-31 23:00:00	Mirriah	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001bcqt0b50wgysf	47	Ali Mahaman	Saoudatou	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001ccqt0yrvlqa6q	48	Rabiou Mamane	Nana Farida	1998-08-03 23:00:00	Aguié	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001dcqt0olyi82qj	49	Adamou Moumouni	Bachirou	2000-12-31 23:00:00	Madou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001ecqt0oz9m8pm3	50	Ibrahim Aboubacar	Rahma	2001-06-02 23:00:00	Tahoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001fcqt04j4iyx3f	51	Moussa Harouna	Fassouma	2000-11-14 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001gcqt0globrtz2	52	Oumarou Sanda Mahamane Abdoul	Moumouni	2000-12-18 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001hcqt08zx20ucs	53	Bahari Hamma Ibrahima		2001-04-15 23:00:00	Laba Toudou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001icqt0gm3jui6l	54	Mahamane Razi Abdourahamane Mahaman	Nour	1997-02-11 23:00:00	N'guigmi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001jcqt0wo9rqa3c	55	Mani	Ikilima	1999-12-31 23:00:00	Mirriah	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001kcqt0lpe962fh	56	Malam Manzo Maman	Nafissa	1998-12-31 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001lcqt0ftphmil3	57	Oumarou Balla	Oubeida	1997-12-31 23:00:00	Arlit	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001mcqt0za60po3b	58	Malam Bachir Abba	Mahibatou	\N	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001ncqt0ne7zskmc	59	Habibou Issa	Maria	1993-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001ocqt01rpn3lni	60	Yahaya Ousmane	Safaraou	1998-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001pcqt0krflzxze	61	Abdoulaye Moussa	Samaila	\N	Tahoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001qcqt042b910q5	62	Mohamed Abdou Abdoul	Kader	\N	Hondobon Goungou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001rcqt0odohosdn	63	Oumarou Manzo Abdoul	Kader	\N	Agadez	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001scqt0k9wrqwjy	64	Harouna Mounkaila	Wassilatou	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001tcqt0up7bc579	65	Ayouba Ide	Zouera	1997-12-31 23:00:00	Moussadey Fandou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001ucqt0a8dfjchd	66	Mahaman Laouan Ichaou	Zainab	1994-06-04 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001vcqt0ub0pr80u	67	Malam Ali Mahamadou	Tassiou	1999-04-30 23:00:00	Mirriah	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001wcqt0v8oom5t0	68	Pouzeypatou Aboubakar	Nassirou	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001xcqt0f4w7jisj	69	Hamidou Garba	Soukairadjou	\N	Kobodey Tessa	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001ycqt0yxohh9bp	70	Souleymane Ibrahim Mahamadou	Keyrou	1995-10-11 23:00:00	Djambabadey/Dosso	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc001zcqt0nvme8v0c	71	Saidou Adamou	Ousmane	1997-12-31 23:00:00	Makalondi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0020cqt0fybgovi7	72	Saadou Souley	Fatimata	2001-06-03 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0021cqt0k75kkzkb	73	Hassane Hamidou	Hamsatou	1998-12-31 23:00:00	Koulikoira	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0022cqt08q0l6647	74	Nazirou Chaibou	Moutari	\N	Bandé	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0023cqt06r4b2ndt	75	Rabiou Abdou Ali	Yousaou	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0024cqt0i7jbic1r	76	Ali Abdou	Harouna	1993-11-11 23:00:00	Niamey/Lazaret	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0025cqt06tnj30kn	77	Ali Abdou	Mahamadou	2000-05-31 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0026cqt0sgxedkrf	78	Ibrahim Salissou	Zeinab	1998-12-31 23:00:00	Gouré	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0027cqt0sx5fqh2r	79	Mahamane Taher Moussami	Etta	1998-12-31 23:00:00	N'guigmi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0028cqt0tgbve7h9	80	Hamadou Djibrilla Abdoul	Salam	1993-12-31 23:00:00	Laway/Hamdalaye	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0029cqt0deve4i2t	81	Abouzeidi Samaila	Djamila	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002acqt0nfrqhse6	82	Housseini Hamadou	Sadou	1997-12-31 23:00:00	Dalwey/Say	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002bcqt0lzgs2sjz	83	Issa Gambo	Abdourahamane	\N	Tessaoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002ccqt0100zou3z	84	Mamoudou Yacouba Mahaman	Mansour	\N	Maradi Zaria 1	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002dcqt09s0ptiah	85	Harouna Aroubonkana	Boubacar	1999-12-31 23:00:00	Koissi/Dosso	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002ecqt02cuw8lb4	86	Hamadou Oumarou	Samssiya	1999-12-31 23:00:00	Birni N'gaoure	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002fcqt02une9h4y	87	Boudalla Bakar Boubacar	Boudalla	1996-12-31 23:00:00	Borgo Darey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002gcqt0497bogoo	88	Moussa Amadou	Sakinatou	1998-09-08 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002hcqt03svyn840	89	Mahaman Moussa	Moussa	1997-07-07 23:00:00	Magaria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002icqt0bvh7zn19	90	Mamane Tassiou Bako	Cherifatou	2000-11-14 23:00:00	Konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002jcqt0iafp33hu	91	Abari Malam Kadey	Fatimatou	\N	Goudoumaria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002kcqt02qdh2k48	92	Ali Issaka	Zinnira	\N	Konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002lcqt0d8mrx8wz	93	Yahaya Andin	Hadjara	2001-02-15 23:00:00	Dantchiao	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002mcqt0i726n0m1	94	Mihran Aboubacar	Mihrana	1996-12-31 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002ncqt0cjo107vl	95	Mati Ali	Amina	\N	Magaria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002ocqt03neii3op	96	Mahaman Moutari Maman	Ousmane	\N	Magaria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002pcqt0bdzar91o	97	Adamou Amadou	Habiba	1996-05-10 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002qcqt0w8i1vevx	98	Moussa Younoussa	Ismael	2000-09-25 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002rcqt05jrf1ws6	99	Hinsa Djibo	Ibrahim	1995-12-31 23:00:00	Gounno Koara	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002scqt062a6gav3	100	Mahamadou Bachir Mamoudou Mahamed	Kairou	2001-04-14 23:00:00	Birni N'gaoure	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002tcqt0akt8q2j4	101	Issaka Djibo Mahaman	Lawan	\N	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002ucqt0zm8i32ah	102	Assoumane Harouna	Dahirou	\N	Folakam/Konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002vcqt0k2pf3vw4	103	Hariss Abdoul Kadri Abdoul	Majid	2001-01-02 23:00:00	Konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002wcqt08jc0uzy8	104	Ali Mounkaila	Bassirou	1998-12-31 23:00:00	Larba Koira Zeno/Gotheye	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002xcqt074iwkkx8	105	Maliki Aboubacar	Ibrahim	\N	Koutougou/Ayorou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002ycqt0zkk4o0l8	106	Malam Dahir	Amadou	1998-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc002zcqt0vemyskrg	107	Mahaman Tassiou Issoufou	Aziza	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0030cqt0ek5fgiux	108	Mamane Boubacar	Djabir	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0031cqt0fpxwi4cb	109	Issoufou Nafiou	Mahamadou	\N	Tessaoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0032cqt0zwu94l2p	110	Ali Liman	Alhassane	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhc0033cqt0x6vmx69j	111	Abba Sanda Fatima	Zara	\N	Chimidour	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0034cqt09jbcdatu	112	Maharazou Sani	Aminatou	\N	Matameye	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0035cqt056bw40w4	113	Alkassoum Moussa	Yahanazou	\N	Tessaoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0036cqt07yrmzcfm	114	Souleymane Halidou	Oumarou	1997-12-31 23:00:00	Goungo	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0037cqt03xrhxsd2	115	Laouali Issaka	Bachirou	1998-01-05 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0038cqt07ecrslfv	116	Makao Douro	Ali	1996-12-31 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0039cqt0i9gsg51g	117	Djibo Amadou Mahamadou	Moctar	1996-09-09 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003acqt0b9jx5mcg	118	Oumarou Younsa	Rahinatou	\N	Tonkobangou Kollo	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003bcqt0sca94ib7	119	Ahidou Elh Moussa	Nana Balkissa	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003ccqt0top3kfl6	120	Abdou Moussa	Hassana	1998-12-31 23:00:00	Kaoura Alassane	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003dcqt00veizdm5	121	Amadou Issa	Nana Charifa	2001-05-07 23:00:00	Tounfalis	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003ecqt00ne8dz83	122	Bounouya Issa Abdoul	Razak	2000-11-25 23:00:00	Magaria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003fcqt0rxbg1i07	123	Mohamed Charhabilou	Oubeida	2000-05-09 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003gcqt0u4wp966v	124	Amadou Bizo	Oumarou	2000-05-13 23:00:00	Matankari	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003hcqt0v7v4v3d6	125	Maman Hassan	Aicha	\N	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003icqt0o9hqm97x	126	Amadou Hando	Raiyana	1998-06-04 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003jcqt0xku35km2	127	Harouna Abdou	Aliyou	1998-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003kcqt0vkhzgkqs	128	Ousmane Indihi	Safiya	1997-04-07 23:00:00	Bourdi/Keita	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003lcqt0vcov2jcd	129	Laouali Daouda	Choukouriya	2000-12-08 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003mcqt04ddoo2j2	130	Aboubacar Ibrahim Mahaman	Noura	2000-09-29 23:00:00	Doutchi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003ncqt044mpymmz	131	Souley Abdou	Zoubeirou	\N	Kirtachi Seybou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003ocqt061hedpev	132	Aliou Yacouba	Aissatou	2001-06-06 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003pcqt0w2c8n0wz	133	Laouali Cheffou Maman	Noura	\N	Takieta Peulh	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003qcqt0m3mz6ib6	134	Saley Djibo Arma	Yaou	1998-12-31 23:00:00	Maijirgui	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003rcqt0gkf99l2u	135	Tidjani Zabeirou	Oumarou	1999-12-31 23:00:00	Bande	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003scqt01tj130rp	136	Adamou Kalla	Bliaminou	2000-06-30 23:00:00	Harounaoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003tcqt02n9iheq2	137	Abdoul Karim Mahamadou	Saima	1998-12-31 23:00:00	Dirga 1	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003ucqt0q4wup4sy	138	Ibrahima Salifou	Aminou	\N	Sabonga	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003vcqt01gqg6308	139	Moussa Djibrilla	Minnatou	1999-12-31 23:00:00	Guesse Beri	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003wcqt0lxowfurp	140	Ide Moumouni	Mansour	1998-12-31 23:00:00	Madou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003xcqt02y2zjmj0	141	Maman Sani Illaye	Yahaya	2000-10-12 23:00:00	Tanout	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003ycqt0nacam9mk	142	Mahaman Sabiou Souley Mahaman	Salissou	1995-03-11 23:00:00	Tessaoua	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd003zcqt0lov85qpg	143	Laouali Idi	Ousmane	1997-12-31 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0040cqt08eb4ybbz	144	Mamane Zabeyrou	Najaatou	\N	Birni N'konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0041cqt0dawk4sao	145	Salao Bahago	Hafsatou	1999-01-09 23:00:00	Konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0042cqt00xprgx8c	146	Hassane Boube Oumoul	Keirou	2000-07-03 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0043cqt0vnwi99lr	147	Laouali Iro	Kamaloudini	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0044cqt0p469hp1u	148	Abdoul Wahab Alassane	Zeinabou	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0045cqt0lnf5styu	149	Issoufou Chaibou	Tahirou	\N	Bey Bey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0046cqt0nfoiqnaz	150	Maman Moutari Ibra	Nana Fassoumatou	1996-01-10 23:00:00	Diffa	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0047cqt0qoeka138	151	Mahaman Gali	Oumaimatou	\N	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0048cqt0gitep4xz	152	Moussa Yacouba	Moctar	1999-12-31 23:00:00	Kiota Mayaki	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0049cqt0xk8in831	153	Zaidou Alassane	Sabira	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004acqt0w3xydxfh	154	Youchaou Dan Ladi Abdou	Rahamane	1998-12-31 23:00:00	Matameye	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004bcqt0p0vxy49j	155	Hassane Mounkaila	Ismael	1996-04-11 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004ccqt0b6udjrru	156	Garba Saidou	Salissou	1994-12-31 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004dcqt0y5ijaa1b	157	Saidou Mahaman	Kissane	1997-02-03 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004ecqt0v2t47x45	158	Daouda Moussa	Souleymane	1994-10-02 23:00:00	Saga/Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004fcqt0aux9xrqg	159	Inoussa Inoussa Mahaman	Noura	\N	Magaria	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004gcqt0lc1msawr	160	Hamza Salam	Hassia	1999-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004hcqt0e974ahzg	161	Mahamadou Garba Mahamadou	Rabiou	2000-04-30 23:00:00	Konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004icqt0myltbwbn	162	Harouna Elhadji Daoure Abdoul	Aziz	\N	Birni N'konni	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004jcqt0s00ws3yx	163	Nouhou Sani	Okacha	2000-12-31 23:00:00	Maifarou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004kcqt0q0lw32ad	164	Ali Abdou	Balkisse	2000-09-03 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004lcqt0m4aalktz	165	Mahamadou Mahamane Abdoul	Razack	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004mcqt0p0ej2gp9	166	Salha Laouali	Mahamadou	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004ncqt0acqp6d8x	167	Halarou Laoualy Abdoul	Azizou	1994-03-08 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004ocqt0tmi0znwi	168	Rabiou Ibrahim	Haouaou	1999-06-03 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004pcqt0j87j24f6	169	Harouna Issiakou	Mahfouzou	1999-12-31 23:00:00	Filingué	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004qcqt00ne6d5cg	170	Hadi Oumarou	Ibrahim	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004rcqt0dxw01hsm	171	Saidou Tanko	Alio	\N	Malbaza	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004scqt095wcy1cc	172	Ousseini Saidou	Hindatou	2000-12-07 23:00:00	Diffa	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004tcqt0hbnyh75i	173	Oumarou Oumarou	Aissatou	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004ucqt06ronxgvn	174	Balle Boubacar Mahamadou		1996-12-31 23:00:00	Illela	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004vcqt0ulevke01	175	Alhassane Galiou	Zouéra	2002-05-09 23:00:00	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004wcqt06f2wbd3a	176	Ibrahim Mahamadou Abdoul	Aziz	1985-12-31 23:00:00	Ayorou	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004xcqt0wfv9tmcm	177	Issifi Idrissa	Mahamadou	1996-12-31 23:00:00	Dolbel	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004ycqt00tqm93yi	178	Oumarou Souleymane	Zeinabou	\N	Niamey	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd004zcqt0piwebjuk	179	Amadou Roufai Mahaman	Assamaou	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0050cqt065gmtpim	180	Maina Boukar Garba	Ali	\N	Agadez	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0051cqt0bdbpbm81	181	Tahirou Imini Abdoul	Karim	\N	Tamaské	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0052cqt0qbuk2bsy	182	Aboubacar Chipkaou	Alio	1995-12-31 23:00:00	Gobawa Carre	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0053cqt0re632268	183	Mahamadou Sallah Ousmane	Ismael	\N	Tillaberi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0054cqt0204as6mh	184	Ali Kalla	Hibatou	1996-12-31 23:00:00	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0055cqt0odhlfmyy	185	Mahamadou Issa	Oubeidoullahi	1997-12-31 23:00:00	Bande	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0056cqt0pm9u14lg	186	Amadou Ibrah	Moussa	1997-01-03 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhd0057cqt0fv96bg9j	187	Moussa Tatagui Issa	Bounou	1994-12-31 23:00:00	Zinder	DAP CEG : Arabe/Etudes Islamiques, ISFP/Franco-Arabe/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0058cqt0vvm8h2qo	188	Massaoudou Mahamed	Faroukou	1993-12-31 23:00:00	Makoissa	DAP CEG : Arabe/Etudes Islamiques, ISFP/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0059cqt0p3p7facy	189	Saifoulahi Issoufou	Issa	\N	Kire Kafada	DAP CEG : Arabe/Etudes Islamiques, ISFP/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005acqt05r2149iy	190	Ousman Ali	Farida	\N	Maradi	DAP CEG : Arabe/Etudes Islamiques, ISFP/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005bcqt0hbyk0u6x	191	Issaka Kimba	Barhame	1994-09-10 23:00:00	Deytagui Noma	Licence Prof au PES/CEG: Francais-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005ccqt0w6qzizi6	192	Issa Abarchi	Nouradine	1997-12-31 23:00:00	Guidan Tounaou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005dcqt0qw8myoal	193	Issoufou Adamou	Salissou	1997-09-16 23:00:00	Doutchi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005ecqt03xenth3k	194	Kalidou Oumarou	Hamadou	1997-01-24 23:00:00	Borgo Samsou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005fcqt0172kioo9	195	Issaka Moussa	Zabeirou	1995-12-31 23:00:00	Marindawa	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005gcqt0f8te7f0b	196	Idi Saidou	Kabirou	1999-12-31 23:00:00	Sae Sofoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005hcqt0rwamkskx	197	Ibrahim Saraoua	Moubarak	\N	Kanembakache	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005icqt08y7hntvt	198	Sani Mamane Sani		1998-05-31 23:00:00	Maigaraou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005jcqt0oy4qpi0h	199	Madi Badja	Zabeirou	1995-12-31 23:00:00	Kolfa	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005kcqt05s0z8vls	200	Boubé Hama	Djafarou	\N	Bellandé	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005lcqt04uk53dy0	201	Younssou Morou	Akilou	1992-12-31 23:00:00	Tagabati	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005mcqt0yqlkua7y	202	Abdou Nahantchi	Mahamadou	1994-12-31 23:00:00	Ambaroura	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005ncqt0m2kswtt0	203	Yayé Saley Abdoul	Rahimou	1996-12-31 23:00:00	Soley Tanka	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005ocqt0vmoz56d6	204	Chaibou Issa Abdoul	Aziz	1994-12-31 23:00:00	Dara/Sabon Machi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005pcqt06y92jzef	205	Saidou Daouda	Bassirou	1996-12-08 23:00:00	Tibiri	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005qcqt0wyy32b18	206	Souleymane Amadou	Souwaiba	\N	Toullou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005rcqt03auel9j4	207	Amadou Soumana	Raihanatou	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005scqt0fn9z1hn4	208	Saidou Abdou	Nana Chahadatou	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005tcqt0fuzuezsh	209	Mamadou Kanembou Malam	Falmata	\N	N'guigmi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005ucqt0ji3dqs62	210	Mahamadou Aboubakar	Rahanatou	1999-03-01 23:00:00	Balleyara	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005vcqt0i7wxpct4	211	Oumarou Batchiri	Nafissa	\N	Chedam	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005wcqt04y7rlaau	212	Bagagué Sandi	Rachida	1995-11-06 23:00:00	Malbaza	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005xcqt0ctza0t10	213	Hamadou Hassane	Sakina	\N	Tahoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005ycqt0z0q0nt5t	214	Magema Hamidou	Ramatou	1997-03-05 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe005zcqt0hzfbfb2w	215	Habibou Jibji	Latifa	1992-12-02 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0060cqt0233beevt	216	Yacouba Barmo	Faouzia	2000-05-23 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0061cqt0a1gwtdd2	217	Moussa Mounkaila	Nassara	1992-12-31 23:00:00	M'Bida	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0062cqt0hxa05nzg	218	Halidou Gado	Kadidjatou	1998-05-04 23:00:00	Akokan	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0063cqt0b1n9zsd5	219	Abdourahamani Oumarou	Fatima	1998-10-10 23:00:00	Gaya	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0064cqt0l7e9ehwz	220	Boubacar Abdourahamane	Djamila	1997-11-06 23:00:00	Matankari	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0065cqt0thmunqyh	221	Issaka Tondi	Ramatou	1999-02-08 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0066cqt0zuutdz7r	222	Illa Cheffou	Souleymane	1997-12-31 23:00:00	Assarou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0067cqt0ai6sv61f	223	Mahamadou Daoui	Ibrahim	\N	Yamamane	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0068cqt0hzcvbnfy	224	Mahaman Giga	Sahara	\N	Hawandawaki	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0069cqt02ylql6ns	225	Moumouni Halidou	Issoufou	1997-07-03 23:00:00	Tolkobeye	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006acqt0ta7v6gdc	226	Zakari Salifou	Alkaïrou	1997-12-31 23:00:00	Kobe Kaina	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006bcqt0qm2ujmb4	227	Amadou	Yacoubou	1995-12-31 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006ccqt0gyhlfw5t	228	Mahamadou Karimoune	Oumoukaltouma	1998-12-04 23:00:00	Birni N'konni	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006dcqt01nzv6lhh	229	Tchindo Marafa	Mourjanatou	\N	Kizamou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006ecqt0ybpru6ge	230	Salmanou Idrissa	Balkissa	\N	Birgi Babba	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006fcqt02xl17j2a	231	Moussa Daoui	Ichaou	1998-04-03 23:00:00	Yamamane	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006gcqt0n4oln8ya	232	Mahamane Nouri Abdou	Hindatou	1998-10-05 23:00:00	Akokan/Arlit	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006hcqt0mcoqdjcj	233	Ousmane Moussa	Fadimata	1994-11-30 23:00:00	Simiri/Ouallam	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006icqt0181obazi	234	Mahamadou Halidou	Rabiatou	1995-12-31 23:00:00	Tibiri	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006jcqt080rksoiz	235	Abdou Seyni Abdoul	Kadri	1996-12-31 23:00:00	Balidey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006kcqt0tl10s2b3	236	Saley Djibo	Sakinatou	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006lcqt0hyuvpzo8	237	Ousmane	Mountari	1994-12-31 23:00:00	Kotchi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006mcqt0p6h2tou9	238	Saadou Issa	Oumou	1995-10-02 23:00:00	Nioumey Kagourou Peulh	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006ncqt0vrjjgac0	239	Garba Sani	Wassila	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006ocqt0ugcnujae	240	Habou Issoufou	Djamila	1994-08-09 23:00:00	Maradi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006pcqt0xbywg7ge	241	Bachir Amani Halimatou	Saâdia	1992-08-09 23:00:00	Zinder	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006qcqt00p4yb0yb	242	Seini Adamou	Moctar	\N	Balleyara	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006rcqt0pvhindcb	243	Ousseini Amadou Abdoul	Wahidou	1995-12-31 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006scqt0t89wlfzg	244	Issoufou Boukary	Nana Hadiza	1996-07-11 23:00:00	Magaria	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006tcqt0mf6osgn0	245	Zalbi Zabeirou	Fati	1996-11-30 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006ucqt0f0uiopyx	246	Awal Issa Sani		1990-12-31 23:00:00	Tokaney	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006vcqt0uo33vbd0	247	Hamani Koysabou	Ibrahim	1995-06-07 23:00:00	Logayzeido	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006wcqt0ympemel5	248	Issoufou Boureima	Hafissou	1995-12-31 23:00:00	Kiota Mayaki	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006xcqt0pd6cjzp3	249	Mahaman Abdou	Rachida	1994-08-31 23:00:00	Birni N'gaouré	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006ycqt0dpjyu37a	250	Hadou Mainou	Jamila	\N	Bawada	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe006zcqt0gb3lnjav	251	Siradji Mato Amadou		1995-12-31 23:00:00	Faroua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0070cqt07krenc0c	252	Aboubacar Ibrah	Samira	1999-03-08 23:00:00	Akokan/Arlit	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0071cqt06etnakfo	253	Abdourahamane Idrissa	Kadidja	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0072cqt062bsxxu0	254	Sadou Harouna	Samaou	1994-12-31 23:00:00	Moussadey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0073cqt0lss8sgjg	255	Guidami Issa	Ramatou	\N	Maradi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0074cqt0hdyrcmhf	256	Oumarou Abdou	Halidou	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0075cqt0crez75aj	257	Moussa Mossi	Hamdiya	\N	Farié	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0076cqt0lpt34dro	258	Djibo Abdou	Rachida	1993-12-31 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0077cqt0gujix521	259	Chaibou Guiwa	Rachida	\N	Golo Gabass	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhe0078cqt0jszcsyyx	260	Maiguizo Bouzou	Saâdatou	2000-09-09 23:00:00	Doutchi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0079cqt00ao8p97r	261	Inoussa Ididia	Aminatou	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007acqt0pdhebdql	262	Moctar Souley	Ousseina	1996-12-31 23:00:00	Gardidjié	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007bcqt0taa6xd79	263	Soumana Adamou	Rakiatou	1999-10-10 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007ccqt0mrbajjfj	264	Hima Zakou	Seybou	1997-12-31 23:00:00	Boudada Douna	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007dcqt0ekvhlocv	265	Garba Djibo	Souwaiba	2000-08-07 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007ecqt0rrw3rs9g	266	Idi Maizoumbou	Maimouna	\N	Zinder	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007fcqt0uy0nd50j	267	Alio Goumar	Rakia	\N	Dogon Doutchi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007gcqt0owlwued5	268	Dakaou Elo	Salifou	1995-08-03 23:00:00	Illéla	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007hcqt0sqs40g8v	269	Saidou Yammey	Kadiri	\N	Balessa	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007icqt01x04k0qd	270	Tsahirou Batchiri	Aboubacar	1996-02-01 23:00:00	Madetta	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007jcqt0hj8f7w07	271	Mage Gounno	Salamatou	2000-09-07 23:00:00	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007kcqt0bxbvf3tl	272	Illiassou Hachimou	Yahaya	1995-12-31 23:00:00	Kontamaoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007lcqt04xwjqkfo	273	Amadou Bizo	Zoulahatou	1994-09-06 23:00:00	Maradi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007mcqt087p4wi7h	274	Issoufou Hamidou	Inayatou	\N	Maradi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007ncqt0ttv77892	275	Ado Ali	Halima	1997-08-03 23:00:00	Daiberi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007ocqt08e440buk	276	Kawa Mouddour	Léla	1996-06-07 23:00:00	Diguina Bonkoukou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007pcqt07q10cat1	277	Mamane Faria	Saidou	\N	Tombon Bouya	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007qcqt0dw5wq3wm	278	Kallamou Salé	Aboubacar	1996-12-31 23:00:00	Maijirgui	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007rcqt06u4ri8r8	279	Adamou Oumarou Abdoul	Warissou	1995-12-31 23:00:00	Chawagui	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007scqt0xglgg37h	280	Atta Gounga	Idi	\N	Kel Tagaye/Tambaye	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007tcqt0egpnyxh1	281	Assoumana Kailou	Halimatou	\N	Agadez	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007ucqt0pffkwoxh	282	Chaaibou Maman	Yacouba	1995-12-31 23:00:00	Guéchémé	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007vcqt09a3zc58n	283	Ada Harouna	Mahamadou	1999-06-01 23:00:00	Djibalé	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007wcqt0od4l9q22	284	Ousmane Ali	Maïmou	1999-12-31 23:00:00	Tounfafi Malam	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007xcqt0vqam8zzq	285	Ayouba Souleymane	Ali	1995-12-31 23:00:00	Minji	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007ycqt019my5r8y	286	Saadou Issa	Hama	1993-12-31 23:00:00	Nioumey Kagourou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf007zcqt0wqj6ckqb	287	Chaibou Mayaou	Moustapha	1995-12-31 23:00:00	Nassaraoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0080cqt0ebc8h9fm	288	Adamou Boukary	Biba	\N	Sékiré Zarma	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0081cqt0xwn1jj6i	289	Maman Rabiou	Mariama	1997-08-06 23:00:00	Madaoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0082cqt01od8fxbk	290	Soumana Mamoudou	Aichatou	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0083cqt0pjawsh53	291	Mahaman Bachir	Salbiya	1997-12-31 23:00:00	Yékoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0084cqt0zyc1lrcr	292	Moutari Boukari	Nana Aichatou	\N	Konni	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0085cqt0yvdfdzdc	293	Hassane Seybou	Ousseini	1993-12-31 23:00:00	Kankandi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0086cqt0ovkpqrak	294	Abdou Tchiwake	Saratou	\N	Dogon Doutchi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0087cqt0h1vcpqf3	295	Harouna Issa	Chamsia	1997-10-09 23:00:00	Téssaoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0088cqt0x7rk607q	296	Issaka Maman	Iro	1994-12-31 23:00:00	Katogué	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0089cqt0nvl0xsmn	297	Hamissou Anza	Maryama	\N	Kizamou	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008acqt0thotdd4q	298	Assoumane Bouwayé	Faiza	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008bcqt0bok14jx1	299	Moussa Abdoulaye	Sakina	1993-12-31 23:00:00	N'dounga Tarey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008ccqt00w6j8os8	300	Saidou	Habsatou	1993-12-31 23:00:00	Kanembakache	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008dcqt0sn19gdhr	301	Alkassoum Agali	Oumal-Hairou	\N	Goula/Dakoro	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008ecqt07bqalzva	302	Boubacar Sani	Nafissa	1997-11-09 23:00:00	Doutchi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008fcqt0hxsu8zv8	303	Mahamadou Hassane	Rakia	\N	Doutchi	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008gcqt0yeb9tder	304	Badamassi Barajé	Zaneidou	1995-12-31 23:00:00	Gamji Sofoua	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008hcqt0ly1qs45m	305	Hassane Gardio	Oumal-Hairi	\N	Dosso	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008icqt05e7pi9f6	306	Moudi Gouzayé	Samira	1997-10-11 23:00:00	Dosso	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008jcqt0etvpro14	307	Hamadou Idrissa	Halimatou	1996-12-31 23:00:00	Fabidji	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008kcqt01rjtempm	308	Adamou Hassane	Balkissa	\N	Dabaga	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008lcqt07zdqsapq	309	Hassan Zakou	Limmo	\N	Kouria	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008mcqt0d64q6ew1	310	Dari Garba	Sani	1995-05-08 23:00:00	Boutana	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008ncqt0tw77y59g	311	Assayit Gagere	Zeïnabou	1997-08-10 23:00:00	Arlit	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008ocqt0ki2uqvlt	312	Miko Moussa	Sabiou	1996-12-31 23:00:00	Gidan Oumarou	Licence Prof au PES/CEG: Français-Anglais, ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008pcqt0zm7x2ahp	313	Issa Na-Allah	Maimouna	1999-11-02 23:00:00	Tessaoua	Licence Prof au PES/CEG: Français-Anglais,ENS, UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008qcqt0888gk95g	314	Souleymane Timbo	Oumaissa	\N	Maradi	Licence Prof au PES/CEG: Français-Anglais, ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008rcqt0ydgzifxn	315	Issoufou Karimou	Fataou	1996-12-31 23:00:00	Kokaiore-Zarma	Licence Prof au PES/CEG: Français-Anglais,ENS, UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008scqt0p3x9vjby	316	Rabiou Maidawa Abdoul	Habou	1997-12-31 23:00:00	Farabani	Licence Prof au PES/CEG: Français-Anglais,ENS, UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008tcqt0m7ptoqt8	317	Daniel Abou	Saratou	\N	Maradi	Licence Prof au PES/CEG: Français-Anglais,ENS, UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008ucqt0u0dtsn93	318	Abdourahaman Malam Boukari	Dahirou	1996-03-31 23:00:00	Zermou	Licence Prof au PES/CEG: Français-Anglais,ENS, UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008vcqt0zfd5gv2v	319	Assoumane Mahamane Sao	Faidatou	1998-10-07 23:00:00	Doutchi	Licence Prof au PES/CEG: Français-Anglais,ENS, UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008wcqt0ijo4co7w	320	Mahamadou Haya	Issoufou	\N	Niamey	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008xcqt0xbf7ntlb	321	Hamidan Awayaka	Assalama	1995-03-01 23:00:00	Arlit	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008ycqt0cujqdiwr	322	Ali Salifou Maman	Baraou	1992-12-31 23:00:00	Guidan Tangno	Licence Prof au PES/CEG: Français-Anglais,ENS,UAM/NY	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf008zcqt05gap5c7h	324	Assane Liman Amadou	Gadji	1998-04-06 23:00:00	Gouré	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0090cqt0a5glzfpu	325	Illiassou Souley	Indi	2000-04-21 23:00:00	Dirkou	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0091cqt0zmyk0hh5	326	Moussa Oumarou	Maman	1996-12-31 23:00:00	Fouroumi	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0092cqt0wp8mzgr9	327	Abdou Magna	Oumarou	2000-04-19 23:00:00	Tanout	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0093cqt0dabrk72j	328	Maman Djibdji	Sabiou	1992-12-04 23:00:00	Zinder	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0094cqt0k9xr1bd1	329	Magagi Anachi	Tassiou	2000-08-29 23:00:00	Katourge/Wacha	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0095cqt04frjcfwq	330	Harouna Lawan	Mousbahou	1993-12-31 23:00:00	Koubdo Soufoua	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0096cqt0fwrk264o	331	Maman Moussa	Kabirou	\N	Belbedji	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0097cqt0qf4t2f0b	332	Harouna Abdou	Amsatou	2000-01-19 23:00:00	Guididuir Gouré	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0098cqt07k04mjfq	333	Nazi Adamou	Roukkayatou	\N	Mallamawa Kaka	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf0099cqt05h107rjt	334	Yaou Abdou Abdoul	Aziz	\N	Zinder	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf009acqt0jk5vsjdz	335	Mahaman Bachir Ousseini	Rahila	2002-01-03 23:00:00	Yékoua/Magaria	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhf009bcqt0zwjhaywr	336	Abdou Alhassan Abdou	Razak	1997-12-31 23:00:00	Mazagna	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009ccqt0b5jdxys0	337	Adamou Moutari Abdoul	Rachid	2001-03-22 23:00:00	Zinder	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009dcqt0f8z984gj	338	Amadou Mani	Saminou	1997-12-31 23:00:00	Dajin Abdo	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009ecqt03zhj2ooy	339	Abdou Oumarou	Mountaka	1996-12-31 23:00:00	Koumtchi	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009fcqt0mhfkv985	340	Inoussa Saidou	Roukayatou	\N	Akokan/Arlit	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009gcqt0i9kyukxj	341	Souleymane Manou	Falmata	2001-09-02 23:00:00	Gangara	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009hcqt05zznxzls	342	Hassane Yacouba	Kadidjatou	2001-02-03 23:00:00	Doutchi	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009icqt0jd6sba56	343	Chaibou Ilyassou	Absatou	\N	Belbedji	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009jcqt07p25vmw2	344	Moumouni	Chaibou	1992-12-31 23:00:00	Maiguizaoua	DAP/CEG en Français-Anglais, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009kcqt0got7nyj4	345	Yacouba Djibi	Mohamed	1999-12-31 23:00:00	Fagata	Licence en Didactiques : Français-Anglais, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009lcqt0o1024ive	346	Yahaya Madougou	Mourtala	\N	Alkali	Licence en Didactiques : Français-Anglais, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009mcqt02r8awp3u	347	Issaka Hamidou	Nafissa	1999-10-09 23:00:00	Arlit	Licence en Didactiques : Français-Anglais, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009ncqt0bp2i7ix0	348	Hambali Issoufou	Abdourahmane	\N	Tabalak	Licence en Didactiques : Français-Anglais, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009ocqt0jjxo74tk	349	Adamou Abdou	Hamani	\N	Sangou	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009pcqt012fvza83	350	Rébo Ardo Kouggou	Mohamed	\N	Gazaoua	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009qcqt0y9eitoch	351	Oumarou Maidaré	Sada	1995-12-31 23:00:00	Imbelbélou	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009rcqt09ax4copd	352	Hadi Ali	Sani	1996-12-31 23:00:00	Mallamaoua/Magaria	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009scqt03srut3tu	353	Amada Elh Attahirou	Adamou	1994-12-02 23:00:00	Dakoro	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009tcqt0px97vkp7	354	Habou Yahaya	Sabiou	1992-12-31 23:00:00	Maimagé Tchiroma	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009ucqt0jwyqluf1	355	Djigo	Ibrahim	1994-12-31 23:00:00	Garin Salao	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009vcqt0oo24c2l7	356	Idrissa Oumarou Mahamadou	Nazirou	\N	Tibiri	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009wcqt0f3i0lqnx	357	Ibrahim Dodo Mahamane	Kabirou	1987-07-03 23:00:00	Mayahi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009xcqt0819ipza3	358	Ibrahim Oumarou	Zouldini	1995-12-31 23:00:00	Saboua Rijia	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009ycqt0bk0oy0nr	359	Yahaya Issiaka Moumouni		1993-12-31 23:00:00	Dan Gamji	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg009zcqt0ugl2i8le	360	Namaiwa Bizo	Saâdou	1995-12-31 23:00:00	Angoal Maba	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a0cqt0v3soi6kd	361	Oumarou Ango Abdou		1996-12-01 23:00:00	Yilwa	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a1cqt05dq06ami	362	Alio Abdoulkarim	Djafarou	1996-10-31 23:00:00	Tounfalis	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a2cqt06evcw4gd	363	Maharazou Abdoullahi	Chamsia	\N	Maradi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a3cqt091dcaj04	364	Ibounou Alhassane Ramatou		2000-02-26 23:00:00	Arlit	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a4cqt0ham3svd5	365	Adamou Boubacar	Sakina	1997-01-05 23:00:00	Maradi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a5cqt0skokrxma	366	Malam Moussa Malam Adamou	Mariama	1997-12-31 23:00:00	Darangomé	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a6cqt0qkftznho	367	Maman Na Balki	Charifa	1998-12-31 23:00:00	Gabi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a7cqt0y37jzu3w	368	Moutari Boubacar	Salaha	\N	Gouala	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a8cqt02cweszhu	369	Aliou Yayé	Faouzia	2001-05-17 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00a9cqt0z59onk47	370	Mahamadou Lamine Issa	Fadima	1995-12-31 23:00:00	Doutouel	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00aacqt0erbctgry	371	Ali Hama	Ramatou	1997-12-31 23:00:00	Addaré	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00abcqt0eqxj0dzo	372	Moumouni Elhadji Lana Amina	Waran	\N	Diffa	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00accqt08aq3pyje	373	Abdoul Karim Souleymane	Rahinatou	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00adcqt0mhp3e54x	374	Moussa Bori	Aminou	\N	Maraké Magori	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00aecqt0vftwomqz	375	Ali Moungai	Saratou	1999-06-30 23:00:00	Ourafane/Tessaoua	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00afcqt04ervvf2p	376	Yabo Mato	Ali	1995-12-31 23:00:00	Kalgo	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00agcqt0jb72hbs2	377	Assoumane Gouzaé	Yanoussa	\N	Zanmazoubi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00ahcqt0ovsagr8d	378	Idi Mallam	Bassirou	1997-12-31 23:00:00	Sabon Machi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00aicqt0qg2opl91	379	Harouna Naoussa	Marliya	1997-03-31 23:00:00	Madaoua	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00ajcqt0a22ivhz1	380	Amore Mato	Mariama	1998-07-31 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00akcqt069nzei4l	381	Agali Assalack	Maimouna	1999-05-02 23:00:00	Keita	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00alcqt0v97idvjn	382	Nahantchi	Mariama	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00amcqt0dmgxzml2	383	Adamou Issa	Misbaou	\N	Harikanassou	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00ancqt0rzytle6i	384	Mahaman Issa	Ousseina	1994-05-05 23:00:00	Doutchi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00aocqt0cjztmvoh	385	Gouzaé Abdou	Rachida	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00apcqt0e44tt6xh	386	Halidou Baâre	Bello	\N	Sakari	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00aqcqt0zplx3uc0	387	Ali Akasser	Badria	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00arcqt0bmucpzn1	388	Assadi Mallam	Nafissatou	\N	Bagagi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00ascqt00z2ecjtx	389	Yacouba Ibrahim	Moustapha	1996-11-30 23:00:00	Intouila	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00atcqt0jybd1ix1	390	Abdou Hassane	Mahamadou	1998-12-31 23:00:00	Falmey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00aucqt0s08t7ovg	391	Issaka Nayou	Rabiou	1995-12-31 23:00:00	Gawaro Dan Yacouba	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00avcqt0w4mkq06e	392	Hama Seyni	Fatiyatou	1993-10-03 23:00:00	Bangario Baba	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00awcqt0m2jevdzt	393	Hamza Djermakoye	Safia	1996-12-31 23:00:00	Filingué	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00axcqt0xi33ssvc	394	Arzika Nomaou	Laria	1998-12-05 23:00:00	Dosso	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00aycqt0h8lnqlkj	395	Zakari Djibo	Habibata	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00azcqt0p1p0bhdn	396	Mahamadou Mainassara	Mariama	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b0cqt0rj8wxv03	397	Oumarou Garba	Salamatou	\N	Tahoua	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b1cqt04u8gj91l	398	Batouré Samba	Fati	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b2cqt0frhachhq	399	Oumarou Namata Abdoul	Aziz	1994-12-31 23:00:00	Baouba	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b3cqt0qlqwk2gn	400	Anza Dan Mato	Ibrahim	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b4cqt05ff7uzj9	401	Mahamadou Illiassou	Souweiba	2000-01-21 23:00:00	Dosso	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b5cqt0mke3hzqh	402	Souleymane Rabo Abdoul	Kader	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b6cqt00d3jiw7r	403	Djibrilla Sahaibou	Samaila	\N	Sabonguida	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b7cqt0vb1zei7m	404	Ali Djibo	Chamssia	1995-05-09 23:00:00	Maradi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b8cqt01wc2gpok	405	Salifou Touradjo Mahamane	Sani	1994-12-31 23:00:00	Kakitama	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00b9cqt0vfxzs03m	406	Mahamadou Souleymane	Hassana	1993-12-31 23:00:00	Biguel	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00bacqt0p9in5nt3	407	Boubacar Nahina	Ibrahim	1978-02-10 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00bbcqt03qheq3gn	408	Ibrahim Hassane Djibo	Aissa	\N	Arlit	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00bccqt062ikck3d	409	Yacoubou Zakari	Daradjatou	1997-12-08 23:00:00	Gaya	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00bdcqt0h974yjng	410	Sanoussi Manzo	Salamatou	\N	Magaria	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00becqt04qhc4z7w	411	Hamani Hama	Seybou	1997-12-31 23:00:00	Warou	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhg00bfcqt0gb21m4yf	412	Amadou Alou	Samira	1998-07-02 23:00:00	Kiéché	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bgcqt0dpcrmc9f	413	Mounkaila Nezoumou	Zeinabou	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bhcqt07toi8001	414	Issaka Abdou	Nawaratou	1995-03-07 23:00:00	Maradi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bicqt0124ovjfn	415	Amadou Adamou	Adama	1996-01-07 23:00:00	Loga	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bjcqt0yvdl5mx2	416	Kané Ganaou	Aicha	\N	Tchizon Kouregué	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bkcqt0ctods3m7	417	Abdou Amadou	Nafissatou	1994-08-08 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00blcqt0sj10fsuc	418	Tanimoune Bega	Hassiya	1998-12-31 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bmcqt02yu4egoq	419	Amadou Hassane	Aichatou	1999-02-03 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bncqt011ue71wk	420	Hassane Sanda	Sahadatou	\N	Koutoukalé	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bocqt0iir9cdq9	421	Gagara Tankari	Adamou	1993-05-10 23:00:00	Landara	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bpcqt0ms474hfo	422	Adamou Bachir Cheou	Gambo	1997-09-01 23:00:00	Bilma	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bqcqt0qlrraf99	423	Oumarou Harouna	Ramatou	1993-12-31 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00brcqt0st5d0lwu	424	Hassane Saley	Idé	1996-12-31 23:00:00	Kobarguikoye	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bscqt00ng50nyl	425	Hamadou Amadou	Rachida	1996-06-06 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00btcqt0gbsdrplb	426	Soumana Siddo	Samira	1998-10-03 23:00:00	Zinder	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bucqt0d489x7nc	427	Samaila Malam Nouhou	Mansour	\N	Kantché	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bvcqt0p57qmmb5	428	Mamoudou Soumana	Soumaila	1996-12-31 23:00:00	Koulbaga	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bwcqt0eiuu9wyc	429	Younoussa Sagayé	Habibou	\N	Gala Goungou	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bxcqt0ejbqp376	430	Dan Soubdou Abdou	Ousseina	1997-12-31 23:00:00	Sabon Kafi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bycqt0xkgu1yum	431	Dourhamane Seydou	Omar	1994-12-31 23:00:00	Deye	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00bzcqt0x1e8bhbl	432	Idi Begou	Badamassi	1994-11-10 23:00:00	Maradi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c0cqt0d4ydn2rl	433	Ali Idi Abdoul	Rachidou	1995-09-11 23:00:00	Ibrahim/Alforma	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c1cqt00ibg44dy	434	Hamadou Issoufou	Mazou	1997-10-01 23:00:00	Alkawal Zarma	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c2cqt080vrdgwp	435	Abdou Karimou Nassar	Inoussa	1995-12-31 23:00:00	Angoal Saoulo	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c3cqt0fwle0jc1	436	Mahamadou Mainassara	Zeinabou	\N	Aviation	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c4cqt0lyk6my39	437	Barkiré Karimou	Hassana	1994-04-04 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c5cqt0sm8ezx4e	438	Idi Yacouba	Zouleykatou	1995-12-31 23:00:00	Loga	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c6cqt0ump0z7ch	439	Modi Karimou	Djamila	1993-10-03 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c7cqt0b1q36srp	440	Aboubacar Salihou	Achirou	1994-12-31 23:00:00	Dan Madotchi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c8cqt0mpua567f	441	Rabo Tankari	Illa	1997-12-31 23:00:00	Soly	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00c9cqt02vxc8qii	442	Tanimoune	Rahila	\N	Tibiri	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cacqt06563npo8	443	Boukar Abba Gana	Fanna	1999-09-07 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cbcqt0tahzc5hy	444	Laminou Souley Abdoul	Razak	1995-12-31 23:00:00	Yékoua	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cccqt0tm1fnwey	445	Amadou Gagara	Oumalher	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cdcqt06dm6wnp8	446	Yahaya Hamadou	Mariama	1997-06-11 23:00:00	Kalo Mota	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cecqt09acfvi1q	447	Hamissou Saidou Maman	Nafiou	1994-12-31 23:00:00	Sakata	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cfcqt03uhqggdk	448	Harouna Moussa	Harissou	1996-12-31 23:00:00	Saoulaoua	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cgcqt0vxnif12d	449	Zakari Souley Zouley	Fatou	2000-06-19 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00chcqt0xcy74241	450	Boureima Hama	Aichatou	\N	Tillaberi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cicqt01doznffq	451	Salla Alassane	Salissou	\N	Dakourawa	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cjcqt0tqoro1t2	452	Harouna Malam Adji Abdoul	Karim	1995-12-31 23:00:00	Gouré	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00ckcqt0d2p39ej8	453	Issaka Kollé	Assan	1996-05-01 23:00:00	Dogari	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00clcqt0o1amlma4	454	Maman	Issahaka	\N	Bangaza	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cmcqt0odo06yhl	455	Amadou Soufiane	Charifatou	\N	Arlit	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cncqt0frycnx8l	456	Ahmed Alkassoum	Mohamed	\N	Ingall	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cocqt0bi00lwmk	457	Laouali Idi	Saâdatou	1997-08-11 23:00:00	Arlit	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cpcqt03ksjcv4d	458	Oumarou Dan-Dambo Mamane	Lawaly	\N	Guéchémé	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cqcqt0gxwrlkhm	459	Sama Niandou	Salifou	1996-01-04 23:00:00	Gaya	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00crcqt0o4e0hjc5	460	Oumarou Djibo	Fadilatou	\N	Deytagui	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cscqt06b3kx98s	461	Harouna Souley	Nana Mariama	\N	Agadez	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00ctcqt088h6k9si	462	Abdou Adamou	Moctar	1997-12-31 23:00:00	Tchara Koisize Koira	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cucqt03tg3unzf	463	Boukari Dan Nomaou	Sabiou	1992-12-31 23:00:00	Guidan Atché	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cvcqt0wawi4xew	464	Ibrahim Abdoulaye	Nana Soureyatou	\N	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cwcqt021wvvfgj	465	Saidou Beto	Boureima	\N	Batamberi	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cxcqt08wjvnhc7	466	Issaka Idi	Samiratou	\N	Saga Fondo/Kollo	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00cycqt0olqi8bgo	467	Arzika Naroua	Hassimou	\N	Angoual Zaroumey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00czcqt0zylzx27k	468	Issa Salifou Kané	Hadjara	\N	Arlit	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d0cqt0r7a7re6x	469	Ali Abba	Adama	1998-01-09 23:00:00	Woro/Gouré	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d1cqt00jvd7atk	470	Hassane Iddé	Zeinabou	\N	Zinder	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d2cqt07eehukeo	471	Ali Gao	Kabirou	1996-12-31 23:00:00	Madarounfa	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d3cqt0ooqeiaf2	472	Abdou Ibrahim	Mohamed	1999-12-31 23:00:00	Inguira/Keita	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d4cqt03ydl4rkc	473	Adamou Daouda	Roucaiyatou	\N	Akokan/Arlit	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d5cqt0qvrnybfa	474	Hassane Adamou	Fatiya	1996-02-10 23:00:00	Niamey	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d6cqt0cwj6d28i	475	Hamada Aboubacar	Samaila	\N	Tahoua	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d7cqt0hlxxvy91	476	Abdou Idi	Badamassi	\N	Kodéroua	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d8cqt0xa2ezf7m	477	Guéro Gadjiri	Sala	1994-12-31 23:00:00	Zarboulé	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00d9cqt03mzqmq2r	478	Zoubeirou Issa	Hamissou	1995-12-31 23:00:00	Mangodo	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00dacqt0rfzdkeph	479	Mayaki	Ibrahima	1977-10-05 23:00:00	Tibiri/Doutchi	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00dbcqt011cm9ww7	480	Riskoua Garba	Fatima	1997-12-31 23:00:00	Toudoula	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00dccqt0lstl0hr5	481	Rouhoumaou Adamou	Saloufou	\N	Guidan Gorey	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00ddcqt0qkc58xg2	482	Sabiou Issoufou	Moustapha	\N	Bandé	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00decqt0dyzpipnl	483	Harouna Issaka Maman	Rabiou	1997-12-31 23:00:00	Matameye	Licence en Didactiques : Français-Histoire-Géographie, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00dfcqt0q7d0lugp	484	Abdoulaye Hamidou	Zalika	2000-09-14 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhh00dgcqt0ijm0s9qa	485	Abdoulaye Elhadji Majah	Tadjira	1995-05-11 23:00:00	Manzou	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dhcqt0uog0gx92	486	Mahaman Sani	Souéba	1999-12-31 23:00:00	Téssaoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dicqt0unxk8poc	487	Amadou Idé	Fadillatou	1999-12-31 23:00:00	Hamdallaye	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00djcqt0bnjrqx7o	488	Tahirou Abarchi Mahamadou	Bachar	2000-11-11 23:00:00	Maradi	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dkcqt0bwb2guqb	489	Mamoudou Salissou	Halima	1998-12-31 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dlcqt0qccu8qj7	490	Hamza Ibrahim	Charifa	\N	Maradi	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dmcqt0wgrw1b97	491	Boukari Inoussa Maman	Rakibou	2002-12-31 23:00:00	N'wala/Droum	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dncqt0ttd4ib5d	492	Massaoudou Habou	Salissou	1995-12-31 23:00:00	Téssaoua/Takadji	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00docqt0hyy8225i	493	Garba Saley	Nana Sakina	2001-12-15 23:00:00	Damana	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dpcqt0zs2f3mdf	494	Maman Sani Oumarou	Fassouma	1997-09-30 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dqcqt0x4dv1tc4	495	Mallam Moutari Elhadji Boubakar	Oumarou	1997-12-31 23:00:00	El Kouka Gangara	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00drcqt0auqaq6l0	496	Rabé Oumarou Achirou		1995-12-31 23:00:00	Kafin Baka	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dscqt0c988pcm6	497	Salissou Laouali	Firdaoussi	2000-09-30 23:00:00	Magaria	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dtcqt0jfmt65fl	498	Abdou Oumarou	Zoulhatou	\N	Kirtachi/Kollo	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ducqt06yfv9n8q	499	Maty Daouda	Zeinabou	2000-11-08 23:00:00	Téssaoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dvcqt0678oqak3	500	Karimou Boukari	Farida	2000-06-02 23:00:00	Nafouta/Téssaoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dwcqt0gp9vayen	501	Gambo Bilbizo	Ousmane	1998-12-31 23:00:00	Jantoudou	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dxcqt05e2loyko	502	Awali Oumarou	Abaché	1996-12-31 23:00:00	Dan Gwari	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dycqt0sjel67sm	503	Moutari Abdou	Sadissou	1998-12-31 23:00:00	Tsotsa	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00dzcqt0yt0lqckg	504	Malam Abdou Amay	Souweiba	1998-12-31 23:00:00	Aguié	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e0cqt042y6k964	505	Sani Yaou	Aboubacar	2000-03-28 23:00:00	Zermou	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e1cqt05z4mmhy2	506	Daré Saley	Chaibou	1996-12-31 23:00:00	Guidan Tagno	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e2cqt0e1dt77m2	507	Habou Chipkaou	Naziri	2000-12-31 23:00:00	Daratou	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e3cqt001vmjcep	508	Issaka Amadou	Libabatou	2000-01-24 23:00:00	Nanaya	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e4cqt01qjedogj	509	Mahaman Salissou Haboubacar	Aicha	\N	Tahoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e5cqt0pt8cv8wg	510	Saley Mahaman	Mouazamou	1996-12-31 23:00:00	Kanda	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e6cqt0qclal4q5	511	Saley Harou Maman	Maharazou	\N	Lingui	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e7cqt0go165lwk	512	Abou Oumarou	Ibrahim	1997-12-31 23:00:00	Sabon Machi	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e8cqt0pcavup7d	513	Abass	Haboubacar	1995-12-31 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00e9cqt0417bsnn6	514	Chaibou Amadou	Ousmane	1999-12-31 23:00:00	Maiguige Peulh	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eacqt0a26m2dag	515	Issaka Malam Abou	Achirou	2000-01-21 23:00:00	Tchake	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ebcqt08fwcrrcu	516	Ada Tounaou	Rahamou	1997-12-11 23:00:00	Téssaoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eccqt0679lz4bb	517	Ousman Souley Abdoul	Majid	1998-12-31 23:00:00	Badawa/Kantché	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00edcqt0txp3qf1h	518	Saidou Alassane	Tidjani	\N	Doubawa	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eecqt0kmqyq6np	519	Adamou Abdoulaye	Zeinabou	1998-12-31 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00efcqt0nivzvr82	520	Amadou Idi	Yacouba	1998-02-02 23:00:00	Tchadoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00egcqt0rbqkpc6a	521	Ousseini Mahamadou	Issa	1995-12-31 23:00:00	Goudoumaria	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ehcqt0dtxn4kzp	522	Tsoho Ahamat	Rahama	\N	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eicqt0mw4ezw49	523	Issoufou Barmo	Aminou	2000-01-22 23:00:00	Guidan Wari/Mahayi	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ejcqt0jmwi5nld	524	Habou Tourey	Noura	1996-12-31 23:00:00	Guidan Kodaou	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ekcqt0qlsiykzm	525	Habibou Djibrilla	Moustapha	1998-08-11 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00elcqt0918a2dpz	526	Abdou Karimou Ousman Maman	Lawali	1998-12-31 23:00:00	Sabon Gari	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00emcqt09o1q8v1e	527	Rabé Habou	Hadiza	2001-03-02 23:00:00	Maradi	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00encqt0vhhtrk5z	528	Abaché Maman	Chaibou	1997-12-31 23:00:00	Gagawa	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eocqt0gsd6e2pd	529	Yaou Alassane	Faiza	2000-09-24 23:00:00	Zaroumeye	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00epcqt0grrnz58v	530	Maman Karimou	Mariama	\N	Alassan Kouma/Mayahi	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eqcqt0gkira87r	531	Tounaou Mahaman	Ibrahim	1998-12-31 23:00:00	Maiguémé	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ercqt0e5bcf0v7	532	Abdou Malan Kanta	Hamza	2000-12-31 23:00:00	Bankareta/z	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00escqt0l3cvcfrm	533	Sani Hazo	Abdou	1999-12-31 23:00:00	Hankaka	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00etcqt0r2niavwh	534	Salissou Abdou	Zakawanou	1997-12-31 23:00:00	Angoal-Gao	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eucqt0zjln59vf	535	Harou Aminou	Tchima	1999-12-31 23:00:00	Dogo	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00evcqt0r0bimj3n	536	Yaou	Sani	1997-12-31 23:00:00	Koufan Aljana	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ewcqt0y5yci59h	537	Oumarou Djibo	Maïmouna	2000-12-31 23:00:00	Tessaoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00excqt0futntv00	538	Aboubakari Mahamane	Assamaou	2001-04-06 23:00:00	Agadez	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00eycqt034ylona7	539	Mahaman Mamoudou	Ibrahim	\N	Tessaoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ezcqt09ypgkfxv	540	Sahirou Hamza	Harouna	1995-12-31 23:00:00	Dakoro	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f0cqt0bfwdj3m8	541	Mahamadou Issoufou	Absatou	1999-12-31 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f1cqt03en8bevd	542	Falola Moucharafou	Roukiatoulaye	\N	Tahoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f2cqt0vgp3btth	543	Amadou Sabo Mahaman	Nourou	\N	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f3cqt01uzwjzld	544	Malam Ado Ibrahim	Halima	2000-03-27 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f4cqt0uukqgf9o	545	Mari Mamadou	Abdoul-Majid	2001-09-01 23:00:00	Dinaye Haoussa	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f5cqt0vzwja5cq	546	Sani Adamou	Imrana	1997-12-31 23:00:00	Maradi	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f6cqt0ynsyk2a8	547	Bounou Moussa Mahaman	Moustapha	2000-03-11 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f7cqt0ia8zb2ys	548	Mamadou Lawan	Biba	1999-12-31 23:00:00	Latouaram	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f8cqt06miwo4b3	549	Chiouidi Elhadji Ousman	Souley	1997-12-31 23:00:00	Garaké	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00f9cqt0qv6n98zt	550	Illou Dan Birni	Chamsiya	1997-02-02 23:00:00	Agadez	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00facqt0kkp78vga	551	Chayabou Malam Ousman	Zaneidou	1997-12-31 23:00:00	Djan Doutsi/Tirmini	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fbcqt0jyzojugo	552	Moussa Maigochi	Adamou	1997-12-31 23:00:00	Arnagou	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fccqt0fh762joc	553	Goumayni Nafa	Aichatou	1998-09-11 23:00:00	Agadez	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fdcqt01f77kvrd	554	Abba Kaoua Malla Mamadou	Kourou	1997-12-31 23:00:00	Mainé Soroa	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fecqt0n97phpm8	555	Ayouba Oumarou Abdoul	Aziz	1996-12-31 23:00:00	Mallamaoua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ffcqt0ynsmpyh7	556	Ramane Djibrillou	Chefou	1998-12-31 23:00:00	Boula Koura	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fgcqt0gmu3w0ua	557	Kaougé Habou	Boukari	1994-12-31 23:00:00	Gantamawa Peulh	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fhcqt0h21gf5fm	558	Issaka Salifou	Sabiou	1996-12-31 23:00:00	Dan Biri	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00ficqt0gns8qjfo	559	Agada Abara	Ibrahim	1995-12-31 23:00:00	Zinder	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fjcqt0kj6zps2u	560	Mahaman Yacouba	Balkissou	2000-07-18 23:00:00	Tanout	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fkcqt0mjkl8d7g	561	Abdou Mai Kaka	Issiaka	1998-12-31 23:00:00	Zaroumeye	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00flcqt0fm4olkoj	562	Mahazou Aboubacar	Samaria	2000-01-27 23:00:00	Zaboua	DAP/CEG, Français-Histoire-Géographie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fmcqt0lgt49way	563	Alassane Idder	Mariama	1995-12-31 23:00:00	Falounfa	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fncqt04gvceenh	564	Harouna Aboubacar Zakari	Yaou	\N	Fararatt	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00focqt026tktx5e	565	Issa Amadou	Salissou	1995-12-31 23:00:00	Garin Liman	Licence Prof au PES/CEG : Français-Histoire-Géographie, ENS, UAM/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fpcqt0jbsh32lv	566	Harouna	Abdoulaye	1992-12-31 23:00:00	Tourmou	Licence en Géographie et Aménagement de l'Espace, U/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhi00fqcqt0zvh3i9ca	567	Oumar Mato	Zeinabou	\N	Arlit	Master Es-Sciences de l'Education en Didactique des Disciplines : Géographie, U/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00frcqt0o8j17nn0	568	Moussa Bako Mahaman	Noura	1989-09-06 23:00:00	Maradi	Master Es-Sciences de l'Education en Didactique des Disciplines : Géographie, U/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00fscqt02dk4n05p	569	Issaka	Mahamadou	\N	Diffa	Master Es-Sciences de l'Education en Didactique des Disciplines : Géographie, UAS/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00ftcqt008jo3unz	570	Yacoudima Tchiroma	Ibrahim	\N	Zinder	Master Es-Sciences de l'Education en Didactique des Disciplines : Géographie, UAS/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00fucqt0b8qwaenf	571	Abdou Illiassou	Sani	1992-07-08 23:00:00	Kanembakaché	Master Es-Sciences de l'Education en Didactique des Disciplines : Anglais, U/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00fvcqt0mxe1d5gp	572	Oumarou Almou Talabe	Roumanatou	\N	Dosso	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00fwcqt08ocehcnj	573	Ousseini Dan Jimo	Younoussa	1995-09-09 23:00:00	Niamey	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00fxcqt0yt4ee2mq	574	Abdoulahi Issa	Tanimoune	1994-12-31 23:00:00	Guidan Dimao	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00fycqt06j5k70df	575	Adamou Gado	Nana Aichatou	\N	Loga	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00fzcqt0ofzozwzh	576	Sani El Leko	Zaheirou	1994-12-31 23:00:00	Koona	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g0cqt0vrcxjl8c	577	Rabiou Na Malam Abdou	Rahim	1995-10-09 23:00:00	Maradi	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g1cqt0rb9s0oha	578	Idé Souley	Abdallah	\N	Niamey	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g2cqt0ca781ug1	579	Salissou Daouda	Manirou	\N	Birnin Lallé	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g3cqt0g31i4b7r	580	Assoumane Hassane	Aboubacar	\N	Boungougi	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g4cqt0gbju5yhn	581	Issa Dodo	Saoudatou	1997-08-06 23:00:00	Birni N'konni	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g5cqt0z0er2qw5	582	Taradja Balery	Abdoulaye	1988-12-31 23:00:00	Arlit	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g6cqt06dbplav5	583	Attikou Mahaman	Sabila	1993-12-31 23:00:00	Tahoua	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g7cqt0j9h7qdb0	584	Ibrahim Yahaya	Zayanou	1996-12-31 23:00:00	Lokoko	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g8cqt0antvegho	585	Saddi Dan Illaga	Samaila	1993-12-31 23:00:00	Kachedawa	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00g9cqt0nn6za7r1	586	Tahirou Bissala	Salamatou	1999-11-06 23:00:00	Akokan/Arlit	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gacqt0w3pbje7m	587	Oumarou Hamma	Daouda	1994-12-02 23:00:00	Yeni Boboye	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gbcqt0tgw0g48z	588	Moctar	Rahmatou	1997-03-04 23:00:00	Ibecetene	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gccqt0qnljfxut	589	Mouttawakilou Aminou	Fatima	\N	Tahoua	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gdcqt0pdsxrbtd	590	Anza Sinka	Moussa	\N	Tchintabaraden	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gecqt03fq52f4s	591	Abou Ibrahim	Maaroufou	\N	Tibiri	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gfcqt0tfnqhodi	592	Moussa Bako Abdoul	Aziz	\N	Maradi	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00ggcqt0kki2pjdl	593	Abdou Idi	Azara	\N	Gouré	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00ghcqt07qerdio3	594	Lawan Ali	Ali	\N	Zinder	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gicqt0812ij9b7	595	Salifou Housseini Abdoul	Malik	\N	Madarounfa	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gjcqt0xw6lcgva	596	Sani Baraou	Aminou	1996-12-31 23:00:00	Garin Gogé	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gkcqt04a59eln1	597	Moussa Saley	Rahinatou	1995-12-10 23:00:00	Niamey	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00glcqt07cwhhrj6	598	Adamou Mahamadou	Salissou	1994-12-31 23:00:00	Cheniassou	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gmcqt064680cyv	599	Hama Idé	Ramatou	1998-06-08 23:00:00	Niamey	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gncqt0ndihwcwr	600	Hama Hamidine	Halilou	\N	Allokoto	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gocqt0e2ntqc3m	601	Sani Bamme	Harou	1997-01-31 23:00:00	Doumfouché	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gpcqt0r8smpbh9	602	Mamadou Azari	Mamadou	1997-12-31 23:00:00	Katafouroram	Licence en Sciences de l'Education, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gqcqt0cq6xkcm8	603	Lawali Seydou Abdoul	Azizi	1991-02-09 23:00:00	Agadez	Licence en Sciences de l'Education : Mésure et Evaluation, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00grcqt0e9xcdm19	604	Laouali Kadadé	Djamila	1991-11-08 23:00:00	Madarounfa	Licence en Sciences de l'Education : Mésure et Evaluation, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gscqt0st55p4d3	605	Harouna Moussa Abdoul	Karim	1992-12-31 23:00:00	Dan Dassaye	Licence en Sciences de l'Education : Psychologie et Orientation Scolaire, U/Ta	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gtcqt0hkdpgo78	606	Amadou Roufai	Moussa	1988-12-31 23:00:00	Zinder	Master Es-Sciences de l'Education : Statistiques et Planification en Education, U/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gucqt01uuq2v2y	607	Ado Harou	Oukacha	1993-11-07 23:00:00	Zinder	Master Es-Sciences de l'Education : Statistiques et Planification en Education, U/Zinder	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gvcqt028oz0s0o	608	Aamadou Roufai Alassane	Alassane	1993-12-31 23:00:00	Angoal Toro	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gwcqt06akd2o21	609	Abdou Idi	Aicha	1996-12-30 23:00:00	Koderaroua	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gxcqt0o8ca1itr	610	Abdou Souley	Safinatou	1994-06-07 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gycqt0kldzlpzy	611	Abdoul Moumouni Riké	Sanoussi	1996-12-31 23:00:00	Rafa	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00gzcqt03phw32si	612	Abdoulaye Harouna	Agada	1994-12-31 23:00:00	Jambali	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h0cqt0pgjnj3nf	613	Aboubacar Sahabi Foureratou		1996-12-31 23:00:00	Malbaza	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h1cqt0i1n730wu	614	Adam Bétou Samaila		1992-12-31 23:00:00	Koumaro-Bouba	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h2cqt0voiagkd5	615	Ahmed Bianou	Mohamed	1992-04-14 23:00:00	Ingall	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h3cqt0tgf1rvlu	616	Alhassane Hima	Boubacar	1994-11-23 23:00:00	Agoudoufoga	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h4cqt0g0l1qlco	617	Ali Adamou	Ouma	1997-07-11 23:00:00	Zinder Inscrit€	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h5cqt0eege9vur	618	Amadou Maman	Harouna	1995-06-19 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h6cqt0sbwcmix1	619	Amadou Soumana	Mamoudou	1992-01-08 23:00:00	Doguel Guedé	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h7cqt0etm8pome	620	Assoumane Bagué Ibrahim		1993-11-24 23:00:00	Tounga Wonkoye	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h8cqt0fmtq78lp	621	Ayouba Souley	Lourwanou	1995-10-10 23:00:00	Bourgami	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00h9cqt0i4168hnb	622	Bahary Abdou	Ousmane	1995-12-30 23:00:00	Maraka	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hacqt0wggubsjj	623	Betou Tankari	Abdoulaye	1993-05-05 23:00:00	Angoual Rey-Rey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hbcqt0ltlj64jk	624	Beydou Sabo	Chaibou	1996-01-03 23:00:00	Goulma Kourdjéni	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hccqt08jjm441q	625	Boubacar Labo	Hamza	1994-04-14 23:00:00	Kouda	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hdcqt0qzy2hnk4	626	Boubacar Makaou Mamane	Sani	1994-08-04 23:00:00	Guidan Roumji	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hecqt0opy425ho	627	Boukari Saley	Issoufou	1992-12-31 23:00:00	Magaria	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hfcqt057e3j880	628	Boureima Harouna Abdoul	Razak	1990-07-26 23:00:00	Konni	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hgcqt0umjpk6kc	629	Chaibou Majidadi	Hamissou	1992-12-31 23:00:00	Maradi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hhcqt0dpaw5crm	630	Daouda Abouza	Laouali	1993-12-30 23:00:00	Batchaka	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hicqt0vlqrjymv	631	Daouda Alpha	Rachid	1993-09-12 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hjcqt00tho15h9	632	Daouda Jatao Achirou		1993-12-31 23:00:00	Tibiri	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hkcqt0aess3joh	633	Dawèye Hankouraou	Abdou	1992-12-31 23:00:00	Katono/Tanout	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hlcqt075rcp04v	634	Foureiratou Adamou	Madé	1993-12-31 23:00:00	Zanga Babadey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hmcqt0rxjftmh2	635	Gabey Salaou	Mamoudou	1996-12-31 23:00:00	Takalahia/Banguiro	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hncqt0yfd0j4s8	636	Gao Nagande	Samaila	1992-09-16 23:00:00	Zéla	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hocqt0hcuk5acy	637	Gaoh Soli	Assoumane	1998-03-10 23:00:00	Rouda Goumoundey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hpcqt00qsypy4b	638	Garba Hassane Hamani		1994-12-31 23:00:00	Boulounguey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hqcqt0t6l6aqkd	639	Garba Seydou	Adamou	1994-12-31 23:00:00	Katanga	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hrcqt0i83hkbm7	640	Gégi Maiguizo Illa		1995-12-31 23:00:00	Toudou Baré-Bari	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hscqt01tfwvg0t	641	Habou Saadou	Attaher	1994-12-31 23:00:00	Angol Kadi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00htcqt0s0uauc31	642	Hachimou Moundadou	Saidou	1994-03-21 23:00:00	Dogon-Tapki	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hucqt0a14kvtwv	643	Halimatou Gambo	Ali	1996-07-16 23:00:00	Tanout	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hvcqt0brd9tfmb	644	Hamadou	Abdoulaye	1995-12-31 23:00:00	Gollé/Dosso	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hwcqt0jneg2po6	645	Harouna Bako	Hadiza	1997-09-27 23:00:00	N'guiguimi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hxcqt0jxp6ue17	646	Hassana Souley	Mahamadou	1996-09-20 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhj00hycqt0r0cuwkw4	647	Hassia Amadou	Soumana	1997-05-02 23:00:00	Gaya	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00hzcqt0cwh2kuw2	648	Ibrahim Elhadji Ousmane	Tsahirou	1991-12-31 23:00:00	Jantoudou	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i0cqt0v5hdxn7t	649	Idé Issa	Amadou	1998-08-20 23:00:00	Karabédji	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i1cqt0mzy7z9rw	650	Illa Allassan	Salifou	1994-12-30 23:00:00	Djima Djima	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i2cqt0h2kzva52	651	Illia Abara	Bachir	1993-12-31 23:00:00	Maradi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i3cqt08aktp3ut	652	Illiassou Souley Ousmane		1994-12-31 23:00:00	Broum	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i4cqt0ttevccxd	653	Ismailou Lassan	Ado	1994-12-31 23:00:00	Kinkaou	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i5cqt0a52h6tt6	654	Issa Hanna Yaou		1994-12-31 23:00:00	Dan Mata Sofoua	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i6cqt0t09m5t8v	655	Issia Dalla Abdoul	Karim	1994-09-23 23:00:00	Takiéta	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i7cqt0onisgkfy	656	Kassomou Tassaou	Lawali	1994-07-23 23:00:00	Doubelma Guida	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i8cqt0k478gtqy	657	Kimba Garba	Yaou	1994-12-31 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00i9cqt0axrmpguk	658	Maizoumbou Kané	Djamilou	1994-11-17 23:00:00	Bankenia	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iacqt0qq9pwlq7	659	Malam Mamane	Abdoulahi	1995-12-31 23:00:00	Taoua	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ibcqt0tiajfvyd	660	Maman Hassane	Aminou	1997-12-31 23:00:00	Kawara N'gnhé	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iccqt0tkk7n41m	661	Mamane Babagana	Moctar	1993-05-01 23:00:00	Balleyara	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00idcqt06elc5k6u	662	Mamoudou Mahamane	Boukari	1996-12-30 23:00:00	Noualla Dan Sofoua	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iecqt0h4bu4wf7	663	Mohamed Ousmane	Aboubacar	1995-12-31 23:00:00	Zinder	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ifcqt06z04swcf	664	Oumaratou Ibrahim	Dourfaye	1997-11-07 23:00:00	Dosso	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00igcqt0qeby3jo1	665	Oumarou Garba	Moussa	1996-06-13 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ihcqt0l9enw5pi	666	Ousman Tchiroma	Amadou	1993-06-26 23:00:00	Kantché	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iicqt0hhpu2zeb	667	Ousseini Mamane	Bachirou	1993-03-14 23:00:00	Tombo-Farrey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ijcqt0pwpaw0a3	668	Rabiou Kané Ayouba		1995-12-31 23:00:00	Dogon Marké/Gabi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ikcqt0dc1f0tt9	669	Rabiou Laouali	Samaila	1996-10-30 23:00:00	Maradi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ilcqt0h8txnxsh	670	Saidou Amadou	Abdourahamane	1992-03-21 23:00:00	Maradi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00imcqt0bfamew0v	671	Salifou Dan Bakoye Abdoul	Razak	1994-12-31 23:00:00	Tawaria	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00incqt0ecf2yqsw	672	Samaila Manga Abdoul	Karim	1996-12-31 23:00:00	Doli	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iocqt0tdt56qao	673	Sani Bébé Boubacar		1996-12-30 23:00:00	Kwala Gobirawa	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ipcqt0miywgee7	674	Sani Issa Ousmane		1991-09-04 23:00:00	Magaria	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iqcqt0o9y1n27e	675	Seydou Hamadou Moctar		1995-12-31 23:00:00	Warrow	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ircqt0dakt8gju	676	Seyni Younoussa Hassane		1994-07-21 23:00:00	Kollo Bosseye	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iscqt07kqzohq7	677	Souley Djigo Mourtala		1993-12-31 23:00:00	Guidan Annour	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00itcqt0qpnyae58	678	Souley Ousmane	Aboubakar	1994-02-12 23:00:00	Tchizon Houregué	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iucqt0o3ivdtw2	679	Souleymane Didigué Abassatou		1996-01-21 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ivcqt035yb8nw6	680	Tassaou Mairakoumi	Moumounui	1996-06-23 23:00:00	Zaziatou	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iwcqt0jautccuu	681	Yacouba Nomaou Mansour		1995-12-31 23:00:00	Damana	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00ixcqt0oop3xapo	682	Yaou Hassane Boureima		1991-12-31 23:00:00	Mamoudou Koira	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00iycqt0ktca88v7	683	Yougbare Pougue Wende	Mahamadou	1997-06-08 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00izcqt0yp41tgzv	684	Zouladeini Ibrahim Abdoul	Nasser	1994-08-10 23:00:00	Zinder	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j0cqt0t3sakoa6	685	Amadou Alassan	Ibrahim	1994-02-28 23:00:00	Guirari	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j1cqt0p5dzqm5x	686	Assan Inoussa Abdou Ra	Ouhou	1994-04-13 23:00:00	Lingui (Dogo)	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j2cqt056j9pjtk	687	Nassirou Zakari	Razza	1992-12-31 23:00:00	Fouroumi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j3cqt06606eelb	688	Ousseini Saidou	Abdou	1995-12-30 23:00:00	Karayé Haoussa	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j4cqt0r6qx6nju	689	Hamissou Mato Maman	Dardaou	1993-12-31 23:00:00	Maitoumbi Bougagé	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j5cqt0pgc828oz	690	Mahamadou Ide Ayouba		1992-12-31 23:00:00	Kantcham	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j6cqt0o5vm9kf4	691	Oumarou Daouda	Samira	1998-10-30 23:00:00	Bawada Dagi	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j7cqt06v2vum29	692	Nouhou Garba Mamane Kabirou		1995-10-17 23:00:00	Agadez	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j8cqt0b3ygz2xu	693	Issifi Souno	Soumana	1996-12-31 23:00:00	Firnarié	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00j9cqt0e9c82wo2	694	Garba  Mané Hassane		1993-07-10 23:00:00	Guézama	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jacqt0dcr53uc7	695	Rafiou Elhadji Tourjani	Mouniratou	1995-12-24 23:00:00	Gaya	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jbcqt0mjcognf3	696	Mahaman  Hachimou	Adamou	1995-12-15 23:00:00	Ibrahim ( Alforma)	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jccqt0zm28yxwu	697	Assoumane Maizougou	Saratou	1995-12-16 23:00:00	Batambéri	Licence Prof au PES/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jdcqt0c1wqqgef	698	Maman Moussa	Moutari	1992-06-09 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jecqt0mqeprorw	699	Adamou Zakari	Mourtala	1996-12-31 23:00:00	Dan Melé	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jfcqt0dhuuhsx9	700	Souraji Ibrahim	Soulemanou	1995-10-19 23:00:00	Goroubey (Tessaoua)	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jgcqt0pp47ynx6	701	Saboutou Manzo	Djafar	1995-12-31 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jhcqt0nhhxpg17	702	Bounou Zakari	Salissou	1993-12-31 23:00:00	Fouroumi	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jicqt0ukhzkb4j	703	Mahaman Alhou Nouhou	Moussa	1994-12-31 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jjcqt0pinty3pa	704	EL Ado Abdou	Yahaya	1995-12-31 23:00:00	Maiguigé	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jkcqt0y2vh7uqu	705	Saadou Mato	Issa	1998-12-31 23:00:00	Maitsintsia	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jlcqt0rk07i1f8	706	Salifou Dan Bido	Moustapha	2000-10-11 23:00:00	Maradou	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jmcqt0uzbgr3y1	707	Moussa Sarkin Boula	Abdou	1996-12-31 23:00:00	Afounori	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jncqt0tu4rizqf	708	Ousmane Oumarou Mamane	Sani	1995-02-23 23:00:00	Mayahi	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jocqt0bfxu2b3g	709	Abdou Dan Moussa	Nassirou	1993-12-31 23:00:00	Dan Kogé (Serkin Yamma)	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jpcqt08uwm9dr0	710	Souley Goume	Alkassoum	2000-09-15 23:00:00	Dan Arori (Gafati)	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jqcqt0bgsbctzg	711	Malam Abani Malam Ali	Loukmanou	1992-12-31 23:00:00	Kagna Malam Gadja	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jrcqt0b7vuj1j9	712	Salissou Issoufou	Issahaka	1994-12-31 23:00:00	Natirge (Tirmini)	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jscqt0o5oxflq0	713	Souley Chipkaou	Roufai	1993-06-12 23:00:00	Tombo (Dogo)	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jtcqt0frdlnr8k	714	Abdoulaye Sarga Mamane	Sani	1998-09-08 23:00:00	Madarounfa	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jucqt0e5g51gp7	715	Garba Magagi	Salissou	1998-12-31 23:00:00	Gamdji Sofoua	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jvcqt07u52ze91	716	Soule Goume Mahamane	Bassirou	1998-07-08 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jwcqt0xwcmylso	717	Oumarou Maman Mani	Rakia	1998-10-13 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jxcqt09yz6r7r9	718	Salissou Elhadji Harou	Habibou	1995-12-31 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jycqt0rjjf79g7	719	Sani Ado	Saminou	1998-04-26 23:00:00	Zaroumèye	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00jzcqt0wio7rjzf	720	Souley Harouna Mahamane	Nasser	1997-08-18 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00k0cqt0yf242wnq	721	Maman Issoufou	Zaneidou	1999-12-31 23:00:00	Taramni	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00k1cqt08kif3roz	722	Malam Issaka Issoufou Maman	Sani	1995-12-31 23:00:00	Guidimouni	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00k2cqt0tlycw8i3	723	Bassirou Issa	Mariama	2001-12-16 23:00:00	Koré	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00k3cqt09wd9wkrd	724	Souley Sidi Maman	Ibrahim	1995-12-31 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00k4cqt0zd2o4n2q	725	Achirou Haboubacar	Katimou	1999-11-14 23:00:00	Guetsi (Magaria)	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00k5cqt0weoyhz36	726	Elh Issaka Makeri	Sani	1996-12-30 23:00:00	El Daweye	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhk00k6cqt05rhblun9	727	Oumarou Saidou	Laouali	1996-12-31 23:00:00	Zinder	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00k7cqt032ukvfss	728	Boureima Moumouni	Zakari	1994-12-31 23:00:00	Sorey-Bene/Libore	DAP/CEG : Mathématiques/Physique-Chimie, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00k8cqt09e03rhvk	729	Abass Yacouba	Ismael	1993-12-31 23:00:00	Toukounous	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00k9cqt02kbr9bus	730	Abdou Mahaman	Salissou	1997-12-31 23:00:00	Zinder	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kacqt01t2gbmp9	731	Abdou Oumarou	Mamoudou	1992-12-31 23:00:00	Toki/Korgom	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kbcqt0v8scw2r4	732	Abdou Ousmane	Samira	1998-09-29 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kccqt05gb2bc03	733	Abdou	Zourkalayni	1995-12-31 23:00:00	Tchoulan Hima	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kdcqt0a8lgo4xp	734	Abdoulaye Bilal	Habssatou	1995-08-11 23:00:00	Dakoro	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kecqt02cjp9wy2	735	Adizatou	Issoufou	1983-12-22 23:00:00	Hamdallaye	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kfcqt08nfckeeb	736	Ahmad Souleymane	Yahaya	1993-11-09 23:00:00	Ingall	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kgcqt03w8685s4	737	Ahmed Ismachila	Aichatou	1995-06-23 23:00:00	Akokan/Arlit	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00khcqt0yvugztut	738	Ali Issa Mousbahou		1995-12-31 23:00:00	Zinder	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kicqt0618djf4b	739	Amadou Moussa	Adama	1992-12-31 23:00:00	Maradi	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kjcqt07a3yh78z	740	Amadou Poutiah	Yahaya	1995-05-23 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kkcqt0k3coprjs	741	Arzika Kaka Chaibou		1993-12-31 23:00:00	Kore Merina	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00klcqt0xfeiubtf	742	Azahidou Tanko Mahamadou	Djamilou	1995-10-08 23:00:00	Toudoun Adarawa	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kmcqt00u73v9x6	743	Bachirou Chékaraou Rachida		1995-05-26 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kncqt0j04950l6	744	Balkissa Ibro	Mato	1996-02-13 23:00:00	Doutchi	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kocqt0nt9x6eaj	745	Barmou Bozari	Oumarou	1991-12-31 23:00:00	Madé	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kpcqt0429j0u2p	746	Boubacar Kona	Mariama	1992-12-31 23:00:00	Garin Nabara/Matankari	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kqcqt08q4x5p4g	747	Chaibou Hadou Souleymane		1994-07-05 23:00:00	Akokan	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00krcqt0hg7gmw2u	748	Cherifa Adamou	Garba	1997-11-07 23:00:00	Dosso	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kscqt0z1iha27b	749	Chipkaou Dan Tanin Hassane		1992-12-31 23:00:00	Tchizon-Kouregué	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00ktcqt00iq7knna	750	Djibo Barazé	Hassane	1995-06-05 23:00:00	Djambabadey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kucqt0m5ojvdsu	751	Djibo Karimoune	Asmaou	1997-10-02 23:00:00	Kollo	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kvcqt0fu8qfs8r	752	Gaibou Kanda Imirane		1994-12-31 23:00:00	Dolbel/Gorouol	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kwcqt0n9le8ue0	753	Hadiza Saidou Moumouni		1993-09-11 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kxcqt0d8423f9p	754	Hakilou Abdou	Manssour	1993-12-31 23:00:00	Yékoua	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kycqt0pkmu85vz	755	Hama alfari	Aboul-Wahidou	1994-03-14 23:00:00	Bomboni	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00kzcqt0nxe1egxa	756	Hamissou Inoussa	Bello	1993-12-31 23:00:00	Firji	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l0cqt09ox6hh81	757	Hamsa Djibrilla	Hamidou	1994-03-26 23:00:00	Madou/Loga	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l1cqt0043smkgb	758	Hamza Aouta Tsayabou		1996-12-31 23:00:00	Garin Dan Komma	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l2cqt0n7h0znda	759	Hassane Hamidou	Nourou	1993-12-31 23:00:00	Fatakadjé	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l3cqt0qdas78xr	760	Hassane Namata Abdoul	Aziz	1999-12-31 23:00:00	Gaya	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l4cqt05fykf0z3	761	Haya Saddi	Abdoulaye	1997-02-11 23:00:00	Madetta	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l5cqt0saxdeboh	762	Ibrahim Adamou	Habou	1993-12-31 23:00:00	Garin Kouroum	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l6cqt0q35y9qmm	763	Ibrahim Bonkano	Abdoulaye	1995-10-21 23:00:00	Dosso	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l7cqt0udtog22y	764	Ibrahim Insa Abdoul	Wahab	1996-01-23 23:00:00	Angol Tourba	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l8cqt0kebfik18	765	Ibrahim Bakoye	Zayanou	1996-12-31 23:00:00	Madeni Tadeita	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00l9cqt0qvw9bhrw	766	Idi Wada	Hadi	1992-12-31 23:00:00	Guidan Alé	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lacqt089y5fhdy	767	Idrissa Saydou	Morou	1995-12-31 23:00:00	Bangoutara	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lbcqt030zeialq	768	Illou Inoussa	Nana Seylouba	1993-11-07 23:00:00	Magaria	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lccqt0mkvxf4rm	769	Issa Narey	Amina	\N	\N	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00ldcqt0zsw3e8fc	770	Issaka Ali Issoufou		1996-12-31 23:00:00	Shett (Filingue)	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lecqt05mt2fc3n	771	Issaka Ibrahim Armayaou		1993-12-31 23:00:00	KontaGora Saboua	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lfcqt0gvz8n5ap	772	Issoufou Bacharou Aichatou		1999-07-18 23:00:00	Dosso	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lgcqt0n03gt1u0	773	Kanlanfé Samari	Bahoaba	1993-12-31 23:00:00	Koulbou	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lhcqt0s2eppsi8	774	Labo Guiwa	Jamila	1996-03-22 23:00:00	Makorwa	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00licqt0fq13eosk	775	Lawali Boubacar	Adamou	1994-02-02 23:00:00	Doutchi	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00ljcqt0vnnhax3w	776	Maazou Harouna Fessal		1993-08-18 23:00:00	Dosso	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lkcqt0qcctb4yx	777	Mahamadou Kaboyi	Sahiya	1994-01-16 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00llcqt0r3dxh47s	778	Mahamadou Tawaye	Ousmane	1994-08-20 23:00:00	Foulan Koira	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lmcqt0afdu5lv3	779	Mahaman Raoui Kankané	Hadiza	1994-06-11 23:00:00	Bandé	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lncqt0q774cjwx	780	Mahamane Dan Azoumi	Salamatou	1993-12-31 23:00:00	Agadez	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00locqt093imvsnx	781	Maniri Galadima Moussa	Habou	1993-12-31 23:00:00	Gangara Liman	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lpcqt0zx82zuv1	782	Manou Kane	Jamila	1998-12-27 23:00:00	Arlit	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lqcqt0xnms8v1h	783	Maouiya Amadou	Chamsia	1994-12-31 23:00:00	Gaya	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lrcqt04zvlyzsd	784	Marou Garba	Inoussa	1992-11-16 23:00:00	Dosso	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lscqt0np6j88n8	785	Mirisko Zakari	Mamadou	\N	Goure	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00ltcqt0shlpk7e1	786	Moussa Hamidou	Amadou	1995-12-31 23:00:00	Gongeye	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lucqt098j2rsw2	787	Moussa Koyssogo	Mariama	1997-10-16 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lvcqt01w1xspea	788	Moussa Nawey Boubacar		1993-01-02 23:00:00	Sanguilé	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lwcqt0w17e705r	789	Nana Fassouma Souley Ango		1999-04-22 23:00:00	Gada	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lxcqt063kebna4	790	Nouhou Maman	Daoussia	1994-12-31 23:00:00	Dodori	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lycqt03es1pf38	791	Oumarou Bagna	Maimouna	1997-05-17 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00lzcqt0qiaj4yrd	792	Oumarou Idi	Illa	1998-12-31 23:00:00	Garin Kari	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00m0cqt0q2kpk2f7	793	Ousseini Mahaman Nata Alla	Habsou	1995-10-14 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00m1cqt0azbrnla4	794	Ousseini Mayaki	Fatchima	1995-12-27 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00m2cqt06zikw1xk	795	Rahanatou Beydou	Bako	1998-05-27 23:00:00	Angoual Marafa	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00m3cqt0u003fvs8	796	Ramanatou Ibrahim Ali		1996-03-17 23:00:00	Maradi	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00m4cqt0o2n5sbxr	797	Ramatoulaye Boureima	Hassane	1993-09-30 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00m5cqt07ol8sp97	798	Roukayatou Mounkaila	Biga	1992-12-31 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhl00m6cqt0hni22znv	799	Sahailou Abarchi	Adamou	1994-12-31 23:00:00	Guidan Kaché	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00m7cqt0nqh6bp0u	800	Salha Chipkaou	Chamsadine	1993-12-30 23:00:00	Kakouma Bara	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00m8cqt0pflbugd9	801	Salifou Bako	Hadiza	1995-12-30 23:00:00	Waye Kaye	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00m9cqt0frxngmkj	802	Sani Sambo Amadou		1993-12-31 23:00:00	Madarounfa	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00macqt0pgq3lj2s	803	Siddo Koranga	Ramatou	1995-12-08 23:00:00	Dosso	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mbcqt0wpxs6vtv	804	Soumana Hamadou	Sadou	1995-07-17 23:00:00	Tangakoira	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mccqt0rilafv7z	805	Tahirou Sani	Moussa	1995-12-31 23:00:00	Dakoro	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mdcqt0t8d7wnjl	806	Yacouba Na Madjé	Nana Choukriya	1998-12-23 23:00:00	Mardi	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mecqt06rr4ne8c	807	Zeinabou Hassane	Ali	1996-01-12 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mfcqt04rvvheo3	808	Zouéra Idé Barké	Amadou	1996-07-13 23:00:00	Niamey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mgcqt0u0x7oe8b	809	Mahamadou Kollo Traoré	Farida	1997-11-23 23:00:00	Akokan	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mhcqt0fsw6zbtb	810	Inoussa Arioma	Sallaou	1992-12-31 23:00:00	Marassagui	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00micqt0w01q29iy	811	Chaibou Wakili	Issia	1993-12-31 23:00:00	Dan Makiyawa	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mjcqt0u3jknnyw	812	Abou Tari	Laminou	1995-12-31 23:00:00	Maiguigé Kaffi	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mkcqt04mzm23mj	813	Dan Kane Harouna	Abda	1995-10-09 23:00:00	Wadamou (Madaoua)	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mlcqt0q7ru37df	814	Seydou Hama	Ramatou	1995-03-22 23:00:00	Birnin N'gaouré	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mmcqt0zecpsdfy	815	Ibrahim Nomaou	Issaka	1992-10-12 23:00:00	Kita Kitai	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mncqt05uk5hvaj	816	Moussa Nafiou	Siradji	1996-12-31 23:00:00	Mirriah	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mocqt0gkrqsv70	817	Bilal Idihal	Bakrim	1991-12-31 23:00:00	Beibatane	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mpcqt09lt7i803	818	Attahirou Abdou	Chamssou	1994-12-31 23:00:00	Guida dam	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mqcqt0i2r90qm9	819	Ibro Bawa	Boubacar	1992-12-31 23:00:00	Kolfa	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mrcqt0ie4mgm58	820	Tankari Maizoumbou	Yaou	1993-12-31 23:00:00	Falmey	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mscqt0qjnhqx8i	821	Illo Nouhou	Salissou	1993-12-30 23:00:00	El Kolta	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mtcqt0q1bsmq1z	822	Laouali Abdou	Aboubacar	1992-03-14 23:00:00	Tessaoua	Licence Prof au PES/CEG : Mathématiques/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mucqt0g63hmtdp	823	Souley Deini	Nassirou	1994-05-06 23:00:00	Guirari	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mvcqt0hefxlrto	824	Maman Gani Ousman	Abdourahamane	1996-12-31 23:00:00	Gaffati	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mwcqt0zv0nfs2k	825	Salaou Maman	Jabourou	1995-12-31 23:00:00	Matamèye	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mxcqt0ds5ohyzg	826	Elhadji Garba Dan Jaoura	Soufianou	1997-12-31 23:00:00	Dadin Kowa	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mycqt0cd3gahra	827	Ado Aouta	Harira	1996-10-09 23:00:00	Akokan (Arlit)	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00mzcqt00fckecrr	828	Habou Saidou	Ahmet	1997-12-31 23:00:00	Maigardaye Haoussa	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n0cqt0ectw3bgp	829	Ousmane	Issoufou	1999-02-01 23:00:00	Zinder (Garin Malam)	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n1cqt0z49p95q5	830	Issaka Ousmane	Moussa	1994-12-31 23:00:00	Sanda	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n2cqt0xwfs25ut	831	Elhadji Amadou Habou	Achirou	1997-12-31 23:00:00	Koleram	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n3cqt00ckijuae	832	Ousmane Abdou	Imrane	1999-12-31 23:00:00	Zinder	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n4cqt0uoqjer25	833	Maman Abdou Abdou	Rahimou	1999-12-31 23:00:00	Guirari	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n5cqt0abfkdoxy	834	Adamou Amadou	Kalid	1997-02-28 23:00:00	Zinder	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n6cqt03mnm8xgv	834	Ayouba Abdou	Laminou	1998-12-30 23:00:00	Daouché	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n7cqt0pz5it938	835	Gambo Tanko	Sabiou	1995-12-31 23:00:00	Magema (Tirmini)	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n8cqt0hzjf9u8x	836	Maman Dana Aboubacar	Reha	1999-02-11 23:00:00	Mirriah	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00n9cqt0uygm9z3a	837	Oumarou Barmo	Hakilou	1993-12-31 23:00:00	Aguié	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nacqt0w8y6hxpl	839	Ousseini Nani	Nana Salima	1999-12-27 23:00:00	Bakin Birgi	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nbcqt0xsnbyqcg	840	Sani Oumarou	Salissou	1995-12-31 23:00:00	Dan Kori	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nccqt04j46lkpw	841	Harouna Souley	Souley	1999-12-31 23:00:00	Koumbi	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00ndcqt030o7zbhb	842	Maazou Haladou	Noura	1993-12-31 23:00:00	Oura	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00necqt03oolr3bx	843	Saadou Boukari	Rabi	1996-12-31 23:00:00	Gamouza (Mayahi)	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nfcqt0la0gbjlx	844	Ibrahim Garba	Zeinabou	1994-06-25 23:00:00	Niamey	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00ngcqt0rdz7pczv	845	Abdou Argi	Sabiou	1998-05-23 23:00:00	Maraké Saboua	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nhcqt0hv4wd1gy	846	Yahouza Moussa	Rakia	1998-09-25 23:00:00	Mirria	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nicqt0xz5kz6ky	847	Abdourahaman Issa	Aboubacar	1995-12-31 23:00:00	Toubé	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00njcqt0fnp6iufb	848	Maman Saguirou Amadou	Aichatou	1998-11-20 23:00:00	Akokan/Arlit	DAP/CEG : Mathématiques/SVT, UAS/Zr	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nkcqt067zf6ld7	849	Abarchi Chaibou	Noura	1994-12-31 23:00:00	Tanagueye	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nlcqt0u9xizgk6	850	Abdo Elh Ibrahim	Kabirou	1994-12-31 23:00:00	Ingaouna	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nmcqt0rqfmv0hh	851	Abdou Ibrahim	Ismael	1994-05-11 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nncqt0w9pm59ij	852	Abdou Saidou Mahamadou	Sani	1995-12-29 23:00:00	Keita/Tahoua	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nocqt0wtnwxvpy	853	Abdoulaye Aligui	Haoua	1995-08-10 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00npcqt0c8rwr17l	854	Abdoulaye Dan Nouhe	Boubacar	1994-01-14 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nqcqt0wrrry0gm	855	Adam Albeidou Abdoul	Razakou	1992-12-31 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nrcqt0h3mxjsy0	856	Adamou Hamani	Seydou	1992-12-31 23:00:00	Gorzoré Djerma	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nscqt0yv1h2g8n	857	Adamou Seyni	Moudachirou	1996-12-31 23:00:00	Boumba	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00ntcqt0gy7x0uxi	858	Ado Sani Mahamadou		1996-03-10 23:00:00	Zinder	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nucqt0sc9fc9p7	859	Alfa Adamou Ali		1994-02-09 23:00:00	Banizoubou Moumouni	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nvcqt0xpsbxe3d	860	Alhassane Rhissé Hamad	Ahmad	1994-12-31 23:00:00	Tiguidan-Tessoum	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nwcqt0jvkugual	861	Ali Adamou	Hassane	1996-04-19 23:00:00	Karey Kopto	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nxcqt0jkq5uwqe	862	Ali Boukari	Fati	1997-09-14 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nycqt018ayebrg	863	Ali Maharazou	Massaoudou	1997-05-12 23:00:00	Malam Kaka	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00nzcqt0hhtwj0a5	864	Almou Issa	Nana Mariama	1995-10-01 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o0cqt0xj79572q	865	Amadou Aboubacar	Aichatou	1997-12-16 23:00:00	Doutchi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o1cqt0v0omwguk	866	Amadou Boubacar	Amede	1995-12-31 23:00:00	Taka/Tera	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o2cqt0j5r4fqr0	867	Amadou Hassane	Tahirou	1992-12-31 23:00:00	Koita Oumarou	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o3cqt0ftiog4ic	868	Amadou Mahaman	Hananatou	1997-03-14 23:00:00	Akohan	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o4cqt0uvyfneca	869	Amadou Soumana Abdoul	Aziz	1994-06-09 23:00:00	Diakindi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o5cqt0n767q65f	870	Aminatou Abdou	Thoussou	1993-12-30 23:00:00	Bngui (Madaoua)	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o6cqt0h4qm4ege	871	Arzika Allage	Issa	1994-01-15 23:00:00	Goulma	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o7cqt0r0vc47hl	872	Assoumane Hainikoye	Boubacar	1995-01-19 23:00:00	Banibangou	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o8cqt0ltadmb0g	873	Assoumane Seini	Abdoulaye	1995-02-01 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00o9cqt0z3dc2gig	874	Attikou Adamou	Mohamed	1994-02-24 23:00:00	Tillaberi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00oacqt0rczr5rf8	875	Bassakoye Abdou	Hamissou	1995-04-16 23:00:00	Doubelma Illéla	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00obcqt0szdojfj8	876	Boubacar Naméra	Mahamadou	1992-12-31 23:00:00	Filingué	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00occqt0gkh9wwuc	877	Chaibou Abdou	Sani	1995-11-30 23:00:00	Maradi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00odcqt003bujz88	878	Charifatou Illiya	Yahaya	1996-11-11 23:00:00	Chadakori	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00oecqt0nklfz2ky	879	Dambalé Korao	Ibrahima	1993-03-23 23:00:00	Dogonkiria	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00ofcqt0aazlq22f	880	Daka	Baraou	1992-12-31 23:00:00	Intouila	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00ogcqt0z4vq3djq	881	Dodo Habou	Salissou	1993-12-31 23:00:00	Tokawa	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00ohcqt0734vs1at	882	Dodo Souley	Djamila	1997-06-27 23:00:00	Dosso	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhm00oicqt0mutwe9aa	883	Fanta Soumana	Ladan	1993-09-19 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00ojcqt0eanfrx32	884	Guimba Naizoumou	Idrissa	1995-12-22 23:00:00	Bargoumawa	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00okcqt03z09eyzs	885	Halimatou Seyni	Hima	1997-01-20 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00olcqt0asbuyapz	886	Hamani Koura Zourkallaini		1993-12-31 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00omcqt0ymuu9rzz	887	Hamidou Moumouni	Nassirou	1995-05-14 23:00:00	Tonkobangou	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00oncqt0l7uxftv6	888	Harouna Souley	Nassirou	1994-04-20 23:00:00	Tombo Bouya	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00oocqt0td8fdbyg	889	Hassane Halidou	Nouhou	1995-05-23 23:00:00	Ambida	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00opcqt0y25j9w16	890	Himadou Moussa	Sita	1997-02-19 23:00:00	Borgo Samsou	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00oqcqt0wz2ufudi	891	Ibrahim Habou Mahamane	Nourou	1995-09-23 23:00:00	Wakasso	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00orcqt05vxun56v	892	Ibrahim Idi Abdoul	Madjid	\N	Maradi	LIcence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00oscqt0321tlwxw	893	Ibrahim Liman Nafiou	Nana Choukoura	1997-05-31 23:00:00	Mayahi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00otcqt0fag1qb7u	894	Ibrahim Maidabo	Faroukou	1995-01-05 23:00:00	Maradi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00oucqt0x1djvu4z	895	Ibrahim Yahouza	Soumaya	1999-09-12 23:00:00	Magaria	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00ovcqt0dispff7m	896	Idi Almou	Halilou	1992-12-31 23:00:00	Maradi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00owcqt0jalb0an2	897	Idi Ibrahim	Daouda	1993-12-31 23:00:00	Akka Saidou	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00oxcqt05qgfstua	898	Issa Chaibou	Harouna	1993-12-30 23:00:00	Tchido	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00oycqt0bt2tf3o2	899	Issa Djibo	Moubarak	1996-12-31 23:00:00	Tajayé Agolla	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00ozcqt09tmxhls1	900	Issa Manakarey	Abdourahamane	1994-12-22 23:00:00	Chical	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p0cqt05xptf1a1	901	Issifou Idi	Salissou	\N	\N	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p1cqt08ov15821	902	Issoufou Garba	Aminou	1993-12-31 23:00:00	Riadi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p2cqt0r1ih2x0v	903	Jamilatou Chaibou	China	1994-01-17 23:00:00	Bonkoukou	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p3cqt0osmtyb6v	904	Lawali Hassane	Baraka	1993-12-31 23:00:00	Maradi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p4cqt04itty2hw	905	Maazou Abdourahamane	Sakina	1998-01-23 23:00:00	Maradi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p5cqt00lgvu1z1	906	Mahamadou Hamidou	Habsatou	1998-05-02 23:00:00	Madaroufa	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p6cqt04h3h2sdr	907	Mahamadou Salaou Abdoul	Majid	1998-03-19 23:00:00	Golom	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p7cqt0jvgdgd2i	908	Mahamane Idi Issa	Hassia	1995-08-28 23:00:00	Damagaram Takaya	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p8cqt08y0bubzw	909	Maiguizo Koché	Ibrahim	1995-04-01 23:00:00	Zinder	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00p9cqt0mbs66zn9	910	Malam Abaché Moussa	Milou	1997-12-31 23:00:00	Rogogo	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pacqt018kc4rrt	911	Malam Sani Adamou	Siradji	1995-12-31 23:00:00	Guidan Dan Galadima	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pbcqt0s3cg5s2c	912	Mamoudou Issa	Moustapha	1997-12-31 23:00:00	Zinder	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pccqt0mju9lz5k	913	Mounkaila Abdoulkarim Hama		1996-12-31 23:00:00	Tombo/Damana	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pdcqt0twy17vfs	914	Moussa Idani	Rahamatou	1996-05-12 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pecqt0ooqkqvlm	915	Moussa Saidou	Mamane	1994-12-30 23:00:00	El Kolta	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pfcqt0ji8oedp8	916	Nafissa Moussa	Chekarao	1997-02-21 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pgcqt01pncmjfu	917	Namata Abarchi Abdoul	Kader	1993-01-13 23:00:00	Ban Kassari	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00phcqt0m7iuy84z	918	Nana Fatimatou Chaibou Argi		1994-08-20 23:00:00	Akokan/Arlit	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00picqt04di581ag	919	Oulemen Albadé	Maazou	1998-12-31 23:00:00	Mansaré/Kourteye	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pjcqt0iwsqxpyi	920	Oumarou Kona	Mahamadou	1993-12-21 23:00:00	Dogondoutchi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pkcqt0979kj97x	921	Ousmane Koini	Saidou	\N	\N	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00plcqt0j5tsgfmn	922	Ousseini Issoufou	Saratou	1995-09-30 23:00:00	Arlit	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pmcqt0z2xgkxyz	923	Rahinatou Harouna	ZaZai	1990-10-29 23:00:00	Dosso	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pncqt0kfg8rzoj	924	Rakia Ibrahim	Smailou	1995-09-24 23:00:00	Mirria	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pocqt0g92yq2lv	925	Ramatou	Boureima	1995-01-10 23:00:00	Niamey	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00ppcqt0myo8xxh3	926	Rouafi Abira	Yaou	1994-11-01 23:00:00	Fanna	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pqcqt0m9iutuca	927	Saidou Illa	Hamidou	1996-12-31 23:00:00	Maibourgouma	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00prcqt0w1aoomfe	928	Salifou Alichina Sa	Adou	1994-04-07 23:00:00	Boubelma-Illela	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pscqt0fcld41r5	929	Salissou Ibrahim Abdou	Djamila	1994-02-18 23:00:00	Jiga	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00ptcqt0e077aerq	930	Sanoussi Malam Nouhou	Saminou	1997-12-30 23:00:00	Tsouté	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pucqt0klj4x89k	931	Soumaila Antoine	Boubacar	1993-12-26 23:00:00	Maradi	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pvcqt0c3ipax9k	932	Tahirou Abdou Ismael		1997-04-13 23:00:00	Zinder	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pwcqt0u2ibe3b8	933	Tourba Yagi	Nouhou	1996-01-15 23:00:00	Dodoria	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pxcqt0ouc6vob0	934	Yahaya Bakoye	Hamidou	1994-12-30 23:00:00	Batata	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pycqt0umgwvt8f	935	Yahaya Hamidou	Hassana	1996-08-14 23:00:00	Malbaza	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00pzcqt0wp2z7434	936	Zada Bouhari Abdoulaye		1993-08-08 23:00:00	Kore Marina	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q0cqt0ipl5exow	937	Zaneidou Elhadji Yawalé	Zaharadini	1998-12-31 23:00:00	Yan Kamoua	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q1cqt0d5kuxawn	938	Laouali Wagé	Soulé	1992-12-31 23:00:00	Maissoura	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q2cqt0xc3dht03	939	Bassirou Moussa	Illa	1993-11-02 23:00:00	Wangaraoua	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q3cqt0i2awdkdg	940	Younoussou Souley	Roukeyatou	1994-01-01 23:00:00	Garbey ( ouallam)	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q4cqt0w8acda9z	941	Harouna Abdou	Yahouza	1997-12-31 23:00:00	Haoukan Sara	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q5cqt0jgx6wxgl	942	Ango Barmou	Rabiou	1993-04-17 23:00:00	Maraké Rogo	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q6cqt0yuteuuk5	943	Abdou Oubandawaki Mahaman	Bassirou	1998-12-30 23:00:00	Djinguilma	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q7cqt09iatns2w	944	Hadjara Almoustapha	Abaradine	1996-12-12 23:00:00	Samo I ( kalfou)	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q8cqt015cticv3	945	Ide Hassane	Koubra	1998-03-11 23:00:00	Gande Beri Koira	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00q9cqt0zy7wpwm0	946	Moussa Assan	Issoufou	1994-12-31 23:00:00	Karayé Haoussa	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qacqt0sycgh1r1	947	Moutari Ousmane Mahaman	Salissou	1991-12-31 23:00:00	Magaria	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qbcqt045g6bxbj	948	Salamatou Sidikou	Yacouba	1995-08-01 23:00:00	Guériguindé/Kourtheye	Licence Prof au PES/CEG : Physique-Chimie/SVT, ENS/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qccqt05cdr8tn7	949	Mahamadou Souley	Saratou	1998-12-08 23:00:00	Yama/Illéla	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qdcqt0oavklm1z	950	Ibrahim Boubacar	Noura	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qecqt0hgjagpxj	951	Saadou Moumouni Abdoul	Kader	\N	Moussadey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qfcqt0havbvxbp	952	Attahirou Abdou	Hamidine	1996-12-31 23:00:00	Handirma	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qgcqt0yokz09fz	953	Issaka Hamadou	Fati	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qhcqt0mst9jgqb	954	Alfari Yacouba	Djamila	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qicqt0cc62kbas	955	Salifou Yacine	Bossono	\N	N'guigmi	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qjcqt0f3ewlkej	956	Mahaman Moutari Thomas	Moussa	1997-05-01 23:00:00	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qkcqt0m9bejuyf	957	Zabeirou Kane Halimatou	Saadia	1995-07-05 23:00:00	Maradi	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qlcqt04k84rxxj	958	Tidjani Amadou	Chamsoudine	\N	Filingué	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qmcqt0pmc2pdio	959	Boureima Soumana	Nafissatou	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qncqt0b8py5dwm	960	Ibrahim Karaka	Halima	1995-12-31 23:00:00	Zinder	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qocqt041xkh56y	961	Chaibou Mikiai	Habsatou	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qpcqt0y676v7nw	962	Issa Hamani	Rahinatou	\N	Filingué	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szhn00qqcqt0sg20xpv6	963	Hama Dotia	Oumarou	1995-12-31 23:00:00	Roubiré	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qrcqt0vm2ptv0b	964	Boubacar Hima Aissata	Lobbo	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qscqt08mp2dyad	965	Dodo Issoufou	Moumouni	1995-12-31 23:00:00	Kalley	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qtcqt0hlygzrkl	966	Boubacar Nalotou	Ibrahim	1995-12-31 23:00:00	Fargossogo/Tamou	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qucqt04e4kfum4	967	Mounkaila Hassane	Amina	1993-09-05 23:00:00	Tillaberi	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qvcqt020h99ro9	968	Hassan Abdou	Haoua	1994-08-09 23:00:00	Zinder	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qwcqt008fcdrgz	969	Seyni Sirifi	Farida	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qxcqt0m8n2vx68	970	Ibrahim Siddo	Hannatou	\N	Ganki Bassarou	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qycqt0e20lv6lk	971	Abdoulaye Belko	Abdourahamane	1994-12-31 23:00:00	Tamou	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00qzcqt0e0d3lnnj	972	Assan Boucar	Rammatou	\N	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00r0cqt0p7a68jt0	973	Tchenyenou Kindo	Toumbendi	1995-12-31 23:00:00	Ouro Sanda	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00r1cqt067m5v0yj	974	Oumarou Boubacar	Soumana	1995-12-31 23:00:00	Ouro Sanda	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00r2cqt06xn56jyr	975	Moumouni Djibo	Djibo	1993-08-07 23:00:00	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
cmko4szho00r3cqt0xgnwuc16	976	Daouda Nouhou	Wassila	1995-04-07 23:00:00	Niamey	Licence Prof en Education des Adultes et Education Non-Formelle, IFAENF/Ny	cmko4sen40000cqt0zznkbztq	2026-01-21 14:41:55.863	Ministère de l'Education
\.


--
-- Data for Name: arretes; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.arretes (id, numero, "dateArrete", promotion, annee, "fichierPath", "contenuOCR", "statutIndexation", "messageErreur", "createdAt", "dateIndexation", "lieuService", "nombreAppeles") FROM stdin;
cmko15oa00004cq2470e2lzbl	2023/045/MJS/SCN	2023-03-15 00:00:00	2023	2023	/uploads/arretes/arrete-2023-045.pdf	RÉPUBLIQUE DU NIGER\nMINISTÈRE DE LA JEUNESSE ET DES SPORTS\nARRÊTÉ N° 2023/045/MJS/SCN\nPortant admission au Service Civique National - Promotion 2023\n\nListe des appelés:\n1. ABDOU Ibrahim - Licence en Informatique\n2. MAHAMADOU Fatima - Master en Gestion\n3. SOULEY Amadou - Licence en Droit	INDEXE	\N	2026-01-21 12:59:49.416	2026-01-21 12:59:49.413	\N	0
cmko15oa30005cq24s9tyw3j3	2024/012/MJS/SCN	2024-01-10 00:00:00	2024	2024	/uploads/arretes/arrete-2024-012.pdf	RÉPUBLIQUE DU NIGER\nMINISTÈRE DE LA JEUNESSE ET DES SPORTS\nARRÊTÉ N° 2024/012/MJS/SCN\nPortant admission au Service Civique National - Promotion 2024\n\nListe des appelés:\n1. HASSAN Aïssata - Licence en Économie\n2. OUMAROU Salissou - Master en Agronomie	INDEXE	\N	2026-01-21 12:59:49.42	2026-01-21 12:59:49.418	\N	0
cmko4sen40000cqt0zznkbztq	324	2022-12-23 00:00:00	2022	2022	\N	\N	INDEXE	\N	2026-01-21 14:41:28.863	2026-01-21 14:41:55.96	\N	975
\.


--
-- Data for Name: attestation_counter; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.attestation_counter (id, year, counter) FROM stdin;
singleton	2026	6
\.


--
-- Data for Name: attestations; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.attestations (id, numero, "dateGeneration", "dateSignature", "typeSignature", "fichierPath", "qrCodeData", statut, "demandeId", "signataireId") FROM stdin;
cmko6s82a000kcq6ks0zd00l1	00004/01/2026	2026-01-21 15:37:19.57	2026-01-21 15:38:12.273	ELECTRONIQUE	/uploads/attestations/00004-01-2026.pdf	{"id":"cmko15oai000fcq24zykcfkuv","numero":"00004/01/2026","nom":"MAHAMADOU","prenom":"Fatima","dateNaissance":"1996-07-20","signature":"4c64dcb4033b1a2cf9522833a836e36ff11af4807060982ec730d9be9a245132","timestamp":1769009839565}	SIGNEE	cmko15oai000fcq24zykcfkuv	cmko15o9w0003cq24abd6sl6a
cmkqutsxo000tcqm0nkuefsw9	00006/01/2026	2026-01-23 12:25:56.412	2026-01-23 13:33:00.999	ELECTRONIQUE	/uploads/attestations/00006-01-2026.pdf	{"id":"cmko15oa60007cq244y3qo5xq","numero":"00006/01/2026","nom":"ABDOU","prenom":"Ibrahim","dateNaissance":"1995-03-15","signature":"f6e18ad674fb461b7f78560ed7c97670522ee76a44145f62fa2c3dd3f65b1925","timestamp":1769171156407}	SIGNEE	cmko15oa60007cq244y3qo5xq	cmkqvrbhy0002cqgodeaebv10
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.audit_logs (id, action, "userId", "demandeId", details, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmko3gdl90008cqbsfppkb9u3	DEMANDE_VALIDATED	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"observations":""}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-21 14:04:07.978
cmko4vw3d00r6cqt0skkbyw1o	USER_CREATED	cmko15o440000cq24vf4ih3ce	\N	{"newUserId":"cmko4vvg500r4cqt0lc2g8b3n","email":"saisie@servicecivique.ne","role":"SAISIE"}	::1	\N	2026-01-21 14:44:11.208
cmko6ktyd0006cq6kpa4fgwn5	DEMANDE_VALIDATED	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"observations":""}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-21 15:31:34.69
cmko6ydiu000wcq6kuv9zv615	DEMANDE_RETURNED_BY_DIRECTOR	cmko15o9w0003cq24abd6sl6a	cmko15oal000ncq24mksfzs6t	{"remarque":"cxwx"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-21 15:42:06.559
cmko8q5b40009cqz0cxllzrxo	DEMANDE_VALIDATED	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq	{"observations":""}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-21 16:31:41.92
cmkqmpl2g000lcqgghgxgdtsu	PIECES_NON_CONFORMES	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq	{"piecesNonConformes":[{"type":"COPIE_ARRETE","observation":"Absence dans les arrêtés - Appelé non trouvé dans la base des arrêtés"}],"observations":"L'appelé n'a pas été trouvé dans les arrêtés du service civique."}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-23 08:38:42.663
cmkqmspdg000xcqggsfyc05ny	DEMANDE_VALIDATED	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq	{"observations":""}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-23 08:41:08.212
cmkqumy7f0001cqm0irq3635j	DEMANDE_MODIFIEE	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"numeroEnregistrement":"SCN-2024-003","modifications":{"nom":"HASSAN","prenom":"Aïssata","dateNaissance":"1997-11-05","lieuNaissance":"Zinder","telephone":"+22796888542","email":"dsi.mesri@gmail.com","promotion":"2024","observations":"[Retour directeur] cxwx"}}	\N	\N	2026-01-23 12:20:36.651
cmkquomd10007cqm0cenxz9jt	DEMANDE_REJECTED	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"motif":"pièces manquantes"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-23 12:21:54.613
cmkqut82l000lcqm0r9xohwvm	DEMANDE_MODIFIEE	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq	{"numeroEnregistrement":"SCN-2024-001","modifications":{"nom":"ABDOU","prenom":"Ibrahim","dateNaissance":"1995-03-15","lieuNaissance":"Niamey","telephone":"+22796888542","email":"roufay_amadou@yahoo.fr","promotion":"2023","observations":"L'appelé n'a pas été trouvé dans les arrêtés du service civique."}}	\N	\N	2026-01-23 12:25:29.372
cmkqutnro000ncqm0y5ey9xgj	DEMANDE_VALIDATED	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq	{"observations":""}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-23 12:25:49.716
cmkqvljm60001cqgoo294f5tv	PIN_CHANGED	cmko15o9w0003cq24abd6sl6a	\N	{"timestamp":"2026-01-23T12:47:30.697Z"}	\N	\N	2026-01-23 12:47:30.698
cmkqvrbj20004cqgov8ces6b8	USER_CREATED	cmko15o440000cq24vf4ih3ce	\N	{"newUserId":"cmkqvrbhy0002cqgodeaebv10","email":"roufay_amadou@yahoo.fr","role":"DIRECTEUR"}	::1	\N	2026-01-23 12:52:00.158
cmkqvtboi0008cqgo9swkxhsy	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 12:53:33.666
cmkqwb5we000acqgod7dkpdxc	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:07:25.98
cmkqwgkm2000ccqgom3zuhrec	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:11:38.307
cmkqwi1ii000ecqgowga3hpax	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:12:46.89
cmkqwn22f000gcqgot1itarpc	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:16:40.886
cmkqwot35000icqgosnenoxli	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:18:02.562
cmkqwvyu7000kcqgokb4zf0hj	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:23:36.606
cmkqx1ts3000mcqgodv6sd7bv	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:28:09.986
cmkqx3koe000ocqgogxaopcg1	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:29:31.502
cmkqx7baz0001cq28nacfg1jd	2FA_OTP_REQUESTED	cmkqvrbhy0002cqgodeaebv10	\N	{"action":"SIGN_ATTESTATION"}	\N	\N	2026-01-23 13:32:25.977
cmkqxoupx000bcq286716133v	DEMANDE_REJECTED	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"motif":"dqsd"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-23 13:46:04.292
cmkqxqolc000jcq28g5hl2fxl	DEMANDE_MODIFIEE	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"numeroEnregistrement":"SCN-2024-003","modifications":{"nom":"HASSAN","prenom":"Aïssata","dateNaissance":"1997-11-05","lieuNaissance":"Zinder","telephone":"22796888542","email":"dsi.mesri@gmail.com","promotion":"2024","observations":"dqsd"}}	\N	\N	2026-01-23 13:47:29.665
cmkqxquke000lcq28nnj6t9e9	DEMANDE_REJECTED	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"motif":"gjh"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-23 13:47:37.406
cmkqxw9h0000rcq28lkpbmdol	DEMANDE_MODIFIEE	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"numeroEnregistrement":"SCN-2024-003","modifications":{"nom":"HASSAN","prenom":"Aïssata","dateNaissance":"1997-11-05","lieuNaissance":"Zinder","telephone":"+22796888542","email":"dsi.mesri@gmail.com","promotion":"2024","observations":"gjh"}}	\N	\N	2026-01-23 13:51:50.004
cmkqxx00j000tcq284dhotjyu	DEMANDE_MODIFIEE	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"numeroEnregistrement":"SCN-2024-003","modifications":{"nom":"HASSAN","prenom":"Aïssata","dateNaissance":"1997-11-05","lieuNaissance":"Zinder","telephone":"+22790905646","email":"dsi.mesri@gmail.com","promotion":"2024","observations":"gjh"}}	\N	\N	2026-01-23 13:52:24.403
cmkqy29cw000zcq28emik2w6a	DEMANDE_REJECTED	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t	{"motif":"qsdqsd"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-23 13:56:29.792
cmks89lq50001cqq46ebfrqjt	USER_UPDATED	cmko15o440000cq24vf4ih3ce	\N	{"targetUserId":"cmko15o9w0003cq24abd6sl6a","changes":{"nom":"ABDOU","prenom":"Dr. Moussa","email":"directeur@servicecivique.ne","role":"DIRECTEUR","actif":false}}	::1	\N	2026-01-24 11:29:54.743
cmks8ac070003cqq4tgt5liwd	USER_UPDATED	cmko15o440000cq24vf4ih3ce	\N	{"targetUserId":"cmko15o9w0003cq24abd6sl6a","changes":{"nom":"ABDOU","prenom":"Dr. Moussa","email":"directeur@servicecivique.ne","role":"DIRECTEUR","actif":true}}	::1	\N	2026-01-24 11:30:28.807
\.


--
-- Data for Name: config_system; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.config_system (id, cle, valeur, "createdAt", "updatedAt") FROM stdin;
cmko15oap000ucq248kruikzc	nom_organisme	Service Civique National du Niger	2026-01-21 12:59:49.441	2026-01-21 12:59:49.441
cmko15oap000vcq246xmu5yrf	adresse_organisme	BP 123, Niamey, Niger	2026-01-21 12:59:49.441	2026-01-21 12:59:49.441
cmko15oap000wcq24y1dhdpow	email_contact	contact@servicecivique.ne	2026-01-21 12:59:49.441	2026-01-21 12:59:49.441
cmko15oap000xcq24z51skzqt	telephone_contact	+227 20 XX XX XX	2026-01-21 12:59:49.441	2026-01-21 12:59:49.441
cmkquqw9m000ccqm0jb65bd5w	email_provider	brevo	2026-01-23 12:23:40.762	2026-01-23 12:23:40.762
cmkquqwwo000dcqm0joxokd70	smtp_port	587	2026-01-23 12:23:41.593	2026-01-23 12:23:41.593
cmkquqwxw000ecqm0d71rhmq1	smtp_secure	false	2026-01-23 12:23:41.637	2026-01-23 12:23:41.637
cmkquqwyd000fcqm0d9mv5u6z	brevo_api_key	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	2026-01-23 12:23:41.653	2026-01-23 12:23:41.653
cmkquqwyh000gcqm0zma8d8ml	brevo_sender_email	noreply@servicecivique.ne	2026-01-23 12:23:41.657	2026-01-23 12:23:41.657
cmkquqwyk000hcqm09lst8qfj	brevo_sender_name	Service Civique National	2026-01-23 12:23:41.661	2026-01-23 12:23:41.661
cmkquqx0m000icqm0le9lcuwv	brevo_sms_enabled	true	2026-01-23 12:23:41.734	2026-01-23 12:23:41.734
cmkquqx2n000jcqm05ojudcqm	sms_provider	twilio	2026-01-23 12:23:41.807	2026-01-23 12:23:41.807
\.


--
-- Data for Name: demandes; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.demandes (id, "numeroEnregistrement", "dateEnregistrement", statut, observations, "motifRejet", "agentId", "createdAt", "updatedAt", "dateValidation", "dateSignature") FROM stdin;
cmko15oai000fcq24zykcfkuv	SCN-2024-002	2024-01-16 00:00:00	SIGNEE	Dossier validé, prêt pour génération	\N	cmko15o650001cq24d76zroyl	2026-01-21 12:59:49.434	2026-01-21 15:38:12.277	2024-01-17 00:00:00	2026-01-21 15:38:12.276
cmko15oa60007cq244y3qo5xq	SCN-2024-001	2024-01-15 00:00:00	SIGNEE	L'appelé n'a pas été trouvé dans les arrêtés du service civique.	\N	cmko15o650001cq24d76zroyl	2026-01-21 12:59:49.423	2026-01-23 13:33:01.005	2026-01-23 12:25:49.708	2026-01-23 13:33:01.003
cmko15oal000ncq24mksfzs6t	SCN-2024-003	2024-01-18 00:00:00	REJETEE	qsdqsd	\N	cmko15o7y0002cq24837gg96k	2026-01-21 12:59:49.438	2026-01-23 13:56:29.784	2026-01-23 13:56:29.783	\N
\.


--
-- Data for Name: directeur_signatures; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.directeur_signatures (id, "userId", "signatureImage", "positionX", "positionY", "texteSignature", "pinHash", "pinAttempts", "pinBloqueJusqua", "isEnabled", "createdAt", "updatedAt", "qrCodePositionX", "qrCodePositionY", "qrCodeSize", "signatureHeight", "signatureWidth", "totpBackupCodes", "totpEnabled", "totpSecret", "twoFactorMethod") FROM stdin;
cmko6esev0002cq6k3yfp5uuz	cmko15o9w0003cq24abd6sl6a	/uploads/signatures/signature-cmko15o9w0003cq24abd6sl6a-1769009212637.png	550	450	Le Directeur du Service Civique National	$2b$10$15yVMBmcEXS9qq2ReZv9b.PFfRZBlx/O2LN1LajadoMGTXAyfP2AC	0	\N	t	2026-01-21 15:26:52.755	2026-01-23 12:47:30.696	50	450	80	60	150	\N	f	\N	email
cmkqvsrfr0006cqgop2mj58pv	cmkqvrbhy0002cqgodeaebv10	/uploads/signatures/signature-cmkqvrbhy0002cqgodeaebv10-1769172787312.png	550	450	Le Directeur du Service Civique National	$2b$10$bLwR3qGLpe0RqLZeUOiBiuJP2EZdjtwbxMVw36mCdrAv/Berl./i2	0	\N	t	2026-01-23 12:53:07.389	2026-01-23 13:32:58.332	50	450	80	60	150	\N	f	\N	email
\.


--
-- Data for Name: historique_statuts; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.historique_statuts (id, "demandeId", statut, commentaire, "createdAt", "modifiePar") FROM stdin;
cmko3f8f40002cqbs4q2xsyuh	cmko15oal000ncq24mksfzs6t	ENREGISTREE	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme conforme	2026-01-21 14:03:14.654	cmko15o650001cq24d76zroyl
cmko3fbmh0004cqbsoo3kpwjm	cmko15oal000ncq24mksfzs6t	ENREGISTREE	Pièce "DEMANDE_MANUSCRITE" marquée comme conforme	2026-01-21 14:03:18.809	cmko15o650001cq24d76zroyl
cmko3fbuh0006cqbs69yi00u0	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Toutes les pièces présentes ont été vérifiées	2026-01-21 14:03:19.098	cmko15o650001cq24d76zroyl
cmko6kb9n0004cq6kc6kad2wd	cmko15oal000ncq24mksfzs6t	ENREGISTREE	Statut modifié en ENREGISTREE	2026-01-21 15:31:10.472	cmko15o650001cq24d76zroyl
cmko6l3zr000ecq6kc4r5erg0	cmko15oal000ncq24mksfzs6t	EN_ATTENTE_SIGNATURE	Attestation générée, en attente de signature	2026-01-21 15:31:47.703	cmko15o650001cq24d76zroyl
cmko6s82k000mcq6kss58jayp	cmko15oai000fcq24zykcfkuv	EN_ATTENTE_SIGNATURE	Attestation générée, en attente de signature	2026-01-21 15:37:19.581	cmko15o650001cq24d76zroyl
cmko6ydj1000ycq6k93wb0pb1	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Retourné par le directeur: cxwx	2026-01-21 15:42:06.589	cmko15o9w0003cq24abd6sl6a
cmko8p3by0001cqz0bhzxkgm1	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "DEMANDE_MANUSCRITE" marquée comme conforme	2026-01-21 16:30:52.7	cmko15o650001cq24d76zroyl
cmko8p6600003cqz0m5qrzeux	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "CERTIFICAT_CESSATION" marquée comme conforme	2026-01-21 16:30:56.377	cmko15o650001cq24d76zroyl
cmko8p79i0005cqz0nlsgx1oh	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "CERTIFICAT_ASSIDUITE" marquée comme conforme	2026-01-21 16:30:57.798	cmko15o650001cq24d76zroyl
cmko8p8b50007cqz0dm1wec6e	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme conforme	2026-01-21 16:30:59.153	cmko15o650001cq24d76zroyl
cmko8qeav000hcqz01tj057cq	cmko15oa60007cq244y3qo5xq	EN_ATTENTE_SIGNATURE	Attestation générée, en attente de signature	2026-01-21 16:31:53.575	cmko15o650001cq24d76zroyl
cmkqmf0xp0001cqgg1vqp7joh	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Pièce "DEMANDE_MANUSCRITE" marquée comme non conforme	2026-01-23 08:30:30.01	cmko15o650001cq24d76zroyl
cmkqmfate0003cqggeyzx3omb	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme non conforme	2026-01-23 08:30:42.818	cmko15o650001cq24d76zroyl
cmkqmgnd90005cqgg9cs4kq5y	cmko15oa60007cq244y3qo5xq	ENREGISTREE	Statut modifié en ENREGISTREE	2026-01-23 08:31:45.742	cmko15o650001cq24d76zroyl
cmkqmhkpe0007cqggvr8us6x8	cmko15oa60007cq244y3qo5xq	ENREGISTREE	Pièce "DEMANDE_MANUSCRITE" marquée comme non conforme	2026-01-23 08:32:28.947	cmko15o650001cq24d76zroyl
cmkqmhkpk0009cqgg8hj0ulna	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Toutes les pièces présentes ont été vérifiées	2026-01-23 08:32:28.952	cmko15o650001cq24d76zroyl
cmkqmoglh000bcqggqdhux6i2	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "DEMANDE_MANUSCRITE" marquée comme conforme	2026-01-23 08:37:50.213	cmko15o650001cq24d76zroyl
cmkqmotht000dcqggmkdrxbsf	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "DEMANDE_MANUSCRITE" marquée comme non conforme	2026-01-23 08:38:06.929	cmko15o650001cq24d76zroyl
cmkqmp3bb000fcqggcoi9xov5	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme non conforme	2026-01-23 08:38:19.656	cmko15o650001cq24d76zroyl
cmkqmp9qv000hcqgg21u58ytu	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "DEMANDE_MANUSCRITE" marquée comme conforme	2026-01-23 08:38:27.991	cmko15o650001cq24d76zroyl
cmkqmpbed000jcqggtjxhibyo	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme conforme	2026-01-23 08:38:30.134	cmko15o650001cq24d76zroyl
cmkqmq04b000rcqgg5nmde30l	cmko15oa60007cq244y3qo5xq	PIECES_NON_CONFORMES	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme non conforme	2026-01-23 08:39:02.171	cmko15o650001cq24d76zroyl
cmkqmq6cf000tcqggwap2k5wa	cmko15oa60007cq244y3qo5xq	PIECES_NON_CONFORMES	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme non conforme	2026-01-23 08:39:10.24	cmko15o650001cq24d76zroyl
cmkqmqbps000vcqgg4jm3i63z	cmko15oa60007cq244y3qo5xq	PIECES_NON_CONFORMES	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme conforme	2026-01-23 08:39:17.201	cmko15o650001cq24d76zroyl
cmkqnh270000zcqggukv75cu9	cmko15oa60007cq244y3qo5xq	EN_TRAITEMENT	Statut modifié en EN_TRAITEMENT	2026-01-23 09:00:04.57	cmko15o650001cq24d76zroyl
cmkqun9rd0003cqm0baangs1m	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Pièce "DEMANDE_MANUSCRITE" marquée comme conforme	2026-01-23 12:20:51.625	cmko15o650001cq24d76zroyl
cmkqunbak0005cqm096is5ox9	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme conforme	2026-01-23 12:20:53.612	cmko15o650001cq24d76zroyl
cmkqutsxx000vcqm06dm3x0jq	cmko15oa60007cq244y3qo5xq	EN_ATTENTE_SIGNATURE	Attestation générée, en attente de signature	2026-01-23 12:25:56.422	cmko15o650001cq24d76zroyl
cmkqxog2k0009cq28rfw8tw4q	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Statut modifié en EN_TRAITEMENT	2026-01-23 13:45:45.306	cmko15o650001cq24d76zroyl
cmkqxqji9000hcq28imso7tz5	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Statut modifié en EN_TRAITEMENT	2026-01-23 13:47:23.073	cmko15o650001cq24d76zroyl
cmkqxw3ey000pcq28vs5jeo0d	cmko15oal000ncq24mksfzs6t	ENREGISTREE	Statut modifié en ENREGISTREE	2026-01-23 13:51:42.151	cmko15o650001cq24d76zroyl
cmkqy20qa000vcq28usymj2eo	cmko15oal000ncq24mksfzs6t	ENREGISTREE	Pièce "CERTIFICAT_PRISE_SERVICE" marquée comme non conforme	2026-01-23 13:56:18.61	cmko15o650001cq24d76zroyl
cmkqy20qm000xcq28w5splhfl	cmko15oal000ncq24mksfzs6t	EN_TRAITEMENT	Toutes les pièces présentes ont été vérifiées	2026-01-23 13:56:18.622	cmko15o650001cq24d76zroyl
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.notifications (id, "demandeId", canal, destinataire, contenu, statut, "dateEnvoi", "messageErreur", tentatives, "createdAt") FROM stdin;
cmko3ge4k000acqbsptvzy6vs	cmko15oal000ncq24mksfzs6t	EMAIL	aissata.hassan@example.com	Demande SCN-2024-003 en cours de traitement	ECHEC	\N	Échec envoi email	1	2026-01-21 14:04:08.709
cmko3ge4s000ccqbs9uyvz6cq	cmko15oal000ncq24mksfzs6t	SMS	+22792345678	Service Civique: Votre demande SCN-2024-003 est en cours de traitement.	ECHEC	\N	Échec envoi SMS	1	2026-01-21 14:04:08.716
cmko6kucf0008cq6kplbdvl43	cmko15oal000ncq24mksfzs6t	EMAIL	aissata.hassan@example.com	Demande SCN-2024-003 en cours de traitement	ECHEC	\N	Échec envoi email	1	2026-01-21 15:31:35.199
cmko6kucl000acq6k0d0j8hsa	cmko15oal000ncq24mksfzs6t	SMS	+22792345678	Service Civique: Votre demande SCN-2024-003 est en cours de traitement.	ECHEC	\N	Échec envoi SMS	1	2026-01-21 15:31:35.205
cmko6l47q000gcq6k48a7ljm3	cmko15oal000ncq24mksfzs6t	EMAIL	aissata.hassan@example.com	✓ Votre attestation est prête - 00003/01/2026	ECHEC	\N	Échec envoi email	1	2026-01-21 15:31:47.991
cmko6l47t000icq6k84dzheqv	cmko15oal000ncq24mksfzs6t	SMS	+22792345678	Service Civique: Votre attestation 00003/01/2026 est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d'identité.	ECHEC	\N	Échec envoi SMS	1	2026-01-21 15:31:47.994
cmko6s83a000ocq6k0lqz59a8	cmko15oai000fcq24zykcfkuv	EMAIL	fatima.mahamadou@example.com	✓ Votre attestation est prête - 00004/01/2026	ECHEC	\N	Échec envoi email	1	2026-01-21 15:37:19.606
cmko6s83r000qcq6kers13on5	cmko15oai000fcq24zykcfkuv	SMS	+22791234567	Service Civique: Votre attestation 00004/01/2026 est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d'identité.	ECHEC	\N	Échec envoi SMS	1	2026-01-21 15:37:19.623
cmko6tcql000scq6kx9u72tme	cmko15oai000fcq24zykcfkuv	EMAIL	fatima.mahamadou@example.com	✓ Votre attestation est prête - 00004/01/2026	ECHEC	\N	Échec envoi email	1	2026-01-21 15:38:12.285
cmko6tcqr000ucq6knozt35ty	cmko15oai000fcq24zykcfkuv	SMS	+22791234567	Service Civique: Votre attestation 00004/01/2026 est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d'identité.	ECHEC	\N	Échec envoi SMS	1	2026-01-21 15:38:12.292
cmko8q5kx000bcqz019234lhc	cmko15oa60007cq244y3qo5xq	EMAIL	ibrahim.abdou@example.com	Demande SCN-2024-001 en cours de traitement	ECHEC	\N	Échec envoi email	1	2026-01-21 16:31:42.273
cmko8q5l3000dcqz0tcajly65	cmko15oa60007cq244y3qo5xq	SMS	+22790123456	Service Civique: Votre demande SCN-2024-001 est en cours de traitement.	ECHEC	\N	Échec envoi SMS	1	2026-01-21 16:31:42.279
cmko8qeb1000jcqz0e0wn2gtr	cmko15oa60007cq244y3qo5xq	EMAIL	ibrahim.abdou@example.com	✓ Votre attestation est prête - 00005/01/2026	ECHEC	\N	Échec envoi email	1	2026-01-21 16:31:53.582
cmko8qeb4000lcqz09rrdnkwb	cmko15oa60007cq244y3qo5xq	SMS	+22790123456	Service Civique: Votre attestation 00005/01/2026 est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d'identité.	ECHEC	\N	Échec envoi SMS	1	2026-01-21 16:31:53.584
cmkqmpl99000ncqggqen6us9s	cmko15oa60007cq244y3qo5xq	EMAIL	ibrahim.abdou@example.com	Demande SCN-2024-001 - Pièces à régulariser	ECHEC	\N	Échec envoi email	1	2026-01-23 08:38:42.909
cmkqmpl9c000pcqggha0l238d	cmko15oa60007cq244y3qo5xq	SMS	+22790123456	Service Civique: Pièces non conformes pour demande SCN-2024-001. Contactez-nous.	ECHEC	\N	Échec envoi SMS	1	2026-01-23 08:38:42.913
cmkquomk20009cqm0nq2dhzuz	cmko15oal000ncq24mksfzs6t	EMAIL	dsi.mesri@gmail.com	Demande d'attestation SCN-2024-003 - Information	ECHEC	\N	Échec envoi email	1	2026-01-23 12:21:54.866
cmkquomk6000bcqm004o32pf1	cmko15oal000ncq24mksfzs6t	SMS	+22796888542	Service Civique: Votre demande SCN-2024-003 nécessite une régularisation. Veuillez contacter nos services.	ECHEC	\N	Échec envoi SMS	1	2026-01-23 12:21:54.871
cmkqutnrv000pcqm0nwo828nd	cmko15oa60007cq244y3qo5xq	EMAIL	roufay_amadou@yahoo.fr	Demande SCN-2024-001 en cours de traitement	ECHEC	\N	Échec envoi email	1	2026-01-23 12:25:49.724
cmkqutnrz000rcqm0m2pctvh0	cmko15oa60007cq244y3qo5xq	SMS	+22796888542	Service Civique: Votre demande SCN-2024-001 est en cours de traitement.	ECHEC	\N	Échec envoi SMS	1	2026-01-23 12:25:49.727
cmkqx830z0003cq28ji8ypdbl	cmko15oa60007cq244y3qo5xq	EMAIL	roufay_amadou@yahoo.fr	✓ Votre attestation est prête - 00006/01/2026	ENVOYEE	2026-01-23 13:33:01.905	\N	1	2026-01-23 13:33:01.908
cmkqx83180005cq28e2ncpohx	cmko15oa60007cq244y3qo5xq	SMS	+22796888542	Service Civique: Votre attestation 00006/01/2026 est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d'identité.	ECHEC	\N	Échec envoi SMS	1	2026-01-23 13:33:01.916
cmkqx831c0007cq28kqzcb7zw	cmko15oa60007cq244y3qo5xq	WHATSAPP	+22790123456	Service Civique: Votre attestation 00006/01/2026 est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d'identité.	ECHEC	\N	Échec envoi WhatsApp	1	2026-01-23 13:33:01.92
cmkqxovej000dcq28snjgz2ds	cmko15oal000ncq24mksfzs6t	EMAIL	dsi.mesri@gmail.com	Demande d'attestation SCN-2024-003 - Information	ENVOYEE	2026-01-23 13:46:05.177	\N	1	2026-01-23 13:46:05.18
cmkqxoveq000fcq28ujce8y7t	cmko15oal000ncq24mksfzs6t	SMS	+22796888542	Service Civique: Votre demande SCN-2024-003 nécessite une régularisation. Veuillez contacter nos services.	ECHEC	\N	Échec envoi SMS	1	2026-01-23 13:46:05.186
cmkqxqv3i000ncq28yldzydcn	cmko15oal000ncq24mksfzs6t	EMAIL	dsi.mesri@gmail.com	Demande d'attestation SCN-2024-003 - Information	ENVOYEE	2026-01-23 13:47:38.092	\N	1	2026-01-23 13:47:38.094
cmkqy2aop0011cq28sa7b3m5l	cmko15oal000ncq24mksfzs6t	EMAIL	dsi.mesri@gmail.com	Demande d'attestation SCN-2024-003 - Information	ENVOYEE	2026-01-23 13:56:31.512	\N	1	2026-01-23 13:56:31.514
cmkqy2ap10013cq2851o6k3kn	cmko15oal000ncq24mksfzs6t	SMS	+22790905646	Service Civique: Votre demande SCN-2024-003 nécessite une régularisation. Veuillez contacter nos services.	ECHEC	\N	Échec envoi SMS	1	2026-01-23 13:56:31.525
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.password_reset_tokens (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: pieces_dossier; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.pieces_dossier (id, type, present, conforme, observation, "statutVerification", "dateVerification", "verifiePar", "demandeId") FROM stdin;
cmko15oai000hcq24us9fhg2i	DEMANDE_MANUSCRITE	t	t	\N	\N	\N	\N	cmko15oai000fcq24zykcfkuv
cmko15oai000icq24rca9igsc	CERTIFICAT_ASSIDUITE	t	t	\N	\N	\N	\N	cmko15oai000fcq24zykcfkuv
cmko15oai000jcq24id2373ff	CERTIFICAT_CESSATION	t	t	\N	\N	\N	\N	cmko15oai000fcq24zykcfkuv
cmko15oai000kcq247l5yef4k	CERTIFICAT_PRISE_SERVICE	t	t	\N	\N	\N	\N	cmko15oai000fcq24zykcfkuv
cmko15oai000lcq24eawoopzz	COPIE_ARRETE	t	t	\N	\N	\N	\N	cmko15oai000fcq24zykcfkuv
cmko15oal000qcq24re06l2rr	CERTIFICAT_ASSIDUITE	f	\N	\N	\N	\N	\N	cmko15oal000ncq24mksfzs6t
cmko15oal000rcq24j62hukmg	CERTIFICAT_CESSATION	f	\N	\N	\N	\N	\N	cmko15oal000ncq24mksfzs6t
cmko15oal000tcq2435f9za0d	COPIE_ARRETE	f	\N	\N	\N	\N	\N	cmko15oal000ncq24mksfzs6t
cmko15oa6000bcq24co52lgjp	CERTIFICAT_CESSATION	t	t	\N	CONFORME	2026-01-21 16:30:56.367	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq
cmko15oa6000acq241aihzk75	CERTIFICAT_ASSIDUITE	t	t	\N	CONFORME	2026-01-21 16:30:57.787	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq
cmko15oa60009cq24eb529l7e	DEMANDE_MANUSCRITE	t	t	\N	CONFORME	2026-01-23 08:38:27.987	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq
cmko15oa6000dcq24cdfps51i	COPIE_ARRETE	f	f	Absence dans les arrêtés - Appelé non trouvé dans la base des arrêtés	\N	\N	\N	cmko15oa60007cq244y3qo5xq
cmko15oa6000ccq24og9l396q	CERTIFICAT_PRISE_SERVICE	t	t	\N	CONFORME	2026-01-23 08:39:17.196	cmko15o650001cq24d76zroyl	cmko15oa60007cq244y3qo5xq
cmko15oal000pcq24l929wsoz	DEMANDE_MANUSCRITE	t	t	\N	CONFORME	2026-01-23 12:20:51.62	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t
cmko15oal000scq24o378it7c	CERTIFICAT_PRISE_SERVICE	t	f	\N	NON_CONFORME	2026-01-23 13:56:18.596	cmko15o650001cq24d76zroyl	cmko15oal000ncq24mksfzs6t
\.


--
-- Data for Name: templates_attestation; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.templates_attestation (id, nom, "fichierPath", "mappingChamps", actif, "createdAt", "updatedAt") FROM stdin;
cmko64zrl0000cq6kgs92by47	modele1	/uploads/templates/background_1769008755721.png	{"version":1,"backgroundImage":"/uploads/templates/background_1769008755721.png","pageWidth":842,"pageHeight":595,"pageOrientation":"landscape","fields":[]}	f	2026-01-21 15:19:15.725	2026-01-21 15:19:15.725
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: desp
--

COPY public.users (id, email, password, nom, prenom, role, actif, "createdAt", "updatedAt", "derniereConnexion", "failedLoginAttempts", "lockoutUntil") FROM stdin;
cmko15o7y0002cq24837gg96k	agent2@servicecivique.ne	$2b$10$gz1/GJrzgjVbS8XkK.HHkuUaB4Jby2HVzqzINodM6/AbfM0I/xiPO	IBRAHIM	Fatima	AGENT	t	2026-01-21 12:59:49.342	2026-01-21 12:59:49.342	\N	0	\N
cmkqvrbhy0002cqgodeaebv10	roufay_amadou@yahoo.fr	$2b$10$FSe0w/fONw/JF39S9w/i9eWaUzsPm1A.Hu/heymDlwc8fwwsxiQV6	Roufai	Amadou	DIRECTEUR	t	2026-01-23 12:52:00.118	2026-01-23 13:32:12.352	2026-01-23 13:32:12.348	0	\N
cmko4vvg500r4cqt0lc2g8b3n	saisie@servicecivique.ne	$2b$10$mXezxr0tupJ.C1wc/nhJJOxbTAIy2MFAA1QCiUwoI3hg3fOI64.QG	mesrit	dsi	SAISIE	t	2026-01-21 14:44:10.613	2026-01-24 11:15:43.615	2026-01-24 11:15:43.612	0	\N
cmko15o9w0003cq24abd6sl6a	directeur@servicecivique.ne	$2b$10$LGucP3ai.seDVJ4Qh52A0.QFw6Z45aP.bj33ij1tbeY9PQKpy7Rs6	ABDOU	Dr. Moussa	DIRECTEUR	t	2026-01-21 12:59:49.412	2026-01-24 11:30:28.79	2026-01-23 12:46:39.543	0	\N
cmko15o440000cq24vf4ih3ce	admin@servicecivique.ne	$2b$10$jk49SAZJWjqwaKVDyFJOeeYM7f/WmhieoGeFH2KhN0WwT7FXJLUWS	ADMIN	Système	ADMIN	t	2026-01-21 12:59:49.205	2026-01-26 07:55:36.458	2026-01-24 11:49:38.698	1	\N
cmko15o650001cq24d76zroyl	agent@servicecivique.ne	$2b$10$qoLKpJUh1NJw..CFy8csuuoe1tqZQfEoRNrChmEMUSdAQqt3ZYPpC	MOUSSA	Aïcha	AGENT	t	2026-01-21 12:59:49.277	2026-01-26 08:14:14.159	2026-01-26 08:14:14.157	0	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: appeles_arretes appeles_arretes_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.appeles_arretes
    ADD CONSTRAINT appeles_arretes_pkey PRIMARY KEY (id);


--
-- Name: appeles appeles_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.appeles
    ADD CONSTRAINT appeles_pkey PRIMARY KEY (id);


--
-- Name: arretes arretes_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.arretes
    ADD CONSTRAINT arretes_pkey PRIMARY KEY (id);


--
-- Name: attestation_counter attestation_counter_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.attestation_counter
    ADD CONSTRAINT attestation_counter_pkey PRIMARY KEY (id);


--
-- Name: attestations attestations_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: config_system config_system_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.config_system
    ADD CONSTRAINT config_system_pkey PRIMARY KEY (id);


--
-- Name: demandes demandes_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.demandes
    ADD CONSTRAINT demandes_pkey PRIMARY KEY (id);


--
-- Name: directeur_signatures directeur_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.directeur_signatures
    ADD CONSTRAINT directeur_signatures_pkey PRIMARY KEY (id);


--
-- Name: historique_statuts historique_statuts_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.historique_statuts
    ADD CONSTRAINT historique_statuts_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: pieces_dossier pieces_dossier_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.pieces_dossier
    ADD CONSTRAINT pieces_dossier_pkey PRIMARY KEY (id);


--
-- Name: templates_attestation templates_attestation_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.templates_attestation
    ADD CONSTRAINT templates_attestation_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: appeles_arretes_arreteId_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "appeles_arretes_arreteId_idx" ON public.appeles_arretes USING btree ("arreteId");


--
-- Name: appeles_arretes_nom_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX appeles_arretes_nom_idx ON public.appeles_arretes USING btree (nom);


--
-- Name: appeles_demandeId_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX "appeles_demandeId_key" ON public.appeles USING btree ("demandeId");


--
-- Name: appeles_nom_prenom_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX appeles_nom_prenom_idx ON public.appeles USING btree (nom, prenom);


--
-- Name: appeles_numeroArrete_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "appeles_numeroArrete_idx" ON public.appeles USING btree ("numeroArrete");


--
-- Name: appeles_promotion_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX appeles_promotion_idx ON public.appeles USING btree (promotion);


--
-- Name: arretes_annee_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX arretes_annee_idx ON public.arretes USING btree (annee);


--
-- Name: arretes_numero_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX arretes_numero_idx ON public.arretes USING btree (numero);


--
-- Name: arretes_numero_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX arretes_numero_key ON public.arretes USING btree (numero);


--
-- Name: arretes_promotion_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX arretes_promotion_idx ON public.arretes USING btree (promotion);


--
-- Name: arretes_statutIndexation_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "arretes_statutIndexation_idx" ON public.arretes USING btree ("statutIndexation");


--
-- Name: attestations_dateGeneration_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "attestations_dateGeneration_idx" ON public.attestations USING btree ("dateGeneration");


--
-- Name: attestations_demandeId_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX "attestations_demandeId_key" ON public.attestations USING btree ("demandeId");


--
-- Name: attestations_numero_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX attestations_numero_idx ON public.attestations USING btree (numero);


--
-- Name: attestations_numero_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX attestations_numero_key ON public.attestations USING btree (numero);


--
-- Name: attestations_statut_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX attestations_statut_idx ON public.attestations USING btree (statut);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_demandeId_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "audit_logs_demandeId_idx" ON public.audit_logs USING btree ("demandeId");


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "audit_logs_userId_idx" ON public.audit_logs USING btree ("userId");


--
-- Name: config_system_cle_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX config_system_cle_key ON public.config_system USING btree (cle);


--
-- Name: demandes_agentId_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "demandes_agentId_idx" ON public.demandes USING btree ("agentId");


--
-- Name: demandes_dateEnregistrement_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "demandes_dateEnregistrement_idx" ON public.demandes USING btree ("dateEnregistrement");


--
-- Name: demandes_numeroEnregistrement_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "demandes_numeroEnregistrement_idx" ON public.demandes USING btree ("numeroEnregistrement");


--
-- Name: demandes_numeroEnregistrement_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX "demandes_numeroEnregistrement_key" ON public.demandes USING btree ("numeroEnregistrement");


--
-- Name: demandes_statut_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX demandes_statut_idx ON public.demandes USING btree (statut);


--
-- Name: directeur_signatures_userId_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX "directeur_signatures_userId_key" ON public.directeur_signatures USING btree ("userId");


--
-- Name: historique_statuts_createdAt_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "historique_statuts_createdAt_idx" ON public.historique_statuts USING btree ("createdAt");


--
-- Name: historique_statuts_demandeId_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "historique_statuts_demandeId_idx" ON public.historique_statuts USING btree ("demandeId");


--
-- Name: notifications_canal_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX notifications_canal_idx ON public.notifications USING btree (canal);


--
-- Name: notifications_demandeId_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "notifications_demandeId_idx" ON public.notifications USING btree ("demandeId");


--
-- Name: notifications_statut_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX notifications_statut_idx ON public.notifications USING btree (statut);


--
-- Name: password_reset_tokens_expiresAt_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "password_reset_tokens_expiresAt_idx" ON public.password_reset_tokens USING btree ("expiresAt");


--
-- Name: password_reset_tokens_token_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX password_reset_tokens_token_idx ON public.password_reset_tokens USING btree (token);


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: password_reset_tokens_userId_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX "password_reset_tokens_userId_key" ON public.password_reset_tokens USING btree ("userId");


--
-- Name: pieces_dossier_demandeId_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX "pieces_dossier_demandeId_idx" ON public.pieces_dossier USING btree ("demandeId");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: desp
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: desp
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: appeles_arretes appeles_arretes_arreteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.appeles_arretes
    ADD CONSTRAINT "appeles_arretes_arreteId_fkey" FOREIGN KEY ("arreteId") REFERENCES public.arretes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appeles appeles_demandeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.appeles
    ADD CONSTRAINT "appeles_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES public.demandes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attestations attestations_demandeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT "attestations_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES public.demandes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attestations attestations_signataireId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT "attestations_signataireId_fkey" FOREIGN KEY ("signataireId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_demandeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES public.demandes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: demandes demandes_agentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.demandes
    ADD CONSTRAINT "demandes_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: directeur_signatures directeur_signatures_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.directeur_signatures
    ADD CONSTRAINT "directeur_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: historique_statuts historique_statuts_demandeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.historique_statuts
    ADD CONSTRAINT "historique_statuts_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES public.demandes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: historique_statuts historique_statuts_modifiePar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.historique_statuts
    ADD CONSTRAINT "historique_statuts_modifiePar_fkey" FOREIGN KEY ("modifiePar") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_demandeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES public.demandes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pieces_dossier pieces_dossier_demandeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desp
--

ALTER TABLE ONLY public.pieces_dossier
    ADD CONSTRAINT "pieces_dossier_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES public.demandes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: desp
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--


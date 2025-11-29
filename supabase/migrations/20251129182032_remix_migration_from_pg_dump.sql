CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: case_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.case_status AS ENUM (
    'active',
    'pending',
    'solved',
    'closed'
);


--
-- Name: evidence_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.evidence_type AS ENUM (
    'sketch',
    'generated',
    'age_progression',
    'angle_view',
    'feature_extraction'
);


--
-- Name: threat_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.threat_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: case_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    note text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_number text NOT NULL,
    title text NOT NULL,
    description text,
    officer_name text NOT NULL,
    officer_badge text,
    status public.case_status DEFAULT 'active'::public.case_status NOT NULL,
    location text,
    incident_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: criminals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.criminals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    aliases text[],
    photo_url text NOT NULL,
    threat_level public.threat_level DEFAULT 'medium'::public.threat_level NOT NULL,
    age_range text,
    gender text,
    ethnicity text,
    height text,
    weight text,
    build text,
    distinguishing_marks text,
    criminal_history text,
    conviction_dates text[],
    warrant_status text,
    known_offenses text[],
    special_instructions text,
    known_associates text[],
    last_known_location text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: detections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    criminal_id uuid,
    suspect_id uuid,
    case_id uuid,
    detection_type text NOT NULL,
    video_url text,
    frame_timestamp text,
    confidence_score numeric(5,2),
    snapshot_url text,
    location text,
    notes text,
    alerted boolean DEFAULT false NOT NULL,
    reviewed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    suspect_id uuid,
    type public.evidence_type NOT NULL,
    image_url text NOT NULL,
    metadata jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: suspects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suspects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    name text,
    age_range text,
    gender text,
    ethnicity text,
    height text,
    build text,
    distinguishing_marks text,
    extracted_features jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_wanted boolean DEFAULT false NOT NULL
);


--
-- Name: case_notes case_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_notes
    ADD CONSTRAINT case_notes_pkey PRIMARY KEY (id);


--
-- Name: cases cases_case_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_case_number_key UNIQUE (case_number);


--
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (id);


--
-- Name: criminals criminals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.criminals
    ADD CONSTRAINT criminals_pkey PRIMARY KEY (id);


--
-- Name: detections detections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detections
    ADD CONSTRAINT detections_pkey PRIMARY KEY (id);


--
-- Name: evidence evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence
    ADD CONSTRAINT evidence_pkey PRIMARY KEY (id);


--
-- Name: suspects suspects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspects
    ADD CONSTRAINT suspects_pkey PRIMARY KEY (id);


--
-- Name: cases update_cases_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: criminals update_criminals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_criminals_updated_at BEFORE UPDATE ON public.criminals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: suspects update_suspects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_suspects_updated_at BEFORE UPDATE ON public.suspects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: case_notes case_notes_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_notes
    ADD CONSTRAINT case_notes_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: criminals criminals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.criminals
    ADD CONSTRAINT criminals_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: detections detections_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detections
    ADD CONSTRAINT detections_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: detections detections_criminal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detections
    ADD CONSTRAINT detections_criminal_id_fkey FOREIGN KEY (criminal_id) REFERENCES public.criminals(id) ON DELETE CASCADE;


--
-- Name: detections detections_suspect_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detections
    ADD CONSTRAINT detections_suspect_id_fkey FOREIGN KEY (suspect_id) REFERENCES public.suspects(id) ON DELETE CASCADE;


--
-- Name: evidence evidence_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence
    ADD CONSTRAINT evidence_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: evidence evidence_suspect_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidence
    ADD CONSTRAINT evidence_suspect_id_fkey FOREIGN KEY (suspect_id) REFERENCES public.suspects(id) ON DELETE CASCADE;


--
-- Name: suspects suspects_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspects
    ADD CONSTRAINT suspects_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: criminals Users can create criminals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create criminals" ON public.criminals FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: detections Users can create detections for their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create detections for their cases" ON public.detections FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = detections.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: evidence Users can create evidence for their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create evidence for their cases" ON public.evidence FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = evidence.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: case_notes Users can create notes for their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create notes for their cases" ON public.case_notes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = case_notes.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: suspects Users can create suspects for their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create suspects for their cases" ON public.suspects FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = suspects.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: cases Users can create their own cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own cases" ON public.cases FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: criminals Users can delete criminals they created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete criminals they created" ON public.criminals FOR DELETE USING ((auth.uid() = created_by));


--
-- Name: evidence Users can delete evidence from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete evidence from their cases" ON public.evidence FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = evidence.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: suspects Users can delete suspects from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete suspects from their cases" ON public.suspects FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = suspects.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: cases Users can delete their own cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own cases" ON public.cases FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: criminals Users can update criminals they created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update criminals they created" ON public.criminals FOR UPDATE USING ((auth.uid() = created_by));


--
-- Name: detections Users can update detections from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update detections from their cases" ON public.detections FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = detections.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: evidence Users can update evidence from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update evidence from their cases" ON public.evidence FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = evidence.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: suspects Users can update suspects from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update suspects from their cases" ON public.suspects FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = suspects.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: cases Users can update their own cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own cases" ON public.cases FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: criminals Users can view all active criminals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all active criminals" ON public.criminals FOR SELECT USING ((is_active = true));


--
-- Name: detections Users can view detections from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view detections from their cases" ON public.detections FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = detections.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: evidence Users can view evidence from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view evidence from their cases" ON public.evidence FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = evidence.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: case_notes Users can view notes from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view notes from their cases" ON public.case_notes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = case_notes.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: suspects Users can view suspects from their cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view suspects from their cases" ON public.suspects FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cases
  WHERE ((cases.id = suspects.case_id) AND (cases.user_id = auth.uid())))));


--
-- Name: cases Users can view their own cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cases" ON public.cases FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: case_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: cases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

--
-- Name: criminals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.criminals ENABLE ROW LEVEL SECURITY;

--
-- Name: detections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

--
-- Name: evidence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

--
-- Name: suspects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suspects ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



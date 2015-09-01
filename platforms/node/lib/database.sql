--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: visible
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO visible;

--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: visible
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO visible;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: client; Type: TABLE; Schema: public; Owner: visible; Tablespace: 
--

CREATE TABLE public.client
(
  publicclientid uuid NOT NULL,
  indexofcurrentkey integer,
  currentchallenge uuid,
  socketid text,
  membersince bigint,
  nickname text,
  commentary text,
  location geography(Point,4326),
  myarrayofkeys text,
  handshaketoken uuid,
  authtoken uuid,
  lastprofileupdate bigint,
  telephone text,
  email text,
  visibility text

)
WITH ( OIDS=FALSE );
ALTER TABLE public.client OWNER TO visible;
GRANT ALL ON TABLE public.client TO visible;

-- Index: public."publicClientID"

-- DROP INDEX public."publicClientID";

CREATE UNIQUE INDEX "publicClientID" ON public.client USING btree (publicclientid);

--
-- Name: message; Type: TABLE; Schema: public; Owner: visible; Tablespace: 
--


CREATE TABLE public.message
(
  msgid uuid,
  receiver uuid,
  sender uuid,
  "timestamp" bigint,
  messagebody json
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.message  OWNER TO visible;


--
-- Name: messageack; Type: TABLE; Schema: public; Owner: visible; Tablespace: 
--

-- Table: public.messageack

-- DROP TABLE public.messageack;

CREATE TABLE public.messageack
(
  msgid uuid,
  receiver uuid,
  sender uuid,
  type text
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.messageack  OWNER TO visible;


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: client; Type: ACL; Schema: public; Owner: visible
--

REVOKE ALL ON TABLE client FROM PUBLIC;
REVOKE ALL ON TABLE client FROM visible;
GRANT ALL ON TABLE client TO visible;


--
-- PostgreSQL database dump complete
--


-- Table: public.dbip_lookup

-- DROP TABLE public.dbip_lookup;

CREATE TABLE public.dbip_lookup
(
  ip_start inet,
  ip_end inet,
  country character(2),
  stateprov character varying(80),
  city character varying(80),
  latitude double precision,
  longitude double precision,
  timezone_offset double precision,
  timezone_name character varying(64)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.dbip_lookup
  OWNER TO visible;

-- Index: public.ip_start

-- DROP INDEX public.ip_start;

CREATE INDEX ip_start
  ON public.dbip_lookup
  USING btree
  (ip_start);


-- Table: public.profilesphoto

-- DROP TABLE public.profilesphoto;

CREATE TABLE public.profilesphoto
(
  publicclientid uuid NOT NULL,
  photo text,
  CONSTRAINT profilesphoto_pkey PRIMARY KEY (publicclientid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.profilesphoto
  OWNER TO visible;



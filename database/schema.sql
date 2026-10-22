--
-- PostgreSQL database dump
--

\restrict fRJethAIkFRSb4ZNYPfDho95ICF5ybVObpyWlEoXaoEizgsOWqLGYDyomsN31DI

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-22 10:04:58

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16708)
-- Name: cursos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cursos (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    categoria character varying(80) DEFAULT 'General'::character varying NOT NULL,
    docente character varying(150) NOT NULL,
    modalidad character varying(20) DEFAULT 'VIRTUAL'::character varying NOT NULL,
    horario text NOT NULL,
    duracion_horas integer NOT NULL,
    capacidad integer NOT NULL,
    publicado boolean DEFAULT false NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cursos_capacidad_valida CHECK (((capacidad >= 1) AND (capacidad <= 500))),
    CONSTRAINT cursos_duracion_valida CHECK ((duracion_horas > 0)),
    CONSTRAINT cursos_modalidad_valida CHECK (((modalidad)::text = ANY ((ARRAY['VIRTUAL'::character varying, 'PRESENCIAL'::character varying, 'HIBRIDA'::character varying])::text[])))
);


ALTER TABLE public.cursos OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16707)
-- Name: cursos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.cursos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cursos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 16956)
-- Name: horarios_curso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.horarios_curso (
    id integer NOT NULL,
    curso_id integer NOT NULL,
    dia_semana smallint NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    CONSTRAINT horarios_curso_dia_semana_check CHECK (((dia_semana >= 1) AND (dia_semana <= 7))),
    CONSTRAINT horarios_horas_validas CHECK ((hora_fin > hora_inicio))
);


ALTER TABLE public.horarios_curso OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16955)
-- Name: horarios_curso_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.horarios_curso ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.horarios_curso_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 16733)
-- Name: matriculas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matriculas (
    id integer NOT NULL,
    estudiante_id integer NOT NULL,
    curso_id integer NOT NULL,
    registrado_por integer NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVA'::character varying NOT NULL,
    fecha_matricula timestamp with time zone DEFAULT now() NOT NULL,
    cancelado_por integer,
    fecha_cancelacion timestamp with time zone,
    motivo_cancelacion text,
    CONSTRAINT matriculas_estado_valido CHECK (((estado)::text = ANY ((ARRAY['ACTIVA'::character varying, 'CANCELADA'::character varying])::text[])))
);


ALTER TABLE public.matriculas OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16732)
-- Name: matriculas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.matriculas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.matriculas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 16770)
-- Name: sesiones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesiones (
    token_hash character varying(64) NOT NULL,
    usuario_id integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    expira_en timestamp with time zone NOT NULL
);


ALTER TABLE public.sesiones OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16683)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    dni character varying(8) NOT NULL,
    correo character varying(150) NOT NULL,
    password_hash text NOT NULL,
    rol character varying(20) DEFAULT 'ESTUDIANTE'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usuarios_dni_valido CHECK (((dni)::text ~ '^[0-9]{8}$'::text)),
    CONSTRAINT usuarios_rol_valido CHECK (((rol)::text = ANY ((ARRAY['ADMINISTRADOR'::character varying, 'ESTUDIANTE'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16682)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5067 (class 0 OID 16708)
-- Dependencies: 222
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cursos (id, nombre, descripcion, categoria, docente, modalidad, horario, duracion_horas, capacidad, publicado, creado_en) FROM stdin;
4	Big Data y Análisis de Datos con Python	Introduce los conceptos clave del procesamiento de grandes volúmenes de datos. Aprende a manipular conjuntos de datos, realizar análisis estadísticos y crear visualizaciones impactantes con Python y sus librerías.	Datos	Miguel Martes Mendoza	PRESENCIAL	Miércoles 08:00-10:00; Domingo 08:00-10:00	45	25	t	2026-10-17 20:07:33.250234-05
3	Diseño y Gestión de Bases de Datos SQL	Domina el modelado de datos relacionales y el lenguaje SQL. Aprende a crear, consultar y optimizar bases de datos eficientes y seguras para respaldar aplicaciones web y empresariales.	Programación	Miguel Martes Mendoza	PRESENCIAL	Sábado 12:00-14:00	30	20	t	2026-10-17 20:06:27.896331-05
1	Desarrollo Web Full Stack	Es la capacidad de crear una aplicación o sitio web de principio a fin, abarcando tanto la parte visual e interactiva que ve el usuario como la lógica interna y la base de datos en el servidor.	Programación	Mario Lope Ore	PRESENCIAL	Lunes 14:00-18:00	40	25	t	2026-10-16 01:17:55.707885-05
5	Diseño UI/UX para Productos Digitales	Aprende a investigar, prototipar y diseñar interfaces intuitivas y atractivas. Comprende los principios de usabilidad, arquitectura de información y diseño visual enfocado en la experiencia del usuario.	Diseño	Jhonatan Castillo Vera	PRESENCIAL	Lunes 08:00-12:00; Sábado 08:00-12:00	40	24	t	2026-10-17 20:09:28.059422-05
2	Desarrollo de Aplicaciones Móviles	Aprende a diseñar y construir aplicaciones móviles desde cero. Domina la interfaz de usuario, la navegación, la integración con APIs y bases de datos locales para publicar tus aplicaciones en las tiendas oficiales.	Programación	Karen Salas Laurente	PRESENCIAL	Lunes 10:00-12:00	40	25	f	2026-10-17 20:04:56.252593-05
\.


--
-- TOC entry 5072 (class 0 OID 16956)
-- Dependencies: 227
-- Data for Name: horarios_curso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.horarios_curso (id, curso_id, dia_semana, hora_inicio, hora_fin) FROM stdin;
1	5	1	08:00:00	12:00:00
2	5	6	08:00:00	12:00:00
8	4	3	08:00:00	10:00:00
9	4	7	08:00:00	10:00:00
10	3	6	12:00:00	14:00:00
12	1	1	14:00:00	18:00:00
13	2	1	10:00:00	12:00:00
\.


--
-- TOC entry 5069 (class 0 OID 16733)
-- Dependencies: 224
-- Data for Name: matriculas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matriculas (id, estudiante_id, curso_id, registrado_por, estado, fecha_matricula, cancelado_por, fecha_cancelacion, motivo_cancelacion) FROM stdin;
1	1	1	1	ACTIVA	2026-10-17 19:52:49.1948-05	\N	\N	\N
2	1	2	2	CANCELADA	2026-10-17 20:24:26.102838-05	1	2026-10-17 20:34:39.880087-05	Aun no quiero llevar ese curso.
3	3	1	2	ACTIVA	2026-10-17 21:32:13.231884-05	\N	\N	\N
4	1	5	1	ACTIVA	2026-10-18 10:04:20.625594-05	\N	\N	\N
5	1	4	1	ACTIVA	2026-10-18 10:04:37.424049-05	\N	\N	\N
6	4	5	4	ACTIVA	2026-10-22 08:12:43.965996-05	\N	\N	\N
7	4	4	4	ACTIVA	2026-10-22 08:12:46.537525-05	\N	\N	\N
8	4	1	4	ACTIVA	2026-10-22 08:12:48.597803-05	\N	\N	\N
9	5	5	5	ACTIVA	2026-10-22 09:12:36.439285-05	\N	\N	\N
10	5	4	5	ACTIVA	2026-10-22 09:12:39.577944-05	\N	\N	\N
11	5	1	5	ACTIVA	2026-10-22 09:12:42.682341-05	\N	\N	\N
12	5	3	5	ACTIVA	2026-10-22 09:43:06.473387-05	\N	\N	\N
\.


--
-- TOC entry 5070 (class 0 OID 16770)
-- Dependencies: 225
-- Data for Name: sesiones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sesiones (token_hash, usuario_id, creado_en, expira_en) FROM stdin;
e4dbdb864f7d795e3ea23b431712ef31ebed8fac2d6bb51c0b1ea54c27d389a6	2	2026-10-16 00:44:42.976792-05	2026-10-16 08:44:42.976792-05
8bddf999d9b02442350fbb918e3432fd4c0dad07f9810bb83e23726ec4bed57e	2	2026-10-17 21:28:36.846002-05	2026-10-18 05:28:36.846002-05
19a8fdd1aff30112849d14e79f258dcadc072aa99b933938103dfb9ca05151cf	1	2026-10-18 10:01:07.783841-05	2026-10-18 18:01:07.783841-05
b1739e77dfdc4affcd8db03c79ae2ff2ac5ac442f8ffa45fb776f117f8ef72ba	1	2026-10-18 14:40:21.873949-05	2026-10-18 22:40:21.873949-05
29cdc54b300a3b0d0a94bf30b2c13cd82b8363cb7ed783b874c62efc1376cb6a	1	2026-10-20 09:20:14.930845-05	2026-10-20 17:20:14.930845-05
09f32a02a19d36476f3758eedd153e332b17c492d5a2b96718d66790274a14f5	5	2026-10-22 08:31:58.944252-05	2026-10-22 16:31:58.944252-05
558ea2716ec314d8e310eaac7a315a8f17bd50a10313864a22f56894dd50de7f	2	2026-10-22 08:39:58.136342-05	2026-10-22 16:39:58.136342-05
\.


--
-- TOC entry 5065 (class 0 OID 16683)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombres, apellidos, dni, correo, password_hash, rol, activo, creado_en) FROM stdin;
2	Jose	Martinez Sanchez	10203040	jose000@gmail.com	$2b$12$lLOvqn2vsGhMfRQdPqS4c..5c2bYhfHvAs.wTSVGO20lPPWAhckyG	ADMINISTRADOR	t	2026-10-16 00:41:36.788672-05
1	Yasmin	Mendoza	70480914	camerontwd@gmail.com	$2b$12$H48NeQcZvsovGJQJg/K3IetrKf4JiBTJoGidFzi1tjP33gt64qWde	ESTUDIANTE	t	2026-10-15 23:44:38.664797-05
3	Maria Jose	Gamboa Gutierrez	20304050	maria@hotmail.com	$2b$12$cvi7GogFVvuzUpjTOb4bzO1jlD0WfrL1l/5K6AoZZ2ymEXa6BnpOW	ADMINISTRADOR	t	2026-10-17 21:17:02.795882-05
4	Jorge	Llantoy Taipe	85947851	jorge@hotmail.com	$2b$12$3uIw7J4HRDoWGI.7IOhjcuE0RR5GAtZ5c67p/qsF0USTyXDuE3Zi.	ESTUDIANTE	t	2026-10-22 08:11:55.486955-05
5	Jack	Ramos Torre	45124512	jack1234@hotmail.com	$2b$12$Wqf4stKWTc9w.YwLNGcsfuSg5DpKPDEUicM/r/Eb45wJqlQStKOue	ESTUDIANTE	t	2026-10-22 08:20:37.221106-05
\.


--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 221
-- Name: cursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cursos_id_seq', 5, true);


--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 226
-- Name: horarios_curso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.horarios_curso_id_seq', 13, true);


--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 223
-- Name: matriculas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.matriculas_id_seq', 12, true);


--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 5, true);


--
-- TOC entry 4899 (class 2606 OID 16731)
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 2606 OID 16967)
-- Name: horarios_curso horarios_curso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios_curso
    ADD CONSTRAINT horarios_curso_pkey PRIMARY KEY (id);


--
-- TOC entry 4910 (class 2606 OID 16969)
-- Name: horarios_curso horarios_sin_duplicados; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios_curso
    ADD CONSTRAINT horarios_sin_duplicados UNIQUE (curso_id, dia_semana, hora_inicio, hora_fin);


--
-- TOC entry 4902 (class 2606 OID 16748)
-- Name: matriculas matriculas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 16779)
-- Name: sesiones sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_pkey PRIMARY KEY (token_hash);


--
-- TOC entry 4895 (class 2606 OID 16705)
-- Name: usuarios usuarios_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_dni_key UNIQUE (dni);


--
-- TOC entry 4897 (class 2606 OID 16703)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4906 (class 1259 OID 16975)
-- Name: horarios_curso_busqueda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX horarios_curso_busqueda ON public.horarios_curso USING btree (curso_id, dia_semana);


--
-- TOC entry 4900 (class 1259 OID 16769)
-- Name: matricula_activa_unica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX matricula_activa_unica ON public.matriculas USING btree (estudiante_id, curso_id) WHERE ((estado)::text = 'ACTIVA'::text);


--
-- TOC entry 4905 (class 1259 OID 16785)
-- Name: sesiones_usuario_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sesiones_usuario_idx ON public.sesiones USING btree (usuario_id);


--
-- TOC entry 4893 (class 1259 OID 16706)
-- Name: usuarios_correo_unico; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_correo_unico ON public.usuarios USING btree (lower((correo)::text));


--
-- TOC entry 4916 (class 2606 OID 16970)
-- Name: horarios_curso horarios_curso_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios_curso
    ADD CONSTRAINT horarios_curso_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- TOC entry 4911 (class 2606 OID 16764)
-- Name: matriculas matriculas_cancelado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_cancelado_por_fkey FOREIGN KEY (cancelado_por) REFERENCES public.usuarios(id);


--
-- TOC entry 4912 (class 2606 OID 16754)
-- Name: matriculas matriculas_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- TOC entry 4913 (class 2606 OID 16749)
-- Name: matriculas matriculas_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4914 (class 2606 OID 16759)
-- Name: matriculas matriculas_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id);


--
-- TOC entry 4915 (class 2606 OID 16780)
-- Name: sesiones sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


-- Completed on 2026-10-22 10:04:59

--
-- PostgreSQL database dump complete
--

\unrestrict fRJethAIkFRSb4ZNYPfDho95ICF5ybVObpyWlEoXaoEizgsOWqLGYDyomsN31DI


--
-- Name: danbooru_post_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.danbooru_post_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.danbooru_post_details_id_seq OWNER TO postgres;

--
-- Name: danbooru_post_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.danbooru_post_details (
    remote_id integer NOT NULL,
    rating text NOT NULL,
    parent_id integer DEFAULT null,
    source text DEFAULT null,
    upload_url text DEFAULT null,
    file_path text,
    tags text NOT NULL,
    md5 text NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.danbooru_post_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.danbooru_post_details OWNER TO postgres;

--
-- Name: danbooru_post_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.danbooru_post_details_id_seq OWNED BY public.danbooru_post_details.id;



--
-- Name: yandere_post_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.yandere_post_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.yandere_post_details_id_seq OWNER TO postgres;

--
-- Name: yandere_post_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.yandere_post_details (
    remote_id integer NOT NULL,
    rating text NOT NULL,
    parent_id integer DEFAULT null,
    source text DEFAULT null,
    upload_url text DEFAULT null,
    file_path text,
    tags text NOT NULL,
    md5 text NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.yandere_post_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.yandere_post_details OWNER TO postgres;

--
-- Name: yandere_post_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.yandere_post_details_id_seq OWNED BY public.yandere_post_details.id;



--
-- Name: gelbooru_post_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.gelbooru_post_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gelbooru_post_details_id_seq OWNER TO postgres;

--
-- Name: gelbooru_post_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.gelbooru_post_details (
    remote_id integer NOT NULL,
    rating text NOT NULL,
    parent_id integer DEFAULT null,
    source text DEFAULT null,
    upload_url text DEFAULT null,
    file_path text,
    tags text NOT NULL,
    md5 text NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.gelbooru_post_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.gelbooru_post_details OWNER TO postgres;

--
-- Name: gelbooru_post_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.gelbooru_post_details_id_seq OWNED BY public.gelbooru_post_details.id;



--
-- Name: zerochan_post_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.zerochan_post_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.zerochan_post_details_id_seq OWNER TO postgres;

--
-- Name: zerochan_post_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.zerochan_post_details (
    remote_id integer NOT NULL,
    rating text NOT NULL DEFAULT 's',
    parent_id integer DEFAULT null,
    source text DEFAULT null,
    upload_url text DEFAULT null,
    file_path text,
    tags text NOT NULL,
    md5 text NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.zerochan_post_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.zerochan_post_details OWNER TO postgres;

--
-- Name: zerochan_post_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.zerochan_post_details_id_seq OWNED BY public.zerochan_post_details.id;



--
-- Name: shuushuu_post_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.shuushuu_post_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shuushuu_post_details_id_seq OWNER TO postgres;

--
-- Name: shuushuu_post_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.shuushuu_post_details (
    remote_id integer NOT NULL,
    rating text NOT NULL DEFAULT 's',
    parent_id integer DEFAULT null,
    source text DEFAULT null,
    upload_url text DEFAULT null,
    file_path text,
    tags text NOT NULL,
    md5 text NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.shuushuu_post_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.shuushuu_post_details OWNER TO postgres;

--
-- Name: shuushuu_post_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.shuushuu_post_details_id_seq OWNED BY public.shuushuu_post_details.id;



--
-- Name: rule34_post_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.rule34_post_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rule34_post_details_id_seq OWNER TO postgres;

--
-- Name: rule34_post_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.rule34_post_details (
    remote_id integer NOT NULL,
    rating text NOT NULL DEFAULT 'e',
    parent_id integer DEFAULT null,
    source text DEFAULT null,
    upload_url text DEFAULT null,
    file_path text,
    tags text NOT NULL,
    md5 text NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.rule34_post_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.rule34_post_details OWNER TO postgres;

--
-- Name: rule34_post_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.rule34_post_details_id_seq OWNED BY public.rule34_post_details.id;



--
-- Name: script_statistics; Type: TABLE; Schema: public; Owner: scripting 
--

CREATE TABLE public.script_statistics (
    service text NOT NULL,
    uploaded_count integer DEFAULT 0 NOT NULL,
    updated_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    last_upload_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.script_statistics OWNER TO postgres;
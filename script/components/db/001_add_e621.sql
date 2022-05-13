--
-- Name: e621_post_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.e621_post_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.e621_post_details_id_seq OWNER TO postgres;

--
-- Name: e621_post_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.e621_post_details (
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
    id integer DEFAULT nextval('public.e621_post_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.e621_post_details OWNER TO postgres;

--
-- Name: e621_post_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.e621_post_details_id_seq OWNED BY public.e621_post_details.id;
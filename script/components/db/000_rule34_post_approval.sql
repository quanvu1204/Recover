--
-- Name: rule34_post_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.rule34_post_approvals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rule34_post_approvals_id_seq OWNER TO postgres;

--
-- Name: rule34_post_approvals; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.rule34_post_approvals (
    remote_id integer NOT NULL,
    rating text NOT NULL,
    parent_id integer DEFAULT null,
    source text DEFAULT null,
    upload_url text DEFAULT null,
    file_path text,
    tags text NOT NULL,
    md5 text NOT NULL,
    score integer NOT NULL,
    reason text NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.rule34_post_approvals_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.rule34_post_approvals OWNER TO postgres;

--
-- Name: rule34_post_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.rule34_post_approvals_id_seq OWNED BY public.rule34_post_approvals.id;
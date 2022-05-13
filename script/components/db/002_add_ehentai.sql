--
-- Name: ehentai_book_details_id_seq; Type: SEQUENCE; Schema: public; Owner: scripting
--

CREATE SEQUENCE public.ehentai_book_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ehentai_book_details_id_seq OWNER TO postgres;

--
-- Name: ehentai_book_details; Type: TABLE; Schema: public; Owner: scripting
--

CREATE TABLE public.ehentai_book_details (
    remote_id integer NOT NULL,
    rating text NOT NULL,
    file_path text,
    book_tags text NOT NULL,
    title_en text,
    title_jp text,
    page_count integer NOT NULL,
    stored_at timestamp without time zone DEFAULT now() NOT NULL,
    is_retried boolean DEFAULT false NOT NULL,
    id integer DEFAULT nextval('public.ehentai_book_details_id_seq'::regclass) NOT NULL
);

ALTER TABLE public.ehentai_book_details OWNER TO postgres;

--
-- Name: ehentai_book_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scripting
--

ALTER SEQUENCE public.ehentai_book_details_id_seq OWNED BY public.ehentai_book_details.id;
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analysis_videos (
  id integer NOT NULL DEFAULT nextval('video_metrics_id_seq'::regclass),
  youtube_video_id character varying NOT NULL,
  metric_date date NOT NULL,
  view_count bigint,
  like_count bigint,
  dislike_count bigint,
  comment_count bigint,
  average_watch_time numeric,
  audience_retention_rate numeric,
  share_count bigint,
  click_through_rate numeric,
  engagement_rate numeric,
  CONSTRAINT analysis_videos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.benchmark_channels (
  id integer NOT NULL DEFAULT nextval('channel_stats_history_id_seq'::regclass),
  channel_id text NOT NULL UNIQUE,
  metric_date date,
  subscriber_count bigint,
  total_views bigint,
  video_upload_count integer,
  channel_name character varying NOT NULL DEFAULT ''::character varying,
  creation_date timestamp with time zone,
  channel_url text DEFAULT ('https://www.youtube.com/channel/'::text || channel_id),
  update_routine boolean NOT NULL DEFAULT false,
  channel_keywords jsonb DEFAULT '[]'::jsonb,
  description text,
  categorization jsonb,
  narrative_playbook jsonb,
  thumbnail_url text,
  banner_url text,
  custom_url text,
  country text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT benchmark_channels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.benchmark_channels_baseline_stats (
  channel_id text NOT NULL,
  total_views_14d integer,
  videos_count_14d integer,
  avg_views_per_video_14d numeric,
  last_updated timestamp without time zone DEFAULT now(),
  taxa_crescimento numeric,
  media_diaria_views_14d integer,
  avg_views_per_video_historical numeric,
  median_views_per_video_historical real,
  CONSTRAINT benchmark_channels_baseline_stats_pkey PRIMARY KEY (channel_id),
  CONSTRAINT fk_baseline_stats_channel FOREIGN KEY (channel_id) REFERENCES public.benchmark_channels(channel_id)
);
CREATE TABLE public.benchmark_videos (
  id integer NOT NULL DEFAULT nextval('videos_id_seq'::regclass),
  youtube_video_id character varying NOT NULL UNIQUE,
  channel_id text NOT NULL,
  title character varying NOT NULL,
  description text,
  thumbnail_url character varying,
  upload_date timestamp without time zone,
  youtube_url text DEFAULT ('https://www.youtube.com/watch?v='::text || (youtube_video_id)::text),
  views bigint NOT NULL DEFAULT 0,
  channel_name character varying NOT NULL DEFAULT ''::character varying,
  metrics_last_updated date,
  video_transcript text,
  video_length interval,
  categorization jsonb,
  performance_vs_avg_historical numeric,
  video_age_days integer,
  views_per_day numeric,
  performance_vs_median_historical numeric,
  momentum_vs_14d numeric,
  status text DEFAULT 'available'::text,
  created_at timestamp with time zone DEFAULT now(),
  enrichment_data jsonb,
  performance_vs_recent_14d numeric,
  keywords ARRAY,
  related_video_ids ARRAY,
  CONSTRAINT benchmark_videos_pkey PRIMARY KEY (id),
  CONSTRAINT fk_benchmark_videos_status FOREIGN KEY (status) REFERENCES public.structure_allowed_status(status_key)
);
CREATE TABLE public.ddl_sync_queue (
  id integer NOT NULL DEFAULT nextval('ddl_sync_queue_id_seq'::regclass),
  object_type text NOT NULL,
  object_name text NOT NULL,
  event_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  synced_at timestamp with time zone,
  github_commit_sha text,
  error_message text,
  CONSTRAINT ddl_sync_queue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.distribution_posting_queue (
  id integer NOT NULL DEFAULT nextval('distribution_posting_queue_id_seq'::regclass),
  video_id integer NOT NULL,
  slot_id integer,
  scheduled_datetime timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  error_message text,
  title text,
  platform USER-DEFINED,
  language USER-DEFINED,
  placeholder text,
  final_link text,
  content_id_on_platform text,
  status text,
  CONSTRAINT distribution_posting_queue_pkey PRIMARY KEY (id),
  CONSTRAINT fk_distribution_posting_queue_status FOREIGN KEY (status) REFERENCES public.structure_allowed_status(status_key),
  CONSTRAINT distribution_posting_queue_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.structure_posting_slots(id),
  CONSTRAINT distribution_posting_queue_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.production_videos(id),
  CONSTRAINT distribution_posting_queue_placeholder_fkey FOREIGN KEY (placeholder) REFERENCES public.structure_accounts(placeholder)
);
CREATE TABLE public.narrative_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  benchmark_video_id integer NOT NULL UNIQUE,
  structure_id uuid,
  emotional_core_id uuid,
  conflict_type_id uuid,
  story_beats jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  identified_structure_model text,
  central_theme text,
  channel_id text,
  story_setting jsonb,
  analysis_metadata jsonb,
  CONSTRAINT narrative_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT fk_benchmark_video FOREIGN KEY (benchmark_video_id) REFERENCES public.benchmark_videos(id),
  CONSTRAINT fk_structure FOREIGN KEY (structure_id) REFERENCES public.narrative_structures(id),
  CONSTRAINT fk_emotional_core FOREIGN KEY (emotional_core_id) REFERENCES public.narrative_emotional_cores(id),
  CONSTRAINT fk_conflict_type FOREIGN KEY (conflict_type_id) REFERENCES public.narrative_conflict_types(id)
);
CREATE TABLE public.narrative_archetypes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT narrative_archetypes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.narrative_characters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  role text NOT NULL,
  name text,
  archetype_id uuid,
  goal text,
  flaw text,
  layers jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  inferred_physical_profile jsonb,
  gender text,
  occupation text,
  relationships jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT narrative_characters_pkey PRIMARY KEY (id),
  CONSTRAINT narrative_characters_archetype_id_fkey FOREIGN KEY (archetype_id) REFERENCES public.narrative_archetypes(id),
  CONSTRAINT fk_analysis FOREIGN KEY (analysis_id) REFERENCES public.narrative_analyses(id)
);
CREATE TABLE public.narrative_conflict_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT narrative_conflict_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.narrative_emotional_cores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT narrative_emotional_cores_pkey PRIMARY KEY (id)
);
CREATE TABLE public.narrative_structures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT narrative_structures_pkey PRIMARY KEY (id)
);
CREATE TABLE public.production_audio_segments (
  job_id integer NOT NULL DEFAULT nextval('production_audio_segments_job_id_seq'::regclass),
  video_id integer NOT NULL,
  segment_number integer NOT NULL,
  segment_text text NOT NULL,
  audio_url text,
  api_key_used text,
  created_at timestamp without time zone DEFAULT now(),
  status USER-DEFINED DEFAULT 'pending'::audio_segment_status,
  segmentation_workflow_used text,
  concatenation_workflow_used text,
  concatenated_audio_id integer,
  duration_seconds numeric,
  CONSTRAINT production_audio_segments_pkey PRIMARY KEY (job_id),
  CONSTRAINT production_audio_segments_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.production_videos(id)
);
CREATE TABLE public.production_concatenated_audios (
  id integer NOT NULL DEFAULT nextval('production_concatenated_audios_id_seq'::regclass),
  video_id integer NOT NULL,
  concatenated_audio_id integer NOT NULL,
  filename text NOT NULL,
  concatenated_audio_text text,
  audio_url text,
  first_audio_segment integer NOT NULL,
  last_audio_segment integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status USER-DEFINED DEFAULT 'pending'::enum_concatenated_audio_status,
  duration_seconds numeric,
  duration_formatted character varying,
  image_creation_prompt_workflow text,
  start_time_seconds numeric,
  end_time_seconds numeric,
  start_time_formatted character varying,
  end_time_formatted character varying,
  CONSTRAINT production_concatenated_audios_pkey PRIMARY KEY (id),
  CONSTRAINT production_concatenated_audios_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.production_videos(id)
);
CREATE TABLE public.production_covering_images (
  id integer NOT NULL DEFAULT nextval('production_covering_images_id_seq'::regclass),
  video_id integer NOT NULL,
  concatenated_audio_id integer,
  filename text,
  file_url text,
  generation_prompt text NOT NULL,
  negative_prompt text,
  ai_model text NOT NULL DEFAULT 'black-forest-labs/FLUX.1-schnell'::text,
  seed bigint,
  steps integer DEFAULT 4,
  guidance_scale double precision DEFAULT 7.5,
  width integer DEFAULT 1280,
  height integer DEFAULT 720,
  status USER-DEFINED NOT NULL DEFAULT 'generate'::covering_image_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  image_id integer CHECK (image_id >= 1 AND image_id <= 99),
  CONSTRAINT production_covering_images_pkey PRIMARY KEY (id),
  CONSTRAINT production_covering_images_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.production_videos(id),
  CONSTRAINT production_covering_images_concatenated_audio_id_fkey FOREIGN KEY (concatenated_audio_id) REFERENCES public.production_concatenated_audios(id)
);
CREATE TABLE public.production_video_editing_assets (
  id integer NOT NULL DEFAULT nextval('production_video_editing_assets_id_seq'::regclass),
  video_id integer NOT NULL,
  segment_id integer CHECK (segment_id >= 0 AND segment_id <= 99),
  asset_type text NOT NULL,
  asset_key text NOT NULL UNIQUE,
  start_time numeric DEFAULT 0,
  duration numeric,
  filename text,
  file_url text,
  width integer,
  height integer,
  layer integer DEFAULT 0,
  properties jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  generation_prompt text,
  text text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['available'::text, 'used'::text, 'deleted'::text, 'generate'::text, 'downloaded'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  asset_description text,
  end_time numeric,
  CONSTRAINT production_video_editing_assets_pkey PRIMARY KEY (id),
  CONSTRAINT fk_video FOREIGN KEY (video_id) REFERENCES public.production_videos(id)
);
CREATE TABLE public.production_video_segments (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  video_id integer NOT NULL,
  segment_id integer NOT NULL CHECK (segment_id >= 1 AND segment_id <= 99),
  filename text NOT NULL,
  video_url text,
  status USER-DEFINED DEFAULT 'pending'::video_segment_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  covering_images jsonb DEFAULT '{"images": []}'::jsonb,
  concatenated_audio_id integer,
  video_segment_workflow_used text,
  covering_assets jsonb,
  metadata_video jsonb,
  CONSTRAINT production_video_segments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.production_videos (
  id integer NOT NULL DEFAULT nextval('videos_production_id_seq'::regclass),
  unique_profile_id text,
  title text,
  description text,
  thumbnail_url character varying,
  tags text,
  planned_upload_date timestamp with time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  language USER-DEFINED DEFAULT 'pt-BR'::language_enum,
  benchmark_title text,
  script text,
  parent_folder text,
  title_url text,
  text_folder_url text,
  audio_folder_url text,
  editing_profile USER-DEFINED DEFAULT 'standard'::editing_profile_enum,
  video_segments_folder text,
  thumbnail_folder_url text,
  benchmark_id integer,
  content_format USER-DEFINED,
  covering_images_count integer DEFAULT 10,
  covering_images_folder text,
  platform USER-DEFINED DEFAULT 'youtube'::account_platform_enum,
  offer_links text,
  date_time timestamp with time zone,
  final_link text,
  privacy USER-DEFINED DEFAULT 'private'::privacy_enum,
  content_id_on_platform text,
  placeholder text,
  is_processing boolean DEFAULT false,
  extracted_hooks text,
  thumb_text text,
  thumbnail_description text,
  teaser_script text,
  ssml_script text,
  benchmark_video_transcript text,
  teaser_folder_url character varying,
  adapted_story_beats_payload jsonb,
  categorization jsonb,
  story_cast_payload jsonb,
  rich_outline_payload jsonb,
  status text DEFAULT 'create_title'::text,
  distributed_by text,
  distributed_at timestamp with time zone,
  distribution_mode text DEFAULT 'manual'::text,
  CONSTRAINT production_videos_pkey PRIMARY KEY (id),
  CONSTRAINT fk_production_videos_status FOREIGN KEY (status) REFERENCES public.structure_allowed_status(status_key),
  CONSTRAINT production_videos_benchmark_id_fkey FOREIGN KEY (benchmark_id) REFERENCES public.benchmark_videos(id),
  CONSTRAINT production_videos_placeholder_fkey FOREIGN KEY (placeholder) REFERENCES public.structure_accounts(placeholder)
);
CREATE TABLE public.structure_accounts (
  id integer NOT NULL DEFAULT nextval('structure_accounts_id_seq'::regclass),
  platform USER-DEFINED,
  name text,
  placeholder text UNIQUE,
  unique_profile_id text,
  language USER-DEFINED DEFAULT 'pt-BR'::language_enum,
  status USER-DEFINED DEFAULT 'active'::account_status_enum,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  posting_frequency integer DEFAULT 1,
  timezone text,
  brand_id uuid,
  niche character varying,
  subniche character varying,
  microniche character varying,
  category character varying,
  format character varying,
  CONSTRAINT structure_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT fk_structure_accounts_brand_id FOREIGN KEY (brand_id) REFERENCES public.structure_brand_bible(id)
);
CREATE TABLE public.structure_allowed_status (
  status_key text NOT NULL,
  status_label text NOT NULL,
  description text,
  workflow_phase text NOT NULL,
  sort_order integer NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT structure_allowed_status_pkey PRIMARY KEY (status_key)
);
CREATE TABLE public.structure_api_keys_pool (
  id integer NOT NULL DEFAULT nextval('structure_api_key_pools_id_seq'::regclass),
  service_provider text NOT NULL,
  api_key text NOT NULL UNIQUE,
  status USER-DEFINED NOT NULL DEFAULT 'available'::api_key_status_enum,
  account text,
  CONSTRAINT structure_api_keys_pool_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_api_queue (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  error_message text,
  processed_at timestamp with time zone,
  video_id bigint,
  workflow_id text,
  api_provider text,
  workflow_name text,
  asset text,
  api_rate_limit bigint,
  CONSTRAINT structure_api_queue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_audio_assets (
  soundtrack_id integer NOT NULL DEFAULT nextval('structure_soundtracks_soundtrack_id_seq'::regclass),
  soundtrack_name character varying NOT NULL,
  file_url character varying NOT NULL,
  duration numeric NOT NULL,
  genre character varying,
  mood character varying,
  bpm integer,
  created_at timestamp with time zone DEFAULT now(),
  asset_type text,
  filename character varying,
  CONSTRAINT structure_audio_assets_pkey PRIMARY KEY (soundtrack_id)
);
CREATE TABLE public.structure_brand_bible (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  brand_name text NOT NULL UNIQUE,
  placeholder text UNIQUE,
  brand_context jsonb,
  audience_description text,
  host_profile jsonb,
  writing_style_guide jsonb,
  voice_profile jsonb,
  default_ssml_lexicon_id uuid,
  visual_profile jsonb,
  default_editing_style_id uuid,
  finalization_profile jsonb,
  agent_prompt_map jsonb,
  typography_profile jsonb,
  world_context_map jsonb,
  channel_cast_map jsonb,
  narrative_playbook jsonb,
  strategy_report text,
  production_workflow_id uuid,
  CONSTRAINT structure_brand_bible_pkey PRIMARY KEY (id),
  CONSTRAINT fk_brand_bible_production_workflow FOREIGN KEY (production_workflow_id) REFERENCES public.structure_production_workflow(id)
);
CREATE TABLE public.structure_categorization_categories (
  id integer NOT NULL DEFAULT nextval('structure_categorization_content_types_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT structure_categorization_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_categorization_formats (
  id integer NOT NULL DEFAULT nextval('structure_categorization_production_styles_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT structure_categorization_formats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_categorization_microniches (
  id integer NOT NULL DEFAULT nextval('structure_categorization_dynamic_microniches_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT structure_categorization_microniches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_categorization_niches (
  id integer NOT NULL DEFAULT nextval('structure_categorization_niches_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  selected boolean NOT NULL DEFAULT false,
  CONSTRAINT structure_categorization_niches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_categorization_subniches (
  id integer NOT NULL DEFAULT nextval('structure_categorization_subniches_id_seq'::regclass),
  niche_id integer NOT NULL,
  name character varying NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT structure_categorization_subniches_pkey PRIMARY KEY (id),
  CONSTRAINT fk_niche FOREIGN KEY (niche_id) REFERENCES public.structure_categorization_niches(id)
);
CREATE TABLE public.structure_credentials (
  id integer NOT NULL DEFAULT nextval('structure_credentials_id_seq'::regclass),
  platform text NOT NULL,
  credentials jsonb NOT NULL,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  placeholder text,
  CONSTRAINT structure_credentials_pkey PRIMARY KEY (id),
  CONSTRAINT structure_credentials_placeholder_fkey FOREIGN KEY (placeholder) REFERENCES public.structure_accounts(placeholder)
);
CREATE TABLE public.structure_platform_posting_config (
  id integer NOT NULL DEFAULT nextval('structure_platform_posting_config_id_seq'::regclass),
  platform USER-DEFINED NOT NULL UNIQUE,
  interval_minutes integer NOT NULL DEFAULT 5,
  start_time time without time zone NOT NULL DEFAULT '06:00:00'::time without time zone,
  end_time time without time zone NOT NULL DEFAULT '22:00:00'::time without time zone,
  total_slots integer DEFAULT (((EXTRACT(epoch FROM (end_time - start_time)))::integer / 60) / interval_minutes),
  CONSTRAINT structure_platform_posting_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_posting_slots (
  id integer NOT NULL DEFAULT nextval('structure_posting_slots_id_seq'::regclass),
  slot_number integer NOT NULL,
  platform USER-DEFINED NOT NULL,
  slot_time time without time zone NOT NULL,
  placeholder text,
  CONSTRAINT structure_posting_slots_pkey PRIMARY KEY (id),
  CONSTRAINT structure_posting_slots_placeholder_fkey FOREIGN KEY (placeholder) REFERENCES public.structure_accounts(placeholder)
);
CREATE TABLE public.structure_production_workflow (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  profile text NOT NULL,
  production_workflow jsonb NOT NULL DEFAULT '{"script_workflow": null, "covering_workflow": null}'::jsonb CHECK (production_workflow ? 'script_workflow'::text AND production_workflow ? 'covering_workflow'::text),
  is_active boolean NOT NULL DEFAULT false,
  CONSTRAINT structure_production_workflow_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_prompt_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  description text,
  system_prompt text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_input text,
  output_schema jsonb,
  prompt_type text,
  CONSTRAINT structure_prompt_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_ssml_lexicons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lexicon_name text NOT NULL UNIQUE,
  description text,
  lexicon_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT structure_ssml_lexicons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_video_editing_styles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  style_name text NOT NULL UNIQUE,
  description text,
  style_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT structure_video_editing_styles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_video_inserts (
  insert_id integer NOT NULL DEFAULT nextval('structure_video_inserts_insert_id_seq'::regclass),
  insert_name character varying NOT NULL,
  insert_category character varying CHECK (insert_category::text = ANY (ARRAY['cta'::character varying, 'warning'::character varying, 'promotion'::character varying, 'branding'::character varying]::text[])),
  gdrive_file_id character varying NOT NULL,
  duration numeric NOT NULL,
  channel_id integer,
  properties jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  placeholder text,
  CONSTRAINT structure_video_inserts_pkey PRIMARY KEY (insert_id),
  CONSTRAINT structure_video_inserts_placeholder_fkey FOREIGN KEY (placeholder) REFERENCES public.structure_accounts(placeholder)
);
CREATE TABLE public.structure_video_rendering_profiles (
  id integer NOT NULL DEFAULT nextval('structure_editing_profiles_id_seq'::regclass),
  profile_name character varying NOT NULL UNIQUE,
  unsharp_settings text DEFAULT '3:3:1.5:3:3:0.7'::text,
  video_codec text DEFAULT 'libx264'::text,
  audio_codec text DEFAULT 'aac'::text,
  pixel_format text DEFAULT 'yuv420p'::text,
  video_bitrate character varying DEFAULT '2M'::character varying,
  audio_bitrate character varying DEFAULT '128k'::character varying,
  crf_value integer DEFAULT 23,
  preset character varying DEFAULT 'medium'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  description text,
  output_width integer DEFAULT 1920,
  output_height integer DEFAULT 1080,
  CONSTRAINT structure_video_rendering_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.structure_visual_fx (
  effect_id integer NOT NULL DEFAULT nextval('structure_visual_fx_effect_id_seq'::regclass),
  effect_name character varying NOT NULL,
  effect_type character varying NOT NULL CHECK (effect_type::text = ANY (ARRAY['mask'::character varying::text, 'overlay'::character varying::text, 'particle'::character varying::text])),
  file_url character varying,
  created_at timestamp with time zone DEFAULT now(),
  category character varying,
  style character varying,
  duration_seconds numeric,
  resolution character varying,
  has_alpha boolean DEFAULT true,
  color_tone character varying,
  movement_type character varying,
  intensity character varying,
  best_use text,
  tags ARRAY,
  updated_at timestamp with time zone DEFAULT now(),
  filename character varying,
  CONSTRAINT structure_visual_fx_pkey PRIMARY KEY (effect_id)
);
CREATE TABLE public.structure_workflow_pool (
  workflow_id text NOT NULL,
  workflow_name text NOT NULL,
  workflow_url text,
  workflow_type text,
  CONSTRAINT structure_workflow_pool_pkey PRIMARY KEY (workflow_id)
);
CREATE TABLE public.vector_project (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text,
  embedding USER-DEFINED,
  metadata jsonb,
  CONSTRAINT vector_project_pkey PRIMARY KEY (id)
);
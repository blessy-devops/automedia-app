Initialising login role...
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analysis_videos: {
        Row: {
          audience_retention_rate: number | null
          average_watch_time: number | null
          click_through_rate: number | null
          comment_count: number | null
          dislike_count: number | null
          engagement_rate: number | null
          id: number
          like_count: number | null
          metric_date: string
          share_count: number | null
          view_count: number | null
          youtube_video_id: string
        }
        Insert: {
          audience_retention_rate?: number | null
          average_watch_time?: number | null
          click_through_rate?: number | null
          comment_count?: number | null
          dislike_count?: number | null
          engagement_rate?: number | null
          id?: number
          like_count?: number | null
          metric_date: string
          share_count?: number | null
          view_count?: number | null
          youtube_video_id: string
        }
        Update: {
          audience_retention_rate?: number | null
          average_watch_time?: number | null
          click_through_rate?: number | null
          comment_count?: number | null
          dislike_count?: number | null
          engagement_rate?: number | null
          id?: number
          like_count?: number | null
          metric_date?: string
          share_count?: number | null
          view_count?: number | null
          youtube_video_id?: string
        }
        Relationships: []
      }
      api_keys_metadata: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          key_label: string | null
          key_preview: string | null
          provider: string
          updated_at: string
          vault_name: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          key_label?: string | null
          key_preview?: string | null
          provider: string
          updated_at?: string
          vault_name: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          key_label?: string | null
          key_preview?: string | null
          provider?: string
          updated_at?: string
          vault_name?: string
        }
        Relationships: []
      }
      benchmark_channels: {
        Row: {
          banner_url: string | null
          categorization: Json | null
          channel_id: string
          channel_keywords: Json | null
          channel_name: string | null
          country: string | null
          created_at: string
          creation_date: string | null
          custom_url: string | null
          description: string | null
          id: number
          is_verified: boolean | null
          metric_date: string | null
          subscriber_count: number | null
          thumbnail_url: string | null
          total_views: number | null
          updated_at: string
          video_upload_count: number | null
        }
        Insert: {
          banner_url?: string | null
          categorization?: Json | null
          channel_id: string
          channel_keywords?: Json | null
          channel_name?: string | null
          country?: string | null
          created_at?: string
          creation_date?: string | null
          custom_url?: string | null
          description?: string | null
          id?: number
          is_verified?: boolean | null
          metric_date?: string | null
          subscriber_count?: number | null
          thumbnail_url?: string | null
          total_views?: number | null
          updated_at?: string
          video_upload_count?: number | null
        }
        Update: {
          banner_url?: string | null
          categorization?: Json | null
          channel_id?: string
          channel_keywords?: Json | null
          channel_name?: string | null
          country?: string | null
          created_at?: string
          creation_date?: string | null
          custom_url?: string | null
          description?: string | null
          id?: number
          is_verified?: boolean | null
          metric_date?: string | null
          subscriber_count?: number | null
          thumbnail_url?: string | null
          total_views?: number | null
          updated_at?: string
          video_upload_count?: number | null
        }
        Relationships: []
      }
      benchmark_channels_baseline_stats: {
        Row: {
          avg_views_per_video_14d: number | null
          avg_views_per_video_30d: number | null
          avg_views_per_video_90d: number | null
          avg_views_per_video_historical: number | null
          calculated_at: string
          channel_id: string
          created_at: string
          id: number
          media_diaria_views_14d: number | null
          median_views_per_video_14d: number | null
          median_views_per_video_30d: number | null
          median_views_per_video_90d: number | null
          median_views_per_video_historical: number | null
          std_dev_views_14d: number | null
          std_dev_views_30d: number | null
          std_dev_views_90d: number | null
          std_dev_views_historical: number | null
          taxa_crescimento: number | null
          total_views_14d: number | null
          total_views_30d: number | null
          total_views_90d: number | null
          total_views_historical: number | null
          updated_at: string
          videos_count_14d: number | null
          videos_count_30d: number | null
          videos_count_90d: number | null
          videos_count_historical: number | null
        }
        Insert: {
          avg_views_per_video_14d?: number | null
          avg_views_per_video_30d?: number | null
          avg_views_per_video_90d?: number | null
          avg_views_per_video_historical?: number | null
          calculated_at?: string
          channel_id: string
          created_at?: string
          id?: number
          media_diaria_views_14d?: number | null
          median_views_per_video_14d?: number | null
          median_views_per_video_30d?: number | null
          median_views_per_video_90d?: number | null
          median_views_per_video_historical?: number | null
          std_dev_views_14d?: number | null
          std_dev_views_30d?: number | null
          std_dev_views_90d?: number | null
          std_dev_views_historical?: number | null
          taxa_crescimento?: number | null
          total_views_14d?: number | null
          total_views_30d?: number | null
          total_views_90d?: number | null
          total_views_historical?: number | null
          updated_at?: string
          videos_count_14d?: number | null
          videos_count_30d?: number | null
          videos_count_90d?: number | null
          videos_count_historical?: number | null
        }
        Update: {
          avg_views_per_video_14d?: number | null
          avg_views_per_video_30d?: number | null
          avg_views_per_video_90d?: number | null
          avg_views_per_video_historical?: number | null
          calculated_at?: string
          channel_id?: string
          created_at?: string
          id?: number
          media_diaria_views_14d?: number | null
          median_views_per_video_14d?: number | null
          median_views_per_video_30d?: number | null
          median_views_per_video_90d?: number | null
          median_views_per_video_historical?: number | null
          std_dev_views_14d?: number | null
          std_dev_views_30d?: number | null
          std_dev_views_90d?: number | null
          std_dev_views_historical?: number | null
          taxa_crescimento?: number | null
          total_views_14d?: number | null
          total_views_30d?: number | null
          total_views_90d?: number | null
          total_views_historical?: number | null
          updated_at?: string
          videos_count_14d?: number | null
          videos_count_30d?: number | null
          videos_count_90d?: number | null
          videos_count_historical?: number | null
        }
        Relationships: []
      }
      benchmark_search_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          keyword: string
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          search_params: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          keyword: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          search_params?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          keyword?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          search_params?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      benchmark_videos: {
        Row: {
          categorization: Json | null
          channel_id: string
          comments: number | null
          created_at: string
          description: string | null
          id: number
          is_outlier: boolean | null
          likes: number | null
          outlier_threshold: number | null
          performance_vs_avg_historical: number | null
          performance_vs_median_historical: number | null
          performance_vs_recent_14d: number | null
          performance_vs_recent_30d: number | null
          performance_vs_recent_90d: number | null
          tags: Json | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          upload_date: string | null
          video_age_days: number | null
          video_length: unknown
          video_transcript: string | null
          views: number | null
          views_per_day: number | null
          youtube_video_id: string
        }
        Insert: {
          categorization?: Json | null
          channel_id: string
          comments?: number | null
          created_at?: string
          description?: string | null
          id?: number
          is_outlier?: boolean | null
          likes?: number | null
          outlier_threshold?: number | null
          performance_vs_avg_historical?: number | null
          performance_vs_median_historical?: number | null
          performance_vs_recent_14d?: number | null
          performance_vs_recent_30d?: number | null
          performance_vs_recent_90d?: number | null
          tags?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          upload_date?: string | null
          video_age_days?: number | null
          video_length?: unknown
          video_transcript?: string | null
          views?: number | null
          views_per_day?: number | null
          youtube_video_id: string
        }
        Update: {
          categorization?: Json | null
          channel_id?: string
          comments?: number | null
          created_at?: string
          description?: string | null
          id?: number
          is_outlier?: boolean | null
          likes?: number | null
          outlier_threshold?: number | null
          performance_vs_avg_historical?: number | null
          performance_vs_median_historical?: number | null
          performance_vs_recent_14d?: number | null
          performance_vs_recent_30d?: number | null
          performance_vs_recent_90d?: number | null
          tags?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          upload_date?: string | null
          video_age_days?: number | null
          video_length?: unknown
          video_transcript?: string | null
          views?: number | null
          views_per_day?: number | null
          youtube_video_id?: string
        }
        Relationships: []
      }
      channel_benchmark_searches: {
        Row: {
          benchmark_channel_id: number | null
          channel_id: string
          channel_name: string | null
          completed_at: string | null
          config: Json | null
          created_at: string
          duration_seconds: number | null
          enrichment_job_id: number | null
          error_message: string | null
          id: number
          outlier_videos_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["channel_search_status"]
          total_videos_found: number | null
          updated_at: string
        }
        Insert: {
          benchmark_channel_id?: number | null
          channel_id: string
          channel_name?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          duration_seconds?: number | null
          enrichment_job_id?: number | null
          error_message?: string | null
          id?: number
          outlier_videos_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["channel_search_status"]
          total_videos_found?: number | null
          updated_at?: string
        }
        Update: {
          benchmark_channel_id?: number | null
          channel_id?: string
          channel_name?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          duration_seconds?: number | null
          enrichment_job_id?: number | null
          error_message?: string | null
          id?: number
          outlier_videos_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["channel_search_status"]
          total_videos_found?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      channel_enrichment_jobs: {
        Row: {
          channel_ids: Json
          channels_completed: number
          channels_failed: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: number
          keyword_search_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["enrichment_job_status"]
          total_channels: number
          updated_at: string
        }
        Insert: {
          channel_ids: Json
          channels_completed?: number
          channels_failed?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: number
          keyword_search_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrichment_job_status"]
          total_channels: number
          updated_at?: string
        }
        Update: {
          channel_ids?: Json
          channels_completed?: number
          channels_failed?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: number
          keyword_search_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrichment_job_status"]
          total_channels?: number
          updated_at?: string
        }
        Relationships: []
      }
      channel_enrichment_tasks: {
        Row: {
          baseline_stats_completed_at: string | null
          baseline_stats_error: string | null
          baseline_stats_result: Json | null
          baseline_stats_started_at: string | null
          baseline_stats_status: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          categorization_completed_at: string | null
          categorization_error: string | null
          categorization_result: Json | null
          categorization_started_at: string | null
          categorization_status: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          channel_id: string
          completed_at: string | null
          created_at: string
          enrichment_job_id: number
          fetch_videos_completed_at: string | null
          fetch_videos_error: string | null
          fetch_videos_result: Json | null
          fetch_videos_started_at: string | null
          fetch_videos_status: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          id: number
          last_error: string | null
          outlier_analysis_completed_at: string | null
          outlier_analysis_error: string | null
          outlier_analysis_result: Json | null
          outlier_analysis_started_at: string | null
          outlier_analysis_status: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          overall_status: Database["public"]["Enums"]["enrichment_task_status"]
          recent_videos_completed_at: string | null
          recent_videos_error: string | null
          recent_videos_job_id: string | null
          recent_videos_result: Json | null
          recent_videos_started_at: string | null
          recent_videos_status: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          retry_count: number
          socialblade_completed_at: string | null
          socialblade_error: string | null
          socialblade_result: Json | null
          socialblade_started_at: string | null
          socialblade_status: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          started_at: string | null
          trending_videos_completed_at: string | null
          trending_videos_error: string | null
          trending_videos_job_id: string | null
          trending_videos_result: Json | null
          trending_videos_started_at: string | null
          trending_videos_status: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          updated_at: string
        }
        Insert: {
          baseline_stats_completed_at?: string | null
          baseline_stats_error?: string | null
          baseline_stats_result?: Json | null
          baseline_stats_started_at?: string | null
          baseline_stats_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          categorization_completed_at?: string | null
          categorization_error?: string | null
          categorization_result?: Json | null
          categorization_started_at?: string | null
          categorization_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          channel_id: string
          completed_at?: string | null
          created_at?: string
          enrichment_job_id: number
          fetch_videos_completed_at?: string | null
          fetch_videos_error?: string | null
          fetch_videos_result?: Json | null
          fetch_videos_started_at?: string | null
          fetch_videos_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          id?: number
          last_error?: string | null
          outlier_analysis_completed_at?: string | null
          outlier_analysis_error?: string | null
          outlier_analysis_result?: Json | null
          outlier_analysis_started_at?: string | null
          outlier_analysis_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          overall_status?: Database["public"]["Enums"]["enrichment_task_status"]
          recent_videos_completed_at?: string | null
          recent_videos_error?: string | null
          recent_videos_job_id?: string | null
          recent_videos_result?: Json | null
          recent_videos_started_at?: string | null
          recent_videos_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          retry_count?: number
          socialblade_completed_at?: string | null
          socialblade_error?: string | null
          socialblade_result?: Json | null
          socialblade_started_at?: string | null
          socialblade_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          started_at?: string | null
          trending_videos_completed_at?: string | null
          trending_videos_error?: string | null
          trending_videos_job_id?: string | null
          trending_videos_result?: Json | null
          trending_videos_started_at?: string | null
          trending_videos_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          updated_at?: string
        }
        Update: {
          baseline_stats_completed_at?: string | null
          baseline_stats_error?: string | null
          baseline_stats_result?: Json | null
          baseline_stats_started_at?: string | null
          baseline_stats_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          categorization_completed_at?: string | null
          categorization_error?: string | null
          categorization_result?: Json | null
          categorization_started_at?: string | null
          categorization_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          channel_id?: string
          completed_at?: string | null
          created_at?: string
          enrichment_job_id?: number
          fetch_videos_completed_at?: string | null
          fetch_videos_error?: string | null
          fetch_videos_result?: Json | null
          fetch_videos_started_at?: string | null
          fetch_videos_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          id?: number
          last_error?: string | null
          outlier_analysis_completed_at?: string | null
          outlier_analysis_error?: string | null
          outlier_analysis_result?: Json | null
          outlier_analysis_started_at?: string | null
          outlier_analysis_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          overall_status?: Database["public"]["Enums"]["enrichment_task_status"]
          recent_videos_completed_at?: string | null
          recent_videos_error?: string | null
          recent_videos_job_id?: string | null
          recent_videos_result?: Json | null
          recent_videos_started_at?: string | null
          recent_videos_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          retry_count?: number
          socialblade_completed_at?: string | null
          socialblade_error?: string | null
          socialblade_result?: Json | null
          socialblade_started_at?: string | null
          socialblade_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          started_at?: string | null
          trending_videos_completed_at?: string | null
          trending_videos_error?: string | null
          trending_videos_job_id?: string | null
          trending_videos_result?: Json | null
          trending_videos_started_at?: string | null
          trending_videos_status?: Database["public"]["Enums"]["enrichment_sub_workflow_status"]
          updated_at?: string
        }
        Relationships: []
      }
      channel_searches: {
        Row: {
          channels_completed: number
          channels_failed: number
          channels_to_process: number
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: number
          job_ids: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["channel_search_status"]
        }
        Insert: {
          channels_completed?: number
          channels_failed?: number
          channels_to_process?: number
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: number
          job_ids?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["channel_search_status"]
        }
        Update: {
          channels_completed?: number
          channels_failed?: number
          channels_to_process?: number
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: number
          job_ids?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["channel_search_status"]
        }
        Relationships: []
      }
      distribution_posting_queue: {
        Row: {
          content_id_on_platform: string | null
          created_at: string | null
          error_message: string | null
          final_link: string | null
          id: number
          language: Database["public"]["Enums"]["language_enum"] | null
          placeholder: string | null
          platform: Database["public"]["Enums"]["account_platform_enum"] | null
          processed_at: string | null
          scheduled_datetime: string | null
          slot_id: number | null
          status: Database["public"]["Enums"]["production_status_enum"]
          title: string | null
          video_id: number
        }
        Insert: {
          content_id_on_platform?: string | null
          created_at?: string | null
          error_message?: string | null
          final_link?: string | null
          id?: number
          language?: Database["public"]["Enums"]["language_enum"] | null
          placeholder?: string | null
          platform?: Database["public"]["Enums"]["account_platform_enum"] | null
          processed_at?: string | null
          scheduled_datetime?: string | null
          slot_id?: number | null
          status?: Database["public"]["Enums"]["production_status_enum"]
          title?: string | null
          video_id: number
        }
        Update: {
          content_id_on_platform?: string | null
          created_at?: string | null
          error_message?: string | null
          final_link?: string | null
          id?: number
          language?: Database["public"]["Enums"]["language_enum"] | null
          placeholder?: string | null
          platform?: Database["public"]["Enums"]["account_platform_enum"] | null
          processed_at?: string | null
          scheduled_datetime?: string | null
          slot_id?: number | null
          status?: Database["public"]["Enums"]["production_status_enum"]
          title?: string | null
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "distribution_posting_queue_placeholder_fkey"
            columns: ["placeholder"]
            isOneToOne: false
            referencedRelation: "structure_accounts"
            referencedColumns: ["placeholder"]
          },
          {
            foreignKeyName: "distribution_posting_queue_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "structure_posting_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_posting_queue_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "production_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_searches: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          duration: number | null
          error_message: string | null
          expanded_keywords: Json | null
          id: number
          job_ids: Json | null
          original_keyword: string
          pages_processed: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["keyword_search_status"]
          total_keywords: number
          updated_at: string
          videos_found: number | null
          videos_saved: number | null
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          expanded_keywords?: Json | null
          id?: number
          job_ids?: Json | null
          original_keyword: string
          pages_processed?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["keyword_search_status"]
          total_keywords: number
          updated_at?: string
          videos_found?: number | null
          videos_saved?: number | null
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          expanded_keywords?: Json | null
          id?: number
          job_ids?: Json | null
          original_keyword?: string
          pages_processed?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["keyword_search_status"]
          total_keywords?: number
          updated_at?: string
          videos_found?: number | null
          videos_saved?: number | null
        }
        Relationships: []
      }
      narrative_analyses: {
        Row: {
          analysis_metadata: Json | null
          benchmark_video_id: number
          central_theme: string | null
          channel_id: string | null
          conflict_type_id: string | null
          created_at: string | null
          emotional_core_id: string | null
          id: string
          identified_structure_model: string | null
          story_beats: Json | null
          story_setting: Json | null
          structure_id: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_metadata?: Json | null
          benchmark_video_id: number
          central_theme?: string | null
          channel_id?: string | null
          conflict_type_id?: string | null
          created_at?: string | null
          emotional_core_id?: string | null
          id?: string
          identified_structure_model?: string | null
          story_beats?: Json | null
          story_setting?: Json | null
          structure_id?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_metadata?: Json | null
          benchmark_video_id?: number
          central_theme?: string | null
          channel_id?: string | null
          conflict_type_id?: string | null
          created_at?: string | null
          emotional_core_id?: string | null
          id?: string
          identified_structure_model?: string | null
          story_beats?: Json | null
          story_setting?: Json | null
          structure_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_conflict_type"
            columns: ["conflict_type_id"]
            isOneToOne: false
            referencedRelation: "narrative_conflict_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_emotional_core"
            columns: ["emotional_core_id"]
            isOneToOne: false
            referencedRelation: "narrative_emotional_cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_structure"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "narrative_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_archetypes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      narrative_characters: {
        Row: {
          analysis_id: string
          archetype_id: string | null
          created_at: string | null
          flaw: string | null
          gender: string | null
          goal: string | null
          id: string
          inferred_physical_profile: Json | null
          layers: Json | null
          name: string | null
          occupation: string | null
          relationships: Json | null
          role: string
          updated_at: string | null
        }
        Insert: {
          analysis_id: string
          archetype_id?: string | null
          created_at?: string | null
          flaw?: string | null
          gender?: string | null
          goal?: string | null
          id?: string
          inferred_physical_profile?: Json | null
          layers?: Json | null
          name?: string | null
          occupation?: string | null
          relationships?: Json | null
          role: string
          updated_at?: string | null
        }
        Update: {
          analysis_id?: string
          archetype_id?: string | null
          created_at?: string | null
          flaw?: string | null
          gender?: string | null
          goal?: string | null
          id?: string
          inferred_physical_profile?: Json | null
          layers?: Json | null
          name?: string | null
          occupation?: string | null
          relationships?: Json | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_analysis"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "narrative_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_characters_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "narrative_archetypes"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_conflict_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      narrative_emotional_cores: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      narrative_structures: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: number
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      production_audio_segments: {
        Row: {
          api_key_used: string | null
          audio_url: string | null
          concatenated_audio_id: number | null
          concatenation_workflow_used: string | null
          created_at: string | null
          duration_seconds: number | null
          job_id: number
          segment_number: number
          segment_text: string
          segmentation_workflow_used: string | null
          status: Database["public"]["Enums"]["audio_segment_status"] | null
          video_id: number
        }
        Insert: {
          api_key_used?: string | null
          audio_url?: string | null
          concatenated_audio_id?: number | null
          concatenation_workflow_used?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          job_id?: number
          segment_number: number
          segment_text: string
          segmentation_workflow_used?: string | null
          status?: Database["public"]["Enums"]["audio_segment_status"] | null
          video_id: number
        }
        Update: {
          api_key_used?: string | null
          audio_url?: string | null
          concatenated_audio_id?: number | null
          concatenation_workflow_used?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          job_id?: number
          segment_number?: number
          segment_text?: string
          segmentation_workflow_used?: string | null
          status?: Database["public"]["Enums"]["audio_segment_status"] | null
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_audio_segments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "production_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      production_concatenated_audios: {
        Row: {
          audio_url: string | null
          concatenated_audio_id: number
          concatenated_audio_text: string | null
          created_at: string
          duration_formatted: string | null
          duration_seconds: number | null
          end_time_formatted: string | null
          end_time_seconds: number | null
          filename: string
          first_audio_segment: number
          id: number
          image_creation_prompt_workflow: string | null
          last_audio_segment: number
          start_time_formatted: string | null
          start_time_seconds: number | null
          status:
            | Database["public"]["Enums"]["enum_concatenated_audio_status"]
            | null
          updated_at: string
          video_id: number
        }
        Insert: {
          audio_url?: string | null
          concatenated_audio_id: number
          concatenated_audio_text?: string | null
          created_at?: string
          duration_formatted?: string | null
          duration_seconds?: number | null
          end_time_formatted?: string | null
          end_time_seconds?: number | null
          filename: string
          first_audio_segment: number
          id?: number
          image_creation_prompt_workflow?: string | null
          last_audio_segment: number
          start_time_formatted?: string | null
          start_time_seconds?: number | null
          status?:
            | Database["public"]["Enums"]["enum_concatenated_audio_status"]
            | null
          updated_at?: string
          video_id: number
        }
        Update: {
          audio_url?: string | null
          concatenated_audio_id?: number
          concatenated_audio_text?: string | null
          created_at?: string
          duration_formatted?: string | null
          duration_seconds?: number | null
          end_time_formatted?: string | null
          end_time_seconds?: number | null
          filename?: string
          first_audio_segment?: number
          id?: number
          image_creation_prompt_workflow?: string | null
          last_audio_segment?: number
          start_time_formatted?: string | null
          start_time_seconds?: number | null
          status?:
            | Database["public"]["Enums"]["enum_concatenated_audio_status"]
            | null
          updated_at?: string
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_concatenated_audios_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "production_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      production_covering_images: {
        Row: {
          ai_model: string
          concatenated_audio_id: number | null
          created_at: string
          file_url: string | null
          filename: string | null
          generation_prompt: string
          guidance_scale: number | null
          height: number | null
          id: number
          image_id: number | null
          negative_prompt: string | null
          seed: number | null
          status: Database["public"]["Enums"]["covering_image_status"]
          steps: number | null
          updated_at: string
          video_id: number
          width: number | null
        }
        Insert: {
          ai_model?: string
          concatenated_audio_id?: number | null
          created_at?: string
          file_url?: string | null
          filename?: string | null
          generation_prompt: string
          guidance_scale?: number | null
          height?: number | null
          id?: number
          image_id?: number | null
          negative_prompt?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["covering_image_status"]
          steps?: number | null
          updated_at?: string
          video_id: number
          width?: number | null
        }
        Update: {
          ai_model?: string
          concatenated_audio_id?: number | null
          created_at?: string
          file_url?: string | null
          filename?: string | null
          generation_prompt?: string
          guidance_scale?: number | null
          height?: number | null
          id?: number
          image_id?: number | null
          negative_prompt?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["covering_image_status"]
          steps?: number | null
          updated_at?: string
          video_id?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_covering_images_concatenated_audio_id_fkey"
            columns: ["concatenated_audio_id"]
            isOneToOne: false
            referencedRelation: "production_concatenated_audios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_covering_images_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "production_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      production_video_editing_assets: {
        Row: {
          asset_description: string | null
          asset_key: string
          asset_type: string
          created_at: string | null
          duration: number | null
          end_time: number | null
          file_url: string | null
          filename: string | null
          generation_prompt: string | null
          height: number | null
          id: number
          layer: number | null
          metadata: Json | null
          properties: Json | null
          segment_id: number | null
          start_time: number | null
          status: string | null
          text: string | null
          updated_at: string | null
          video_id: number
          width: number | null
        }
        Insert: {
          asset_description?: string | null
          asset_key: string
          asset_type: string
          created_at?: string | null
          duration?: number | null
          end_time?: number | null
          file_url?: string | null
          filename?: string | null
          generation_prompt?: string | null
          height?: number | null
          id?: number
          layer?: number | null
          metadata?: Json | null
          properties?: Json | null
          segment_id?: number | null
          start_time?: number | null
          status?: string | null
          text?: string | null
          updated_at?: string | null
          video_id: number
          width?: number | null
        }
        Update: {
          asset_description?: string | null
          asset_key?: string
          asset_type?: string
          created_at?: string | null
          duration?: number | null
          end_time?: number | null
          file_url?: string | null
          filename?: string | null
          generation_prompt?: string | null
          height?: number | null
          id?: number
          layer?: number | null
          metadata?: Json | null
          properties?: Json | null
          segment_id?: number | null
          start_time?: number | null
          status?: string | null
          text?: string | null
          updated_at?: string | null
          video_id?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_video"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "production_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      production_video_segments: {
        Row: {
          concatenated_audio_id: number | null
          covering_assets: Json | null
          covering_images: Json | null
          created_at: string
          filename: string
          id: number
          metadata_video: Json | null
          segment_id: number
          status: Database["public"]["Enums"]["video_segment_status"] | null
          updated_at: string
          video_id: number
          video_segment_workflow_used: string | null
          video_url: string | null
        }
        Insert: {
          concatenated_audio_id?: number | null
          covering_assets?: Json | null
          covering_images?: Json | null
          created_at?: string
          filename: string
          id?: number
          metadata_video?: Json | null
          segment_id: number
          status?: Database["public"]["Enums"]["video_segment_status"] | null
          updated_at?: string
          video_id: number
          video_segment_workflow_used?: string | null
          video_url?: string | null
        }
        Update: {
          concatenated_audio_id?: number | null
          covering_assets?: Json | null
          covering_images?: Json | null
          created_at?: string
          filename?: string
          id?: number
          metadata_video?: Json | null
          segment_id?: number
          status?: Database["public"]["Enums"]["video_segment_status"] | null
          updated_at?: string
          video_id?: number
          video_segment_workflow_used?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      production_videos: {
        Row: {
          adapted_story_beats_payload: Json | null
          audio_folder_url: string | null
          benchmark_id: number | null
          benchmark_title: string | null
          benchmark_video_transcript: string | null
          categorization: Json | null
          content_format:
            | Database["public"]["Enums"]["content_format_enum"]
            | null
          content_id_on_platform: string | null
          covering_images_count: number | null
          covering_images_folder: string | null
          created_at: string | null
          date_time: string | null
          description: string | null
          editing_profile:
            | Database["public"]["Enums"]["editing_profile_enum"]
            | null
          extracted_hooks: string | null
          final_link: string | null
          id: number
          is_processing: boolean | null
          language: Database["public"]["Enums"]["language_enum"] | null
          offer_links: string | null
          parent_folder: string | null
          placeholder: string | null
          planned_upload_date: string | null
          platform: Database["public"]["Enums"]["account_platform_enum"] | null
          privacy: Database["public"]["Enums"]["privacy_enum"] | null
          rich_outline_payload: Json | null
          script: string | null
          ssml_script: string | null
          status: Database["public"]["Enums"]["production_status_enum"] | null
          story_cast_payload: Json | null
          tags: string | null
          teaser_folder_url: string | null
          teaser_script: string | null
          text_folder_url: string | null
          thumb_text: string | null
          thumbnail_description: string | null
          thumbnail_folder_url: string | null
          thumbnail_url: string | null
          title: string | null
          title_url: string | null
          unique_profile_id: string | null
          updated_at: string | null
          video_segments_folder: string | null
        }
        Insert: {
          adapted_story_beats_payload?: Json | null
          audio_folder_url?: string | null
          benchmark_id?: number | null
          benchmark_title?: string | null
          benchmark_video_transcript?: string | null
          categorization?: Json | null
          content_format?:
            | Database["public"]["Enums"]["content_format_enum"]
            | null
          content_id_on_platform?: string | null
          covering_images_count?: number | null
          covering_images_folder?: string | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          editing_profile?:
            | Database["public"]["Enums"]["editing_profile_enum"]
            | null
          extracted_hooks?: string | null
          final_link?: string | null
          id?: number
          is_processing?: boolean | null
          language?: Database["public"]["Enums"]["language_enum"] | null
          offer_links?: string | null
          parent_folder?: string | null
          placeholder?: string | null
          planned_upload_date?: string | null
          platform?: Database["public"]["Enums"]["account_platform_enum"] | null
          privacy?: Database["public"]["Enums"]["privacy_enum"] | null
          rich_outline_payload?: Json | null
          script?: string | null
          ssml_script?: string | null
          status?: Database["public"]["Enums"]["production_status_enum"] | null
          story_cast_payload?: Json | null
          tags?: string | null
          teaser_folder_url?: string | null
          teaser_script?: string | null
          text_folder_url?: string | null
          thumb_text?: string | null
          thumbnail_description?: string | null
          thumbnail_folder_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          title_url?: string | null
          unique_profile_id?: string | null
          updated_at?: string | null
          video_segments_folder?: string | null
        }
        Update: {
          adapted_story_beats_payload?: Json | null
          audio_folder_url?: string | null
          benchmark_id?: number | null
          benchmark_title?: string | null
          benchmark_video_transcript?: string | null
          categorization?: Json | null
          content_format?:
            | Database["public"]["Enums"]["content_format_enum"]
            | null
          content_id_on_platform?: string | null
          covering_images_count?: number | null
          covering_images_folder?: string | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          editing_profile?:
            | Database["public"]["Enums"]["editing_profile_enum"]
            | null
          extracted_hooks?: string | null
          final_link?: string | null
          id?: number
          is_processing?: boolean | null
          language?: Database["public"]["Enums"]["language_enum"] | null
          offer_links?: string | null
          parent_folder?: string | null
          placeholder?: string | null
          planned_upload_date?: string | null
          platform?: Database["public"]["Enums"]["account_platform_enum"] | null
          privacy?: Database["public"]["Enums"]["privacy_enum"] | null
          rich_outline_payload?: Json | null
          script?: string | null
          ssml_script?: string | null
          status?: Database["public"]["Enums"]["production_status_enum"] | null
          story_cast_payload?: Json | null
          tags?: string | null
          teaser_folder_url?: string | null
          teaser_script?: string | null
          text_folder_url?: string | null
          thumb_text?: string | null
          thumbnail_description?: string | null
          thumbnail_folder_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          title_url?: string | null
          unique_profile_id?: string | null
          updated_at?: string | null
          video_segments_folder?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_videos_placeholder_fkey"
            columns: ["placeholder"]
            isOneToOne: false
            referencedRelation: "structure_accounts"
            referencedColumns: ["placeholder"]
          },
        ]
      }
      profiles: {
        Row: {
          createdAt: string | null
          email: string
          id: number
          image: string | null
          name: string
        }
        Insert: {
          createdAt?: string | null
          email: string
          id?: number
          image?: string | null
          name: string
        }
        Update: {
          createdAt?: string | null
          email?: string
          id?: number
          image?: string | null
          name?: string
        }
        Relationships: []
      }
      related_videos_searches: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          failed_jobs: number | null
          id: number
          job_ids: Json | null
          keyword_search_id: number
          related_videos_found: number | null
          related_videos_saved: number | null
          source_videos_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["related_search_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          failed_jobs?: number | null
          id?: number
          job_ids?: Json | null
          keyword_search_id: number
          related_videos_found?: number | null
          related_videos_saved?: number | null
          source_videos_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["related_search_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          failed_jobs?: number | null
          id?: number
          job_ids?: Json | null
          keyword_search_id?: number
          related_videos_found?: number | null
          related_videos_saved?: number | null
          source_videos_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["related_search_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_videos_searches_keyword_search_id_fkey"
            columns: ["keyword_search_id"]
            isOneToOne: false
            referencedRelation: "keyword_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      structure_accounts: {
        Row: {
          brand_id: string | null
          category: string | null
          content_format:
            | Database["public"]["Enums"]["content_format_enum"]
            | null
          created_at: string | null
          format: string | null
          id: number
          language: Database["public"]["Enums"]["language_enum"] | null
          microniche: string | null
          name: string | null
          niche: string | null
          placeholder: string | null
          platform: Database["public"]["Enums"]["account_platform_enum"] | null
          posting_frequency: number | null
          status: Database["public"]["Enums"]["account_status_enum"] | null
          subniche: string | null
          timezone: string | null
          unique_profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          category?: string | null
          content_format?:
            | Database["public"]["Enums"]["content_format_enum"]
            | null
          created_at?: string | null
          format?: string | null
          id?: number
          language?: Database["public"]["Enums"]["language_enum"] | null
          microniche?: string | null
          name?: string | null
          niche?: string | null
          placeholder?: string | null
          platform?: Database["public"]["Enums"]["account_platform_enum"] | null
          posting_frequency?: number | null
          status?: Database["public"]["Enums"]["account_status_enum"] | null
          subniche?: string | null
          timezone?: string | null
          unique_profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          category?: string | null
          content_format?:
            | Database["public"]["Enums"]["content_format_enum"]
            | null
          created_at?: string | null
          format?: string | null
          id?: number
          language?: Database["public"]["Enums"]["language_enum"] | null
          microniche?: string | null
          name?: string | null
          niche?: string | null
          placeholder?: string | null
          platform?: Database["public"]["Enums"]["account_platform_enum"] | null
          posting_frequency?: number | null
          status?: Database["public"]["Enums"]["account_status_enum"] | null
          subniche?: string | null
          timezone?: string | null
          unique_profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_structure_accounts_brand_id"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "structure_brand_bible"
            referencedColumns: ["id"]
          },
        ]
      }
      structure_api_keys_pool: {
        Row: {
          account: string | null
          api_key: string
          id: number
          service_provider: string
          status: Database["public"]["Enums"]["api_key_status_enum"]
        }
        Insert: {
          account?: string | null
          api_key: string
          id?: number
          service_provider: string
          status?: Database["public"]["Enums"]["api_key_status_enum"]
        }
        Update: {
          account?: string | null
          api_key?: string
          id?: number
          service_provider?: string
          status?: Database["public"]["Enums"]["api_key_status_enum"]
        }
        Relationships: []
      }
      structure_api_queue: {
        Row: {
          api_provider: string | null
          api_rate_limit: number | null
          asset: string | null
          created_at: string | null
          error_message: string | null
          id: number
          payload: Json
          processed_at: string | null
          status: string
          video_id: number | null
          workflow_id: string | null
          workflow_name: string | null
        }
        Insert: {
          api_provider?: string | null
          api_rate_limit?: number | null
          asset?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          payload: Json
          processed_at?: string | null
          status?: string
          video_id?: number | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          api_provider?: string | null
          api_rate_limit?: number | null
          asset?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          payload?: Json
          processed_at?: string | null
          status?: string
          video_id?: number | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
      }
      structure_audio_assets: {
        Row: {
          asset_type: string | null
          bpm: number | null
          created_at: string | null
          duration: number
          file_url: string
          filename: string | null
          genre: string | null
          mood: string | null
          soundtrack_id: number
          soundtrack_name: string
        }
        Insert: {
          asset_type?: string | null
          bpm?: number | null
          created_at?: string | null
          duration: number
          file_url: string
          filename?: string | null
          genre?: string | null
          mood?: string | null
          soundtrack_id?: number
          soundtrack_name: string
        }
        Update: {
          asset_type?: string | null
          bpm?: number | null
          created_at?: string | null
          duration?: number
          file_url?: string
          filename?: string | null
          genre?: string | null
          mood?: string | null
          soundtrack_id?: number
          soundtrack_name?: string
        }
        Relationships: []
      }
      structure_brand_bible: {
        Row: {
          agent_prompt_map: Json | null
          audience_description: string | null
          brand_context: Json | null
          brand_name: string
          channel_cast_map: Json | null
          created_at: string | null
          default_editing_style_id: string | null
          default_ssml_lexicon_id: string | null
          finalization_profile: Json | null
          host_profile: Json | null
          id: string
          narrative_playbook: Json | null
          placeholder: string | null
          strategy_report: string | null
          typography_profile: Json | null
          updated_at: string | null
          visual_profile: Json | null
          voice_profile: Json | null
          world_context_map: Json | null
          writing_style_guide: Json | null
        }
        Insert: {
          agent_prompt_map?: Json | null
          audience_description?: string | null
          brand_context?: Json | null
          brand_name: string
          channel_cast_map?: Json | null
          created_at?: string | null
          default_editing_style_id?: string | null
          default_ssml_lexicon_id?: string | null
          finalization_profile?: Json | null
          host_profile?: Json | null
          id?: string
          narrative_playbook?: Json | null
          placeholder?: string | null
          strategy_report?: string | null
          typography_profile?: Json | null
          updated_at?: string | null
          visual_profile?: Json | null
          voice_profile?: Json | null
          world_context_map?: Json | null
          writing_style_guide?: Json | null
        }
        Update: {
          agent_prompt_map?: Json | null
          audience_description?: string | null
          brand_context?: Json | null
          brand_name?: string
          channel_cast_map?: Json | null
          created_at?: string | null
          default_editing_style_id?: string | null
          default_ssml_lexicon_id?: string | null
          finalization_profile?: Json | null
          host_profile?: Json | null
          id?: string
          narrative_playbook?: Json | null
          placeholder?: string | null
          strategy_report?: string | null
          typography_profile?: Json | null
          updated_at?: string | null
          visual_profile?: Json | null
          voice_profile?: Json | null
          world_context_map?: Json | null
          writing_style_guide?: Json | null
        }
        Relationships: []
      }
      structure_categorization_categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      structure_categorization_formats: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      structure_categorization_microniches: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      structure_categorization_niches: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          selected: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          selected?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          selected?: boolean
        }
        Relationships: []
      }
      structure_categorization_subniches: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          niche_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          niche_id: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          niche_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_niche"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "structure_categorization_niches"
            referencedColumns: ["id"]
          },
        ]
      }
      structure_content_formats: {
        Row: {
          created_at: string | null
          description: string | null
          format: string | null
          id: number
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: number
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: number
          is_active?: boolean | null
        }
        Relationships: []
      }
      structure_credentials: {
        Row: {
          created_at: string | null
          credentials: Json
          id: number
          is_active: boolean | null
          last_used_at: string | null
          placeholder: string | null
          platform: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credentials: Json
          id?: number
          is_active?: boolean | null
          last_used_at?: string | null
          placeholder?: string | null
          platform: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credentials?: Json
          id?: number
          is_active?: boolean | null
          last_used_at?: string | null
          placeholder?: string | null
          platform?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structure_credentials_placeholder_fkey"
            columns: ["placeholder"]
            isOneToOne: false
            referencedRelation: "structure_accounts"
            referencedColumns: ["placeholder"]
          },
        ]
      }
      structure_platform_posting_config: {
        Row: {
          end_time: string
          id: number
          interval_minutes: number
          platform: Database["public"]["Enums"]["account_platform_enum"]
          start_time: string
          total_slots: number | null
        }
        Insert: {
          end_time?: string
          id?: number
          interval_minutes?: number
          platform: Database["public"]["Enums"]["account_platform_enum"]
          start_time?: string
          total_slots?: number | null
        }
        Update: {
          end_time?: string
          id?: number
          interval_minutes?: number
          platform?: Database["public"]["Enums"]["account_platform_enum"]
          start_time?: string
          total_slots?: number | null
        }
        Relationships: []
      }
      structure_posting_slots: {
        Row: {
          id: number
          placeholder: string | null
          platform: Database["public"]["Enums"]["account_platform_enum"]
          slot_number: number
          slot_time: string
        }
        Insert: {
          id?: number
          placeholder?: string | null
          platform: Database["public"]["Enums"]["account_platform_enum"]
          slot_number: number
          slot_time: string
        }
        Update: {
          id?: number
          placeholder?: string | null
          platform?: Database["public"]["Enums"]["account_platform_enum"]
          slot_number?: number
          slot_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "structure_posting_slots_placeholder_fkey"
            columns: ["placeholder"]
            isOneToOne: false
            referencedRelation: "structure_accounts"
            referencedColumns: ["placeholder"]
          },
        ]
      }
      structure_prompt_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          output_schema: Json | null
          prompt_type: string | null
          system_prompt: string
          template_name: string
          updated_at: string | null
          user_input: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          output_schema?: Json | null
          prompt_type?: string | null
          system_prompt: string
          template_name: string
          updated_at?: string | null
          user_input?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          output_schema?: Json | null
          prompt_type?: string | null
          system_prompt?: string
          template_name?: string
          updated_at?: string | null
          user_input?: string | null
        }
        Relationships: []
      }
      structure_ssml_lexicons: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lexicon_data: Json | null
          lexicon_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lexicon_data?: Json | null
          lexicon_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lexicon_data?: Json | null
          lexicon_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      structure_video_editing_styles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          style_data: Json | null
          style_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          style_data?: Json | null
          style_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          style_data?: Json | null
          style_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      structure_video_inserts: {
        Row: {
          channel_id: number | null
          created_at: string | null
          duration: number
          gdrive_file_id: string
          insert_category: string | null
          insert_id: number
          insert_name: string
          is_active: boolean | null
          placeholder: string | null
          properties: Json | null
        }
        Insert: {
          channel_id?: number | null
          created_at?: string | null
          duration: number
          gdrive_file_id: string
          insert_category?: string | null
          insert_id?: number
          insert_name: string
          is_active?: boolean | null
          placeholder?: string | null
          properties?: Json | null
        }
        Update: {
          channel_id?: number | null
          created_at?: string | null
          duration?: number
          gdrive_file_id?: string
          insert_category?: string | null
          insert_id?: number
          insert_name?: string
          is_active?: boolean | null
          placeholder?: string | null
          properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "structure_video_inserts_placeholder_fkey"
            columns: ["placeholder"]
            isOneToOne: false
            referencedRelation: "structure_accounts"
            referencedColumns: ["placeholder"]
          },
        ]
      }
      structure_video_rendering_profiles: {
        Row: {
          audio_bitrate: string | null
          audio_codec: string | null
          created_at: string | null
          crf_value: number | null
          description: string | null
          id: number
          is_active: boolean | null
          output_height: number | null
          output_width: number | null
          pixel_format: string | null
          preset: string | null
          profile_name: string
          unsharp_settings: string | null
          video_bitrate: string | null
          video_codec: string | null
        }
        Insert: {
          audio_bitrate?: string | null
          audio_codec?: string | null
          created_at?: string | null
          crf_value?: number | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          output_height?: number | null
          output_width?: number | null
          pixel_format?: string | null
          preset?: string | null
          profile_name: string
          unsharp_settings?: string | null
          video_bitrate?: string | null
          video_codec?: string | null
        }
        Update: {
          audio_bitrate?: string | null
          audio_codec?: string | null
          created_at?: string | null
          crf_value?: number | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          output_height?: number | null
          output_width?: number | null
          pixel_format?: string | null
          preset?: string | null
          profile_name?: string
          unsharp_settings?: string | null
          video_bitrate?: string | null
          video_codec?: string | null
        }
        Relationships: []
      }
      structure_visual_fx: {
        Row: {
          best_use: string | null
          category: string | null
          color_tone: string | null
          created_at: string | null
          duration_seconds: number | null
          effect_id: number
          effect_name: string
          effect_type: string
          file_url: string | null
          filename: string | null
          has_alpha: boolean | null
          intensity: string | null
          movement_type: string | null
          resolution: string | null
          style: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          best_use?: string | null
          category?: string | null
          color_tone?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          effect_id?: number
          effect_name: string
          effect_type: string
          file_url?: string | null
          filename?: string | null
          has_alpha?: boolean | null
          intensity?: string | null
          movement_type?: string | null
          resolution?: string | null
          style?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          best_use?: string | null
          category?: string | null
          color_tone?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          effect_id?: number
          effect_name?: string
          effect_type?: string
          file_url?: string | null
          filename?: string | null
          has_alpha?: boolean | null
          intensity?: string | null
          movement_type?: string | null
          resolution?: string | null
          style?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      structure_workflow_pool: {
        Row: {
          workflow_id: string
          workflow_name: string
          workflow_type: string | null
          workflow_url: string | null
        }
        Insert: {
          workflow_id: string
          workflow_name: string
          workflow_type?: string | null
          workflow_url?: string | null
        }
        Update: {
          workflow_id?: string
          workflow_name?: string
          workflow_type?: string | null
          workflow_url?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: number
          name: string
          password: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          updated_at?: string
        }
        Relationships: []
      }
      vector_project: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      video_folder_items: {
        Row: {
          added_at: string
          added_by: string | null
          folder_id: number
          id: number
          video_id: number
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          folder_id: number
          id?: number
          video_id: number
        }
        Update: {
          added_at?: string
          added_by?: string | null
          folder_id?: number
          id?: number
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "video_folder_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "video_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_folder_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "benchmark_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: number
          name: string
          parent_folder_id: number | null
          position: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          parent_folder_id?: number | null
          position?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          parent_folder_id?: number | null
          position?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "video_folder_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "video_folders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      channel_metrics_summary: {
        Row: {
          average_subscribers: number | null
          average_videos_per_channel: number | null
          last_updated: string | null
          total_channels: number | null
          total_subscribers: number | null
          total_videos_across_channels: number | null
        }
        Relationships: []
      }
      table_documentation: {
        Row: {
          column_default: string | null
          column_name: unknown
          data_type: string | null
          is_nullable: string | null
          ordinal_position: number | null
          table_name: unknown
        }
        Relationships: []
      }
      video_folder_stats: {
        Row: {
          id: number | null
          last_video_added: string | null
          name: string | null
          parent_folder_id: number | null
          subfolder_count: number | null
          user_id: string | null
          video_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "video_folder_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "video_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      video_metrics_summary: {
        Row: {
          average_views: number | null
          last_updated: string | null
          outliers_5x_count: number | null
          total_videos: number | null
          total_views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_video_segment_workflow_to_segment:
        | { Args: { p_video_id?: number }; Returns: undefined }
        | { Args: never; Returns: undefined }
      benchmark_videos_sync_video_categories_from_channels: {
        Args: never
        Returns: undefined
      }
      categorize_benchmark_videos: { Args: never; Returns: undefined }
      check_folder_has_content: { Args: { p_folder_id: number }; Returns: Json }
      get_benchmark_video_narrative_dossier: {
        Args: { p_benchmark_video_id: number }
        Returns: Json
      }
      get_complete_function_ddl: {
        Args: { p_function_name: string }
        Returns: Json
      }
      get_complete_index_ddl: { Args: { p_index_name: string }; Returns: Json }
      get_complete_table_ddl: {
        Args: { p_table_name: string }
        Returns: string
      }
      get_complete_trigger_ddl: {
        Args: { p_trigger_name: string }
        Returns: Json
      }
      get_complete_view_ddl: { Args: { p_view_name: string }; Returns: Json }
      get_folder_descendants: {
        Args: { p_folder_id: number }
        Returns: {
          id: number
        }[]
      }
      get_folder_path: { Args: { p_folder_id: number }; Returns: Json }
      get_narrative_analysis_cluster: {
        Args: { limit_count: number; target_channel_id: string }
        Returns: Json
      }
      get_style_guide_rule: {
        Args: { search_text: string }
        Returns: {
          correct_id: number
          entity_to_standardize: string
        }[]
      }
      get_table_ddl: { Args: { table_name_param: string }; Returns: string }
      get_table_with_sql: { Args: { table_name: string }; Returns: Json }
      list_secrets: {
        Args: never
        Returns: {
          description: string
          name: string
        }[]
      }
      match_project:
        | {
            Args: { filter: Json; match_count: number; query_embedding: string }
            Returns: {
              content: string
              id: string
              metadata: Json
              similarity: number
            }[]
          }
        | {
            Args: {
              match_count?: number
              project_id_arg: string
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              project_id: string
              similarity: number
            }[]
          }
      production_videos_sync_benchmark_transcript: {
        Args: { p_production_video_id?: number }
        Returns: {
          status: string
          title: string
          video_id: number
        }[]
      }
      rebuild_placeholder_enum: { Args: never; Returns: undefined }
      refresh_metrics_views: { Args: never; Returns: undefined }
      structure_accounts_infer_timezone: {
        Args: { p_language: string }
        Returns: string
      }
      structure_credentials_get: {
        Args: { p_identifier: string; p_platform: string }
        Returns: Json
      }
      structure_credentials_save: {
        Args: { p_credentials: Json; p_identifier: string; p_platform: string }
        Returns: boolean
      }
      sync_and_update_status: { Args: never; Returns: undefined }
      sync_benchmark_title_and_update_status: {
        Args: never
        Returns: undefined
      }
      sync_benchmark_title_only: { Args: never; Returns: undefined }
      test_clean_name_system: { Args: { order_id: number }; Returns: boolean }
      test_delete_file: { Args: never; Returns: string }
      test_delete_file_alt: { Args: never; Returns: string }
      test_delete_file_as_service_role: { Args: never; Returns: string }
      test_merge_system: { Args: { product_id: number }; Returns: string }
      test_production_video_segments_webhook: {
        Args: { test_video_id: number }
        Returns: string
      }
      test_revisor_system: { Args: { video_id: number }; Returns: undefined }
      update_vault_secret: {
        Args: { secret_name: string; secret_value: string }
        Returns: Json
      }
      validate_user_email: { Args: { email: string }; Returns: boolean }
    }
    Enums: {
      account_platform_enum:
        | "youtube"
        | "tiktok"
        | "facebook"
        | "instagram"
        | "whatsapp"
        | "email"
        | "blog"
      account_status_enum: "active" | "inactive" | "suspended"
      api_key_status_enum: "available" | "unavailable"
      audio_segment_status:
        | "pending"
        | "processing"
        | "uploading"
        | "completed"
        | "downloaded"
        | "concatenated"
        | "deleted"
      audio_status: "pending" | "to_process" | "to_upload" | "completed"
      channel_search_status: "pending" | "processing" | "completed" | "failed"
      component_status_enum:
        | "active"
        | "testing"
        | "inactive"
        | "error"
        | "maintenance"
      component_type_enum:
        | "function"
        | "trigger"
        | "webhook"
        | "policy"
        | "view"
        | "procedure"
      content_format_enum:
        | "narrated"
        | "musical"
        | "podcast"
        | "storytelling"
        | "documentary"
        | "prayer_narration"
      covering_image_status:
        | "available"
        | "used"
        | "deleted"
        | "generate"
        | "downloaded"
      distribution_platform_enum:
        | "youtube"
        | "tiktok"
        | "facebook"
        | "instagram"
        | "whatsapp"
        | "email"
        | "blog"
      distribution_status_enum:
        | "draft"
        | "pending_review"
        | "approved"
        | "scheduled"
        | "published"
        | "failed"
        | "canceled"
      editing_profile_enum: "standard" | "fast" | "high_quality"
      enrichment_job_status: "pending" | "processing" | "completed" | "failed"
      enrichment_sub_workflow_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      enrichment_task_status: "pending" | "processing" | "completed" | "failed"
      enum_concatenated_audio_status:
        | "pending"
        | "generated"
        | "downloaded"
        | "completed"
        | "deleted"
      keyword_search_status: "pending" | "processing" | "completed" | "failed"
      language_enum:
        | "pt-BR"
        | "en-US"
        | "es-ES"
        | "fr-FR"
        | "de-DE"
        | "it-IT"
        | "ja-JP"
        | "ko-KR"
        | "zh-CN"
        | "ru-RU"
        | "ar-SA"
        | "hi-IN"
        | "en-GB"
        | "en-CA"
        | "en-AU"
        | "es-MX"
        | "es-AR"
        | "pt-PT"
        | "fr-CA"
        | "de-CH"
        | "nl-NL"
        | "tr-TR"
        | "id-ID"
        | "th-TH"
        | "vi-VN"
        | "pl-PL"
        | "sv-SE"
      placeholder_enum:
        | "africanvillagevoices"
        | "avozdarevelacaobiblica"
        | "canal_teste_religiao"
        | "payblackstories"
      privacy_enum: "public" | "unlisted" | "private"
      production_status_enum:
        | "create_title"
        | "create_narrative_premise"
        | "create_script"
        | "create_thumbnail"
        | "create_audio_segments"
        | "create_covering_images"
        | "create_video_segments"
        | "create_concatenated_audios"
        | "create_final_video"
        | "pending_approval"
        | "approved"
        | "scheduled"
        | "published"
        | "in_analysis"
        | "failed"
        | "canceled"
        | "on_hold"
      related_search_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      unified_content_status_enum:
        | "create_title"
        | "create_narrative_premise"
        | "create_script"
        | "create_audio_segments"
        | "create_concatenated_audios"
        | "create_covering_images"
        | "create_video_segments"
        | "create_final_video"
        | "create_thumbnail"
        | "pending_review"
        | "approved"
        | "scheduled"
        | "published"
        | "in_analysis"
        | "failed"
        | "canceled"
      video_production_status:
        | "available"
        | "pending_distribution"
        | "add_to_production"
        | "used"
      video_segment_status: "pending" | "done" | "downloaded" | "used"
      video_segment_status_enum: "pending" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_platform_enum: [
        "youtube",
        "tiktok",
        "facebook",
        "instagram",
        "whatsapp",
        "email",
        "blog",
      ],
      account_status_enum: ["active", "inactive", "suspended"],
      api_key_status_enum: ["available", "unavailable"],
      audio_segment_status: [
        "pending",
        "processing",
        "uploading",
        "completed",
        "downloaded",
        "concatenated",
        "deleted",
      ],
      audio_status: ["pending", "to_process", "to_upload", "completed"],
      channel_search_status: ["pending", "processing", "completed", "failed"],
      component_status_enum: [
        "active",
        "testing",
        "inactive",
        "error",
        "maintenance",
      ],
      component_type_enum: [
        "function",
        "trigger",
        "webhook",
        "policy",
        "view",
        "procedure",
      ],
      content_format_enum: [
        "narrated",
        "musical",
        "podcast",
        "storytelling",
        "documentary",
        "prayer_narration",
      ],
      covering_image_status: [
        "available",
        "used",
        "deleted",
        "generate",
        "downloaded",
      ],
      distribution_platform_enum: [
        "youtube",
        "tiktok",
        "facebook",
        "instagram",
        "whatsapp",
        "email",
        "blog",
      ],
      distribution_status_enum: [
        "draft",
        "pending_review",
        "approved",
        "scheduled",
        "published",
        "failed",
        "canceled",
      ],
      editing_profile_enum: ["standard", "fast", "high_quality"],
      enrichment_job_status: ["pending", "processing", "completed", "failed"],
      enrichment_sub_workflow_status: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      enrichment_task_status: ["pending", "processing", "completed", "failed"],
      enum_concatenated_audio_status: [
        "pending",
        "generated",
        "downloaded",
        "completed",
        "deleted",
      ],
      keyword_search_status: ["pending", "processing", "completed", "failed"],
      language_enum: [
        "pt-BR",
        "en-US",
        "es-ES",
        "fr-FR",
        "de-DE",
        "it-IT",
        "ja-JP",
        "ko-KR",
        "zh-CN",
        "ru-RU",
        "ar-SA",
        "hi-IN",
        "en-GB",
        "en-CA",
        "en-AU",
        "es-MX",
        "es-AR",
        "pt-PT",
        "fr-CA",
        "de-CH",
        "nl-NL",
        "tr-TR",
        "id-ID",
        "th-TH",
        "vi-VN",
        "pl-PL",
        "sv-SE",
      ],
      placeholder_enum: [
        "africanvillagevoices",
        "avozdarevelacaobiblica",
        "canal_teste_religiao",
        "payblackstories",
      ],
      privacy_enum: ["public", "unlisted", "private"],
      production_status_enum: [
        "create_title",
        "create_narrative_premise",
        "create_script",
        "create_thumbnail",
        "create_audio_segments",
        "create_covering_images",
        "create_video_segments",
        "create_concatenated_audios",
        "create_final_video",
        "pending_approval",
        "approved",
        "scheduled",
        "published",
        "in_analysis",
        "failed",
        "canceled",
        "on_hold",
      ],
      related_search_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      unified_content_status_enum: [
        "create_title",
        "create_narrative_premise",
        "create_script",
        "create_audio_segments",
        "create_concatenated_audios",
        "create_covering_images",
        "create_video_segments",
        "create_final_video",
        "create_thumbnail",
        "pending_review",
        "approved",
        "scheduled",
        "published",
        "in_analysis",
        "failed",
        "canceled",
      ],
      video_production_status: [
        "available",
        "pending_distribution",
        "add_to_production",
        "used",
      ],
      video_segment_status: ["pending", "done", "downloaded", "used"],
      video_segment_status_enum: ["pending", "done"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.58.5 (currently installed v2.54.11)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli

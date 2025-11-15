/**
 * Supabase Database Types
 *
 * This file contains TypeScript types for the Supabase database schema.
 * These types are used to provide type safety when working with Supabase clients.
 *
 * To generate these types automatically from your database schema, run:
 * ```bash
 * npx supabase gen types typescript --project-id xlpkabexmwsugkmbngwm > types/supabase.ts
 * ```
 *
 * Or use the Supabase CLI:
 * ```bash
 * supabase gen types typescript --linked > types/supabase.ts
 * ```
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: number
          name: string
          email: string
          image: string
          createdAt: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          image: string
          createdAt?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          image?: string
          createdAt?: string
        }
        Relationships: []
      }
      benchmark_channels: {
        Row: {
          id: number
          channel_id: string
          channel_name: string | null
          description: string | null
          subscriber_count: number | null
          total_views: number | null
          video_upload_count: number | null
          creation_date: string | null
          channel_keywords: Json | null
          metric_date: string | null
          categorization: Json | null
          country: string | null
          custom_url: string | null
          thumbnail_url: string | null
          banner_url: string | null
          is_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          channel_id: string
          channel_name?: string | null
          description?: string | null
          subscriber_count?: number | null
          total_views?: number | null
          video_upload_count?: number | null
          creation_date?: string | null
          channel_keywords?: Json | null
          metric_date?: string | null
          categorization?: Json | null
          country?: string | null
          custom_url?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          channel_id?: string
          channel_name?: string | null
          description?: string | null
          subscriber_count?: number | null
          total_views?: number | null
          video_upload_count?: number | null
          creation_date?: string | null
          channel_keywords?: Json | null
          metric_date?: string | null
          categorization?: Json | null
          country?: string | null
          custom_url?: string | null
          thumbnail_url?: string | null
          banner_url?: string | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      benchmark_videos: {
        Row: {
          id: number
          youtube_video_id: string
          channel_id: string
          title: string | null
          description: string | null
          views: number | null
          likes: number | null
          comments: number | null
          upload_date: string | null
          video_length: string | null
          thumbnail_url: string | null
          tags: Json | null
          categorization: Json | null
          performance_vs_avg_historical: number | null
          performance_vs_median_historical: number | null
          performance_vs_recent_14d: number | null
          performance_vs_recent_30d: number | null
          performance_vs_recent_90d: number | null
          is_outlier: boolean | null
          outlier_threshold: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          youtube_video_id: string
          channel_id: string
          title?: string | null
          description?: string | null
          views?: number | null
          likes?: number | null
          comments?: number | null
          upload_date?: string | null
          video_length?: string | null
          thumbnail_url?: string | null
          tags?: Json | null
          categorization?: Json | null
          performance_vs_avg_historical?: number | null
          performance_vs_median_historical?: number | null
          performance_vs_recent_14d?: number | null
          performance_vs_recent_30d?: number | null
          performance_vs_recent_90d?: number | null
          is_outlier?: boolean | null
          outlier_threshold?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          youtube_video_id?: string
          channel_id?: string
          title?: string | null
          description?: string | null
          views?: number | null
          likes?: number | null
          comments?: number | null
          upload_date?: string | null
          video_length?: string | null
          thumbnail_url?: string | null
          tags?: Json | null
          categorization?: Json | null
          performance_vs_avg_historical?: number | null
          performance_vs_median_historical?: number | null
          performance_vs_recent_14d?: number | null
          performance_vs_recent_30d?: number | null
          performance_vs_recent_90d?: number | null
          is_outlier?: boolean | null
          outlier_threshold?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      benchmark_channels_baseline_stats: {
        Row: {
          id: number
          channel_id: string
          total_views_14d: number | null
          videos_count_14d: number | null
          avg_views_per_video_14d: number | null
          median_views_per_video_14d: number | null
          std_dev_views_14d: number | null
          total_views_30d: number | null
          videos_count_30d: number | null
          avg_views_per_video_30d: number | null
          median_views_per_video_30d: number | null
          std_dev_views_30d: number | null
          total_views_90d: number | null
          videos_count_90d: number | null
          avg_views_per_video_90d: number | null
          median_views_per_video_90d: number | null
          std_dev_views_90d: number | null
          total_views_historical: number | null
          videos_count_historical: number | null
          avg_views_per_video_historical: number | null
          median_views_per_video_historical: number | null
          std_dev_views_historical: number | null
          calculated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          channel_id: string
          total_views_14d?: number | null
          videos_count_14d?: number | null
          avg_views_per_video_14d?: number | null
          median_views_per_video_14d?: number | null
          std_dev_views_14d?: number | null
          total_views_30d?: number | null
          videos_count_30d?: number | null
          avg_views_per_video_30d?: number | null
          median_views_per_video_30d?: number | null
          std_dev_views_30d?: number | null
          total_views_90d?: number | null
          videos_count_90d?: number | null
          avg_views_per_video_90d?: number | null
          median_views_per_video_90d?: number | null
          std_dev_views_90d?: number | null
          total_views_historical?: number | null
          videos_count_historical?: number | null
          avg_views_per_video_historical?: number | null
          median_views_per_video_historical?: number | null
          std_dev_views_historical?: number | null
          calculated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          channel_id?: string
          total_views_14d?: number | null
          videos_count_14d?: number | null
          avg_views_per_video_14d?: number | null
          median_views_per_video_14d?: number | null
          std_dev_views_14d?: number | null
          total_views_30d?: number | null
          videos_count_30d?: number | null
          avg_views_per_video_30d?: number | null
          median_views_per_video_30d?: number | null
          std_dev_views_30d?: number | null
          total_views_90d?: number | null
          videos_count_90d?: number | null
          avg_views_per_video_90d?: number | null
          median_views_per_video_90d?: number | null
          std_dev_views_90d?: number | null
          total_views_historical?: number | null
          videos_count_historical?: number | null
          avg_views_per_video_historical?: number | null
          median_views_per_video_historical?: number | null
          std_dev_views_historical?: number | null
          calculated_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      channel_enrichment_jobs: {
        Row: {
          id: number
          keyword_search_id: string | null
          channel_ids: Json
          total_channels: number
          channels_completed: number
          channels_failed: number | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          keyword_search_id?: string | null
          channel_ids: Json
          total_channels: number
          channels_completed?: number
          channels_failed?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          keyword_search_id?: string | null
          channel_ids?: Json
          total_channels?: number
          channels_completed?: number
          channels_failed?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      channel_enrichment_tasks: {
        Row: {
          id: number
          enrichment_job_id: number
          channel_id: string
          overall_status: 'pending' | 'processing' | 'completed' | 'failed'
          categorization_status: 'pending' | 'processing' | 'completed' | 'failed'
          categorization_result: Json | null
          categorization_error: string | null
          categorization_started_at: string | null
          categorization_completed_at: string | null
          socialblade_status: 'pending' | 'processing' | 'completed' | 'failed'
          socialblade_result: Json | null
          socialblade_error: string | null
          socialblade_started_at: string | null
          socialblade_completed_at: string | null
          fetch_videos_status: 'pending' | 'processing' | 'completed' | 'failed'
          fetch_videos_result: Json | null
          fetch_videos_error: string | null
          fetch_videos_started_at: string | null
          fetch_videos_completed_at: string | null
          baseline_stats_status: 'pending' | 'processing' | 'completed' | 'failed'
          baseline_stats_result: Json | null
          baseline_stats_error: string | null
          baseline_stats_started_at: string | null
          baseline_stats_completed_at: string | null
          outlier_analysis_status: 'pending' | 'processing' | 'completed' | 'failed'
          outlier_analysis_result: Json | null
          outlier_analysis_error: string | null
          outlier_analysis_started_at: string | null
          outlier_analysis_completed_at: string | null
          retry_count: number
          last_error: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          enrichment_job_id: number
          channel_id: string
          overall_status?: 'pending' | 'processing' | 'completed' | 'failed'
          categorization_status?: 'pending' | 'processing' | 'completed' | 'failed'
          categorization_result?: Json | null
          categorization_error?: string | null
          categorization_started_at?: string | null
          categorization_completed_at?: string | null
          socialblade_status?: 'pending' | 'processing' | 'completed' | 'failed'
          socialblade_result?: Json | null
          socialblade_error?: string | null
          socialblade_started_at?: string | null
          socialblade_completed_at?: string | null
          fetch_videos_status?: 'pending' | 'processing' | 'completed' | 'failed'
          fetch_videos_result?: Json | null
          fetch_videos_error?: string | null
          fetch_videos_started_at?: string | null
          fetch_videos_completed_at?: string | null
          baseline_stats_status?: 'pending' | 'processing' | 'completed' | 'failed'
          baseline_stats_result?: Json | null
          baseline_stats_error?: string | null
          baseline_stats_started_at?: string | null
          baseline_stats_completed_at?: string | null
          outlier_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed'
          outlier_analysis_result?: Json | null
          outlier_analysis_error?: string | null
          outlier_analysis_started_at?: string | null
          outlier_analysis_completed_at?: string | null
          retry_count?: number
          last_error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          enrichment_job_id?: number
          channel_id?: string
          overall_status?: 'pending' | 'processing' | 'completed' | 'failed'
          categorization_status?: 'pending' | 'processing' | 'completed' | 'failed'
          categorization_result?: Json | null
          categorization_error?: string | null
          categorization_started_at?: string | null
          categorization_completed_at?: string | null
          socialblade_status?: 'pending' | 'processing' | 'completed' | 'failed'
          socialblade_result?: Json | null
          socialblade_error?: string | null
          socialblade_started_at?: string | null
          socialblade_completed_at?: string | null
          fetch_videos_status?: 'pending' | 'processing' | 'completed' | 'failed'
          fetch_videos_result?: Json | null
          fetch_videos_error?: string | null
          fetch_videos_started_at?: string | null
          fetch_videos_completed_at?: string | null
          baseline_stats_status?: 'pending' | 'processing' | 'completed' | 'failed'
          baseline_stats_result?: Json | null
          baseline_stats_error?: string | null
          baseline_stats_started_at?: string | null
          baseline_stats_completed_at?: string | null
          outlier_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed'
          outlier_analysis_result?: Json | null
          outlier_analysis_error?: string | null
          outlier_analysis_started_at?: string | null
          outlier_analysis_completed_at?: string | null
          retry_count?: number
          last_error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'channel_enrichment_tasks_enrichment_job_id_fkey'
            columns: ['enrichment_job_id']
            referencedRelation: 'channel_enrichment_jobs'
            referencedColumns: ['id']
          }
        ]
      }
      production_webhooks: {
        Row: {
          id: number
          name: string
          webhook_url: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          webhook_url: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          webhook_url?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: number
          webhook_id: number | null
          video_count: number
          video_ids: number[]
          status: 'success' | 'failed' | 'partial' | null
          response_code: number | null
          response_body: string | null
          error_message: string | null
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          id?: number
          webhook_id?: number | null
          video_count: number
          video_ids: number[]
          status?: 'success' | 'failed' | 'partial' | null
          response_code?: number | null
          response_body?: string | null
          error_message?: string | null
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          id?: number
          webhook_id?: number | null
          video_count?: number
          video_ids?: number[]
          status?: 'success' | 'failed' | 'partial' | null
          response_code?: number | null
          response_body?: string | null
          error_message?: string | null
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'webhook_logs_webhook_id_fkey'
            columns: ['webhook_id']
            referencedRelation: 'production_webhooks'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      enrichment_job_status: 'pending' | 'processing' | 'completed' | 'failed'
      enrichment_task_status: 'pending' | 'processing' | 'completed' | 'failed'
      enrichment_sub_workflow_status: 'pending' | 'processing' | 'completed' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

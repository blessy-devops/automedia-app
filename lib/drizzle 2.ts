import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  bigint,
  integer,
  timestamp,
  date,
  interval,
  jsonb,
  uniqueIndex,
  index,
  real,
  boolean,
} from 'drizzle-orm/pg-core'
import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Configuração de conexões com Supabase
// Shared pooler para queries rápidas
const sqlPooled = postgres(process.env.DATABASE_URL!, { prepare: false })

// Direct connection para workflows complexos (IA, APIs externas)
const sqlDirect = postgres(process.env.DATABASE_URL_DIRECT!, { prepare: false })

// Mantém compatibilidade com código legado
const sql = sqlPooled

// ============================================================================
// ENUMS - Channel Benchmark Module
// ============================================================================

export const enrichmentJobStatusEnum = pgEnum('enrichment_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const enrichmentTaskStatusEnum = pgEnum('enrichment_task_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const enrichmentSubWorkflowStatusEnum = pgEnum('enrichment_sub_workflow_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

// ============================================================================
// TABLES - Channel Benchmark Module
// ============================================================================

/**
 * Tabela benchmark_channels
 * Armazena dados dos canais do YouTube para benchmark
 */
export const benchmarkChannelsTable = pgTable(
  'benchmark_channels',
  {
    id: serial('id').primaryKey(),
    channelId: varchar('channel_id', { length: 255 }).notNull().unique(),
    channelName: text('channel_name'),
    description: text('description'),
    subscriberCount: bigint('subscriber_count', { mode: 'number' }),
    totalViews: bigint('total_views', { mode: 'number' }),
    videoUploadCount: integer('video_upload_count'),
    creationDate: timestamp('creation_date', { withTimezone: true }),
    channelKeywords: jsonb('channel_keywords').$type<string[]>(),
    metricDate: date('metric_date'),
    categorization: jsonb('categorization').$type<{
      niche?: string
      subniche?: string
      microniche?: string
      category?: string
      format?: string
    }>(),
    country: varchar('country', { length: 10 }),
    customUrl: varchar('custom_url', { length: 255 }),
    thumbnailUrl: text('thumbnail_url'),
    bannerUrl: text('banner_url'),
    isVerified: boolean('is_verified').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      channelIdIdx: uniqueIndex('benchmark_channels_channel_id_idx').on(table.channelId),
      metricDateIdx: index('benchmark_channels_metric_date_idx').on(table.metricDate),
      subscriberCountIdx: index('benchmark_channels_subscriber_count_idx').on(table.subscriberCount),
    }
  }
)

export type BenchmarkChannel = InferSelectModel<typeof benchmarkChannelsTable>
export type NewBenchmarkChannel = InferInsertModel<typeof benchmarkChannelsTable>

/**
 * Tabela benchmark_videos
 * Armazena dados dos vídeos do YouTube para análise de performance
 */
export const benchmarkVideosTable = pgTable(
  'benchmark_videos',
  {
    id: serial('id').primaryKey(),
    youtubeVideoId: varchar('youtube_video_id', { length: 255 }).notNull().unique(),
    channelId: varchar('channel_id', { length: 255 }).notNull(),
    title: text('title'),
    description: text('description'),
    views: bigint('views', { mode: 'number' }),
    likes: bigint('likes', { mode: 'number' }),
    comments: integer('comments'),
    uploadDate: timestamp('upload_date', { withTimezone: true }),
    videoLength: interval('video_length'),
    thumbnailUrl: text('thumbnail_url'),
    tags: jsonb('tags').$type<string[]>(),
    categorization: jsonb('categorization').$type<{
      primary_category?: string
      secondary_categories?: string[]
      content_type?: string
      format?: string
    }>(),
    // Outlier scores para performance do vídeo
    performanceVsAvgHistorical: real('performance_vs_avg_historical'),
    performanceVsMedianHistorical: real('performance_vs_median_historical'),
    performanceVsRecent14d: real('performance_vs_recent_14d'),
    performanceVsRecent30d: real('performance_vs_recent_30d'),
    performanceVsRecent90d: real('performance_vs_recent_90d'),
    // Metadados adicionais
    isOutlier: boolean('is_outlier').default(false),
    outlierThreshold: real('outlier_threshold'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      videoIdIdx: uniqueIndex('benchmark_videos_youtube_video_id_idx').on(table.youtubeVideoId),
      channelIdIdx: index('benchmark_videos_channel_id_idx').on(table.channelId),
      uploadDateIdx: index('benchmark_videos_upload_date_idx').on(table.uploadDate),
      viewsIdx: index('benchmark_videos_views_idx').on(table.views),
      isOutlierIdx: index('benchmark_videos_is_outlier_idx').on(table.isOutlier),
    }
  }
)

export type BenchmarkVideo = InferSelectModel<typeof benchmarkVideosTable>
export type NewBenchmarkVideo = InferInsertModel<typeof benchmarkVideosTable>

/**
 * Tabela benchmark_channels_baseline_stats
 * Armazena estatísticas baseline de canais em diferentes períodos (14d, 30d, 90d)
 */
export const benchmarkChannelsBaselineStatsTable = pgTable(
  'benchmark_channels_baseline_stats',
  {
    id: serial('id').primaryKey(),
    channelId: varchar('channel_id', { length: 255 }).notNull(),
    // Estatísticas 14 dias
    totalViews14d: bigint('total_views_14d', { mode: 'number' }),
    videosCount14d: integer('videos_count_14d'),
    avgViewsPerVideo14d: real('avg_views_per_video_14d'),
    medianViewsPerVideo14d: real('median_views_per_video_14d'),
    stdDevViews14d: real('std_dev_views_14d'),
    // Estatísticas 30 dias
    totalViews30d: bigint('total_views_30d', { mode: 'number' }),
    videosCount30d: integer('videos_count_30d'),
    avgViewsPerVideo30d: real('avg_views_per_video_30d'),
    medianViewsPerVideo30d: real('median_views_per_video_30d'),
    stdDevViews30d: real('std_dev_views_30d'),
    // Estatísticas 90 dias
    totalViews90d: bigint('total_views_90d', { mode: 'number' }),
    videosCount90d: integer('videos_count_90d'),
    avgViewsPerVideo90d: real('avg_views_per_video_90d'),
    medianViewsPerVideo90d: real('median_views_per_video_90d'),
    stdDevViews90d: real('std_dev_views_90d'),
    // Estatísticas históricas gerais
    totalViewsHistorical: bigint('total_views_historical', { mode: 'number' }),
    videosCountHistorical: integer('videos_count_historical'),
    avgViewsPerVideoHistorical: real('avg_views_per_video_historical'),
    medianViewsPerVideoHistorical: real('median_views_per_video_historical'),
    stdDevViewsHistorical: real('std_dev_views_historical'),
    // Metadados
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      channelIdIdx: index('baseline_stats_channel_id_idx').on(table.channelId),
      calculatedAtIdx: index('baseline_stats_calculated_at_idx').on(table.calculatedAt),
    }
  }
)

export type BenchmarkChannelBaselineStats = InferSelectModel<typeof benchmarkChannelsBaselineStatsTable>
export type NewBenchmarkChannelBaselineStats = InferInsertModel<typeof benchmarkChannelsBaselineStatsTable>

/**
 * Tabela channel_enrichment_jobs
 * Rastreia jobs de enriquecimento de canais em batch
 */
export const channelEnrichmentJobsTable = pgTable(
  'channel_enrichment_jobs',
  {
    id: serial('id').primaryKey(),
    keywordSearchId: varchar('keyword_search_id', { length: 255 }),
    channelIds: jsonb('channel_ids').$type<string[]>().notNull(),
    totalChannels: integer('total_channels').notNull(),
    channelsCompleted: integer('channels_completed').default(0).notNull(),
    channelsFailed: integer('channels_failed').default(0),
    status: enrichmentJobStatusEnum('status').default('pending').notNull(),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      statusIdx: index('enrichment_jobs_status_idx').on(table.status),
      keywordSearchIdx: index('enrichment_jobs_keyword_search_idx').on(table.keywordSearchId),
      createdAtIdx: index('enrichment_jobs_created_at_idx').on(table.createdAt),
    }
  }
)

export type ChannelEnrichmentJob = InferSelectModel<typeof channelEnrichmentJobsTable>
export type NewChannelEnrichmentJob = InferInsertModel<typeof channelEnrichmentJobsTable>

/**
 * Tabela channel_enrichment_tasks
 * Rastreia o progresso de cada canal individual através dos 5 sub-workflows
 * Esta é a tabela mais complexa do módulo, com status granular para cada etapa
 */
export const channelEnrichmentTasksTable = pgTable(
  'channel_enrichment_tasks',
  {
    id: serial('id').primaryKey(),
    enrichmentJobId: integer('enrichment_job_id').notNull(),
    channelId: varchar('channel_id', { length: 255 }).notNull(),

    // Status geral da task
    overallStatus: enrichmentTaskStatusEnum('overall_status').default('pending').notNull(),

    // Sub-workflow 1: Categorização do Canal (Claude AI)
    categorizationStatus: enrichmentSubWorkflowStatusEnum('categorization_status').default('pending').notNull(),
    categorizationResult: jsonb('categorization_result').$type<{
      primary_category?: string
      secondary_categories?: string[]
      tags?: string[]
      content_type?: string
      analysis?: string
    }>(),
    categorizationError: text('categorization_error'),
    categorizationStartedAt: timestamp('categorization_started_at', { withTimezone: true }),
    categorizationCompletedAt: timestamp('categorization_completed_at', { withTimezone: true }),

    // Sub-workflow 2: Scraping SocialBlade
    socialbladeStatus: enrichmentSubWorkflowStatusEnum('socialblade_status').default('pending').notNull(),
    socialbladeResult: jsonb('socialblade_result').$type<{
      rank?: number
      grade?: string
      subscribers_rank?: number
      video_views_rank?: number
      country_rank?: number
      estimated_monthly_earnings?: { min: number; max: number }
      raw_data?: Record<string, any>
    }>(),
    socialbladeError: text('socialblade_error'),
    socialbladeStartedAt: timestamp('socialblade_started_at', { withTimezone: true }),
    socialbladeCompletedAt: timestamp('socialblade_completed_at', { withTimezone: true }),

    // Sub-workflow 3: Fetch Videos (YouTube Data API)
    fetchVideosStatus: enrichmentSubWorkflowStatusEnum('fetch_videos_status').default('pending').notNull(),
    fetchVideosResult: jsonb('fetch_videos_result').$type<{
      total_videos_fetched?: number
      video_ids?: string[]
      fetch_date?: string
    }>(),
    fetchVideosError: text('fetch_videos_error'),
    fetchVideosStartedAt: timestamp('fetch_videos_started_at', { withTimezone: true }),
    fetchVideosCompletedAt: timestamp('fetch_videos_completed_at', { withTimezone: true }),

    // Sub-workflow 4: Cálculo de Baseline Stats
    baselineStatsStatus: enrichmentSubWorkflowStatusEnum('baseline_stats_status').default('pending').notNull(),
    baselineStatsResult: jsonb('baseline_stats_result').$type<{
      stats_calculated?: boolean
      periods?: string[]
      stats_id?: number
    }>(),
    baselineStatsError: text('baseline_stats_error'),
    baselineStatsStartedAt: timestamp('baseline_stats_started_at', { withTimezone: true }),
    baselineStatsCompletedAt: timestamp('baseline_stats_completed_at', { withTimezone: true }),

    // Sub-workflow 5: Análise de Outliers
    outlierAnalysisStatus: enrichmentSubWorkflowStatusEnum('outlier_analysis_status').default('pending').notNull(),
    outlierAnalysisResult: jsonb('outlier_analysis_result').$type<{
      outliers_found?: number
      outlier_video_ids?: string[]
      analysis_date?: string
    }>(),
    outlierAnalysisError: text('outlier_analysis_error'),
    outlierAnalysisStartedAt: timestamp('outlier_analysis_started_at', { withTimezone: true }),
    outlierAnalysisCompletedAt: timestamp('outlier_analysis_completed_at', { withTimezone: true }),

    // Metadados gerais
    retryCount: integer('retry_count').default(0).notNull(),
    lastError: text('last_error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      jobIdIdx: index('enrichment_tasks_job_id_idx').on(table.enrichmentJobId),
      channelIdIdx: index('enrichment_tasks_channel_id_idx').on(table.channelId),
      overallStatusIdx: index('enrichment_tasks_overall_status_idx').on(table.overallStatus),
      categorizationStatusIdx: index('enrichment_tasks_categorization_status_idx').on(table.categorizationStatus),
      socialbladeStatusIdx: index('enrichment_tasks_socialblade_status_idx').on(table.socialbladeStatus),
      fetchVideosStatusIdx: index('enrichment_tasks_fetch_videos_status_idx').on(table.fetchVideosStatus),
      baselineStatsStatusIdx: index('enrichment_tasks_baseline_stats_status_idx').on(table.baselineStatsStatus),
      outlierAnalysisStatusIdx: index('enrichment_tasks_outlier_analysis_status_idx').on(table.outlierAnalysisStatus),
    }
  }
)

export type ChannelEnrichmentTask = InferSelectModel<typeof channelEnrichmentTasksTable>
export type NewChannelEnrichmentTask = InferInsertModel<typeof channelEnrichmentTasksTable>

// ============================================================================
// TABLES - Structure Categorization Module
// ============================================================================

/**
 * Tabela structure_categorization_niches
 * Armazena os nichos disponíveis para categorização de canais
 */
export const structureCategorizationNichesTable = pgTable('structure_categorization_niches', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type StructureCategorizationNiche = InferSelectModel<typeof structureCategorizationNichesTable>

/**
 * Tabela structure_categorization_subniches
 * Armazena os subnichos disponíveis para categorização de canais
 */
export const structureCategorizationSubnichesTable = pgTable('structure_categorization_subniches', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type StructureCategorizationSubniche = InferSelectModel<typeof structureCategorizationSubnichesTable>

/**
 * Tabela structure_categorization_categories
 * Armazena as categorias disponíveis para categorização de canais
 */
export const structureCategorizationCategoriesTable = pgTable('structure_categorization_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type StructureCategorizationCategory = InferSelectModel<typeof structureCategorizationCategoriesTable>

/**
 * Tabela structure_categorization_formats
 * Armazena os formatos disponíveis para categorização de canais
 */
export const structureCategorizationFormatsTable = pgTable('structure_categorization_formats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type StructureCategorizationFormat = InferSelectModel<typeof structureCategorizationFormatsTable>

/**
 * Tabela structure_categorization_microniches
 * Armazena os micronichos disponíveis para categorização de canais
 */
export const structureCategorizationMicronichesTable = pgTable('structure_categorization_microniches', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type StructureCategorizationMicroniche = InferSelectModel<typeof structureCategorizationMicronichesTable>

export const UsersTable = pgTable(
  'profiles',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    image: text('image').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex('unique_idx').on(users.email),
    }
  }
)

export type User = InferSelectModel<typeof UsersTable>
export type NewUser = InferInsertModel<typeof UsersTable>

// ============================================================================
// DATABASE CONNECTIONS
// ============================================================================

/**
 * db - Conexão padrão usando shared pooler
 * Use para: Queries rápidas, CRUD padrão, operações síncronas
 */
export const db = drizzle(sqlPooled)

/**
 * dbDirect - Conexão direta ao banco
 * Use para: Workflows complexos, chamadas IA, APIs externas, operações longas
 *
 * Exemplo:
 * ```ts
 * // Para workflows de enrichment que podem demorar
 * import { dbDirect } from '@/lib/drizzle'
 * const result = await dbDirect.select().from(channelEnrichmentTasksTable)
 * ```
 */
export const dbDirect = drizzle(sqlDirect)

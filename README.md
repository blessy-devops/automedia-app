# AutoMedia Platform

**Next.js 15** application for YouTube channel benchmark and enrichment pipeline with AI-powered categorization.

[![GitHub](https://img.shields.io/badge/GitHub-blessy--devops%2Fautomedia--app-blue?logo=github)](https://github.com/blessy-devops/automedia-app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)

## 🚀 Features

- **5-Step Enrichment Pipeline** with AI categorization
- **Real-time Progress Monitoring** via Supabase Realtime
- **Structured Taxonomy** (niche → subniche → microniche → category → format)
- **n8n Compatible** - 100% aligned with existing workflow
- **Cost Optimized** - Pre-flight checks skip already-categorized channels

## ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/blessy-devops/automedia-app.git
cd automedia-app

# 2. Install
pnpm install

# 3. Configure .env
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Run
pnpm dev
```

Visit [http://localhost:3003/benchmark/channels](http://localhost:3003/benchmark/channels)

## 📋 Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- RapidAPI key (YouTube Data API)
- OpenRouter API key

## 📚 Documentation

- **[CATEGORIZATION_N8N_ALIGNMENT.md](./CATEGORIZATION_N8N_ALIGNMENT.md)** - n8n workflow alignment
- **[PIPELINE_IMPLEMENTATION_SUMMARY.md](./PIPELINE_IMPLEMENTATION_SUMMARY.md)** - Implementation overview
- **[EDGE_FUNCTIONS_DEPLOYMENT.md](./EDGE_FUNCTIONS_DEPLOYMENT.md)** - Deployment guide
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase configuration

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Real-time**: Supabase Realtime
- **Edge Functions**: Deno
- **AI**: OpenRouter API (GPT-4o-mini)

## 🔄 Pipeline Flow

```
User submits Channel ID
    ↓
enrichment-pipeline-starter
    ↓ Fetches channel details from RapidAPI
    ↓
enrichment-step-1-categorization ✅ COMPLETE
    ↓ AI-powered categorization with n8n taxonomy
    ↓
enrichment-step-2-socialblade 🚧 STUB
    ↓ SocialBlade metrics
    ↓
enrichment-step-3-fetch-videos 🚧 STUB
    ↓ Video fetching
    ↓
enrichment-step-4-baseline-stats 🚧 STUB
    ↓ Performance baselines
    ↓
enrichment-step-5-outlier-analysis 🚧 STUB
    ↓ Outlier detection
    ↓
Pipeline Complete! ✅
```

## 🎯 Categorization Example

```json
{
  "niche": "technology",
  "subniche": "web_development",
  "microniche": "fast_paced_tutorials",
  "category": "tutorial",
  "format": "screen_recording"
}
```

## 💰 Performance

- **Latency**: 2-5s (new) | ~100ms (skip)
- **Cost**: ~$0.0013/channel (new) | $0 (skip)
- **Savings**: 50% on re-categorization with pre-flight check

## 🧪 Testing

```bash
# 1. Navigate to benchmark page
open http://localhost:3003/benchmark/channels

# 2. Enter Channel ID
# Example: UCuAXFkgsw1L7xaCfnd5JJOw (Fireship)

# 3. Monitor logs
supabase functions logs enrichment-step-1-categorization --follow
```

## 📦 Deployment

### Deploy Edge Functions

```bash
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

### Set Secrets

```bash
supabase secrets set rapidapi_key_1760651731629=YOUR_KEY --project-ref YOUR_PROJECT_REF
supabase secrets set openrouter_key_1760655833491=YOUR_KEY --project-ref YOUR_PROJECT_REF
```

## 📄 License

MIT

---

**Built with ❤️ using [Claude Code](https://claude.com/claude-code)**

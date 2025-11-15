# Vercel Python Function Debug - SocialBlade Scraper

## Contexto do Projeto

Estamos desenvolvendo uma plataforma de análise de canais do YouTube que possui um pipeline de enrichment em 6 etapas. Uma dessas etapas (Step 2) requer scraping de métricas do SocialBlade usando Playwright.

### Arquitetura Atual

- **Frontend/Backend:** Next.js 15.5.6 hospedado no Vercel
- **Database/Edge Functions:** Supabase (PostgreSQL + Deno Edge Functions)
- **Pipeline:** Supabase Edge Functions orquestram o fluxo de enrichment
- **SocialBlade Scraper:** Tentando deployar como Vercel Python Function

## O Problema

Precisamos de uma Vercel Python Serverless Function que:

1. Recebe requisições POST com `{"channelId": "UCxxxxx"}`
2. Usa **Playwright** para fazer scraping do SocialBlade
3. Retorna dados estruturados em JSON
4. Tem autenticação via Bearer token
5. **Timeout de 60 segundos** (scraping demora ~15s)

### URL Esperada

```
POST https://automedia-app.vercel.app/api/scrape_socialblade
```

### Request Example

```bash
curl -X POST https://automedia-app.vercel.app/api/scrape_socialblade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sb_secret_2024_automedia_platform_secure_token_xyz123" \
  -d '{"channelId": "UCuAXFkgsw1L7xaCfnd5JJOw"}'
```

### Response Expected

```json
{
  "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
  "dailyStats": [
    {
      "views": 1234567,
      "videosPosted": 2,
      "hasNewVideo": true
    }
  ]
}
```

## Estado Atual do Código

### Estrutura de Arquivos

```
automedia/
├── api/
│   ├── scrape_socialblade.py    # Tentativa atual
│   └── requirements.txt
├── vercel.json
└── ... (resto do projeto Next.js)
```

### api/scrape_socialblade.py (Versão Atual - NÃO FUNCIONA)

```python
from http.server import BaseHTTPRequestHandler
from playwright.sync_api import sync_playwright
import json
import os

def handler(request):
    # Only allow POST requests
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Check authorization
    secret = os.environ.get('SOCIALBLADE_API_SECRET')
    if not secret:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'SOCIALBLADE_API_SECRET not configured'})
        }

    auth_header = request.headers.get('authorization', '')
    if not auth_header or auth_header != f"Bearer {secret}":
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized'})
        }

    # Parse request body
    try:
        body = json.loads(request.body)
        channel_id = body.get('channelId')

        if not channel_id or len(channel_id) < 10:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid channelId'})
            }
    except:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON body'})
        }

    # Scrape SocialBlade
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            url = f"https://socialblade.com/youtube/channel/{channel_id}"
            page.goto(url, wait_until='domcontentloaded')
            page.wait_for_timeout(15000)

            daily_stats = []
            table = page.query_selector('table')

            if table:
                rows = table.query_selector_all('tbody tr')

                for i in range(min(len(rows), 14)):
                    row = rows[i]
                    cells = row.query_selector_all('td')

                    if len(cells) >= 6:
                        # Views (column 3)
                        views_text = cells[3].inner_text().strip()

                        # Videos posted (column 5)
                        videos_text = cells[5].inner_text().strip()
                        class_attr = cells[5].get_attribute('class') or ''

                        if views_text and views_text != '--':
                            views_num = int(''.join(filter(str.isdigit, views_text)))

                            videos_count = 0
                            if videos_text and videos_text != '--':
                                videos_clean = ''.join(filter(str.isdigit, videos_text))
                                if videos_clean:
                                    videos_count = int(videos_clean)

                            has_new_video = 'positive' in class_attr

                            if views_num > 100:
                                daily_stats.append({
                                    'views': views_num,
                                    'videosPosted': videos_count,
                                    'hasNewVideo': has_new_video
                                })

            browser.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'channelId': channel_id,
                    'dailyStats': daily_stats
                })
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Scraping failed: {str(e)}'})
        }
```

### api/requirements.txt

```
playwright==1.40.0
```

### vercel.json

```json
{
  "functions": {
    "api/scrape_socialblade.py": {
      "maxDuration": 60
    }
  },
  "build": {
    "env": {
      "PLAYWRIGHT_BROWSERS_PATH": "0"
    }
  }
}
```

### Environment Variables Configuradas no Vercel

```
SOCIALBLADE_API_SECRET=sb_secret_2024_automedia_platform_secure_token_xyz123
```

## Sintomas do Problema

1. **Deploy bem-sucedido**, sem erros de build
2. **Deployment URL:** `https://automedia-5mypjgb2r-davi-useblessycos-projects.vercel.app`
3. **Deployment Protection:** DESABILITADO (não tem mais autenticação SSO do Vercel)
4. **Erro ao acessar:** `HTTP 405 Method Not Allowed`

### Comportamento Observado

```bash
# GET request retorna erro 500 (Next.js Internal Server Error)
$ curl https://automedia-5mypjgb2r-davi-useblessycos-projects.vercel.app/api/scrape_socialblade
<!DOCTYPE html><html>...500: Internal Server Error...</html>

# POST request retorna erro 405
$ curl -X POST https://automedia-5mypjgb2r-davi-useblessycos-projects.vercel.app/api/scrape_socialblade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sb_secret_2024_automedia_platform_secure_token_xyz123" \
  -d '{"channelId":"UCuAXFkgsw1L7xaCfnd5JJOw"}'
# HTTP 405
```

## Tentativas Anteriores (Todas Falharam)

### Tentativa 1: FastAPI + Vercel
- **Arquivo:** `api/scrape_socialblade.py` com FastAPI
- **Resultado:** 405 Method Not Allowed
- **Problema:** Vercel não suporta FastAPI diretamente em Serverless Functions

### Tentativa 2: Estrutura de Pasta `api/scrape_socialblade/index.py`
- **Arquivo:** `api/scrape_socialblade/index.py`
- **Resultado:** Build error - padrão não encontrado
- **Problema:** Vercel não reconheceu a estrutura de pasta para Python

### Tentativa 3: Handler Simplificado (Atual)
- **Arquivo:** `api/scrape_socialblade.py` com `def handler(request)`
- **Resultado:** 405 Method Not Allowed
- **Problema:** Possivelmente signature incorreta do handler ou Playwright não suportado

## Dúvidas Críticas

1. **Handler Signature:** Qual é a assinatura correta para Vercel Python Functions?
   - `def handler(request)` ?
   - `def handler(request, response)` ?
   - Herdar de `BaseHTTPRequestHandler` ?

2. **Playwright Support:** Vercel Serverless Functions suportam Playwright em Python?
   - Chromium binaries são instalados automaticamente?
   - Precisa de configuração adicional de runtime?
   - Há limitações de memória/CPU para browser headless?

3. **Request Parsing:** Como acessar corretamente:
   - `request.method`
   - `request.headers`
   - `request.body` (JSON parsing)

4. **Response Format:** Qual formato de resposta o Vercel espera?
   - Dict com `statusCode`, `headers`, `body`?
   - Objeto Response customizado?
   - Apenas retornar string?

## Referências Relevantes

- **Vercel Python Docs:** https://vercel.com/docs/functions/runtimes/python
- **Playwright Python:** https://playwright.dev/python/docs/intro
- **Deployment URL atual:** https://automedia-5mypjgb2r-davi-useblessycos-projects.vercel.app
- **Project Vercel:** automedia-app (davi-useblessycos-projects)

## O Que Precisamos

**Uma Vercel Python Serverless Function funcional que:**

1. ✅ Aceita POST requests com JSON body
2. ✅ Valida Authorization Bearer token
3. ✅ Usa Playwright para scraping (headless Chromium)
4. ✅ Retorna JSON estruturado
5. ✅ Funciona com timeout de 60 segundos
6. ✅ Deploy bem-sucedido sem erros 405

## Informações Adicionais

- **Next.js Version:** 15.5.6
- **Node Version:** 22.x (usado pelo projeto)
- **Python Version:** (default do Vercel - 3.9?)
- **Package Manager:** pnpm
- **Git:** Projeto não tem Git configurado (deploy via Vercel CLI)

---

**Pergunta Principal:** Como corrigir o erro 405 e fazer a Vercel Python Function funcionar corretamente com Playwright?

**Alternativa considerada:** Migrar para Supabase Edge Function (Deno + Playwright), mas preferimos manter no Vercel se possível por questões de custo e simplicidade.

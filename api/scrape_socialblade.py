from fastapi import FastAPI, Request, HTTPException
from playwright.async_api import async_playwright
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List

# Carrega variáveis de ambiente
load_dotenv()

# Cria instância do FastAPI
app = FastAPI()

# Modelos de dados
class ScrapeRequest(BaseModel):
    channelId: str

class DailyStat(BaseModel):
    views: int
    videosPosted: int  # Número de vídeos postados naquele dia
    hasNewVideo: bool  # Flag indicando se houve postagem

class ScrapeResponse(BaseModel):
    channelId: str
    dailyStats: List[DailyStat]

@app.post("/api/scrape_socialblade", response_model=ScrapeResponse)
async def scrape_channel(request: Request, body: ScrapeRequest):
    """
    Scrape Social Blade data for a YouTube channel.

    This endpoint extracts daily views and video posting data from Social Blade.
    It returns raw scraped data without performing any calculations.

    Security: Requires Bearer token in Authorization header.
    """

    # Verificação de segurança
    secret = os.getenv('SOCIALBLADE_API_SECRET')
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="SOCIALBLADE_API_SECRET not configured"
        )

    auth_header = request.headers.get('Authorization')
    if not auth_header or auth_header != f"Bearer {secret}":
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing Authorization header"
        )

    # Validação do channelId
    if not body.channelId or len(body.channelId) < 10:
        raise HTTPException(
            status_code=400,
            detail="Invalid channelId: must be at least 10 characters"
        )

    browser = None

    try:
        async with async_playwright() as p:
            # Inicia o navegador com configurações anti-detecção
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--disable-blink-features=AutomationControlled'
                ]
            )

            # Cria contexto com user-agent personalizado
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )

            # Cria nova página
            page = await context.new_page()

            # Remove propriedades que indicam automação
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)

            # Navega para a URL do Social Blade
            url = f"https://socialblade.com/youtube/channel/{body.channelId}"
            await page.goto(url, wait_until='domcontentloaded')

            # Aguarda 15 segundos para carregar completamente (conforme script original)
            await page.wait_for_timeout(15000)

            # Extração dos dados
            daily_stats = []

            # Localiza a primeira tabela
            table_locator = page.locator('table').first

            # Verifica se a tabela existe
            table_count = await table_locator.count()
            if table_count == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"No data table found for channel {body.channelId}"
                )

            # Localiza todas as linhas do tbody
            rows_locator = table_locator.locator('tbody tr')
            rows_count = await rows_locator.count()

            # Itera sobre as linhas (limitado a 14 dias)
            for i in range(min(rows_count, 14)):
                row = rows_locator.nth(i)
                cells = row.locator('td')

                # Verifica se tem células suficientes
                cells_count = await cells.count()
                if cells_count < 6:
                    continue

                # Extrai views da coluna 3 (índice 3)
                views_text = await cells.nth(3).inner_text()
                views_text = views_text.strip()

                # Extrai informação de vídeo novo da coluna 5 (índice 5)
                video_cell = cells.nth(5)
                videos_text = await video_cell.inner_text()
                videos_text = videos_text.strip()
                class_attr = await video_cell.get_attribute('class')

                # Processa views
                if views_text and views_text != '--':
                    # Remove caracteres não numéricos das views
                    views_num = int(''.join(filter(str.isdigit, views_text)))

                    # Extrai o NÚMERO de vídeos postados (não apenas se é positivo)
                    videos_count = 0
                    if videos_text and videos_text != '--':
                        videos_clean = ''.join(filter(str.isdigit, videos_text))
                        if videos_clean:
                            videos_count = int(videos_clean)

                    # Detecta se houve vídeo novo (classe 'positive')
                    has_new_video = 'positive' in (class_attr or '')

                    # Filtra dias com views baixas (< 100)
                    if views_num > 100:
                        daily_stats.append(DailyStat(
                            views=views_num,
                            videosPosted=videos_count,
                            hasNewVideo=has_new_video
                        ))

            # Fecha o navegador
            await browser.close()
            browser = None

            # Retorna os dados brutos
            return ScrapeResponse(
                channelId=body.channelId,
                dailyStats=daily_stats
            )

    except HTTPException:
        # Re-lança HTTPExceptions
        raise

    except Exception as e:
        # Captura qualquer outro erro
        raise HTTPException(
            status_code=500,
            detail=f"Scraping failed: {str(e)}"
        )

    finally:
        # Garante que o navegador seja fechado
        if browser:
            await browser.close()

# Handler para Vercel
handler = app

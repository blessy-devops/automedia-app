import { Webhook } from 'lucide-react'
import { getWebhooks } from './actions'
import { WebhooksTable } from './components/webhooks-table'
import { CreateWebhookDialog } from './components/create-webhook-dialog'

/**
 * Webhooks Settings Page - Server Component
 *
 * This page manages production webhooks for sending benchmark videos
 * to external production environments.
 *
 * Features:
 * - List all configured webhooks
 * - Create new webhooks
 * - Edit existing webhooks
 * - Toggle webhook active status
 * - Delete webhooks
 */
export default async function WebhooksPage() {
  // Fetch all webhooks from the database
  const { data: webhooks, error } = await getWebhooks()

  if (error) {
    console.error('Error loading webhooks:', error)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Webhook className="h-8 w-8" />
              <h1 className="text-4xl font-bold tracking-tight">
                Webhooks de Produção
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Configure webhooks para enviar vídeos para ambientes de produção
            </p>
          </div>
          <CreateWebhookDialog />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Como Funciona
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Os webhooks cadastrados aqui podem ser usados na página de vídeos para
                enviar vídeos selecionados para outros bancos de dados de produção. Cada
                webhook deve apontar para uma Edge Function que receberá os dados dos
                vídeos.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-red-600 dark:text-red-400 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Erro ao Carregar Webhooks
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <WebhooksTable webhooks={webhooks || []} />
        )}
      </div>
    </div>
  )
}

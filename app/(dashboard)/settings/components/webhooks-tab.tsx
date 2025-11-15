import { Webhook } from 'lucide-react'
import { getWebhooks } from '../webhooks/actions'
import { WebhooksTable } from '../webhooks/components/webhooks-table'
import { CreateWebhookDialog } from '../webhooks/components/create-webhook-dialog'

/**
 * Webhooks Tab - Server Component
 *
 * Displays and manages production webhooks for sending videos to external databases
 */
export async function WebhooksTab() {
  const { data: webhooks, error } = await getWebhooks()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Database Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Configure webhooks to send benchmark videos to production databases
          </p>
        </div>
        <CreateWebhookDialog />
      </div>

      {/* Error State */}
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <div className="text-destructive mt-0.5">
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
              <h3 className="font-semibold text-destructive mb-1">
                Error Loading Webhooks
              </h3>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <WebhooksTable webhooks={webhooks || []} />
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
        <div className="flex gap-3">
          <Webhook className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">How Webhooks Work</h4>
            <p className="text-sm text-muted-foreground">
              Webhooks allow you to send selected videos from the Videos page to external
              production databases. Configure the webhook URL (Edge Function endpoint) here,
              then use the "Send to Production" button on the Videos page to transfer data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

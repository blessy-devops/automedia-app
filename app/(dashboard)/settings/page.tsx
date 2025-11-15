import { Settings, Webhook, Key, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Suspense } from 'react'
import { WebhooksTab } from './components/webhooks-tab'
import { RapidApiTab } from './components/rapid-api-tab'
import { OpenRouterTab } from './components/openrouter-tab'
import { checkRapidApiKeyExists, checkOpenRouterKeyExists } from './actions'

/**
 * Settings Page - Server Component
 *
 * ⚠️ SECURITY-CRITICAL PAGE ⚠️
 *
 * This page manages:
 * - Webhooks for sending videos to production databases
 * - API keys stored in Supabase Vault (RapidAPI, OpenRouter)
 *
 * SECURITY REQUIREMENTS:
 * - MUST be protected by admin-only access control (TODO: implement auth check)
 * - Uses createAdminClient() for vault operations (server-side only)
 * - Never exposes actual secret values to the client
 * - All vault access remains server-side via Server Actions
 *
 * IMPORTANT:
 * - API keys are managed via Server Actions in actions.ts
 * - Webhooks are managed via Server Actions in webhooks/actions.ts
 */
export default async function SettingsPage() {
  // ⚠️ SECURITY CHECK: Verify user has admin permissions
  // TODO: Implement proper admin role verification
  // For now, this is a placeholder - in production, verify against user session
  // Example:
  // const session = await getServerSession()
  // if (!session || session.user.role !== 'admin') {
  //   redirect('/unauthorized')
  // }

  // Check if API keys are configured (server-side check)
  const [isRapidApiConfigured, isOpenRouterConfigured] = await Promise.all([
    checkRapidApiKeyExists(),
    checkOpenRouterKeyExists(),
  ])

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-foreground" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Configurações
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Gerencie webhooks, integrações e chaves de API do sistema
        </p>
      </div>

      {/* Security Warning */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-amber-600 dark:text-amber-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-100">
              Área de Alta Segurança
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Esta página permite gerenciar credenciais sensíveis e webhooks de produção.
              Certifique-se de que está em um ambiente seguro. As chaves de API são
              criptografadas e armazenadas no Supabase Vault.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted p-1">
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-background">
            <Webhook className="mr-2 h-4 w-4" />
            Database Webhooks
          </TabsTrigger>
          <TabsTrigger value="rapidapi" className="data-[state=active]:bg-background">
            <Key className="mr-2 h-4 w-4" />
            Rapid API
          </TabsTrigger>
          <TabsTrigger value="openrouter" className="data-[state=active]:bg-background">
            <Zap className="mr-2 h-4 w-4" />
            OpenRouter
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="webhooks" className="space-y-6">
          <Suspense
            fallback={
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Loading webhooks...
              </div>
            }
          >
            <WebhooksTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="rapidapi" className="space-y-6">
          <RapidApiTab isConfigured={isRapidApiConfigured} />
        </TabsContent>

        <TabsContent value="openrouter" className="space-y-6">
          <OpenRouterTab isConfigured={isOpenRouterConfigured} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

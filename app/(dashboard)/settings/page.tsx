import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsForm } from './components/SettingsForm'
import { Settings } from 'lucide-react'

/**
 * Secret metadata interface matching the form component
 */
interface SecretInfo {
  name: string
  displayName: string
  description: string
}

/**
 * Settings Page - Server Component
 *
 * ⚠️ SECURITY-CRITICAL PAGE ⚠️
 *
 * This page manages API keys stored in Supabase Vault.
 *
 * SECURITY REQUIREMENTS:
 * - MUST be protected by admin-only access control (TODO: implement auth check)
 * - Uses createAdminClient() which has FULL ADMINISTRATIVE PRIVILEGES
 * - Never exposes actual secret values to the client
 * - Only passes secret metadata (names, descriptions) to client components
 *
 * IMPORTANT:
 * - This is one of the ONLY places where createAdminClient() should be imported
 * - All vault access MUST remain server-side only
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

  // Create admin client to list secrets from Vault
  // ⚠️ This client bypasses RLS and has full database access
  const supabase = createAdminClient()

  // Define the secrets we want to manage
  // In the future, this could be fetched dynamically from Vault
  const managedSecrets: SecretInfo[] = [
    {
      name: 'rapidapi_key_1760651731629',
      displayName: 'RapidAPI Key',
      description:
        'Chave de API para acessar os serviços da RapidAPI (Social Blade, etc.)',
    },
    {
      name: 'openrouter_key_1760655833491',
      displayName: 'OpenRouter API Key',
      description: 'Chave de API para acessar modelos de IA via OpenRouter',
    },
  ]

  try {
    // Optionally verify that these secrets exist in the Vault
    // This is a read-only operation to confirm the secrets are configured
    const { data: vaultSecrets, error } = await (supabase as any).rpc('list_secrets')

    if (error) {
      console.error('Error listing vault secrets:', error)
      // Continue anyway - we'll show the form and handle errors during update
    } else if (vaultSecrets) {
      // Log available secrets for debugging (doesn't expose values)
      console.log('Available vault secrets:', vaultSecrets)
    }
  } catch (error) {
    console.error('Failed to verify vault secrets:', error)
    // Continue anyway - the form will handle update errors
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8" />
          <h1 className="text-4xl font-bold tracking-tight">Configurações</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Gerencie as integrações e chaves de API do sistema
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 dark:text-amber-400 mt-0.5">
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
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Área de Alta Segurança
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Esta página permite gerenciar credenciais sensíveis. Certifique-se de que está
                em um ambiente seguro. Os valores atuais das chaves nunca são exibidos por
                segurança - apenas forneça novos valores para atualizar.
              </p>
            </div>
          </div>
        </div>

        <SettingsForm secrets={managedSecrets} />
      </div>
    </div>
  )
}

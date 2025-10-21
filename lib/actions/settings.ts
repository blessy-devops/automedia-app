'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * ⚠️ SECURITY-CRITICAL SERVER ACTION ⚠️
 *
 * Updates API keys stored in Supabase Vault
 *
 * SECURITY REQUIREMENTS:
 * - This action MUST only be called by authenticated admin users
 * - Uses createAdminClient() which has FULL ADMINISTRATIVE PRIVILEGES
 * - NEVER expose this action to non-admin users
 * - ALL inputs must be validated before processing
 *
 * @param formData - Object containing secret names as keys and new values as values
 * @returns Result object with success/error status and message
 */
export async function updateApiKeys(formData: Record<string, string>) {
  try {
    // ⚠️ SECURITY CHECK: Verify user has admin permissions
    // TODO: Implement proper admin role verification
    // For now, this is a placeholder - in production, verify against user session
    // Example: const session = await getServerSession()
    // if (!session || session.user.role !== 'admin') {
    //   return { success: false, error: 'Unauthorized: Admin access required' }
    // }

    // Create admin client to access Vault
    // ⚠️ This client bypasses RLS and has full database access
    const supabase = createAdminClient()

    // Prepare array of update promises for parallel execution
    const updatePromises: Promise<any>[] = []

    // Iterate over form data and create update operations
    for (const [secretName, newValue] of Object.entries(formData)) {
      // Only update if a new value was provided (non-empty string)
      if (newValue && newValue.trim().length > 0) {
        // Validate secret name format (basic security check)
        if (!secretName.includes('_key_')) {
          console.warn(`Skipping invalid secret name format: ${secretName}`)
          continue
        }

        // Add update promise to array
        updatePromises.push(
          (supabase as any).rpc('update_vault_secret', {
            secret_name: secretName,
            secret_value: newValue.trim(),
          })
        )
      }
    }

    // Execute all updates in parallel
    if (updatePromises.length > 0) {
      const results = await Promise.all(updatePromises)

      // Check for any errors in the results
      const errors = results.filter((result) => result.error)
      if (errors.length > 0) {
        console.error('Vault update errors:', errors)
        return {
          success: false,
          error: 'Falha ao atualizar alguns segredos. Verifique os logs.',
        }
      }
    } else {
      return {
        success: false,
        error: 'Nenhum valor fornecido para atualização.',
      }
    }

    // Revalidate the settings page to reflect changes
    revalidatePath('/settings')

    return {
      success: true,
      message: 'Configurações atualizadas com sucesso!',
    }
  } catch (error) {
    console.error('Error updating API keys:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro inesperado ao atualizar configurações.',
    }
  }
}

/**
 * Helper type for the action result
 */
export type UpdateApiKeysResult =
  | { success: true; message: string }
  | { success: false; error: string }

'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// Secret names in Supabase Vault
const RAPID_API_SECRET_NAME = 'rapidapi_key_1760651731629'
const OPENROUTER_SECRET_NAME = 'openrouter_key_1760655833491'

/**
 * Save Rapid API key to Supabase Vault
 */
export async function saveRapidApiKey(apiKey: string) {
  try {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, error: 'API key is required' }
    }

    const supabase = createAdminClient()

    // Insert or update secret in Vault
    const { error } = await (supabase as any).rpc('insert_secret', {
      name: RAPID_API_SECRET_NAME,
      secret: apiKey.trim(),
    })

    if (error) {
      console.error('Error saving Rapid API key:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in saveRapidApiKey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Save OpenRouter API key to Supabase Vault
 */
export async function saveOpenRouterKey(apiKey: string) {
  try {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, error: 'API key is required' }
    }

    const supabase = createAdminClient()

    // Insert or update secret in Vault
    const { error } = await (supabase as any).rpc('insert_secret', {
      name: OPENROUTER_SECRET_NAME,
      secret: apiKey.trim(),
    })

    if (error) {
      console.error('Error saving OpenRouter key:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in saveOpenRouterKey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if Rapid API key exists in Vault
 */
export async function checkRapidApiKeyExists(): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // List all secrets and check if our key exists
    const { data: secrets, error } = await (supabase as any).rpc('list_secrets')

    if (error) {
      console.error('Error listing secrets:', error)
      return false
    }

    if (!secrets || !Array.isArray(secrets)) {
      return false
    }

    return secrets.some(
      (secret: any) =>
        secret.name === RAPID_API_SECRET_NAME || secret === RAPID_API_SECRET_NAME
    )
  } catch (error) {
    console.error('Error checking Rapid API key:', error)
    return false
  }
}

/**
 * Check if OpenRouter API key exists in Vault
 */
export async function checkOpenRouterKeyExists(): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // List all secrets and check if our key exists
    const { data: secrets, error } = await (supabase as any).rpc('list_secrets')

    if (error) {
      console.error('Error listing secrets:', error)
      return false
    }

    if (!secrets || !Array.isArray(secrets)) {
      return false
    }

    return secrets.some(
      (secret: any) =>
        secret.name === OPENROUTER_SECRET_NAME || secret === OPENROUTER_SECRET_NAME
    )
  } catch (error) {
    console.error('Error checking OpenRouter key:', error)
    return false
  }
}

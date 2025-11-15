'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type ProductionWebhook = Database['public']['Tables']['production_webhooks']['Row']
type WebhookInsert = Database['public']['Tables']['production_webhooks']['Insert']
type WebhookUpdate = Database['public']['Tables']['production_webhooks']['Update']

// ============================================================================
// WEBHOOK CRUD OPERATIONS
// ============================================================================

/**
 * Get all production webhooks
 */
export async function getWebhooks() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_webhooks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching webhooks:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Unexpected error in getWebhooks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
}

/**
 * Get active production webhooks only
 */
export async function getActiveWebhooks() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_webhooks')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching active webhooks:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Unexpected error in getActiveWebhooks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
}

/**
 * Get a single webhook by ID
 */
export async function getWebhook(id: number) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_webhooks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching webhook:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Unexpected error in getWebhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
}

/**
 * Create a new production webhook
 */
export async function createWebhook(data: {
  name: string
  webhook_url: string
  description?: string
  is_active?: boolean
}) {
  try {
    const supabase = await createClient()

    // Validate name is not empty
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Webhook name is required', data: null }
    }

    // Validate URL is not empty and is a valid URL
    if (!data.webhook_url || data.webhook_url.trim().length === 0) {
      return { success: false, error: 'Webhook URL is required', data: null }
    }

    // Validate URL format
    try {
      new URL(data.webhook_url)
    } catch {
      return { success: false, error: 'Invalid webhook URL format', data: null }
    }

    // Validate URL starts with http:// or https://
    if (!data.webhook_url.startsWith('http://') && !data.webhook_url.startsWith('https://')) {
      return {
        success: false,
        error: 'Webhook URL must start with http:// or https://',
        data: null,
      }
    }

    const insertData: WebhookInsert = {
      name: data.name.trim(),
      webhook_url: data.webhook_url.trim(),
      description: data.description?.trim() || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    }

    const { data: webhook, error } = await supabase
      .from('production_webhooks')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating webhook:', error)
      // Check for unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A webhook with this name already exists',
          data: null,
        }
      }
      return { success: false, error: error.message, data: null }
    }

    revalidatePath('/settings/webhooks')
    return { success: true, data: webhook, error: null }
  } catch (error) {
    console.error('Unexpected error in createWebhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
}

/**
 * Update an existing production webhook
 */
export async function updateWebhook(id: number, data: {
  name?: string
  webhook_url?: string
  description?: string
  is_active?: boolean
}) {
  try {
    const supabase = await createClient()

    // Validate at least one field is being updated
    if (!data.name && !data.webhook_url && data.description === undefined && data.is_active === undefined) {
      return { success: false, error: 'No fields to update', data: null }
    }

    const updateData: WebhookUpdate = {}

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        return { success: false, error: 'Webhook name cannot be empty', data: null }
      }
      updateData.name = data.name.trim()
    }

    if (data.webhook_url !== undefined) {
      if (data.webhook_url.trim().length === 0) {
        return { success: false, error: 'Webhook URL cannot be empty', data: null }
      }

      // Validate URL format
      try {
        new URL(data.webhook_url)
      } catch {
        return { success: false, error: 'Invalid webhook URL format', data: null }
      }

      if (!data.webhook_url.startsWith('http://') && !data.webhook_url.startsWith('https://')) {
        return {
          success: false,
          error: 'Webhook URL must start with http:// or https://',
          data: null,
        }
      }

      updateData.webhook_url = data.webhook_url.trim()
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null
    }

    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active
    }

    const { data: webhook, error } = await supabase
      .from('production_webhooks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating webhook:', error)
      // Check for unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A webhook with this name already exists',
          data: null,
        }
      }
      return { success: false, error: error.message, data: null }
    }

    revalidatePath('/settings/webhooks')
    return { success: true, data: webhook, error: null }
  } catch (error) {
    console.error('Unexpected error in updateWebhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
}

/**
 * Delete a production webhook
 */
export async function deleteWebhook(id: number) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('production_webhooks').delete().eq('id', id)

    if (error) {
      console.error('Error deleting webhook:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/settings/webhooks')
    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error in deleteWebhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Toggle webhook active status
 */
export async function toggleWebhookStatus(id: number, is_active: boolean) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_webhooks')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling webhook status:', error)
      return { success: false, error: error.message, data: null }
    }

    revalidatePath('/settings/webhooks')
    return { success: true, data, error: null }
  } catch (error) {
    console.error('Unexpected error in toggleWebhookStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }
  }
}

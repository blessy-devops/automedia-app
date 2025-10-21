'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Key } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { updateApiKeys } from '@/lib/actions/settings'

/**
 * Secret metadata interface
 */
interface SecretInfo {
  name: string
  displayName: string
  description: string
}

/**
 * Props for SettingsForm component
 */
interface SettingsFormProps {
  secrets: SecretInfo[]
}

/**
 * Settings Form Client Component
 *
 * Renders a secure form for updating API keys stored in Supabase Vault.
 *
 * SECURITY FEATURES:
 * - Password-type inputs to hide sensitive values
 * - Form validation with Zod
 * - Server Action calls for secure updates
 * - No secrets are ever exposed in client-side code
 * - User feedback via toast notifications
 */
export function SettingsForm({ secrets }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create dynamic form schema based on available secrets
  const formSchema = z.object(
    secrets.reduce(
      (acc, secret) => ({
        ...acc,
        [secret.name]: z.string().optional(),
      }),
      {} as Record<string, z.ZodOptional<z.ZodString>>
    )
  )

  type FormValues = Record<string, string | undefined>

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: secrets.reduce(
      (acc, secret) => ({
        ...acc,
        [secret.name]: '',
      }),
      {} as FormValues
    ),
  })

  /**
   * Handle form submission
   * Calls the secure Server Action to update secrets in Vault
   */
  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)

      // Filter out empty values - only update secrets with new values
      const updates = Object.entries(values).reduce(
        (acc, [key, value]) => {
          const stringValue = value as string
          if (stringValue && stringValue.trim().length > 0) {
            acc[key] = stringValue
          }
          return acc
        },
        {} as Record<string, string>
      )

      // Check if there are any updates to make
      if (Object.keys(updates).length === 0) {
        toast.warning('Nenhuma alteração detectada', {
          description: 'Forneça ao menos um novo valor para atualizar.',
        })
        return
      }

      // Call Server Action to update secrets
      const result = await updateApiKeys(updates)

      if (result.success) {
        toast.success('Sucesso!', {
          description: result.message,
        })

        // Reset form after successful update
        form.reset()
      } else {
        toast.error('Erro ao atualizar', {
          description: result.error,
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro ao processar sua solicitação.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <CardTitle>Chaves de API</CardTitle>
        </div>
        <CardDescription>
          Gerencie as chaves de API armazenadas de forma segura no Supabase
          Vault. Os valores atuais não são exibidos por segurança - apenas
          forneça novos valores para atualizar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {secrets.map((secret) => (
              <FormField
                key={secret.name}
                control={form.control}
                name={secret.name as keyof FormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{secret.displayName}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite o novo valor (deixe vazio para não alterar)"
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      {secret.description}
                      <br />
                      <span className="text-xs font-mono text-muted-foreground">
                        Nome no Vault: {secret.name}
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Limpar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

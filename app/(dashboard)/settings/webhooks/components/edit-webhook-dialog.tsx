'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { updateWebhook, type ProductionWebhook } from '../actions'
import { WEBHOOK_TYPES, type WebhookType } from '../types'

type Webhook = ProductionWebhook

interface EditWebhookDialogProps {
  webhook: Webhook
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditWebhookDialog({
  webhook,
  open,
  onOpenChange,
}: EditWebhookDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: webhook.name,
    webhook_url: webhook.webhook_url,
    description: webhook.description || '',
    is_active: webhook.is_active,
    webhook_type: (webhook.webhook_type || 'benchmark') as WebhookType,
  })

  // Update form when webhook changes
  useEffect(() => {
    setFormData({
      name: webhook.name,
      webhook_url: webhook.webhook_url,
      description: webhook.description || '',
      is_active: webhook.is_active,
      webhook_type: (webhook.webhook_type || 'benchmark') as WebhookType,
    })
  }, [webhook])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await updateWebhook(webhook.id, formData)

    if (result.success) {
      toast.success('Webhook atualizado com sucesso!')
      onOpenChange(false)
    } else {
      toast.error(`Erro ao atualizar webhook: ${result.error}`)
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
            <DialogDescription>
              Atualize as informações do webhook "{webhook.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Ex: Produção Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-webhook_type">
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.webhook_type}
                  onValueChange={(value) => setFormData({ ...formData, webhook_type: value as WebhookType })}
                >
                  <SelectTrigger id="edit-webhook_type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-webhook_url">
                URL do Webhook <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-webhook_url"
                type="url"
                placeholder="https://seu-projeto.supabase.co/functions/v1/receive-benchmark-videos"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                placeholder="Opcional: Descreva o propósito deste webhook..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-is_active">Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Webhooks inativos não aparecem na seleção
                </p>
              </div>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

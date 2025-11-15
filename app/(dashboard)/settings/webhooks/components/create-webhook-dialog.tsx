'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { createWebhook } from '../actions'

export function CreateWebhookDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    webhook_url: '',
    description: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await createWebhook(formData)

    if (result.success) {
      toast.success('Webhook criado com sucesso!')
      setOpen(false)
      setFormData({
        name: '',
        webhook_url: '',
        description: '',
        is_active: true,
      })
    } else {
      toast.error(`Erro ao criar webhook: ${result.error}`)
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Novo Webhook</DialogTitle>
            <DialogDescription>
              Configure um novo webhook para enviar vídeos para um ambiente de produção
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Produção Principal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Um nome descritivo para identificar este webhook
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="webhook_url">
                URL do Webhook <span className="text-destructive">*</span>
              </Label>
              <Input
                id="webhook_url"
                type="url"
                placeholder="https://seu-projeto.supabase.co/functions/v1/receive-benchmark-videos"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                A URL completa da Edge Function que receberá os vídeos
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Opcional: Descreva o propósito deste webhook..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Webhooks inativos não aparecem na seleção
                </p>
              </div>
              <Switch
                id="is_active"
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

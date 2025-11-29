'use client'

import { useState, useEffect } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getActiveWebhooks, type ProductionWebhook } from '@/app/(dashboard)/settings/webhooks/actions'
import { sendVideosToProduction } from '../actions'

type Webhook = ProductionWebhook

interface SendToProductionButtonProps {
  videoIds: number[]
  onSuccess?: () => void
}

export function SendToProductionButton({
  videoIds,
  onSuccess,
}: SendToProductionButtonProps) {
  const [open, setOpen] = useState(false)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>('')
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Load active webhooks when dialog opens
  useEffect(() => {
    if (open) {
      loadWebhooks()
    }
  }, [open])

  const loadWebhooks = async () => {
    setIsLoadingWebhooks(true)
    const result = await getActiveWebhooks()

    if (result.success && result.data) {
      setWebhooks(result.data)
      // Auto-select if only one webhook
      if (result.data.length === 1) {
        setSelectedWebhookId(result.data[0].id.toString())
      }
    } else {
      toast.error(`Erro ao carregar webhooks: ${result.error}`)
    }

    setIsLoadingWebhooks(false)
  }

  const handleSend = async () => {
    if (!selectedWebhookId) {
      toast.error('Selecione um webhook de destino')
      return
    }

    setIsSending(true)

    const result = await sendVideosToProduction(videoIds, parseInt(selectedWebhookId))

    if (result.success) {
      toast.success(
        `${videoIds.length} vídeo${videoIds.length !== 1 ? 's' : ''} enviado${videoIds.length !== 1 ? 's' : ''} com sucesso!`
      )
      setOpen(false)
      setSelectedWebhookId('')
      onSuccess?.()
    } else {
      toast.error(`Erro ao enviar vídeos: ${result.error}`)
    }

    setIsSending(false)
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 bg-green-600 hover:bg-green-700 text-white"
        disabled={videoIds.length === 0}
      >
        <Upload className="w-4 h-4 mr-1.5" />
        Enviar para Produção
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar Vídeos para Produção</DialogTitle>
            <DialogDescription>
              Envie {videoIds.length} vídeo{videoIds.length !== 1 ? 's' : ''} selecionado
              {videoIds.length !== 1 ? 's' : ''} para um ambiente de produção
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoadingWebhooks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : webhooks.length === 0 ? (
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
                      Nenhum Webhook Configurado
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      Você precisa configurar pelo menos um webhook ativo antes de enviar
                      vídeos para produção.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false)
                        window.location.href = '/settings/webhooks'
                      }}
                    >
                      Configurar Webhooks
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="webhook-select">
                    Selecione o Webhook de Destino
                  </Label>
                  <Select value={selectedWebhookId} onValueChange={setSelectedWebhookId}>
                    <SelectTrigger id="webhook-select">
                      <SelectValue placeholder="Escolha um webhook..." />
                    </SelectTrigger>
                    <SelectContent>
                      {webhooks.map((webhook) => (
                        <SelectItem key={webhook.id} value={webhook.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{webhook.name}</span>
                            {webhook.description && (
                              <span className="text-xs text-muted-foreground">
                                {webhook.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedWebhookId && (
                    <p className="text-xs text-muted-foreground">
                      URL:{' '}
                      <code className="bg-muted px-1.5 py-0.5 rounded">
                        {webhooks.find((w) => w.id.toString() === selectedWebhookId)
                          ?.webhook_url}
                      </code>
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Os vídeos selecionados serão enviados para o webhook escolhido. O
                    banco de dados de destino receberá todos os dados dos vídeos,
                    incluindo métricas e categorização.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || !selectedWebhookId || webhooks.length === 0}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar para Produção
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { sendVideosToProduction } from '../actions'

interface SendToProductionButtonProps {
  videoIds: number[]
  onSuccess?: () => void
}

export function SendToProductionButton({
  videoIds,
  onSuccess,
}: SendToProductionButtonProps) {
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (videoIds.length === 0) return

    setIsSending(true)

    const result = await sendVideosToProduction(videoIds)

    if (result.success) {
      toast.success(
        `${videoIds.length} vídeo${videoIds.length !== 1 ? 's' : ''} enviado${videoIds.length !== 1 ? 's' : ''} para produção!`
      )
      onSuccess?.()
    } else {
      toast.error(`Erro ao enviar vídeos: ${result.error}`)
    }

    setIsSending(false)
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleSend}
      className="h-8 bg-green-600 hover:bg-green-700 text-white"
      disabled={videoIds.length === 0 || isSending}
    >
      {isSending ? (
        <>
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Upload className="w-4 h-4 mr-1.5" />
          Enviar para Produção
        </>
      )}
    </Button>
  )
}

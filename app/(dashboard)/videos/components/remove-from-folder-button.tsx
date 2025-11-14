'use client'

import { useState } from 'react'
import { FolderMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { removeVideosFromFolder } from '../actions'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface RemoveFromFolderButtonProps {
  videoIds: number[]
  folderId: number
  folderName?: string
  onSuccess?: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function RemoveFromFolderButton({
  videoIds,
  folderId,
  folderName,
  onSuccess,
  variant = 'outline',
  size = 'sm',
  className,
}: RemoveFromFolderButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    setLoading(true)

    const result = await removeVideosFromFolder(folderId, videoIds)

    setLoading(false)

    if (result.success) {
      toast.success(
        result.message ||
          `${videoIds.length} vídeo(s) removido(s) da pasta${folderName ? ` "${folderName}"` : ''}`
      )
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
    } else {
      toast.error(result.error || 'Erro ao remover vídeos da pasta')
    }
  }

  const videoCount = videoIds.length

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={videoCount === 0}>
          <FolderMinus className="h-4 w-4 mr-2" />
          Remover da Pasta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover vídeos da pasta?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a remover {videoCount} vídeo{videoCount > 1 ? 's' : ''} da
            pasta{folderName ? ` "${folderName}"` : ''}.
            <br />
            <br />
            Os vídeos não serão deletados, apenas removidos desta pasta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removendo...
              </>
            ) : (
              'Remover'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

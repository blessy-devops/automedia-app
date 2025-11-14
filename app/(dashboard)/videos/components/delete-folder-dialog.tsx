'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { deleteFolder } from '../actions'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type FolderWithChildren = {
  id: number
  name: string
  description: string | null
  userId: string | null
  parentFolderId: number | null
  color: string | null
  icon: string | null
  position: number | null
  createdAt: Date
  updatedAt: Date
  videoCount: number
  subFolders: FolderWithChildren[]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DeleteFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: FolderWithChildren | null
  onSuccess?: () => void
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
  onSuccess,
}: DeleteFolderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [forceDelete, setForceDelete] = useState(false)

  const handleDelete = async () => {
    if (!folder) return

    setLoading(true)

    const result = await deleteFolder(folder.id, forceDelete)

    setLoading(false)

    if (result.success) {
      toast.success(`Pasta "${folder.name}" excluída com sucesso!`)
      onOpenChange(false)
      setForceDelete(false) // Reset for next time
      if (onSuccess) {
        onSuccess()
      }
    } else {
      if (result.hasSubFolders || result.hasItems) {
        toast.error('A pasta não está vazia. Marque a opção para excluir com todo o conteúdo.')
      } else {
        toast.error(result.error || 'Erro ao excluir pasta')
      }
    }
  }

  if (!folder) return null

  const hasSubFolders = folder.subFolders && folder.subFolders.length > 0
  const hasItems = folder.videoCount > 0
  const isNotEmpty = hasSubFolders || hasItems

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir Pasta?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a excluir a pasta{' '}
              <span className="font-semibold text-foreground">&quot;{folder.name}&quot;</span>.
            </p>

            {isNotEmpty && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="font-semibold text-foreground text-sm">Esta pasta contém:</p>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  {hasSubFolders && (
                    <li>
                      {folder.subFolders.length} subpasta
                      {folder.subFolders.length > 1 ? 's' : ''}
                    </li>
                  )}
                  {hasItems && (
                    <li>
                      {folder.videoCount} vídeo
                      {folder.videoCount > 1 ? 's' : ''}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {isNotEmpty && (
              <div className="flex items-start space-x-2 bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <Checkbox
                  id="force-delete"
                  checked={forceDelete}
                  onCheckedChange={(checked) => setForceDelete(checked as boolean)}
                  disabled={loading}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="force-delete"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Excluir pasta e todo o conteúdo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Todas as subpastas serão excluídas. Os vídeos não serão deletados, apenas
                    desassociados desta pasta.
                  </p>
                </div>
              </div>
            )}

            {!isNotEmpty && (
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita. A pasta será permanentemente excluída.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || (isNotEmpty && !forceDelete)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Pasta'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

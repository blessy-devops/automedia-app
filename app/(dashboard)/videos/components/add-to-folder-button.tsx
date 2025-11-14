'use client'

import { useState } from 'react'
import { FolderPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { addVideosToFolder } from '../actions'
import { Separator } from '@/components/ui/separator'

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
// FOLDER LIST ITEM (RECURSIVE)
// ============================================================================

interface FolderListItemProps {
  folder: FolderWithChildren
  level?: number
  onSelect: (folderId: number, folderName: string) => void
  loading: boolean
}

function FolderListItem({
  folder,
  level = 0,
  onSelect,
  loading,
}: FolderListItemProps) {
  const hasSubFolders = folder.subFolders && folder.subFolders.length > 0

  return (
    <div>
      {/* Folder button */}
      <Button
        variant="ghost"
        className="w-full justify-start h-9 font-normal"
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => onSelect(folder.id, folder.name)}
        disabled={loading}
      >
        <FolderPlus
          className="h-4 w-4 mr-2 shrink-0"
          style={{ color: folder.color || '#3b82f6' }}
        />
        <span className="truncate">{folder.name}</span>
      </Button>

      {/* Subfolders (recursive) */}
      {hasSubFolders && (
        <>
          {folder.subFolders.map((subFolder) => (
            <FolderListItem
              key={subFolder.id}
              folder={subFolder}
              level={level + 1}
              onSelect={onSelect}
              loading={loading}
            />
          ))}
        </>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AddToFolderButtonProps {
  videoIds: number[]
  folders: FolderWithChildren[]
  onSuccess?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function AddToFolderButton({
  videoIds,
  folders,
  onSuccess,
  variant = 'default',
  size = 'sm',
  className,
}: AddToFolderButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddToFolder = async (folderId: number, folderName: string) => {
    setLoading(true)

    const result = await addVideosToFolder(folderId, videoIds)

    setLoading(false)

    if (result.success) {
      toast.success(
        result.message || `${videoIds.length} vídeo(s) adicionado(s) à pasta "${folderName}"`
      )
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
    } else {
      toast.error(result.error || 'Erro ao adicionar vídeos à pasta')
    }
  }

  const videoCount = videoIds.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={videoCount === 0}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FolderPlus className="h-4 w-4 mr-2" />
          )}
          Adicionar à Pasta
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Header */}
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Adicionar à Pasta</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {videoCount} vídeo{videoCount > 1 ? 's' : ''} selecionado
            {videoCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Folder list */}
        <ScrollArea className="h-64">
          {folders.length === 0 ? (
            <div className="p-6 text-center">
              <FolderPlus className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma pasta criada ainda
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie uma pasta primeiro
              </p>
            </div>
          ) : (
            <div className="p-1">
              {folders.map((folder) => (
                <FolderListItem
                  key={folder.id}
                  folder={folder}
                  onSelect={handleAddToFolder}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

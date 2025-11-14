'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

type FolderAction = 'create' | 'rename' | 'delete' | 'createSubfolder' | 'changeColor'

// ============================================================================
// FOLDER TREE ITEM (RECURSIVE COMPONENT)
// ============================================================================

interface FolderTreeItemProps {
  folder: FolderWithChildren
  level?: number
  selectedId: number | null
  onFolderClick: (folderId: number) => void
  onFolderAction: (action: FolderAction, folder: FolderWithChildren | null) => void
}

function FolderTreeItem({
  folder,
  level = 0,
  selectedId,
  onFolderClick,
  onFolderAction,
}: FolderTreeItemProps) {
  const [isOpen, setIsOpen] = useState(level === 0)
  const hasSubFolders = folder.subFolders && folder.subFolders.length > 0
  const isSelected = selectedId === folder.id
  const videoCount = folder.videoCount || 0

  return (
    <div>
      {/* Folder row */}
      <div
        className={cn(
          'flex items-center gap-1 rounded-md group hover:bg-accent transition-colors',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
      >
        {/* Expand/collapse chevron */}
        {hasSubFolders ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
            className="p-1 hover:bg-accent-foreground/10 rounded"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" /> // Spacing placeholder
        )}

        {/* Folder icon + name */}
        <div
          onClick={() => onFolderClick(folder.id)}
          className="flex items-center gap-2 flex-1 min-w-0 py-1.5 px-2 cursor-pointer rounded"
        >
          {isOpen && hasSubFolders ? (
            <FolderOpen
              className="h-4 w-4 shrink-0"
              style={{ color: folder.color || '#3b82f6' }}
            />
          ) : (
            <Folder
              className="h-4 w-4 shrink-0"
              style={{ color: folder.color || '#3b82f6' }}
            />
          )}
          <span className="truncate text-sm font-medium">{folder.name}</span>
          {videoCount > 0 && (
            <Badge variant="secondary" className="ml-auto shrink-0 h-5 text-xs">
              {videoCount}
            </Badge>
          )}
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFolderAction('rename', folder)}>
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFolderAction('changeColor', folder)}>
              Mudar Cor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFolderAction('createSubfolder', folder)}>
              Nova Subpasta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFolderAction('delete', folder)}
              className="text-destructive focus:text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Subfolders (recursive) */}
      {isOpen && hasSubFolders && (
        <div className="mt-0.5">
          {folder.subFolders.map((subFolder) => (
            <FolderTreeItem
              key={subFolder.id}
              folder={subFolder}
              level={level + 1}
              selectedId={selectedId}
              onFolderClick={onFolderClick}
              onFolderAction={onFolderAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

interface FolderSidebarProps {
  folders: FolderWithChildren[]
  className?: string
  onFolderAction: (action: FolderAction, folder: FolderWithChildren | null) => void
}

export function FolderSidebar({
  folders,
  className,
  onFolderAction,
}: FolderSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedFolderId = searchParams.get('folderId')

  const handleFolderClick = (folderId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('folderId', folderId.toString())

    // Reset page to 1 when changing folders
    params.delete('page')

    router.push(`/videos?${params.toString()}`)
  }

  const handleAllVideosClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('folderId')
    params.delete('page')
    router.push(`/videos?${params.toString()}`)
  }

  const isAllVideosSelected = !selectedFolderId

  return (
    <div className={cn('flex flex-col h-full border-r bg-background', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Pastas de Vídeos</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => onFolderAction('create', null)}
            title="Nova Pasta"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* All Videos button */}
        <Button
          variant={isAllVideosSelected ? 'secondary' : 'ghost'}
          className="w-full justify-start h-9"
          onClick={handleAllVideosClick}
        >
          <Video className="h-4 w-4 mr-2" />
          Todos os Vídeos
        </Button>
      </div>

      {/* Folder tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {folders.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma pasta criada</p>
              <p className="text-xs mt-1">Clique no + para criar</p>
            </div>
          ) : (
            folders.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                selectedId={selectedFolderId ? parseInt(selectedFolderId) : null}
                onFolderClick={handleFolderClick}
                onFolderAction={onFolderAction}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createFolder, updateFolder } from '../actions'

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
// COLOR PALETTE
// ============================================================================

const FOLDER_COLORS = [
  { value: '#3b82f6', label: 'Azul', name: 'blue' },
  { value: '#ef4444', label: 'Vermelho', name: 'red' },
  { value: '#10b981', label: 'Verde', name: 'green' },
  { value: '#f59e0b', label: 'Laranja', name: 'orange' },
  { value: '#8b5cf6', label: 'Roxo', name: 'purple' },
  { value: '#ec4899', label: 'Rosa', name: 'pink' },
  { value: '#06b6d4', label: 'Ciano', name: 'cyan' },
  { value: '#14b8a6', label: 'Teal', name: 'teal' },
  { value: '#84cc16', label: 'Lima', name: 'lime' },
  { value: '#f97316', label: 'Tangerina', name: 'tangerine' },
  { value: '#6366f1', label: 'Índigo', name: 'indigo' },
  { value: '#a855f7', label: 'Violeta', name: 'violet' },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Flatten folder tree to get all folders in a flat array
 */
function flattenFolders(folders: FolderWithChildren[]): FolderWithChildren[] {
  const result: FolderWithChildren[] = []

  function traverse(folderList: FolderWithChildren[]) {
    for (const folder of folderList) {
      result.push(folder)
      if (folder.subFolders && folder.subFolders.length > 0) {
        traverse(folder.subFolders)
      }
    }
  }

  traverse(folders)
  return result
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: FolderWithChildren | null
  folders: FolderWithChildren[]
  parentId?: number | null
  onSuccess?: () => void
}

export function FolderDialog({
  open,
  onOpenChange,
  folder = null,
  folders,
  parentId = null,
  onSuccess,
}: FolderDialogProps) {
  const isEdit = !!folder

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentFolderId, setParentFolderId] = useState<string>('root')
  const [color, setColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)

  // Initialize form when dialog opens or folder changes
  useEffect(() => {
    if (open) {
      if (folder) {
        // Edit mode
        setName(folder.name)
        setDescription(folder.description || '')
        setParentFolderId(folder.parentFolderId ? folder.parentFolderId.toString() : 'root')
        setColor(folder.color || '#3b82f6')
      } else {
        // Create mode
        setName('')
        setDescription('')
        setParentFolderId(parentId ? parentId.toString() : 'root')
        setColor('#3b82f6')
      }
    }
  }, [open, folder, parentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('O nome da pasta é obrigatório')
      return
    }

    setLoading(true)

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      parentFolderId: parentFolderId === 'root' ? null : parseInt(parentFolderId),
      color,
    }

    const result = isEdit
      ? await updateFolder(folder.id, data)
      : await createFolder(data)

    setLoading(false)

    if (result.success) {
      toast.success(isEdit ? 'Pasta atualizada com sucesso!' : 'Pasta criada com sucesso!')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } else {
      toast.error(result.error || 'Erro ao salvar pasta')
    }
  }

  // Get flat list of folders (excluding current folder if editing)
  const flatFolders = flattenFolders(folders).filter((f) => !isEdit || f.id !== folder.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Atualize as informações da pasta'
                : 'Crie uma nova pasta para organizar seus vídeos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Vídeos de Marketing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Adicione uma descrição para esta pasta..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Parent folder selector */}
            <div className="space-y-2">
              <Label htmlFor="parentFolderId">Pasta Pai (opcional)</Label>
              <Select value={parentFolderId} onValueChange={setParentFolderId} disabled={loading}>
                <SelectTrigger id="parentFolderId">
                  <SelectValue placeholder="Selecione uma pasta pai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Nenhuma (Raiz)</SelectItem>
                  {flatFolders.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Escolha uma pasta pai para criar uma subpasta
              </p>
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className="h-9 w-9 rounded-md border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: value,
                      borderColor: color === value ? '#000' : 'transparent',
                      boxShadow: color === value ? '0 0 0 2px white, 0 0 0 4px black' : 'none',
                    }}
                    onClick={() => setColor(value)}
                    title={label}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEdit ? (
                'Atualizar'
              ) : (
                'Criar Pasta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Folder, Save, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createFolder, updateFolder, deleteFolder } from '../actions'
import { useRouter } from 'next/navigation'

interface FolderItem {
  id: number
  name: string
  description: string | null
  videoCount: number
  color: string | null
}

interface ManageFoldersModalProps {
  folders: FolderItem[]
  onClose: () => void
}

export function ManageFoldersModal({ folders: initialFolders, onClose }: ManageFoldersModalProps) {
  const router = useRouter()
  const [folders, setFolders] = useState(initialFolders)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStartEdit = (folder: FolderItem) => {
    setEditingId(folder.id)
    setEditingName(folder.name)
  }

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) return

    setIsLoading(true)
    try {
      const result = await updateFolder(id, {
        name: editingName.trim(),
      })

      if (result.success) {
        setFolders(folders.map(f =>
          f.id === id ? { ...f, name: editingName.trim() } : f
        ))
        setEditingId(null)
        setEditingName('')
        toast.success('Pasta atualizada com sucesso!')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao atualizar pasta')
      }
    } catch (error) {
      toast.error('Erro ao atualizar pasta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta pasta? Os vídeos não serão deletados.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteFolder(id)

      if (result.success) {
        setFolders(folders.filter(f => f.id !== id))
        toast.success('Pasta deletada com sucesso!')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao deletar pasta')
      }
    } catch (error) {
      toast.error('Erro ao deletar pasta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setIsLoading(true)
    try {
      const result = await createFolder({
        name: newFolderName.trim(),
        description: '',
        color: '#3b82f6',
      })

      if (result.success && result.folder) {
        setFolders([...folders, {
          id: result.folder.id,
          name: result.folder.name,
          description: result.folder.description,
          videoCount: 0,
          color: result.folder.color,
        }])
        setNewFolderName('')
        setIsCreating(false)
        toast.success('Pasta criada com sucesso!')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao criar pasta')
      }
    } catch (error) {
      toast.error('Erro ao criar pasta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewFolderName('')
  }

  const totalVideos = folders.reduce((sum, f) => sum + (f.videoCount || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-foreground">Manage Folders</h2>
            <p className="text-sm text-muted-foreground mt-1">Create, edit, and organize your video folders</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Folder Button/Form */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              disabled={isLoading}
              className="w-full border-2 border-dashed border-border rounded-lg px-4 py-4 text-muted-foreground hover:border-muted-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Folder</span>
            </button>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-4 mb-4">
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder()
                    if (e.key === 'Escape') handleCancelCreate()
                  }}
                  placeholder="Enter folder name..."
                  className="flex-1 bg-card border border-blue-300 dark:border-blue-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Create
                </button>
                <button
                  onClick={handleCancelCreate}
                  disabled={isLoading}
                  className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 px-2 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Folders List */}
          {folders.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No folders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first folder to organize videos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="bg-card border border-border rounded-lg px-4 py-3 hover:border-muted-foreground transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Folder
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: folder.color || '#6b7280' }}
                    />

                    {editingId === folder.id ? (
                      // EDIT MODE
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(folder.id)
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          className="flex-1 bg-card border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                          autoFocus
                          disabled={isLoading}
                        />
                        <button
                          onClick={() => handleSaveEdit(folder.id)}
                          disabled={isLoading}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 px-2 py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      // VIEW MODE
                      <>
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{folder.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {folder.videoCount || 0} video{folder.videoCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartEdit(folder)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(folder.id)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mt-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>💡 Tip:</strong> Select videos in the table and use "Add to folder" to organize them. Deleting a folder won't delete the videos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/50">
          <div className="text-sm text-muted-foreground">
            {folders.length} folder{folders.length !== 1 ? 's' : ''} • {totalVideos} video{totalVideos !== 1 ? 's' : ''} organized
          </div>
          <button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

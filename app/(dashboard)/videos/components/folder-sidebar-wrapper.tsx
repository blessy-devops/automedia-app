'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderSidebar } from './folder-sidebar'
import { FolderDialog } from './folder-dialog'
import { DeleteFolderDialog } from './delete-folder-dialog'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FolderSidebarWrapperProps {
  folders: any[]
}

// ============================================================================
// CLIENT WRAPPER FOR FOLDER SIDEBAR
// ============================================================================

/**
 * Client Component wrapper for FolderSidebar
 * Handles dialog state management and router operations
 */
export function FolderSidebarWrapper({ folders }: FolderSidebarWrapperProps) {
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [parentFolderId, setParentFolderId] = useState<number | null>(null)
  const router = useRouter()

  const handleFolderAction = (action: string, folder: any) => {
    switch (action) {
      case 'create':
        setSelectedFolder(null)
        setParentFolderId(null)
        setFolderDialogOpen(true)
        break
      case 'createSubfolder':
        setSelectedFolder(null)
        setParentFolderId(folder.id)
        setFolderDialogOpen(true)
        break
      case 'rename':
      case 'changeColor':
        setSelectedFolder(folder)
        setFolderDialogOpen(true)
        break
      case 'delete':
        setSelectedFolder(folder)
        setDeleteFolderDialogOpen(true)
        break
    }
  }

  const handleDialogSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <FolderSidebar
        folders={folders}
        className="w-64"
        onFolderAction={handleFolderAction}
      />
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        folder={selectedFolder}
        folders={folders}
        parentId={parentFolderId}
        onSuccess={handleDialogSuccess}
      />
      <DeleteFolderDialog
        open={deleteFolderDialogOpen}
        onOpenChange={setDeleteFolderDialogOpen}
        folder={selectedFolder}
        onSuccess={handleDialogSuccess}
      />
    </>
  )
}

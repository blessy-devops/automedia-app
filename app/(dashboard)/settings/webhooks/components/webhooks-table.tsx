'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff, Webhook } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { deleteWebhook, toggleWebhookStatus, type ProductionWebhook } from '../actions'
import { WEBHOOK_TYPES, type WebhookType } from '../types'
import { EditWebhookDialog } from './edit-webhook-dialog'
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

type Webhook = ProductionWebhook

interface WebhooksTableProps {
  webhooks: Webhook[]
}

export function WebhooksTable({ webhooks }: WebhooksTableProps) {
  const router = useRouter()
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [deletingWebhookId, setDeletingWebhookId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState<number | null>(null)

  const handleToggleStatus = async (webhook: Webhook) => {
    setIsTogglingStatus(webhook.id)
    const newStatus = !webhook.is_active

    const result = await toggleWebhookStatus(webhook.id, newStatus)

    if (result.success) {
      toast.success(
        newStatus
          ? `Webhook "${webhook.name}" ativado com sucesso`
          : `Webhook "${webhook.name}" desativado com sucesso`
      )
      router.refresh()
    } else {
      toast.error(`Erro ao atualizar webhook: ${result.error}`)
    }

    setIsTogglingStatus(null)
  }

  const handleDelete = async () => {
    if (!deletingWebhookId) return

    setIsDeleting(true)
    const webhook = webhooks.find((w) => w.id === deletingWebhookId)

    const result = await deleteWebhook(deletingWebhookId)

    if (result.success) {
      toast.success(`Webhook "${webhook?.name}" excluído com sucesso`)
      router.refresh()
      setDeletingWebhookId(null)
    } else {
      toast.error(`Erro ao excluir webhook: ${result.error}`)
    }

    setIsDeleting(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Helper para cores do badge de tipo
  const getTypeBadgeVariant = (type: WebhookType | string | null): string => {
    switch (type) {
      case 'benchmark':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'regeneration':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'creation':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'notification':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTypeLabel = (type: WebhookType | string | null): string => {
    return WEBHOOK_TYPES.find(t => t.value === type)?.label || type || 'Desconhecido'
  }

  if (webhooks.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum webhook configurado</h3>
        <p className="text-muted-foreground mb-4">
          Comece criando seu primeiro webhook de produção
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((webhook) => (
              <TableRow key={webhook.id}>
                <TableCell className="font-medium">{webhook.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeVariant(webhook.webhook_type)}`}>
                    {getTypeLabel(webhook.webhook_type)}
                  </span>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {webhook.webhook_url}
                  </code>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {webhook.description || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                    {webhook.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(webhook.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(webhook)}
                        disabled={isTogglingStatus === webhook.id}
                      >
                        {webhook.is_active ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingWebhook(webhook)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingWebhookId(webhook.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingWebhook && (
        <EditWebhookDialog
          webhook={editingWebhook}
          open={!!editingWebhook}
          onOpenChange={(open) => !open && setEditingWebhook(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingWebhookId}
        onOpenChange={(open) => !open && setDeletingWebhookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O webhook será excluído permanentemente e
              não poderá mais ser usado para enviar vídeos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

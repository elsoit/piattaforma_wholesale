'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Order {
  id: number
  order_number: string
  order_type: string
  status: string
  created_at: string
  total_amount: number
  catalog: {
    nome: string
    brand: {
      name: string
    }
  }
}

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

function DeleteDialog({ open, onOpenChange, order, onConfirm, isDeleting }: DeleteDialogProps) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conferma Cancellazione</DialogTitle>
          <DialogDescription>
            Sei sicuro di voler cancellare l&apos;ordine <strong>{order.order_number}</strong>?<br/>
            L&apos;ordine contiene prodotti per un totale di <strong>{
              new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR'
              }).format(order.total_amount)
            }</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Annulla
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Cancellazione...
              </>
            ) : (
              'Cancella Ordine'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bozza':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'inviato':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'bozza':
        return 'Bozza'
      case 'inviato':
        return 'Inviato'
      default:
        return status
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    order: Order | null
  }>({
    open: false,
    order: null
  })

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Errore nel caricamento degli ordini')

      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Errore:', error)
      toast.error('Errore nel caricamento degli ordini')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleDeleteClick = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation() // Previene la navigazione alla pagina dell'ordine
    
    if (deleting) return // Previene cancellazioni multiple

    // Se l'ordine ha un totale > 0, mostra il dialog
    if (order.total_amount > 0) {
      setDeleteDialog({
        open: true,
        order
      })
    } else {
      // Altrimenti procedi direttamente con la cancellazione
      handleDelete(order.id)
    }
  }

  const handleDelete = async (orderId: number) => {
    if (deleting) return

    try {
      setDeleting(orderId)
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore nella cancellazione')
      }

      toast.success('Ordine cancellato con successo')
      setDeleteDialog({ open: false, order: null })
      await fetchOrders() // Ricarica la lista
    } catch (error) {
      console.error('Errore:', error)
      toast.error(error instanceof Error ? error.message : 'Errore nella cancellazione')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: it })
    } catch (error) {
      console.error('Errore nel formato data:', error)
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="pt-[64px]">
      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        order={deleteDialog.order}
        onConfirm={() => deleteDialog.order && handleDelete(deleteDialog.order.id)}
        isDeleting={deleting !== null}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
        
          <h1 className="text-2xl font-bold">I tuoi ordini</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nessun ordine trovato
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Numero</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Catalogo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stato</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Totale</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Data Creazione</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/vetrina/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 text-sm">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm">{order.catalog.brand.name}</td>
                      <td className="px-4 py-3 text-sm">{order.catalog.nome}</td>
                      <td className="px-4 py-3 text-sm">
                        {order.order_type === 'preorder' ? 'Pre-Order' : 'Pronta Consegna'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {order.status === 'bozza' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleDeleteClick(order, e)}
                            disabled={deleting === order.id}
                          >
                            {deleting === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "article_code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Codice Articolo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "variant_code",
    header: "Codice Variante",
  },
  {
    accessorKey: "brand_name",
    header: "Brand",
  },
  {
    accessorKey: "size_name",
    header: "Taglia",
  },
  {
    accessorKey: "wholesale_price",
    header: () => <div className="text-right">Prezzo Ingrosso</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("wholesale_price"))
      const formatted = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "retail_price",
    header: () => <div className="text-right">Prezzo Dettaglio</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("retail_price"))
      const formatted = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Stato",
    cell: ({ row }) => {
      const status = row.getValue("status")
      return (
        <div className={`font-medium ${
          status === 'active' ? 'text-green-600' : 'text-red-600'
        }`}>
          {status === 'active' ? 'Attivo' : 'Inattivo'}
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original
      return null // Le azioni verranno gestite nella pagina
    },
  },
] 
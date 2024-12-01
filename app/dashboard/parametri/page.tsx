'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandsTable } from '@/components/parametri/brands-table'

export default function ParametriPage() {
  return (
    <div className="flex h-full">
      {/* Menu laterale */}
      <div className="w-64 border-r p-4">
        <h2 className="font-semibold mb-4">Parametri</h2>
        <Tabs defaultValue="brands" className="w-full" orientation="vertical">
          <TabsList className="flex flex-col h-full items-stretch">
            <TabsTrigger value="brands" className="justify-start">
              Brands
            </TabsTrigger>
            {/* Altri tab futuri */}
          </TabsList>
        </Tabs>
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 p-6">
        <BrandsTable />
      </div>
    </div>
  )
} 
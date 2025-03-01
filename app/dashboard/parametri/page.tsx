'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandsTable } from '@/components/parametri/brands-table'
import { SizesTable } from '@/components/parametri/sizes-table'
import { SizeGroupsTable } from '@/components/parametri/size-groups-table'

export default function ParametriPage() {
  return (
    <div className="flex h-full">
      <Tabs defaultValue="brands" className="w-full">
        {/* Menu laterale */}
        <div className="flex">
          <div className="w-64 border-r p-4">
            <h2 className="font-semibold mb-4">Parametri</h2>
            <TabsList className="flex flex-col h-auto items-stretch">
              <TabsTrigger value="brands" className="justify-start">
                Brands
              </TabsTrigger>
              <TabsTrigger value="sizes" className="justify-start">
                Sizes
              </TabsTrigger>
              <TabsTrigger value="size-groups" className="justify-start">
                Size Groups
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenuto principale */}
          <div className="flex-1 p-6">
            <TabsContent value="brands">
              <BrandsTable />
            </TabsContent>
            <TabsContent value="sizes">
              <SizesTable />
            </TabsContent>
            <TabsContent value="size-groups">
              <SizeGroupsTable />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
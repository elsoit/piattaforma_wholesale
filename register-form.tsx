import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { BUSINESS_TYPES, COUNTRIES } from '@/lib/constants/variants'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

interface UserFormData {
  nome: string
  cognome: string
  email: string
  telefono: string
  password: string
}

interface CompanyFormData {
  company_name: string
  vat_number: string
  business: string
  country: string
  address: string
  city: string
  zip_code: string
  company_email: string
  company_phone: string
  pec?: string
  sdi?: string
}

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      company_name: "",
      vat_number: "",
      company_email: "",
      company_phone: "",
      business: "",
      address: "",
      city: "",
      zip_code: "",
      country: "",
      user_email: "",
      password: "",
      nome: "",
      cognome: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Informazioni Aziendali */}
          <h2 className="text-lg font-semibold">Informazioni Aziendali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ragione Sociale</FormLabel>
                  <FormControl>
                    <Input placeholder="Inserisci ragione sociale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Business</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo business" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ... altri campi aziendali ... */}
          </div>

          {/* Sede Legale */}
          <h2 className="text-lg font-semibold">Sede Legale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paese</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona paese" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ... altri campi indirizzo ... */}
          </div>

          {/* ... resto del form ... */}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Registrati
        </Button>
      </form>
    </Form>
  )
} 
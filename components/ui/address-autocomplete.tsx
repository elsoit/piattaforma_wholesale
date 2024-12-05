'use client'
import { useEffect, useRef, useState } from 'react'
import { Input } from './input'
import { MapPin } from 'lucide-react'
import { Button } from './button'

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    street_address: string
    city: string
    postal_code: string
    country: string
    province: string
  }) => void
  defaultValue?: string
  error?: string
  country?: string
}

export function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  error,
  country
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    province: '',
    postal_code: ''
  })
  const autoCompleteRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!country) return

    // Initialize services
    autoCompleteRef.current = new google.maps.places.AutocompleteService()
    const mapDiv = document.createElement('div')
    placesServiceRef.current = new google.maps.places.PlacesService(mapDiv)
  }, [country])

  const getPlaceDetails = async (placeId: string) => {
    return new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
      if (!placesServiceRef.current) return reject('Places service not initialized')

      placesServiceRef.current.getDetails(
        {
          placeId: placeId,
          fields: ['address_components', 'formatted_address']
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result)
          } else {
            reject(status)
          }
        }
      )
    })
  }

  const handleInput = async (value: string) => {
    setInputValue(value)
    if (!value || !autoCompleteRef.current || !country) {
      setPredictions([])
      setIsOpen(false)
      return
    }

    try {
      const response = await autoCompleteRef.current.getPlacePredictions({
        input: value,
        componentRestrictions: { country: country.toLowerCase() },
        types: ['address']
      })

      if (response?.predictions && response.predictions.length > 0) {
        setPredictions(response.predictions)
        setIsOpen(true)
        setShowManualInput(false)
      } else {
        setPredictions([])
        setIsOpen(false)
        setShowManualInput(true)
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
      setShowManualInput(true)
    }
  }

  const handleSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    try {
      const place = await getPlaceDetails(prediction.place_id)
      if (!place.address_components) return

      let streetNumber = ''
      let route = ''
      let city = ''
      let postalCode = ''
      let selectedCountry = ''
      let province = ''

      for (const component of place.address_components) {
        const type = component.types[0]
        switch (type) {
          case "street_number": streetNumber = component.long_name; break
          case "route": route = component.long_name; break
          case "locality": 
          case "postal_town": // Aggiungi questo per il Regno Unito
            city = component.long_name; 
            break
          case "postal_code": postalCode = component.long_name; break
          case "country": selectedCountry = component.short_name; break
          case "administrative_area_level_1": province = component.long_name; break
        }
      }

      // Se la città non è stata trovata, prova a usare il distretto
      if (!city) {
        const district = place.address_components.find(
          component => component.types.includes("administrative_area_level_2")
        )
        if (district) {
          city = district.long_name
        }
      }

      if (selectedCountry.toUpperCase() !== country?.toUpperCase()) {
        setInputValue('')
        return
      }

      const streetAddress = `${route} ${streetNumber}`.trim()
      setInputValue(place.formatted_address || streetAddress)
      setIsOpen(false)
      
      onAddressSelect({
        street_address: streetAddress || '',
        city: city || '',
        postal_code: postalCode || '',
        country: selectedCountry || '',
        province: province || ''
      })
    } catch (error) {
      console.error('Error getting place details:', error)
    }
  }

  const handleManualSubmit = () => {
    onAddressSelect({
      street_address: manualAddress.street,
      city: manualAddress.city,
      postal_code: manualAddress.postal_code,
      province: manualAddress.province,
      country: country || ''
    })
    setInputValue(manualAddress.street)
    setShowManualInput(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => inputValue && predictions.length > 0 && setIsOpen(true)}
          placeholder={country ? `Start typing address in ${country}...` : "Select country first"}
          className={`h-12 ${error ? 'border-red-500' : ''}`}
          disabled={!country}
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors flex items-start gap-2"
              onClick={() => handleSelect(prediction)}
            >
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-sm text-gray-500">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showManualInput && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <p className="text-sm text-gray-500">Address not found. Please enter manually:</p>
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Street address"
                value={manualAddress.street}
                onChange={(e) => setManualAddress(prev => ({ ...prev, street: e.target.value }))}
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="City"
                value={manualAddress.city}
                onChange={(e) => setManualAddress(prev => ({ ...prev, city: e.target.value }))}
                className="h-12"
              />
              <Input
                type="text"
                placeholder="Province/State"
                value={manualAddress.province}
                onChange={(e) => setManualAddress(prev => ({ ...prev, province: e.target.value }))}
                className="h-12"
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Postal Code"
                value={manualAddress.postal_code}
                onChange={(e) => setManualAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                className="h-12"
              />
            </div>
            <Button
              type="button"
              onClick={handleManualSubmit}
              className="w-full h-12"
              disabled={!manualAddress.street || !manualAddress.city || !manualAddress.postal_code}
            >
              Confirm Address
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 
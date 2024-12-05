'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from './input'
import { MapPin } from 'lucide-react'
import { Button } from './button'
import { State, City } from 'country-state-city'

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    street_address: string
    city: string
    postal_code: string
    country: string
    province: string
    region: string
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
  // Stati
  const [inputValue, setInputValue] = useState(defaultValue)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    province: '',
    postal_code: '',
    region: ''
  })

  // Refs
  const autoCompleteRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Inizializza Google Places
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && country) {
      autoCompleteRef.current = new google.maps.places.AutocompleteService()
      const mapDiv = document.createElement('div')
      placesServiceRef.current = new google.maps.places.PlacesService(mapDiv)
    }
  }, [country])

  // Gestione input
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
        componentRestrictions: { country }
      })
      
      // Se non ci sono risultati, mostra l'input manuale
      if (!response?.predictions || response.predictions.length === 0) {
        setShowManualInput(true)
        setIsOpen(false)
        return
      }

      // Prendi solo i primi 3 risultati
      const limitedPredictions = response.predictions.slice(0, 3)
      setPredictions(limitedPredictions)
      setIsOpen(true)
    } catch (error) {
      console.error('Error fetching predictions:', error)
      setShowManualInput(true)
      setIsOpen(false)
    }
  }

  // Gestione selezione predizione
  const handleSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    // Se è stata selezionata l'opzione manuale
    if (prediction.place_id === 'manual-input') {
      setShowManualInput(true)
      setIsOpen(false)
      return
    }

    if (!placesServiceRef.current) return

    try {
      const details = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesServiceRef.current?.getDetails(
          { 
            placeId: prediction.place_id,
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

      if (details.address_components) {
        let streetNumber = '', route = '', city = '', postalCode = '', region = '', province = ''

        for (const component of details.address_components) {
          const type = component.types[0]
          switch (type) {
            case 'street_number': streetNumber = component.long_name; break
            case 'route': route = component.long_name; break
            case 'locality': city = component.long_name; break
            case 'postal_code': postalCode = component.long_name; break
            case 'administrative_area_level_1': region = component.long_name; break
            case 'administrative_area_level_2': province = component.long_name; break
          }
        }

        // Se non c'è il numero civico, mostra l'input manuale
        if (!streetNumber) {
          setShowManualInput(true);
        }

        const streetAddress = `${route} ${streetNumber}`.trim()
        setInputValue(streetAddress)

        // Aggiorna i campi manuali se sono visibili
        if (showManualInput) {
          setManualAddress(prev => ({
            ...prev,
            street: streetAddress,
            city: city || '',
            postal_code: postalCode || '',
            province: province || city || '',
            region: region || ''
          }))
        }

        // Notifica il componente padre SENZA triggerare il submit
        onAddressSelect({
          street_address: streetAddress,
          city,
          postal_code: postalCode,
          country: country || '',
          province,
          region
        })

        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error getting place details:', error)
      setShowManualInput(true)
    }
  }

  // Aggiungi questa funzione per aggiornare automaticamente l'indirizzo
  const updateParentAddress = () => {
    if (manualAddress.street && manualAddress.city && manualAddress.postal_code && manualAddress.region) {
      onAddressSelect({
        street_address: manualAddress.street,
        city: manualAddress.city,
        postal_code: manualAddress.postal_code,
        province: manualAddress.province,
        region: manualAddress.region,
        country: country || ''
      })
      setInputValue(manualAddress.street)
    }
  }

  useEffect(() => {
    // Aggiorna il parent con i valori correnti degli input quando cambiano
    if (manualAddress.street && manualAddress.city && manualAddress.postal_code) {
      onAddressSelect({
        street_address: manualAddress.street,
        city: manualAddress.city,
        postal_code: manualAddress.postal_code,
        province: manualAddress.province,
        region: manualAddress.region,
        country: country || ''
      });
    }
  }, [manualAddress]);

  // Effetto per resettare i campi quando cambia il paese
  useEffect(() => {
    setInputValue('');
    setShowManualInput(false);
    setManualAddress({
      street: '',
      city: '',
      province: '',
      postal_code: '',
      region: ''
    });
    setPredictions([]);
    setIsOpen(false);
  }, [country]);

  // Gestione click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-4" ref={wrapperRef}>
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
        
        <button
          type="button"
          onClick={() => setShowManualInput(true)}
          className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
        >
          Enter manually
        </button>

        {isOpen && predictions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelect(prediction)
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors flex items-start gap-2 ${
                  prediction.place_id === 'manual-input' 
                    ? 'border-t border-gray-200 text-blue-600 hover:text-blue-700' 
                    : ''
                }`}
              >
                {prediction.place_id === 'manual-input' ? (
                  <>
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">
                        {prediction.structured_formatting.main_text}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-medium text-gray-900 truncate">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {showManualInput && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <p className="text-sm text-gray-500">Enter address manually:</p>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Street address"
              value={manualAddress.street}
              onChange={(e) => {
                setManualAddress(prev => ({ ...prev, street: e.target.value }))
                updateParentAddress()
              }}
              className="h-12"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Region/State"
                value={manualAddress.region}
                onChange={(e) => {
                  setManualAddress(prev => ({ ...prev, region: e.target.value }))
                  updateParentAddress()
                }}
                className="h-12"
              />

              <Input
                type="text"
                placeholder="Province"
                value={manualAddress.province}
                onChange={(e) => {
                  setManualAddress(prev => ({ ...prev, province: e.target.value }))
                  updateParentAddress()
                }}
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="City"
                value={manualAddress.city}
                onChange={(e) => {
                  setManualAddress(prev => ({ ...prev, city: e.target.value }))
                  updateParentAddress()
                }}
                className="h-12"
              />

              <Input
                type="text"
                placeholder={country === 'US' ? 'ZIP Code' : 'Postal Code'}
                value={manualAddress.postal_code}
                onChange={(e) => {
                  setManualAddress(prev => ({ ...prev, postal_code: e.target.value }))
                  updateParentAddress()
                }}
                className="h-12"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
declare namespace google.maps.places {
  class AutocompleteService {
    getPlacePredictions(request: AutocompletionRequest): Promise<AutocompleteResponse>;
  }

  class PlacesService {
    constructor(attrContainer: HTMLDivElement);
    getDetails(request: PlaceDetailsRequest, callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void): void;
  }

  interface AutocompletePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }

  interface AutocompleteResponse {
    predictions: AutocompletePrediction[];
  }

  interface AutocompletionRequest {
    input: string;
    componentRestrictions?: {
      country: string;
    };
    types?: string[];
  }

  interface PlaceDetailsRequest {
    placeId: string;
    fields: string[];
  }

  enum PlacesServiceStatus {
    OK,
    ZERO_RESULTS,
    OVER_QUERY_LIMIT,
    REQUEST_DENIED,
    INVALID_REQUEST,
  }

  interface PlaceResult {
    address_components?: AddressComponent[];
    formatted_address?: string;
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }
} 
export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Catalogo {
  id: number;
  codice: string;
  tipo: 'Preordine' | 'Riassortimento';
  brand_id: string;
  data_inizio_ordini?: Date;
  data_fine_ordini?: Date;
  stagione: string;
  anno: number;
  data_consegna?: string;
  stato: 'bozza' | 'pubblicato' | 'archiviato';
  note?: string;
  condizioni?: string;
  created_at: Date;
  updated_at: Date;
  cover_url?: string;
  nome?: string;
}

export interface CatalogoFile {
  id: number;
  catalogo_id: number;
  nome: string;
  description?: string;
  tipo: string;
  file_url: string;
  created_at: Date;
  updated_at: Date;
}

// ... altri tipi necessari ... 
export interface Vehicle {
  id: string;
  /** Immatriculation (licence plate). */
  plate: string;
  /** Marque (make). */
  make: string;
  /** Modèle (model). */
  model: string;
  /** Année (optional). */
  year?: number;
  /** Client propriétaire — reference to an existing client. */
  clientId: string;
  createdAt: number;
  updatedAt: number;
}

/** Editable fields of a vehicle, independent of identity and timestamps. */
export type VehicleInput = {
  plate: string;
  make: string;
  model: string;
  year?: number;
  clientId: string;
};

/** Lifecycle status of a workshop intervention. */
export type InterventionStatus = 'pending' | 'in_progress' | 'done';

export interface Intervention {
  id: string;
  /** Vehicle being serviced — reference to an existing vehicle. */
  vehicleId: string;
  /** Date of the intervention, ISO format `YYYY-MM-DD`. */
  date: string;
  /** Description of the reported problem. */
  problem: string;
  /** Diagnosis (optional). */
  diagnosis?: string;
  /** Work carried out (optional). */
  workDone?: string;
  /** Cost in euros (optional). */
  cost?: number;
  status: InterventionStatus;
  createdAt: number;
  updatedAt: number;
}

/** Editable fields of an intervention, independent of identity and timestamps. */
export type InterventionInput = Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>;

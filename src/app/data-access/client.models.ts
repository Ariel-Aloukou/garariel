export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: number;
  updatedAt: number;
}

/** Editable fields of a client, independent of identity and timestamps. */
export type ClientInput = {
  fullName: string;
  phone: string;
  email: string;
  address?: string;
};

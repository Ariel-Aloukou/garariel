import { Injectable, computed, signal } from '@angular/core';
import { Vehicle, VehicleInput } from '../../data-access/vehicle.models';
import { loadOrSeedVehicles, saveVehicles } from '../../data-access/vehicle.data';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Plate comparison ignores usual separators (spaces, hyphens). */
function compact(value: string): string {
  return normalize(value).replace(/[\s-]/g, '');
}

/** Search scope: immatriculation, marque, modèle (per the vehicle-management spec). */
function matchesQuery(vehicle: Vehicle, rawQuery: string): boolean {
  const query = normalize(rawQuery);
  if (!query) return true;
  if (normalize(vehicle.make).includes(query)) return true;
  if (normalize(vehicle.model).includes(query)) return true;

  const compactQuery = compact(rawQuery);
  if (compactQuery && compact(vehicle.plate).includes(compactQuery)) return true;
  return normalize(vehicle.plate).includes(query);
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly _vehicles = signal<Vehicle[]>(loadOrSeedVehicles());
  private readonly _query = signal('');

  readonly vehicles = this._vehicles.asReadonly();
  readonly query = this._query.asReadonly();
  readonly count = computed(() => this._vehicles().length);
  readonly filteredVehicles = computed(() => {
    const query = this._query();
    return this._vehicles().filter((vehicle) => matchesQuery(vehicle, query));
  });
  readonly resultCount = computed(() => this.filteredVehicles().length);
  readonly hasVehicles = computed(() => this._vehicles().length > 0);
  readonly hasResults = computed(() => this.filteredVehicles().length > 0);
  /** No vehicles exist at all. */
  readonly isEmpty = computed(() => this._vehicles().length === 0);
  /** Vehicles exist but the current search has no match. */
  readonly isNoResult = computed(() => this._vehicles().length > 0 && this.filteredVehicles().length === 0);

  setQuery(query: string): void {
    this._query.set(query);
  }

  clearQuery(): void {
    this._query.set('');
  }

  getById(id: string): Vehicle | undefined {
    return this._vehicles().find((vehicle) => vehicle.id === id);
  }

  create(input: VehicleInput): Vehicle {
    const now = Date.now();
    const vehicle: Vehicle = {
      id: `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      plate: input.plate.trim(),
      make: input.make.trim(),
      model: input.model.trim(),
      ...(input.year === undefined ? {} : { year: input.year }),
      clientId: input.clientId,
      createdAt: now,
      updatedAt: now,
    };
    this.commit([...this._vehicles(), vehicle]);
    return vehicle;
  }

  update(id: string, input: VehicleInput): Vehicle | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updated: Vehicle = {
      ...existing,
      plate: input.plate.trim(),
      make: input.make.trim(),
      model: input.model.trim(),
      year: input.year,
      clientId: input.clientId,
      updatedAt: Date.now(),
    };
    this.commit(this._vehicles().map((vehicle) => (vehicle.id === id ? updated : vehicle)));
    return updated;
  }

  delete(id: string): boolean {
    if (!this.getById(id)) return false;
    this.commit(this._vehicles().filter((vehicle) => vehicle.id !== id));
    return true;
  }

  private commit(vehicles: Vehicle[]): void {
    this._vehicles.set(vehicles);
    saveVehicles(vehicles);
  }

  private newId(): string {
    return `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

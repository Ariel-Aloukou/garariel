import { InterventionStatus } from '../../data-access/intervention.models';

/** French labels for the technical status values. */
export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  done: 'Terminée',
};

/** Badge styling per status — always shown alongside the label, never colour alone. */
export const INTERVENTION_STATUS_BADGE_CLASSES: Record<InterventionStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

export const INTERVENTION_STATUS_OPTIONS: ReadonlyArray<{
  value: InterventionStatus;
  label: string;
}> = [
  { value: 'pending', label: INTERVENTION_STATUS_LABELS.pending },
  { value: 'in_progress', label: INTERVENTION_STATUS_LABELS.in_progress },
  { value: 'done', label: INTERVENTION_STATUS_LABELS.done },
];

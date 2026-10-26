import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_VALUES, type UserStatus } from '../_data/user';
import { Field } from './panel-parts';
import { STATUS_LABELS, StatusBadge } from './status-badge';
import { VerifiedBadge } from './verified-badge';

type EditProps = { editing: boolean };

export const VerifiedField = ({
  verified,
  editing,
  onChange,
}: EditProps & { verified: boolean; onChange: (verified: boolean) => void }) => (
  <Field label="Email">
    {editing ? (
      <Select
        value={verified ? 'verified' : 'unverified'}
        onValueChange={(v) => onChange(v === 'verified')}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="unverified">Unverified</SelectItem>
        </SelectContent>
      </Select>
    ) : (
      <VerifiedBadge verified={verified} />
    )}
  </Field>
);

export const StatusField = ({
  status,
  deleted,
  editing,
  onChange,
}: EditProps & {
  status: UserStatus;
  deleted: boolean;
  onChange: (status: UserStatus) => void;
}) => (
  <Field label="Status">
    {editing ? (
      <Select value={status} onValueChange={(v) => onChange(v as UserStatus)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <StatusBadge status={status} deleted={deleted} />
    )}
  </Field>
);

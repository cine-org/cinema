import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AccountGrant, AccountProfile } from '@repo/auth';
import { ROLE_SCOPE } from '@repo/iam';

const SCOPE_TYPES = ['global', 'cluster', 'theater'] as const;
type ScopeType = (typeof SCOPE_TYPES)[number];

class AdminMeUserDto {
  @ApiProperty({ example: 'Lê Minh Quân', description: 'Full name, or the email without one.' })
  readonly name!: string;

  @ApiProperty({ example: 'Theater manager', description: 'Display name of the role.' })
  readonly role!: string;

  @ApiProperty({ example: 'LQ' })
  readonly initials!: string;
}

class AdminMeScopeDto {
  @ApiProperty({ enum: SCOPE_TYPES })
  readonly type!: ScopeType;

  @ApiPropertyOptional({ type: [String], description: 'Set for cluster.' })
  readonly clusterIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Set for theater.' })
  readonly theaterIds?: string[];
}

class AdminMeAccessDto {
  @ApiProperty({ type: [String], example: ['theaters:read', 'rooms:create'] })
  readonly permissions!: string[];

  @ApiProperty({ type: AdminMeScopeDto })
  readonly scope!: AdminMeScopeDto;
}

// The signed-in account as the admin app's session and access helpers expect it.
export class AdminMeResponseDto {
  @ApiProperty({ type: AdminMeUserDto })
  readonly user!: AdminMeUserDto;

  @ApiProperty({ type: AdminMeAccessDto })
  readonly access!: AdminMeAccessDto;

  static from(profile: AccountProfile, grant: AccountGrant): AdminMeResponseDto {
    const name = profile.fullName ?? profile.email ?? '';
    return {
      user: { name, role: profile.roleName ?? grant.key, initials: initialsOf(name) },
      access: { permissions: [...grant.permissions], scope: scopeOf(grant) },
    };
  }
}

function scopeOf(grant: AccountGrant): AdminMeScopeDto {
  switch (grant.scope) {
    case ROLE_SCOPE.CLUSTER:
      return { type: 'cluster', clusterIds: grant.clusterId ? [grant.clusterId] : [] };
    case ROLE_SCOPE.THEATER:
      return { type: 'theater', theaterIds: grant.theaterId ? [grant.theaterId] : [] };
    default:
      return { type: 'global' };
  }
}

// First letters of the first and last words: "Lê Minh Quân" → "LQ".
function initialsOf(name: string): string {
  const words = name.split(/[\s@.]+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((word) => word[0]!.toUpperCase()).join('');
}

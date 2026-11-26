import {BaseEntity} from '../../../shared/domain/model/base.entity';

export class Profile implements BaseEntity {
  constructor(
    public id: number,
    public userId: number,
    public fundoName: string,
    public contactPhone: string,
    public moistureThreshold: number,
    public temperatureThreshold: number,
  ) {
  }
}

export function isProfileComplete(profile: Profile, roles: readonly string[] = []): boolean {
  const isCommercial = roles.some((role) => {
    const normalized = role.trim().toUpperCase();
    return normalized === 'CUSTOMER' || normalized === 'SUPPLIER';
  });

  const hasDefaultPhone = profile.contactPhone === '+51000000000';

  if (isCommercial) {
    return !hasDefaultPhone;
  }

  const hasDefaultName = profile.fundoName === 'Default Fundo';
  return !hasDefaultName && !hasDefaultPhone;
}

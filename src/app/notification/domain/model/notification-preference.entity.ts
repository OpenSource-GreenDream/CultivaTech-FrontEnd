import { NotificationType } from './notification-type.enum';

export class NotificationPreference {
  constructor(
    public readonly id: number,
    public readonly profileId: number,
    public readonly type: NotificationType,
    public readonly fieldId: number | null,
    public readonly enabled: boolean,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}
}

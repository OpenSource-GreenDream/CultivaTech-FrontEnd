export class Notification {
  constructor(
    public readonly id: number,
    public readonly profileId: number,
    public readonly title: string,
    public readonly message: string,
    public readonly isRead: boolean,
    public readonly isAlert: boolean,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}
}
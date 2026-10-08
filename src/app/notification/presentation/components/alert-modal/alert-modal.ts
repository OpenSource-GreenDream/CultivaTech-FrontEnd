import { Component, Inject, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Notification } from '../../../domain/model/notification.entity';

@Component({
  selector: 'app-alert-modal',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './alert-modal.html',
  styleUrl: './alert-modal.css',
})
export class AlertModal {
  notification: Notification | null = null;

  constructor(
    public dialogRef: MatDialogRef<AlertModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: Notification | null,
  ) {
    this.notification = data;
  }

  close(): void {
    this.dialogRef.close();
  }

  accept(): void {
    this.dialogRef.close({ action: 'accept', notification: this.notification });
  }

  goToSensor(): void {
    this.dialogRef.close({ action: 'goToSensor', notification: this.notification });
  }
}

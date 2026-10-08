import { Component, inject, ViewChild } from '@angular/core';
import { SupplyForm } from '../../components/supply-form/supply-form';
import { CreateSupplyRequest } from '../../../domain/model/create-supply.request';
import { StockStore } from '../../../application/stock.store';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [
    SupplyForm,
    TranslatePipe
  ],
  selector: 'app-supply-registration',
  styleUrl: './supply-registration.css',
  templateUrl: './supply-registration.html',
})
export class SupplyRegistration {
  private stockStore = inject(StockStore);

  @ViewChild(SupplyForm)
  private supplyForm!: SupplyForm;

  successMessage = false;

  onRegisterSupply(request: CreateSupplyRequest): void {
    this.successMessage = false;

    this.stockStore.createSupply(request).subscribe({
      next: () => {
        console.log('Supply registered successfully');

        this.successMessage = true;
        this.supplyForm.reset();
      },
      error: (error) => {
        console.error('Error registering supply', error);
      }
    });
  }
}

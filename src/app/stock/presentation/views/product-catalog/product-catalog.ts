import {Component, inject, OnInit, signal} from '@angular/core';
import {StockStore} from '../../../application/stock.store';
import {Router} from '@angular/router';
import {Product} from '../../../domain/model/product.entity';
import {CurrencyPipe} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    CurrencyPipe,
    TranslatePipe
  ],
  selector: 'app-product-catalog',
  styleUrl: './product-catalog.css',
  templateUrl: './product-catalog.html',
})
export class ProductCatalog implements OnInit {
  private readonly stockStore = inject(StockStore);
  private readonly router = inject(Router);

  readonly products = this.stockStore.products;
  readonly loading = this.stockStore.loading;

  readonly selectedProduct = signal<Product | null>(null);

  readonly selectedProducer = this.stockStore.selectedProducer;
  readonly producerLoading = this.stockStore.producerLoading;

  ngOnInit(): void {
    this.stockStore.loadProducts().subscribe();
  }

  isAvailable(productId: number): boolean {
    return this.stockStore.isProductAvailable(productId);
  }

  getFieldName(fieldId: number | null | undefined): string {
    return this.stockStore.getFieldName(fieldId);
  }

  getSoilType(fieldId: number | null | undefined): string {
    if (fieldId === null || fieldId === undefined) return '';
    const field = this.stockStore.fields().find((f) => Number(f.id) === Number(fieldId));
    return field?.soilType ?? '';
  }

  viewDetail(product: Product): void {
    this.selectedProduct.set(product);
    this.stockStore.loadProducer(product.id).subscribe({
      error: () => {},
    });
  }

  closeDetail(): void {
    this.selectedProduct.set(null);
    this.stockStore.clearProducer();
  }

  goBack(): void {
    this.router.navigate(['/stock']);
  }
}

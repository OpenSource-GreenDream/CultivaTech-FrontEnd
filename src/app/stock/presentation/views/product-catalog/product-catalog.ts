import {Component, inject, OnInit, signal} from '@angular/core';
import {StockStore} from '../../../application/stock.store';
import {Router} from '@angular/router';
import {Product} from '../../../domain/model/product.entity';
import {CurrencyPipe} from '@angular/common';

@Component({
  imports: [
    CurrencyPipe
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

  ngOnInit(): void {
    this.stockStore.loadProducts().subscribe();
  }

  viewDetail(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeDetail(): void {
    this.selectedProduct.set(null);
  }

  goBack(): void {
    this.router.navigate(['/stock']);
  }
}

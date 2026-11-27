import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {StockStore} from '../../../application/stock.store';
import {Router} from '@angular/router';
import {CommunityStore} from '../../../../community/application/community.store';
import {AuthService} from '../../../../iam/application/auth.service';

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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly communityStore = inject(CommunityStore);

  readonly averageRating = signal<{ average: number; count: number }>({ average: 0, count: 0 });

  readonly canReviewProduct = computed(() => {
    const roles = this.authService.currentUserRoles();
    return roles.includes('CUSTOMER') || roles.includes('SUPPLIER');
  });

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
    document.body.style.overflow = 'hidden';
    this.stockStore.loadProducer(product.id).subscribe({
      next: () => {
        const producer = this.stockStore.selectedProducer();
        if (producer) {
          this.communityStore.getAverageProductRating(producer.profileId).subscribe({
            next: (res) => this.averageRating.set(res),
          });
        }
      },
      error: () => {},
    });
  }

  closeDetail(): void {
    this.selectedProduct.set(null);
    this.stockStore.clearProducer();
    this.averageRating.set({ average: 0, count: 0 });
    document.body.style.overflow = '';
  }

  reviewProduct(productId: number): void {
    this.closeDetail();
    this.router.navigate(['/community/products', productId, 'reviews']);
  }

  goBack(): void {
    this.router.navigate(['/stock']);
  }
}

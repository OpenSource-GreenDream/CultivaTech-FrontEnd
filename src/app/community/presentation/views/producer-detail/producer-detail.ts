import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {CurrencyPipe} from '@angular/common';
import {CommunityStore} from '../../../application/community.store';
import {CommunityProfile} from '../../../domain/model/community-profile.entity';
import {Product} from '../../../../stock/domain/model/product.entity';
import {ProductApi} from '../../../../stock/infrastructure/product-api';
import {InventoryApi} from '../../../../stock/infrastructure/inventory-api';

@Component({
  imports: [TranslatePipe, CurrencyPipe],
  selector: 'app-producer-detail',
  styleUrl: './producer-detail.css',
  templateUrl: './producer-detail.html',
})
export class ProducerDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected communityStore = inject(CommunityStore);
  private productApi = inject(ProductApi);
  private inventoryApi = inject(InventoryApi);

  readonly producer = signal<CommunityProfile | null>(null);
  readonly products = signal<Product[]>([]);
  readonly averageRating = signal<{ average: number; count: number }>({ average: 0, count: 0 });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('communityProfileId'));
    this.communityStore.loadAllCommunityProfiles().subscribe({
      next: () => {
        const found = this.communityStore.communityProfiles().find((p) => p.id === id) ?? null;
        this.producer.set(found);
        if (found) {
          this.loadProducts(found.profileId);
          this.communityStore.getAverageProductRating(found.profileId).subscribe({
            next: (res) => this.averageRating.set(res),
          });
        }
      }
    });
  }

  private loadProducts(profileId: number): void {
    this.inventoryApi.getInventoriesByProfileId(profileId).subscribe({
      next: (inventories) => {
        const ids = new Set(inventories.map((i) => Number(i.id)));
        this.productApi.getProducts().subscribe({
          next: (products) => {
            this.products.set(products.filter((p) => ids.has(Number(p.inventoryId))).map((p) => ({
              id: p.id,
              inventoryId: p.inventoryId,
              fieldId: p.fieldId ?? null,
              name: p.name,
              description: p.description,
              price: p.price,
              type: p.type,
              imageUrl: p.imageUrl,
            })));
          },
          error: () => this.products.set([]),
        });
      },
      error: () => this.products.set([]),
    });
  }

  viewProductReviews(productId: number): void {
    this.router.navigate(['/community/products', productId, 'reviews']);
  }

  back(): void {
    this.router.navigate(['/community']);
  }
}
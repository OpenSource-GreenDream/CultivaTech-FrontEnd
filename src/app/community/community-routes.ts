import {Routes} from '@angular/router';

export const COMMUNITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/views/community-management/community-management')
      .then(m => m.CommunityManagement),
  },
  {
    path: 'producers/:communityProfileId',
    loadComponent: () => import('./presentation/views/producer-detail/producer-detail')
      .then(m => m.ProducerDetail),
  },
  {
    path: 'products/:productId/reviews',
    loadComponent: () => import('./presentation/views/product-reviews/product-reviews')
      .then(m => m.ProductReviews),
  }
];
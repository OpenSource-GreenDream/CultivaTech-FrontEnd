import {Routes} from '@angular/router';

export const COMMUNITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/views/community-management/community-management')
      .then(m => m.CommunityManagement)
  }
];

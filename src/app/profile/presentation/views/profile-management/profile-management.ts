import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {Router} from '@angular/router';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';
import {ProfileInfo} from '../../components/profile-info/profile-info';
import {FieldList} from '../../components/field-list/field-list';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    ProfileInfo,
    FieldList,
    TranslatePipe
  ],
  selector: 'app-profile-management',
  styleUrl: './profile-management.css',
  templateUrl: './profile-management.html',
})
export class ProfileManagementComponent implements OnInit, OnDestroy {
  protected profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);
  private router = inject(Router);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.profileStore.clearFeedback();
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.profileContext.fetchCurrentProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.loadFields();
        } else {
          this.isLoading.set(false);
          this.router.navigate(['/profile/create']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('profile.management.load-error');
      }
    });
  }

  private loadFields(): void {
    this.profileStore.loadFieldsForCurrentProfile().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('fields.load-error');
      }
    });
  }

  onFieldCreated(): void {
    this.loadFields();
  }
}

import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
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
export class ProfileManagementComponent implements OnInit {
  protected profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;

  ngOnInit(): void {
    this.isLoading = true;
    this.profileContext.fetchCurrentProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.profileStore.currentProfile.set(profile);
          this.loadFields();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching profile context:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadFields(): void {
    this.profileStore.loadFieldsForCurrentProfile().subscribe({
      next: (fields) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading fields:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFieldCreated(): void {
    this.loadFields();
  }
}

import {Component, input} from '@angular/core';
import {Profile} from '../../../domain/model/profile.entity';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    TranslatePipe
  ],
  selector: 'app-profile-info',
  styleUrl: './profile-info.css',
  templateUrl: './profile-info.html',
})
export class ProfileInfo {
  readonly profile = input<Profile | null>(null);
}

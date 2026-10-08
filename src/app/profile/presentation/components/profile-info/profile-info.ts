import {Component, Input} from '@angular/core';
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
  @Input() profile: Profile | null = null;
}

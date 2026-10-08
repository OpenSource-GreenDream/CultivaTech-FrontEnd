import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { StockMovement } from '../../../domain/model';

@Component({
  imports: [DatePipe, TranslatePipe],
  selector: 'app-stock-movement-list',
  styleUrl: './stock-movement-list.css',
  templateUrl: './stock-movement-list.html',
})
export class StockMovementList {
  movements = input<StockMovement[]>([]);
}

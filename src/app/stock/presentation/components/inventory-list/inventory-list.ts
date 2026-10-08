import {Component, input} from '@angular/core';
import {Inventory} from '../../../domain/model/inventory.entity';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';

@Component({
  imports: [
    TranslatePipe,
    DatePipe
  ],
  selector: 'app-inventory-list',
  styleUrl: './inventory-list.css',
  templateUrl: './inventory-list.html',
})
export class InventoryList {
  inventories = input<Inventory[]>([]);
}

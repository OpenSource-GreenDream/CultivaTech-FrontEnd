import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Layout} from './shared/presentation/components/layout/layout';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('cultivatech-front');
}

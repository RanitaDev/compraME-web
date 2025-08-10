import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { HomeComponent } from './features/home/home.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, HomeComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('compraME-web');
}

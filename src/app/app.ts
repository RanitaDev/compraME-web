import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { HomeComponent } from './features/home/home.component';
import { Footer } from 'primeng/api';
import { FooterComponent } from './layout/footer/footer.component';
import { SpinnerComponent } from './core/components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, FooterComponent, SpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('compraME-web');
}

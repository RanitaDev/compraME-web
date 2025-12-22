import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { FooterComponent } from './layout/footer/footer.component';
import { SpinnerComponent } from './core/components/spinner/spinner.component';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextModalComponent } from './shared/modal-text/modal-text.component';
import { FaqModalComponent } from './shared/faq-modal/faq-modal.component';
import { ContactoModalComponent } from './shared/contacto-modal/contacto-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, FooterComponent, SpinnerComponent, ToastModule, ConfirmDialogModule, TextModalComponent, FaqModalComponent, ContactoModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('compraME-web');
}

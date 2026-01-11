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
  imports: [
    RouterOutlet,
    Header,
    FooterComponent,
    SpinnerComponent,
    ToastModule,
    ConfirmDialogModule,
    TextModalComponent,
    FaqModalComponent,
    ContactoModalComponent
  ],
  template: `
    <!-- Header -->
    <div class="container mx-auto px-8 sm:px-6 lg:px-8">
      <app-header></app-header>
    </div>

    <!-- Main Content -->
    <main class="container mx-auto px-8 sm:px-6 lg:px-8">
      <p-toast
        key="main"
        position="top-right"
        [breakpoints]="{'920px': {width: '100%', right: '0', left: '0'}}"
        [baseZIndex]="9999">
      </p-toast>
      <p-confirmDialog></p-confirmDialog>
      <router-outlet></router-outlet>
    </main>

    <div>
      <app-footer></app-footer>
    </div>

    <app-text-modal></app-text-modal>
    <app-faq-modal></app-faq-modal>
    <app-contacto-modal></app-contacto-modal>

    <!-- Spinner global para cargas -->
    <app-spinner></app-spinner>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('compraME-web');
}

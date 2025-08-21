import { routes } from './../../app.routes';
// footer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  animations: [
    trigger('footerAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('brandAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('0.6s 0.2s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('sectionAnimation', [
      transition(':enter', [
        query('a', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('newsletterAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.7s 0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('bottomBarAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s 0.6s ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})

export class FooterComponent implements OnInit {
  newsletterEmail: string = '';
  currentYear: number = new Date().getFullYear();
  public navigationLinks: Array<{ name: string; href: string; icon: string }> = [];
  public supportLinks: Array<{ name: string; href: string; icon: string }> = [];
  public legalLinks: Array<{ name: string; href: string; icon: string }> = [];
  public socialLinks: Array<{ name: string; href: string; platform: string }> = [];

  constructor(
    public router: Router
  ){
    // Navigation links data
  this.navigationLinks = [
    { name: 'Inicio', href: '#', icon: 'home' },
    { name: 'Productos', href: '#', icon: 'products' },
    { name: 'Categorías', href: '#', icon: 'categories' },
    { name: 'Ofertas', href: '#', icon: 'offers' },
    { name: 'Mi Cuenta', href: '#', icon: 'account' },
    { name: 'Carrito', href: '#', icon: 'cart' }
  ];

  // Help & Support links data
  this.supportLinks = [
    { name: 'Preguntas Frecuentes', href: '#', icon: 'faq' },
    { name: 'Centro de Ayuda', href: '#', icon: 'help' },
    { name: 'Contacto', href: '#', icon: 'contact' },
    { name: 'Chat en Vivo', href: '#', icon: 'chat' },
    { name: 'Guía de Compras', href: '#', icon: 'guide' },
    { name: 'Devoluciones', href: '#', icon: 'returns' }
  ];

  // Legal & Privacy links data
  this.legalLinks = [
    { name: 'Política de Privacidad', href: '#', icon: 'privacy' },
    { name: 'Términos y Condiciones', href: '#', icon: 'terms' },
    { name: 'Política de Cookies', href: '#', icon: 'cookies' },
    { name: 'Aviso Legal', href: '#', icon: 'legal' },
    { name: 'GDPR', href: '#', icon: 'gdpr' },
    { name: 'Accesibilidad', href: '#', icon: 'accessibility' }
  ];

  // Social media links data
  this.socialLinks = [
    { name: 'Facebook', href: '#', platform: 'facebook' },
    { name: 'Instagram', href: '#', platform: 'instagram' },
    { name: 'Twitter', href: '#', platform: 'twitter' },
    { name: 'YouTube', href: '#', platform: 'youtube' }
  ];
  }

  ngOnInit(): void {
    // Inicialización del componente
    this.loadFooterData();
  }

  private loadFooterData(): void {
    // Aquí podrías cargar datos dinámicos del footer desde un servicio
    console.log('Footer data loaded');
  }

  // Newsletter subscription
  onNewsletterSubmit(): void {
    if (this.isValidEmail(this.newsletterEmail)) {
      console.log('Newsletter subscription:', this.newsletterEmail);
      // Aquí implementarías la lógica de suscripción
      // Por ejemplo: this.newsletterService.subscribe(this.newsletterEmail);
      this.showSuccessMessage();
      this.newsletterEmail = '';
    } else {
      this.showErrorMessage('Por favor, ingresa un email válido');
    }
  }

  // Email validation
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Social media navigation
  onSocialClick(platform: string): void {
    console.log(`Navigating to ${platform}`);
    // Implementar navegación a redes sociales
    // Por ejemplo: window.open(this.getSocialUrl(platform), '_blank');
  }

  // Footer link navigation
  onFooterLinkClick(linkName: string): void {
    console.log(`Navigating to ${linkName}`);
    // Implementar navegación interna
    // Por ejemplo: this.router.navigate([this.getLinkRoute(linkName)]);
  }

  // Success/Error message handlers
  private showSuccessMessage(): void {
    console.log('¡Gracias por suscribirte! Recibirás nuestras mejores ofertas.');
    // Implementar sistema de notificaciones
    // Por ejemplo: this.toastService.success('¡Suscripción exitosa!');
  }

  private showErrorMessage(message: string): void {
    console.log('Error:', message);
    // Implementar sistema de notificaciones de error
    // Por ejemplo: this.toastService.error(message);
  }

  // Utility methods
  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Keyboard event handling for accessibility
  onKeyDown(event: KeyboardEvent, action: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  public navegar(ruta: string): void {
    console.log('Navegando a:', ruta);
    const orderId = 'ORD-87654321';
    this.router.navigate([`${ruta}/${orderId}`]);
  }

}

import { Injectable } from '@angular/core';

export interface ContactOption {
  icon: string;
  label: string;
  link: string;
  bgColor: string;
  hoverColor: string;
}

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private options: ContactOption[] = [
    {
      icon: 'pi pi-whatsapp',
      label: 'WhatsApp',
      link: 'https://wa.me/524771234567',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700'
    },
    {
      icon: 'pi pi-facebook',
      label: 'Facebook',
      link: 'https://facebook.com/comprame',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      icon: 'pi pi-envelope',
      label: 'Correo Electrónico',
      link: 'mailto:contacto@comprame.com.mx',
      bgColor: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700'
    }
  ];

  constructor() {}

  getAll(): ContactOption[] {
    return this.options;
  }
}

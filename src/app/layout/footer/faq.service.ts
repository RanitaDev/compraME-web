import { Injectable } from '@angular/core';

export interface FAQ {
  question: string;
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class FaqService {
  private faqs: FAQ[] = [
    {
      question: '¿Cómo funciona compraME?',
      answer: `compraME es un comercio electrónico con sede en León, Guanajuato, especializado en productos tecnológicos de alta gama y equipos de nivel empresarial que no suelen estar disponibles en el mercado convencional. Atendemos principalmente a clientes dentro del estado, aunque también realizamos envíos a nivel nacional. Nuestro objetivo es facilitar el acceso a dispositivos y accesorios de última generación con un servicio ágil y confiable.`
    },
    {
      question: '¿Cómo funcionan los pagos?',
      answer: `Una vez que seleccionas un producto, podrás elegir entre las formas de pago disponibles. Tras seguir las instrucciones correspondientes y completar el pago, deberás subir el comprobante de tu transacción. En ese momento se generará tu orden, la cual será revisada por nuestro equipo. Una vez verificado el pago, procederemos con el proceso de envío.`
    },
    {
      question: '¿Cuánto se tardan los envíos?',
      answer: `Los plazos de entrega estimados son de 1 a 3 días naturales para envíos dentro del estado de Guanajuato y de 5 a 10 días naturales para envíos a nivel nacional. Además, el envío es gratuito en compras superiores a $600 pesos.`
    },
    {
      question: '¿Por qué elegir compraME sobre otros?',
      answer: `compraME actúa como intermediario especializado en productos que no se consiguen fácilmente por canales convencionales, especialmente dispositivos electrónicos de nivel empresarial. Ofrecemos un catálogo cuidadosamente seleccionado, soporte personalizado y transparencia en cada etapa del proceso, desde la compra hasta la entrega. Nuestra misión es conectar a nuestros clientes con tecnología de punta de manera sencilla y confiable.`
    },
    {
      question: '¿Hay devoluciones?',
      answer: `Por el momento no contamos con un sistema de devoluciones habilitado. Estamos trabajando en implementar esta funcionalidad próximamente para mejorar tu experiencia de compra.`
    },
    {
      question: '¿Garantía?',
      answer: `Sí, muchos de nuestros productos cuentan con garantía directa del proveedor o fabricante. En otros casos, la garantía se gestiona directamente con compraME. Te recomendamos revisar las especificaciones de cada producto para conocer los detalles de cobertura.`
    }
  ];

  constructor() {}

  getAll(): FAQ[] {
    return this.faqs;
  }

  add(faq: FAQ): void {
    this.faqs.push(faq);
  }
}

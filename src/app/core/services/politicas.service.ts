import { Injectable } from '@angular/core';

export interface Politica {
  key: string;
  title: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class PoliticasService {
  // Contenidos legales redactados en tono profesional; deben revisarse con
  // asesoría jurídica antes de su publicación definitiva.
  private policies: Record<string, Politica> = {
    terminos_servicio: {
      key: 'terminos_servicio',
      title: 'Términos y Condiciones de Uso',
      content: `Estos Términos y Condiciones regulan la utilización del sitio web y de
los servicios prestados por compraME. El acceso y uso de la plataforma
implican la aceptación íntegra de las condiciones aquí enunciadas. El usuario
se compromete a utilizar los servicios conforme a la normativa vigente y a no
emplearlos con fines ilícitos ni para perjudicar derechos de terceros.

compraME podrá, en caso de incumplimiento de estas condiciones, adoptar
medidas procedentes, incluidas la suspensión temporal o la extinción del
servicio al usuario responsable, sin perjuicio de las acciones legales que
procedan.`
    },

    politica_privacidad: {
      key: 'politica_privacidad',
      title: 'Política de Privacidad y Protección de Datos',
      content: `compraME trata los datos personales de conformidad con la legislación
aplicable en materia de protección de datos. Los datos se recaban para
finalidades concretas, explícitas y legítimas, como la gestión de pedidos,
facturación, atención al cliente y mejora de la experiencia de usuario.

Los usuarios podrán ejercer los derechos que la normativa reconoce
(acceso, rectificación, supresión, oposición, limitación y portabilidad)
mediante la remisión de una solicitud dirigida al responsable del tratamiento
con la identificación correspondiente. Los datos se conservarán durante el
tiempo necesario para cumplir la finalidad del tratamiento y para atender las
obligaciones legales aplicables.`
    },

    politica_reembolsos: {
      key: 'politica_reembolsos',
      title: 'Política de Reembolsos y Devoluciones',
      content: `Las devoluciones y reembolsos se gestionarán conforme a lo previsto en la
legislación vigente y a las condiciones específicas asociadas a cada producto.
Para que proceda la devolución, el producto deberá ser devuelto en condiciones
adecuadas (salvo defecto de fabricación) y acompañarse de su embalaje y
accesorios originales cuando proceda.

En los casos en que se confirme un error de suministro o un defecto del
producto imputable a compraME, ésta asumirá los gastos de devolución y
procederá al reembolso del importe satisfecho en un plazo razonable y por el
medio de pago originalmente utilizado, salvo acuerdo expreso en contrario.`
    },

    politica_envio: {
      key: 'politica_envio',
      title: 'Condiciones de Envío y Entrega',
      content: `Los plazos de entrega facilitados son estimativos y se computan a partir de
la confirmación del pedido y la verificación del pago. Las entregas se realizan
en la dirección indicada por el cliente; compraME no será responsable de los
retrasos ocasionados por información de envío incorrecta o incompleta.

En situaciones de fuerza mayor o por causas atribuibles al transportista, los
plazos podrán extenderse. compraME informará al cliente de cualquier
incidencia relevante y pondrá a su disposición las alternativas que procedan.`
    },

    seguridad_datos: {
      key: 'seguridad_datos',
      title: 'Seguridad de la Información',
      content: `compraME aplica medidas técnicas y organizativas adecuadas para garantizar
la confidencialidad, integridad y disponibilidad de los datos personales
que trata. Estas medidas incluyen controles de acceso, políticas de
gestión de accesos, cifrado cuando corresponde y procesos de monitorización
de seguridad.

No obstante, ningún sistema es completamente invulnerable. En caso de
incidencia de seguridad que suponga riesgo para los datos personales,
compraME adoptará las medidas de contención y notificación previstas por la
normativa aplicable.`
    },

    politica_cookies: {
      key: 'politica_cookies',
      title: 'Política de Cookies',
      content: `Este sitio utiliza cookies propias y de terceros para mejorar la
experiencia de navegación, facilitar funcionalidades esenciales y obtener
estadísticas de uso anónimas. Las cookies podrán clasificarse como técnicas,
de preferencia, de análisis y de marketing.

El usuario puede gestionar su consentimiento y rechazar o eliminar cookies
desde la configuración del navegador o mediante las opciones de gestión de
cookies habilitadas en la plataforma. La desactivación de determinadas cookies
puede afectar al correcto funcionamiento de algunas funcionalidades.`
    },

    aviso_legal: {
      key: 'aviso_legal',
      title: 'Aviso Legal',
      content: `La información contenida en este sitio web se facilita únicamente con
finalidades informativas generales. compraME realiza esfuerzos razonables
para mantener la información actualizada y veraz, pero no garantiza su
integridad ni exactitud en todos los supuestos. La utilización de la
información ofrecida es responsabilidad del usuario.

Los derechos de propiedad intelectual e industrial sobre los contenidos son
titularidad de sus legítimos propietarios o han sido licenciados. Queda
prohibida la reproducción total o parcial sin la autorización expresa del
titular correspondiente.`
    },

    gdpr: {
      key: 'gdpr',
      title: 'Protección de Datos (GDPR)',
      content: `Para los usuarios ubicados en el Espacio Económico Europeo, compraME
cumple con los requisitos del Reglamento General de Protección de Datos
(RGPD). Los interesados podrán ejercer los derechos reconocidos por dicha
normativa ante el responsable del tratamiento, y en su caso formular una
reclamación ante la autoridad de control competente.`
    },

    accesibilidad: {
      key: 'accesibilidad',
      title: 'Accesibilidad',
      content: `compraME se esfuerza por facilitar el acceso universal a sus servicios y
por seguir criterios de accesibilidad web. Si detecta barreras o dificultades
de acceso, puede notificarlo a través de los canales de atención al cliente para
que sean evaluadas y corregidas con prioridad.`
    }
  };

  constructor() {}

  /** Devuelve la política (title + content) por su clave. */
  getPolitica(key: string): Politica | null {
    return this.policies[key] ?? null;
  }

  /** Lista las claves disponibles. */
  listKeys(): string[] {
    return Object.keys(this.policies);
  }

  /** Devuelve todas las políticas como array. */
  all(): Politica[] {
    return Object.values(this.policies);
  }
}

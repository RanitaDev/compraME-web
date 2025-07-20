import { NgModule } from '@angular/core';
// Importa aquí solo los módulos de PrimeNG que necesites
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
// Agrega más módulos según los vayas necesitando

@NgModule({
  exports: [
    ButtonModule,
    InputTextModule,
    CardModule
    // Agrega aquí los módulos importados
  ]
})
export class PrimeNgModule {}

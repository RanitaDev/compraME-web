import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
// Importa aquí solo los módulos de PrimeNG que necesites

@NgModule({
  imports: [
    ButtonModule,
    TooltipModule,
    TableModule,
    FloatLabelModule,
    CardModule,
    DialogModule,
    ToastModule,
    //ANGULAR
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [
    ButtonModule,
    TooltipModule,
    TableModule,
    FloatLabelModule,
    CardModule,
    DialogModule,
    ToastModule,
    //ANGULAR
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  declarations: [
    // Aquí puedes declarar componentes si es necesario
  ]
})
export class PrimeNgModule {}

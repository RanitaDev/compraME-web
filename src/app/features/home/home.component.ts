
import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '../../primeng.module';
import { BackgroundService } from '../../core/generales/background.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    PrimeNgModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  public currentColor: string = '#ffffff'; // Default color

  constructor(
    private backgroundService: BackgroundService
  ) { }

  ngOnInit(): void {
    //PRIMERO LLAMAMOS A LOS PRODUCTOS DESTACADOS
  }

}


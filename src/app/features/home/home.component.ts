
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../primeng.module';
import { ProductService } from '../../services/products.service';
import { Subscription } from 'rxjs';
import { CarouselBannerComponent } from './components/carousel-banner/carousel-banner.component';
import { CategoryCardsComponent } from './components/category-cards/category-cards.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PrimeNgModule,
    CarouselBannerComponent,
    CategoryCardsComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

}


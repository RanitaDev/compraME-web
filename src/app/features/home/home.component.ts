
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cards } from '../../shared/cards/cards';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Cards, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {}

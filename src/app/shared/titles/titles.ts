import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-titles',
  imports: [],
  templateUrl: './titles.html',
  styleUrl: './titles.css'
})
export class Titles {
  @Input() text: string = 'INSERTE UN TÍTULO';
  @Input() font: string = 'Sans-serif';
}

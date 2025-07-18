import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.initializeNavAnimation();
  }

  private initializeNavAnimation() {
    const navLinks = this.el.nativeElement.querySelectorAll('.nav-link');
    const navBackground = this.el.nativeElement.querySelector('.nav-background');

    navLinks.forEach((link: HTMLElement) => {
      this.renderer.listen(link, 'click', (event) => {
        event.preventDefault();
        
        // Remove active class from all links
        navLinks.forEach((l: HTMLElement) => {
          this.renderer.removeClass(l, 'active');
        });
        
        // Add active class to clicked link
        this.renderer.addClass(link, 'active');
        
        // Animate background
        this.animateNavBackground(link, navBackground);
      });
    });

    // Set initial position for active link
    const activeLink = this.el.nativeElement.querySelector('.nav-link.active');
    if (activeLink && navBackground) {
      this.animateNavBackground(activeLink, navBackground);
    }
  }

  private animateNavBackground(activeLink: HTMLElement, background: HTMLElement) {
    const linkRect = activeLink.getBoundingClientRect();
    const navRect = activeLink.closest('.nav')?.getBoundingClientRect();
    
    if (!navRect) return;

    const leftOffset = linkRect.left - navRect.left;
    const width = linkRect.width;

    this.renderer.setStyle(background, 'width', `${width}px`);
    this.renderer.setStyle(background, 'transform', `translateX(${leftOffset}px) translateY(-50%)`);
    this.renderer.setStyle(background, 'opacity', '1');
  }
}

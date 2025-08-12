import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCommentsComponent } from './product-comments.component';

describe('ProductCommentsComponent', () => {
  let component: ProductCommentsComponent;
  let fixture: ComponentFixture<ProductCommentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCommentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

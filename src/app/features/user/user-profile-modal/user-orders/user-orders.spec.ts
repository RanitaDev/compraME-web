import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserOrders } from './user-orders';

describe('UserOrders', () => {
  let component: UserOrders;
  let fixture: ComponentFixture<UserOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserOrders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

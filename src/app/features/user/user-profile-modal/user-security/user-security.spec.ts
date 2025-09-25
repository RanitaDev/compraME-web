import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSecurity } from './user-security';

describe('UserSecurity', () => {
  let component: UserSecurity;
  let fixture: ComponentFixture<UserSecurity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSecurity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSecurity);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

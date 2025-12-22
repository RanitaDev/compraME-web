import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IAuthResponse } from '../../interfaces/auth.interface';

// Interfaces locales para el componente
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  direccion?: string;
  telefono: string;
  rolId?: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    DividerModule,
    ToggleButtonModule,
    TooltipModule
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  isLoginMode = signal(true);
  loginForm: FormGroup;
  registerForm: FormGroup;

  public checked: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true] // Cambiar a true por defecto
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(32)]],
      confirmPassword: ['', [Validators.required]],
      //acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para confirmar contraseñas
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Si las contraseñas coinciden, eliminar el error específico
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  toggleMode() {
    this.isLoginMode.set(!this.isLoginMode());
  }

  onLogin() {
    if (this.loginForm.valid) {
      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe || false
      };

      this.authService.login(loginData).subscribe({
        next: (response: IAuthResponse) => {
          this.toastService.success('¡Bienvenido!', 'Has iniciado sesión correctamente');

          // Verificar si hay una intención de compra pendiente
          const purchaseIntent = localStorage.getItem('purchase_intent');
          if (purchaseIntent) {
            try {
              const intent = JSON.parse(purchaseIntent);
              if (intent.action === 'buy_now' && intent.productId) {
                // Redirigir de vuelta al producto para completar la compra
                localStorage.removeItem('purchase_intent');
                this.router.navigate(['/product', intent.productId], {
                  queryParams: { continue_purchase: 'true' }
                });
                return;
              }
            } catch (error) {
              console.error('Error procesando purchase_intent:', error);
            }
          }

          // Redirección normal
          const redirectUrl = localStorage.getItem('redirect_after_login');
          if (redirectUrl && redirectUrl !== '/auth') {
            localStorage.removeItem('redirect_after_login');
            this.router.navigate([redirectUrl]);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          // El mensaje ya viene procesado desde el AuthService handleError
          const errorMessage = error.message || 'Error al iniciar sesión';
          this.toastService.error('Error de autenticación', errorMessage);
        }
      });
    } else {
      this.toastService.validationError('Por favor completa todos los campos correctamente');
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      const registerData: RegisterRequest = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        nombre: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`,
        telefono: this.registerForm.value.telefono,
        rolId: 'cliente'
      };

      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          this.toastService.success('¡Cuenta creada!', 'Tu cuenta ha sido creada exitosamente. ¡Bienvenido a compraME!');

          // Pequeño delay para que el usuario vea el toast antes de navegar
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1500);
        },
        error: (error: any) => {
          console.error('Error en registro:', error);

          // El mensaje ya viene procesado desde el AuthService handleError
          const errorMessage = error.message || 'Error al crear la cuenta';
          this.toastService.error('Error en el registro', errorMessage);
        }
      });
    } else {
      this.toastService.validationError('Por favor completa todos los campos correctamente');
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  // Métodos de utilidad para la validación en el template
  isFieldInvalid(formName: 'loginForm' | 'registerForm', fieldName: string): boolean {
    const form = formName === 'loginForm' ? this.loginForm : this.registerForm;
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formName: 'loginForm' | 'registerForm', fieldName: string): string {
    const form = formName === 'loginForm' ? this.loginForm : this.registerForm;
    const field = form.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Ingrese un email válido';
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${minLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `Máximo ${maxLength} caracteres`;
      }
      if (field.errors['pattern'] && fieldName === 'telefono') {
        return 'El teléfono debe tener entre 8 y 15 dígitos';
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }

  // Método para limpiar formularios al cambiar de modo
  onModeChange() {
    this.loginForm.reset();
    this.registerForm.reset();
    this.toggleMode();
  }
}

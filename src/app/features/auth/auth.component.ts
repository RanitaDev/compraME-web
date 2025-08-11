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

// Interfaces locales para el componente
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
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
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
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
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: (response: any) => {
          console.log('Usuario autenticado:', response.user);
          this.router.navigate(['/home']);
        },
        error: (error: any) => {
          console.error('Error en login:', error.message);
          // Aquí puedes mostrar un mensaje de error al usuario
        }
      });
    } else {
      console.log('Formulario inválido');
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  onRegister() {
    console.log('Llegué al registro:');
    if (this.registerForm.valid) {
      const registerData: RegisterRequest = {
        name: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword
      };

      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          console.log('Usuario registrado:', response.user);
          this.router.navigate(['/home']);
        },
        error: (error: any) => {
          console.error('Error en registro:', error.message);
          // Aquí puedes mostrar un mensaje de error al usuario
        }
      });
    } else {
      console.log('Formulario inválido');
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

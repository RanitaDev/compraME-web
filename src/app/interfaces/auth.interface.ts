export interface IUser {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  telefono?: string;
  direccion?: string;
  role?: string;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
  message?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IRegisterRequest {
  nombre: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

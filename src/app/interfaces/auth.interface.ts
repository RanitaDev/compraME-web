export interface IUser {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro?: string;
  rolId?: string;
}

export interface IAuthResponse {
  access_token: string;
  refresh_token?: string;
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

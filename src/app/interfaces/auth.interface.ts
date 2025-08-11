export interface IUser {
  id: string;
  email: string;
  name: string;
  lastName?: string; // Hacer opcional
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
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}
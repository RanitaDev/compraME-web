import { apiInterceptor } from "./api.interceptor";
import { authInterceptor } from "./auth.interceptor";
import { errorInterceptor } from "./error.interceptor";

export const httpInterceptors = [
  apiInterceptor,
  authInterceptor,
  errorInterceptor
];

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  success: boolean;
  url: string;
  public_id: string;
  message: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  images: { url: string; public_id: string }[];
  count: number;
  message: string;
}

export interface DeleteResponse {
  success: boolean;
  result: any;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/upload`;

  /**
   * Sube una imagen a Cloudinary
   * @param file - Archivo de imagen
   * @returns Observable con la respuesta que incluye la URL de Cloudinary
   */
  uploadImage(file: File): Observable<UploadResponse> {
    // Validaciones básicas
    if (!file) {
      return throwError(() => new Error('No se proporcionó ningún archivo'));
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return throwError(() => new Error('El archivo debe ser una imagen (JPEG, PNG, GIF, WebP)'));
    }

    // Validar tamaño (2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return throwError(() => new Error('La imagen no debe superar los 2MB'));
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Enviar al backend
    return this.http.post<UploadResponse>(`${this.apiUrl}/image`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Sube múltiples imágenes a Cloudinary
   * @param files - Array de archivos de imagen
   * @returns Observable con las respuestas que incluyen las URLs de Cloudinary
   */
  uploadMultipleImages(files: File[]): Observable<MultipleUploadResponse> {
    if (!files || files.length === 0) {
      return throwError(() => new Error('No se proporcionaron archivos'));
    }

    // Validar cada archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return throwError(() => new Error(`El archivo ${file.name} debe ser una imagen (JPEG, PNG, GIF, WebP)`));
      }
      if (file.size > maxSize) {
        return throwError(() => new Error(`El archivo ${file.name} no debe superar los 2MB`));
      }
    }

    // Crear FormData con múltiples archivos
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    return this.http.post<MultipleUploadResponse>(`${this.apiUrl}/images`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Sube un PDF a Cloudinary
   * @param file - Archivo PDF
   * @returns Observable con la respuesta que incluye la URL de Cloudinary
   */
  uploadPDF(file: File): Observable<UploadResponse> {
    if (!file) {
      return throwError(() => new Error('No se proporcionó ningún archivo'));
    }

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      return throwError(() => new Error('El archivo debe ser un PDF'));
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return throwError(() => new Error('El PDF no debe superar los 10MB'));
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<UploadResponse>(`${this.apiUrl}/pdf`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Elimina un archivo de Cloudinary
   * @param publicId - Public ID del archivo a eliminar
   * @param resourceType - Tipo de recurso ('image' o 'raw')
   * @returns Observable con la respuesta de eliminación
   */
  deleteFile(publicId: string, resourceType: 'image' | 'raw' = 'image'): Observable<DeleteResponse> {
    if (!publicId) {
      return throwError(() => new Error('Se requiere el public_id del archivo'));
    }

    return this.http.post<DeleteResponse>(`${this.apiUrl}/delete`, {
      public_id: publicId,
      resource_type: resourceType
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error al subir el archivo';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    console.error('Error en UploadService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene la extensión de un archivo
   */
  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Valida si un archivo es una imagen válida
   */
  isValidImage(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalState {
  open: boolean;
  title?: string;
  content?: string;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private _modal$ = new BehaviorSubject<ModalState>({ open: false });
  readonly modal$ = this._modal$.asObservable();

  /** Open the modal with given title and content (plain text / HTML-safe string). */
  open(title: string, content: string) {
    this._modal$.next({ open: true, title, content });
  }

  /** Close the modal. */
  close() {
    this._modal$.next({ open: false });
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CorStateService {
  private isDisabledSubject = new BehaviorSubject<boolean>(false);
  isDisabled$ = this.isDisabledSubject.asObservable();

  setDisabledState(state: boolean) {
    this.isDisabledSubject.next(state);
  }
}

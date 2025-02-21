import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(userData: any, personnelData: any) {
    const fullUserData = { ...userData, personnel: personnelData };
    localStorage.setItem('user-data', JSON.stringify(fullUserData));
    this.userSubject.next(fullUserData);
  }

  getUser() {
    const savedUser = localStorage.getItem('user-data');
    return savedUser
      ? JSON.parse(savedUser)
      : { personnel: { name: 'Unknown', routedTo: 'Unknown' } };
  }

  getUserName(): string {
    const user = this.getUser();
    return user?.personnel?.name || 'Unknown';
  }

  getGroupCode(): string {
    const user = this.getUser();
    return user?.personnel?.functionalityGroupCode || 'Unknown';
  }

  clearUser() {
    this.userSubject.next(null);
    localStorage.removeItem('user-data'); // delete user info
    localStorage.removeItem('login-token'); // delete token
  }
}

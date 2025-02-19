import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(userData: any) {
    this.userSubject.next(userData);
    localStorage.setItem('user-data', JSON.stringify(userData));
  }

  getUser() {
    const savedUser = localStorage.getItem('user-data');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  getUserName(): string {
    const user = this.getUser();
    return user?.personnel?.empName || 'Unknown'; // return user name
  }

  clearUser() {
    this.userSubject.next(null);
    localStorage.removeItem('user-data');   // delete user info
    localStorage.removeItem('login-token'); // delete token
  }
}

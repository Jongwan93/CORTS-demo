import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(userData: any, personnelData: any) {
    const fullUserData = { ...userData, personnel: personnelData };
    localStorage.setItem('user-data', JSON.stringify(fullUserData));
    this.userSubject.next(fullUserData);
    // console.log("this is user Data: ", fullUserData);
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

  logout() {
    this.clearUser();
    this.router.navigate(['/login']); 
  }

  clearUser() {
    this.userSubject.next(null);
    localStorage.clear();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('login-token') && !!localStorage.getItem('user-data');
  }
}

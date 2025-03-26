import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    sessionStorage.setItem('sessionActive', 'true');
  }

  async canActivate(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve,50));

    const token = localStorage.getItem('login-token');

    console.log("token: ", token);

    if (token) {
      return true;
    } else {
      console.warn('Unauthorized access - redirecting to login page');
      localStorage.clear();
      this.router.navigate(['/login']);
      
      return false;
    }
  }
}

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
    if (!sessionStorage.getItem('sessionActive')) {
      localStorage.clear();
    }

    sessionStorage.setItem('sessionActive', 'true');
  }

  canActivate(): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    const hasUserData = !!localStorage.getItem('user-data');

    if (isLoggedIn && hasUserData) {
      return true;
    } else {
      console.warn('Unauthorized access - redirecting to login page');
      localStorage.clear();
      this.router.navigate(['/login']);
      
      return false;
    }
  }
}

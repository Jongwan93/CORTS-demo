import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router'
import { AuthService } from '../app/services/auth.service';
import { HeaderComponent } from '../app/header/header.component';

@Component({
  selector: 'app-logout',
  imports: [HeaderComponent],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {
  private titleService = inject(Title);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  constructor() {
    this.titleService.setTitle('CORTS - Logged out'); // browser title name
    this.logout();
  }

  logout() {
    this.authService.clearUser();
    localStorage.clear();
    this.router.navigate(['/logout']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}

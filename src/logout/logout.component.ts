import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router'

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {
  private titleService = inject(Title);
  private router = inject(Router);
  
  constructor() {
    this.titleService.setTitle('CORTS - Logged out'); // browser title name
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}

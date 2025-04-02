import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  constructor() {}

  private router = inject(Router);

  isLogoutPage(): boolean{
    return this.router.url === '/logout';
  }

  isQueryPage(): boolean{
    return this.router.url === '/query';
  }
}

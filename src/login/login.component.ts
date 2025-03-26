import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationStart } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../app/services/auth.service';
import { LookupService } from '../app/services/lookup.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  caccId: number = 401; // hard coded for now

  private hasConfirmedNavigation = false;
  
  private titleService = inject(Title);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private lookupService = inject(LookupService);

  constructor() {
    this.titleService.setTitle('CORTS - Login');
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (
        event instanceof NavigationStart &&
        event.restoredState !== null &&
        event.navigationTrigger === 'popstate' &&
        event.url === '/login' &&
        !this.hasConfirmedNavigation
      ) {
        const confirmLeave = confirm(
          'Do you want to move to Login Page? You will be Logged out'
        );

        this.hasConfirmedNavigation = true;

        if (!confirmLeave) {
          history.forward();
        } else {
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    });
  }

  async login() {
    const loginData = {
      username: this.username,
      password: this.password,
      caccId: this.caccId,
    };

    try {
      const response = await firstValueFrom(
        this.http.post<{
          status: string;
          message: string;
          data: {
            accessToken: string;
            tokenType: string;
            userPrincipal: any;
            personnel: any;
          };
          timestamp: string;
          code: number;
        }>('api/auth/login', loginData)
      );

      localStorage.setItem('login-token', response.data.accessToken);
      localStorage.setItem(
        'loginUserName',
        response.data.userPrincipal.username
      );
      localStorage.setItem(
        'user-data',
        JSON.stringify({
          ...response.data.userPrincipal,
          personnel: response.data.personnel,
        })
      );

      this.authService.setUser(
        response.data.userPrincipal,
        response.data.personnel
      );

      await this.lookupService.fetchAndStoreLookups();

      await this.router.navigate(['/mainpage']);
    } catch (err) {
      alert('Login failed');
      console.error('Login error:', err);
    }
  }
}

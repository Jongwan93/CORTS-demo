import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../app/services/auth.service';
import { LookupService } from '../app/services/lookup.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  caccId: number = 454; // hard coded for now

  constructor(
    private titleService: Title,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private lookupService: LookupService
  ) {
    this.titleService.setTitle('CORTS - Login');
  }

  login() {
    const loginData = {
      username: this.username,
      password: this.password,
      caccId: this.caccId,
    };

    this.http
      .post<{
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
      .subscribe({
        next: (response) => {

          localStorage.setItem('login-token', response.data.accessToken); // save token

          this.authService.setUser(
            response.data.userPrincipal,
            response.data.personnel
          );

          this.lookupService.fetchAndStoreLookups();

          this.router.navigate(['/mainpage']);
        },
        error: (err) => {
          alert('Login Failed: wrong password or username');
          console.error('Login error:', err);
        },
      });
  }
}

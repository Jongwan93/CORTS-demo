import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from "@angular/platform-browser";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  caccId: number = 454; // hard coded for now

  constructor(private titleService: Title, private router: Router, private http: HttpClient) {
    this.titleService.setTitle("CORTS - Login");
  }

  login() {
    const loginData = {
      username: this.username,
      password: this.password,
      caccId: this.caccId
    };

    this.http.post<{ token: string }>('/api/auth/login', loginData)
      .subscribe({
        next: (response) => {
          localStorage.setItem('login-token', response.token);
          this.router.navigate(['/mainpage']);
        },
        error: (err) => {
          alert('Login Failed: wrong password or username');
          console.error('Login error:', err); // test
        }
      });

  }

}

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private timeout: any;

  private readonly TIMEOUT_DURATION = 10 * 60 * 100000; // change time later

  ngOnInit() {
    this.resetTimeout();
    this.addEventListeners();
  }

  ngOnDestroy() {
    this.removeEventListeners();
    clearTimeout(this.timeout);
  }

  // Timer reset condition
  private resetTimeout() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (this.authService.isLoggedIn()) {
        this.authService.logout();
      }
    }, this.TIMEOUT_DURATION);
  }

  // detect user movement
  private addEventListeners() {
    window.addEventListener('mousemove', this.resetTimeout.bind(this));
    window.addEventListener('keydown', this.resetTimeout.bind(this));
    window.addEventListener('click', this.resetTimeout.bind(this));
  }

  // remove event listener (memory leak)
  private removeEventListeners() {
    window.removeEventListener('mousemove', this.resetTimeout.bind(this));
    window.removeEventListener('keydown', this.resetTimeout.bind(this));
    window.removeEventListener('click', this.resetTimeout.bind(this));
  }
}

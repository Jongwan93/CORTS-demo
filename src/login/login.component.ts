import { Component} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
  constructor(private titleService:Title) {
    this.titleService.setTitle("CORTS - Login");
  }

}

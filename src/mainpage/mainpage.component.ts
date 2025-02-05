import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-mainpage',
  templateUrl: './mainpage.component.html',
  styleUrl: './mainpage.component.css',
  standalone: true,
  imports: [RouterModule],
})
export class MainpageComponent{
  constructor(private router: Router, private titleService:Title) {
    this.titleService.setTitle("CORTS - Start Page");
  }

  onProceed(): void {
    const selectedValue = (
      document.getElementById('create-new') as HTMLSelectElement
    ).value;

    if (selectedValue === '1') {
      this.router.navigate(['/incident-report']);
    } else if (selectedValue === '2') {
      this.router.navigate(['/vsa-report']);
    } else if (selectedValue === '3') {
      this.router.navigate(['/complaint-report']);
    } else if (selectedValue === '4') {
      this.router.navigate(['/cacc-equipment-failure']);
    } else if (selectedValue === '5') {
      this.router.navigate(['/fleet-equipment-report']);
    } else {
      alert('Please select the correct option to proceed.');
    }
  }
}

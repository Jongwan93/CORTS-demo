import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HeaderComponent } from '../app/header/header.component';

@Component({
  selector: 'app-cad-incident-detail',
  imports: [FormsModule, RouterModule, CommonModule, HeaderComponent,],
  templateUrl: './cad-incident-detail.component.html',
  styleUrls: ['./cad-incident-detail.component.css'],
})
export class CADIncidentDetailComponent implements OnInit {
  constructor() {
    this.titleService.setTitle('CORTS - CAD Incident Detail'); // browser title name
  }

  // services
  private titleService = inject(Title);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {


  }
}

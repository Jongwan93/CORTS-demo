import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-complaint-report',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './complaint-report.component.html',
  styleUrl: './complaint-report.component.css'
})
export class ComplaintReportComponent {

}

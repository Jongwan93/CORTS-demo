import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './incident-report.component.html',
  styleUrl: './incident-report.component.css',
})
export class IncidentReportComponent {
  incidentData: any = {}; // object to store fetched incident details
  createdTime: string = ''; // current date
  dueDate: string = ''; // due date - two days after
  corNumber: string = 'New'; // core#. New as default value
  status: string = 'New'; // Status. New as default value

  relatedCORsInput: string = '';
  relatedCORs: string[] = []; // list of related CORs

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchIncidentReport();
    this.setCurrentTime();
  }

  fetchIncidentReport() {
    const apiUrl =
      'http://ehsxiyfwkds202.ehsa2.ca:8080/corts-services/swagger-ui/index.html'; //api url

    this.http.get(apiUrl).subscribe(
      (data: any) => {
        this.incidentData = data; // store API reponse in incidentData object
      },
      (error) => {
        console.error('Error. API not working properly', error);
      }
    );
  }

  setCurrentTime() {
    const now = new Date();
    this.createdTime = this.formatDate(now);

    const dueDateCalc = new Date(now);
    dueDateCalc.setDate(dueDateCalc.getDate() + 2);
    this.dueDate = this.formatDate(dueDateCalc);      
  }

  formatDate(date:Date): string{
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).replace(',', '');
  }

  saveChanges() {
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000); // random number generated
    this.corNumber = `454-${randomNumber}`;

    this.status = 'Create';
  }

  addRelatedCORs() {
    if (this.relatedCORsInput.trim()){
      this.relatedCORs.push(this.relatedCORsInput.trim());
      this.relatedCORsInput = '';
      this.relatedCORs = [...this.relatedCORs];
    }
  }

  removeRelatedCORs() {
    this.relatedCORs.pop();
    this.relatedCORs = [...this.relatedCORs]; 
  }
}

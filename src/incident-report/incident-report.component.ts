import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgFor, CommonModule } from '@angular/common';
import { AuthService } from '../app/services/auth.service';
import { StatusService } from '../app/services/status.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [FormsModule, RouterModule, NgFor, CommonModule],
  templateUrl: './incident-report.component.html',
  styleUrl: './incident-report.component.css',
})
export class IncidentReportComponent implements OnInit {
  constructor(private titleService: Title, private router: Router) {
    this.titleService.setTitle('CORTS - COR Entry (New)');
  }

  corNumber: string = 'New'; // COR# (New as default value)
  isCorNumberGenerated: boolean = false;
  status: string = 'New'; // new as default

  ngOnInit() {
    this.setCurrentTime();
    this.userName = this.authService.getUserName(); // fetch user info

    // get the username for Creator and RoutedTo
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.personnel.name || 'Unknown';
    }
  }

  // -------------------------------Basic Information---------------------------
  // fetching auth service to use user info
  private authService = inject(AuthService); // AuthService를 inject
  private http = inject(HttpClient);
  private statusService = inject(StatusService);
  userName: string = ''; // user's name is stored

  // generate random cor#
  generateCorNumber(): string{
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    return `454-${randomNum}`;
  }

  // related COR: add new COR logic
  relatedCORsInput: string = '';
  relatedCORs: string[] = []; // List of related CORs
  selectedRelatedCOR: string = '';

  addRelatedCOR(event: Event) {
    event.preventDefault();
    // event not empty, COR does not overlap
    if (
      this.relatedCORsInput &&
      !this.relatedCORs.includes(this.relatedCORsInput)
    ) {
      // often, push is not recognized by Angular
      // better to use array to trigger change detection
      this.relatedCORs = [...this.relatedCORs, this.relatedCORsInput];
      this.relatedCORsInput = ''; // reset
    }
  }

  // related COR: remove COR logic
  removeSelectedCOR(event: Event) {
    event.preventDefault();
    if (this.selectedRelatedCOR) {
      this.relatedCORs = this.relatedCORs.filter(
        (cor) => cor !== this.selectedRelatedCOR
      );
      this.selectedRelatedCOR = '';
    }
  }

  // ---------------------------------Incident Report-----------------------------
  incidentData: any = {}; // Object to store fetched incident details
  incidentType: string = ''; // dropdown menu
  previousIncidentType: string = ''; // to detect change
  incidentDateTime = '';
  incidentRecords: { incidentType: string; date: string; time: string }[] = [];
  incidentCommentText: string = ''; // incident details input

  getIncidentTypeText(value: string): string {
    const incidentTypes: { [key: string]: string } = {
      '1': 'Delay in Response',
      '2': 'MCI',
      '3': 'Other',
      '4': 'Unusual Occurrence',
    };
    return incidentTypes[value] || 'Unknown';
  }

  // ---------------------------------Narrative------------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: {
    date: string;
    time: string;
    user: string;
    comment: string;
    type: string;
  }[] = [];

  // save changes button
  saveChanges() {
    console.log('Incident Type:', this.incidentType);
    console.log('Date/Time of Incident', this.incidentDateTime);


    if (!this.incidentCommentText.trim() || !this.incidentType || this.incidentType === '' || !this.incidentDateTime || this.incidentDateTime.trim() === '') {
      alert('Please complete all the required fields.');
      return;
    }

    if (!this.isCorNumberGenerated){
      this.corNumber = this.generateCorNumber();
      this.isCorNumberGenerated = true;
      localStorage.setItem('cornumber', this.corNumber);
    }

    if (this.status == 'New'){
      this.status = 'Created';
      localStorage.setItem('corStatus', this.status);
    }


    //incident type is changed
    if (this.previousIncidentType !== this.incidentType) {
      const now = new Date();
      this.combinedEntries = [
        ...this.combinedEntries,
        {
          date: this.formatDate(now),
          time: this.formatTime(now),
          user: this.userName.split(', ')[0] || 'Unknown',
          comment: `"Incident type" was changed to: ${this.getIncidentTypeText(
            this.incidentType
          )}`,
          type: 'incident',
        },
      ];
      this.previousIncidentType = this.incidentType;
    }

    // narrative comment logic
    if (this.narrativeCommentText.trim()) {
      const now = new Date();
      this.combinedEntries = [                                          
        ...this.combinedEntries,
        {
          date: this.formatDate(now),
          time: this.formatTime(now),
          user: this.userName.split(', ')[0] || 'Unknown',
          comment: this.narrativeCommentText.trim(),
          type: 'narrative',
        },
      ];
      this.narrativeCommentText = '';
    }

    // incident comment logic
    if (this.incidentCommentText.trim()) {
      const now = new Date();
      this.combinedEntries = [
        ...this.combinedEntries,
        {
          date: this.formatDate(now),
          time: this.formatTime(now),
          user: this.userName.split(', ')[0] || 'Unknown',
          comment: this.incidentCommentText.trim(),
          type: 'incident',
        },
      ];
      this.incidentCommentText = '';
    }
  } // --------- end of save changes function

  //-------------------------------UTILITY------------------------------------
  createdDate: string = ''; // Current date
  createdTime: string = ''; // Current time
  fullDateTime: string = ''; // Current date + time
  dueDate: string = ''; // Due date (two days after)

  // formatting the date
  formatDate(date: Date): string {
    return date
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(',', '');
  }

  // formatting the time
  formatTime(date: Date): string {
    return date
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      .replace(',', '');
  }

  // calculate current time and due date (+2 days)
  setCurrentTime() {
    const now = new Date();
    this.createdDate = this.formatDate(now);
    this.createdTime = this.formatTime(now);
    this.fullDateTime = `${this.createdDate} ${this.createdTime}`;

    const dueDateCalc = new Date(now);
    dueDateCalc.setDate(dueDateCalc.getDate() + 2);
    this.dueDate = this.formatDate(dueDateCalc);
  }

  reloadPage(): void {
    window.location.reload();
  }

  saveAndExit(): void {
    console.log('Changes saved and exited');
  }
}

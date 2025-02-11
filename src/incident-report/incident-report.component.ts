import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgFor, CommonModule } from '@angular/common';

interface NarrativeEntry {
  date: string;
  time: string;
  user: string;
  comment: string;
}

interface IncidentEntry {
  date: string;
  time: string;
  user: string;
  // incidentType: string;
  comment: string;
}

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [FormsModule, RouterModule, NgFor, CommonModule],
  templateUrl: './incident-report.component.html',
  styleUrl: './incident-report.component.css',
})
export class IncidentReportComponent implements OnInit {
  incidentData: any = {}; // Object to store fetched incident details
  createdDate: string = ''; // Current date
  createdTime: string = ''; // Current time
  fullDateTime: string = ''; // Current date + time
  dueDate: string = ''; // Due date (two days after)
  corNumber: string = 'New'; // COR# (New as default value)
  status: string = 'New'; // Status (New as default value)

  incidentType: string = '1';
  previousIncidentType: string = '1';
  incidentDateTime = '';
  incidentRecords: { incidentType: string; date: string; time: string }[] = [];
  incidentCommentText: string = ''; // incident details input
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: {
    date: string;
    time: string;
    user: string;
    comment: string;
    type: string;
  }[] = [];

  relatedCORsInput: string = '';
  relatedCORs: string[] = []; // List of related CORs
  selectedRelatedCOR: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchIncidentReport();
    this.setCurrentTime();
    this.setIncidentDateTime();
  }

  setIncidentDateTime() {
    const now = new Date();
    this.incidentDateTime = now.toISOString().slice(0, 16);
  }

  fetchIncidentReport() {
    const apiUrl =
      'http://ehsxiyfwkds202.ehsa2.ca:8080/corts-services/swagger-ui/index.html';

    this.http.get(apiUrl).subscribe(
      (data: any) => {
        this.incidentData = data; // Store API response in incidentData object
      },
      (error) => {
        console.error('Error fetching incident report:', error);
      }
    );
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

  // save changes button
  saveChanges() {
    if (this.corNumber === 'New') {
      this.corNumber = `454-${Math.floor(1000000 + Math.random() * 9000000)}`;
      this.status = 'Created';
    }

    // TO DO: create error message for empty date/time
    //
    //
    //
    //

    if (this.previousIncidentType !== this.incidentType) {
      const now = new Date();
      this.combinedEntries = [
        ...this.combinedEntries,
        {
          date: this.formatDate(now),
          time: this.formatTime(now),
          user: this.incidentData.creator || 'Unknown',
          comment: `Incident type has changed to: ${this.getIncidentTypeText(
            this.incidentType
          )}`,
          type: 'incident',
        },
      ];
      this.previousIncidentType = this.incidentType;
    }

    // incident comment logic
    if (this.narrativeCommentText.trim()) {
      const now = new Date();
      this.combinedEntries = [
        ...this.combinedEntries,
        {
          date: this.formatDate(now),
          time: this.formatTime(now),
          user: this.incidentData.creator || 'Unknown',
          comment: this.narrativeCommentText.trim(),
          type: 'narrative',
        },
      ];
      this.narrativeCommentText = '';
    }

    // narrative comment logic
    if (this.incidentCommentText.trim()) {
      const now = new Date();
      this.combinedEntries = [
        ...this.combinedEntries,
        {
          date: this.formatDate(now),
          time: this.formatTime(now),
          user: this.incidentData.creator || 'Unknown',
          comment: this.incidentCommentText.trim(),
          type: 'incident',
        },
      ];
      this.incidentCommentText = '';
    }
  }

  getIncidentTypeText(value: string): string {
    const incidentTypes: { [key: string]: string } = {
      "1": "Delay in Response",
      "2": "MCI",
      "3": "Other",
      "4": "Unusual Occurrence",
    };
    return incidentTypes[value] || "Unknown";
  }

  // related COR: add new COR logic
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
}

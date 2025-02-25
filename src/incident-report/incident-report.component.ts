import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, CommonModule } from '@angular/common';
import { AuthService } from '../app/services/auth.service';
import { Title } from '@angular/platform-browser';
import { IncidentService } from '../app/services/incident-report.service';
import { LookupService } from '../app/services/lookup.service';

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

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService); // AuthService inject
  private incidentService = inject(IncidentService);
  private lookupService = inject(LookupService);

  userName: string = ''; // user's name is stored
  loginUserName: string = '';
  groupCode: string = ''; // user's functionality group code
  routedToGroup: string = ''; // Routed To group full name
  groupCodeID: number = 0; // group code ID for create incident report API request body
  corTypeKey: number = 0; // COR Type Key
  corType: string = ''; // COR Type (Display Name)
  tempIncidentComment: string = '';
  tempNarrativeComment: string = '';
  incidentTypeList: any[] = [];

  ngOnInit() {
    this.userName = this.authService.getUserName(); // fetch user info
    this.groupCode = this.authService.getGroupCode(); // fetch group code (COM)

    // get the username for Creator and RoutedTo
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.personnel.name || 'Unknown';
    }

    this.route.paramMap.subscribe((params) => {
      const key = params.get('corTypeKey');
      if (key) {
        this.corTypeKey = parseInt(key, 10);
        this.fetchCorTypeDisplayName();
      }
    });

    // find Route To group name
    const userGroups = localStorage.getItem('lookup-user-group');
    if (userGroups) {
      const parsedUserGroups = JSON.parse(userGroups);
      // loop through the userGroup object
      const matchedGroup = parsedUserGroups.data.find(
        (group: any) => group.code === this.groupCode
      );

      if (matchedGroup) {
        this.routedToGroup = matchedGroup.displayName;
        this.groupCodeID = matchedGroup.userGroupKey;
      }
    }

    this.loginUserName = localStorage.getItem('loginUserName') || '';

    this.setInitialCorStatus();

    // update time of created
    if (this.status == 'Initial Assignment') {
      this.setCurrentTime();
    }

    const incidentData = this.lookupService.getLookupData('incident-type');
    if (incidentData && incidentData.data){
      this.incidentTypeList = incidentData.data;
    }
  } // end of ngOnInit()

  // -------------------------------Basic Information---------------------------
  // fetching auth service to use user info

  createdDate: string = 'New'; // Current date
  createdTime: string = ''; // Current time
  corNumber = 'New'; // COR#
  status = '';
  statusID: number = 0;

  // COR Type
  fetchCorTypeDisplayName() {
    const cortTypeData = localStorage.getItem('lookup-cort-type');
    if (cortTypeData) {
      const parsedData = JSON.parse(cortTypeData);

      const matchedCORType = parsedData.data.find(
        (type: any) => type.cORTypeKey === this.corTypeKey
      );

      if (matchedCORType) {
        this.corType = matchedCORType.displayName;
      }
    }
  }

  //COR status
  setInitialCorStatus() {
    const CORstatus = localStorage.getItem('lookup-corts-status');
    if (CORstatus) {
      const parsedStatus = JSON.parse(CORstatus);

      // status = Initial Assignment
      if (this.corNumber === 'New') {
        
        this.statusID = 4;

        const initialAssignment = parsedStatus.data.find(
          (status: any) => status.cORStatusKey === 4
        );
        this.status = initialAssignment.displayName;
      }
      // status = Open
      else {
        this.statusID = 1;
        const open = parsedStatus.data.find(
          (status: any) => status.cORStatusKey === 1
        );
        this.status = open.displayName;
      }
    }
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
  incidentType: string = ''; // dropdown menu
  previousIncidentType: string = ''; // to detect change
  incidentDateTime = '';
  incidentCommentText: string = ''; // incident details input

  // need incident type name for html
  getIncidentTypeText(value: string): string {
    const findIncidentType = this.incidentTypeList.find(
      (type) => type.incidentTypeKey === Number(value)
    );
    return findIncidentType ? findIncidentType.displayName : 'Unknown';
  }

  // find the key to send API
  getIncidentTypeKey(displayName: string): number | null {
    const findIncidentType = this.incidentTypeList.find(
      (type) => type.displayName === displayName
    );
    return findIncidentType ? findIncidentType.incidentTypeKey : null;
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
    // incident detail, type, date cannot be empty
    if (
      !this.incidentCommentText.trim() ||
      !this.incidentType ||
      this.incidentType === '' ||
      !this.incidentDateTime ||
      this.incidentDateTime.trim() === ''
    ) {
      alert('Please complete all the required fields.');
      return;
    }

    const now = new Date();

    //incident type is changed
    if (this.previousIncidentType !== this.incidentType) {
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
      const tempNarrativeComment = this.narrativeCommentText;
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
      this.tempNarrativeComment = tempNarrativeComment;
      this.narrativeCommentText = '';
    }

    // incident comment logic
    if (this.incidentCommentText.trim()) {
      const tempIncidentComment = this.incidentCommentText;
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
      this.tempIncidentComment = tempIncidentComment;
      this.incidentCommentText = '';
    }

    //-----------------------create incident API call--------------------------------
    const requestBody = {
      assignedTo: 'Supervisor', // hard coded for now
      assignedToGroup: 'true',
      cadIncidentNum: '454-Z023046766', // hard coded for now
      corStatus: this.statusID,
      corType: this.corTypeKey,
      createDate: this.fullDateTime,
      createdby: this.loginUserName,
      incidenType: this.incidentType,
      incidentDateTime: new Date(this.incidentDateTime).toISOString(),
      incidentDetails: this.tempIncidentComment,
      userGroup: this.groupCodeID,
      narratives: [
        {
          corFk: 0,
          timeStamp: new Date().toISOString(),
          systemGenerated: true,
          createdBy: this.userName,
          createdByInitials: this.loginUserName,
          narrativeText: this.tempNarrativeComment || 'New Incident Created',
        },
      ],
      relatedCors: [],
    };

    console.log('Request Body:', requestBody);

    //bring token
    const token = localStorage.getItem('login-token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    this.http
      .post('/api/reports/incident-report/create', requestBody, { headers })
      .subscribe(
        (response) => {
          this.incidentService.setIncidentResponse(response);

          this.corNumber = this.incidentService.getCorNumber();

          console.log('Response:', response);
          alert('Incident Report Successfully Created');
        },
        (error) => {
          console.error('Error:', error);
          alert('Failed to Create Incident Report');
        }
      );

    // only update created, due-date time when status is not initial assignment
    if (this.status == 'Initial Assignment') {
      this.setCurrentTime();
    }

    this.setInitialCorStatus();
  } // --------- end of save changes function

  //-------------------------------UTILITY------------------------------------
  fullDateTime: string = 'New'; // Current date + time
  dueDate: string = 'New'; // Due date (two days after)

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

  // ISO 8601 format to MM/DD/YYYY HH:mm:ss
  formatDisplayDateTime(isoString: string): string {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  }

  // calculate current time and due date (+2 days)
  setCurrentTime() {
    const now = new Date();
    this.fullDateTime = now.toISOString();
    this.createdDate = this.formatDate(now);
    this.createdTime = this.formatTime(now);

    const dueDateCalc = new Date(now);
    dueDateCalc.setDate(dueDateCalc.getDate() + 2);
    this.dueDate = this.formatDate(dueDateCalc);
  }

  /* not working
  // change status to OPEN when save change button is clicked
  setStatusToOpen() {
    const CORstatus = localStorage.getItem('lookup-corts-status');
    if (CORstatus) {
      const parsedStatus = JSON.parse(CORstatus);

      const openStatus = parsedStatus.data.find(
        (status: any) => status.displayName === 'OPEN'
      );

      if (openStatus) {
        this.status = openStatus.displayName;
        console.log(`COR Status updated to: ${this.status}`);
      }
    }
  }*/
}

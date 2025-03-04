import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  private titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('CORTS - COR Entry (New)'); // browser title name
  }

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  // services
  private authService = inject(AuthService);
  private incidentService = inject(IncidentService);
  private lookupService = inject(LookupService);

  userName: string = ''; // user's real name
  loginUserName: string = ''; // login ID
  groupCode: string = ''; // user's functionality group code
  routedToGroup: string = ''; // Routed To group full name
  groupCodeID: number = 0; // group code ID for create incident report API request body
  corTypeKey: number = 0; // COR Type Key
  corType: string = ''; // COR Type (Display Name)
  tempIncidentComment: string = '';
  isAssignedtoGroup: boolean = true;
  incidentTypeList: any[] = [];
  routedToSelection: string = '';
  previousRoutedTo: string = '';
  isSystemGenerated: boolean = true;

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
    if (incidentData && incidentData.data) {
      this.incidentTypeList = incidentData.data;
    }
  } // end of ngOnInit()

  // -------------------------------Basic Information---------------------------
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

  // Routed To selection detecting &&
  // find if report is assigned to group
  routedToSelectionChange(event: Event): void {
    const selection = event.target as HTMLSelectElement;
    this.routedToSelection = selection.value;

    const userGroups = localStorage.getItem('lookup-user-group');
    if (userGroups) {
      const parsedUserGroups = JSON.parse(userGroups);
      // loop through the userGroup object
      const matchedGroup = parsedUserGroups.data.find(
        (group: any) => group.displayName === this.routedToSelection
      );
      if (matchedGroup) {
        this.isAssignedtoGroup = true;
      } else {
        this.isAssignedtoGroup = false;
      }
    }
  }

  // ------------------------Incident Report-----------------------------
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

    if (this.routedToSelection === '') {
      alert('Please select Route To option');
      return;
    }

    // incident comment logic
    if (
      !this.incidentType ||
      this.incidentType === '' ||
      !this.incidentDateTime ||
      this.incidentDateTime.trim() === ''
    ) {
      alert('Please complete all the required fields.');
      return;
    }

    if (this.routedToSelection === '') {
      alert('Please select Route To option');
      return;
    }

    const now = new Date();
    const currentTimestamp = now.toISOString();
    const isNewReport = this.corNumber === 'New';

    this.combinedEntries = [...this.combinedEntries];

    const narrativesArray: {
      narrativeKey: number;
      corFk: number;
      timeStamp: string;
      systemGenerated: boolean;
      createdBy: string;
      createdByInitials: string;
      narrativeText: string;
    }[] = [];    

    const addNarrativeEntry = (comment: string) => {
      this.combinedEntries.unshift({
        date: this.formatDate(now),
        time: this.formatTime(now),
        user: this.userName.split(', ')[0] || 'Unknown',
        comment: comment,
        type: 'narrative',
      });

      narrativesArray.push({
        narrativeKey: 0,
        corFk: 0,
        timeStamp: currentTimestamp,
        systemGenerated: this.isSystemGenerated,
        createdBy: this.userName,
        createdByInitials: this.loginUserName,
        narrativeText: comment,
      });
    };

    if (isNewReport) {
      // "new incident report created" added
      addNarrativeEntry('New Incident Report is Created!');

      // "Routed To..." message added
      addNarrativeEntry(`Routed To ${this.routedToSelection}`);
    }

    // user's incident comment added
    let incidentCommentValue = '';
    if (this.incidentCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.formatDate(now),
        time: this.formatTime(now),
        user: this.userName.split(', ')[0] || 'Unknown',
        comment: this.incidentCommentText.trim(),
        type: 'incident',
      });
      incidentCommentValue = this.incidentCommentText.trim();
    }

    // user's narrative comment now added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      addNarrativeEntry(this.narrativeCommentText.trim());
      narrativeCommentValue = this.narrativeCommentText.trim();
    }

    //-----------------------create incident API call-------------------------
    const createRequestBody = {
      assignedTo: this.routedToSelection,
      assignedToGroup: this.isAssignedtoGroup,
      cadIncidentNum: '454-Z023046766', // hard coded for now
      corStatus: this.statusID,
      corType: this.corTypeKey,
      createDate: this.fullDateTime,
      createdby: this.loginUserName,
      incidenType: this.incidentType,
      incidentDateTime: new Date(this.incidentDateTime).toISOString(),
      incidentDetails: incidentCommentValue,
      userGroup: this.groupCodeID,
      narratives: narrativesArray,
      relatedCors: [],
    };

    this.incidentCommentText = '';
    this.narrativeCommentText = '';

    console.log('Request Body:', createRequestBody); // print request body

    const updateRequestBody = {
      corMainKey: parseInt(this.incidentService.getcorMainKey(), 10) || 0,
      vorNumber: 'string',
      createDate: this.fullDateTime,
      cortsType: this.corTypeKey,
      createdby: this.loginUserName,
      userGroup: this.groupCodeID,
      assignedTo: this.routedToSelection,
      assignedDate: this.fullDateTime,
      cadIncidentNum: '454-Z023046766',
      cortStatus: this.statusID,
      dueDate: this.dueDate,
      lastAssignedTo: this.routedToSelection,
      assignedToGroup: this.isAssignedtoGroup,
      lastModifiedBy: this.loginUserName,
      lastModifiedDate: new Date().toISOString(),
      closedby: '',
      closeDate: '',
      lastAssignedDate: this.fullDateTime,
      relatedCors: [],
      incidenType: this.incidentType,
      incidentDate: new Date(this.incidentDateTime).toISOString(),
      incidentDetails: this.incidentCommentText,
      narratives: [
        {
          narrativeKey: 0,
          corFk: parseInt(this.incidentService.getcorMainKey(), 10) || 0,
          timeStamp: new Date().toISOString(),
          systemGenerated: this.isSystemGenerated,
          createdBy: this.userName,
          createdByInitials: this.loginUserName,
          narrativeText: this.narrativeCommentText,
        },
      ],
    };

    //bring token
    const token = localStorage.getItem('login-token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    if (this.corNumber === 'New') {
      this.http
        .post('/api/reports/incident-report/create', createRequestBody, {
          headers,
        })
        .subscribe(
          (response) => {
            this.incidentService.setIncidentResponse(response);

            this.corNumber = this.incidentService.getCorNumber();
            console.log('Response:', response); // print response
            alert('Incident Report Successfully Created');
          },
          (error) => {
            console.error('Error:', error);
            alert('Failed to Create Incident Report');
          }
        );
    } else {
      this.http
        .put(
          `/api/reports/incident-report/update/${this.corNumber}`,
          updateRequestBody,
          { headers }
        )
        .subscribe(
          (response) => {
            console.log('Response:', response);
            alert('Incident Report Successfully Updated');
          },
          (error) => {
            console.error('Error:', error);
            alert('Failed to Update Incident Report');
          }
        );
    }

    // only update created, due-date time when status is not initial assignment
    if (this.status == 'Initial Assignment') {
      this.setCurrentTime();
    }

    this.setStatusToCreate();
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

  // change status to CREATE when save change button is clicked
  setStatusToCreate() {
    const CORstatus = localStorage.getItem('lookup-corts-status');

    if (CORstatus) {
      const parsedStatus = JSON.parse(CORstatus);

      const openStatus = parsedStatus.data.find(
        (status: any) => status.displayName === 'Create'
      );
      this.statusID = openStatus.cORStatusKey;

      if (openStatus) {
        this.status = openStatus.displayName;
      }
    }
  }
}

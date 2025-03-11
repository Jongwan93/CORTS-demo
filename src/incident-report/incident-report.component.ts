import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { IncidentService } from '../app/services/incident-report.service';
import { LookupService } from '../app/services/lookup.service';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    NgFor,
    CommonModule,
    BasicInformationComponent,
  ],
  templateUrl: './incident-report.component.html',
  styleUrls: ['./incident-report.component.css'],
})

export class IncidentReportComponent implements OnInit {
  // now you can use function in basic-information component
  @ViewChild(BasicInformationComponent) basicInfoComponent!: BasicInformationComponent;
  
  ngAfterViewInit(): void {
    this.statusID = this.basicInfoComponent.statusID;
    this.corType = this.basicInfoComponent.corType;
    this.corTypeKey = this.basicInfoComponent.corTypeKey;
  }

  private titleService = inject(Title);

  constructor() {
    this.titleService.setTitle('CORTS - COR Entry (New)'); // browser title name
  }

  // services
  private incidentService = inject(IncidentService);
  private lookupService = inject(LookupService);

  //(DO NOT TOUCH)--------------------------------------------------------
  loginUserName: string = ''; // login ID                                |
  corNumber = 'New'; // COR#                                             |
  corTypeKey: number = 0; // COR Type Key for API                        |
  corType: string = ''; // COR Type (Display Name)                       |
  routedToSelection: string = ''; // user choice of routed to            |
  previousRoutedTo: string = ''; // if user chose new Routed To          |
  statusID: number = 0; // status translated to ID for API call          |
  //(DO NOT TOUCH)--------------------------------------------------------

  incidentTypeList: any[] = []; // to send it to html
  isSystemGenerated: boolean = true; // "Routed To.." "New Report Created"
  isDupCloseCorButtonsVisible: boolean = false; // default not showing buttons
  corMainKey: string = ''; // Primary key to find the exisitng report

  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || ''; // 29030

    // sent the list of incident types to drop down menu of Incident Type
    const incidentData = this.lookupService.getLookupData('incident-type');
    if (incidentData && incidentData.data) {
      this.incidentTypeList = incidentData.data;
    }
  } // ++++++ end of ngOnInit() ++++++

  // -------------------------------Basic Information---------------------------
  // Moved to Basic-information.component.ts
  

  // ------------------------Incident Report-----------------------------
  incidentTypeKey: string = ''; // dropdown menu
  previousIncidentTypeKey: string = ''; // to detect change
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

  // detect incident type change
  incidentTypeChange(newIncidentTypeKey: string) {
    this.incidentTypeKey = newIncidentTypeKey;

    // only update previousInicdnetTypeKey one time at the beginning
    if (this.corNumber === 'New') {
      this.previousIncidentTypeKey = this.incidentTypeKey;
    }
  }

  // ---------------------------------Narrative------------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];

  // save changes button
  saveChanges() {
    // incident detail, type, date cannot be empty
    if (
      !this.incidentCommentText.trim() ||
      !this.incidentTypeKey ||
      this.incidentTypeKey === '' ||
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
    const isNewReport = this.basicInfoComponent.corNumber === 'New';

    this.combinedEntries = [...this.combinedEntries];

    const narrativesArray: any[] = [];

    const addNarrativeEntry = (comment: string) => {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(now),
        time: this.basicInfoComponent.formatTime(now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: comment,
        type: 'narrative',
      });

      narrativesArray.push({
        narrativeKey: 0,
        corFk: 0,
        timeStamp: currentTimestamp,
        systemGenerated: this.isSystemGenerated,
        createdBy: this.basicInfoComponent.userName,
        createdByInitials: this.loginUserName,
        narrativeText: comment,
      });
    };

    // New - Routed To, Incident Type
    if (isNewReport) {
      // "new incident report created" added
      addNarrativeEntry('New Incident Report is Created!');

      // "incident type message added"
      addNarrativeEntry(
        `Incident Type is [${this.getIncidentTypeText(this.incidentTypeKey)}]`
      );

      // "Routed To..." message added
      addNarrativeEntry(`Routed To [${this.routedToSelection}]`);
      this.previousRoutedTo = this.routedToSelection;

      // show the duplicate and close COR button
      this.basicInfoComponent.isDupCloseCorButtonsVisible = true;
    }

    // Update - when Routed To is changed
    if (!isNewReport && this.previousRoutedTo !== this.routedToSelection) {
      addNarrativeEntry(
        `Routed To is Updated from [${this.previousRoutedTo}] to [${this.routedToSelection}]`
      );
      this.previousRoutedTo = this.routedToSelection;
    }

    // Update - when incident Type is changed
    if (!isNewReport && this.previousIncidentTypeKey !== this.incidentTypeKey) {
      addNarrativeEntry(
        `Inicdent Type is updated from [${this.getIncidentTypeText(
          this.previousIncidentTypeKey
        )}] to [${this.getIncidentTypeText(this.incidentTypeKey)}]`
      );
      this.previousIncidentTypeKey = this.incidentTypeKey;
    }

    // user's incident comment added
    let incidentCommentValue = '';
    if (this.incidentCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(now),
        time: this.basicInfoComponent.formatTime(now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.incidentCommentText.trim(),
        type: 'incident',
      });
      incidentCommentValue = this.incidentCommentText.trim();
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      addNarrativeEntry(this.narrativeCommentText.trim());
      narrativeCommentValue = this.narrativeCommentText.trim();
    }

    //-----------------------create incident API call-------------------------
    // Create body
    const createRequestBody = {
      assignedTo: this.routedToSelection,
      assignedToGroup: this.basicInfoComponent.isAssignedtoGroup,
      cadIncidentNum: '454-Z023046766', // hard coded for now
      corStatus: this.statusID,
      corType: this.corTypeKey,
      createDate: this.basicInfoComponent.fullDateTime,
      createdby: this.loginUserName,
      incidenType: this.incidentTypeKey,
      incidentDateTime: new Date(this.incidentDateTime).toISOString(),
      incidentDetails: incidentCommentValue,
      userGroup: this.basicInfoComponent.groupCodeID,
      narratives: narrativesArray,
      relatedCors: [],
    };

    console.log("create request body: ", createRequestBody);

    this.incidentCommentText = '';
    this.narrativeCommentText = '';

    // Update body
    const updateRequestBody = {
      corMainKey: this.corMainKey,
      vorNumber: this.corNumber, // not a misspell
      createDate: this.basicInfoComponent.fullDateTime,
      cortsType: this.corTypeKey,
      createdby: this.loginUserName,
      userGroup: this.basicInfoComponent.groupCodeID,
      assignedTo: this.routedToSelection,
      assignedDate: this.basicInfoComponent.fullDateTime,
      cadIncidentNum: '454-Z023046766', // hard coded for now
      cortStatus: this.statusID,
      dueDate: new Date(this.basicInfoComponent.dueDate).toISOString(),
      lastAssignedTo: this.routedToSelection,
      assignedToGroup: this.basicInfoComponent.isAssignedtoGroup,
      lastModifiedBy: this.loginUserName,
      lastModifiedDate: new Date().toISOString(),
      closedby: '',
      closeDate: '',
      lastAssignedDate: this.basicInfoComponent.fullDateTime,
      relatedCors: [],
      incidenType: this.incidentTypeKey,
      incidentDate: new Date(this.incidentDateTime).toISOString(),
      incidentDetails: this.incidentCommentText,
      narratives: narrativesArray,
    };

    // API call
    if (this.corNumber === 'New') {
      this.incidentService.createIncident(createRequestBody).subscribe(
        (response) => {
          this.incidentService.setIncidentResponse(response);
          this.corNumber = this.incidentService.getCorNumber();
          this.corMainKey = this.incidentService.getcorMainKey();

          alert('Incident Report Successfully Created');
        },
        (error) => {
          console.error('Error:', error);
          alert('Failed to Create Incident Report');
        }
      );
    } else {
      this.incidentService.updateIncident(updateRequestBody).subscribe(
        (response) => {
          this.incidentService.setIncidentResponse(response);

          alert('Incident Report Successfully Updated');
        },
        (error) => {
          console.error('Error:', error);
          alert('Failed to Update Incident Report');
        }
      );
    }

    this.basicInfoComponent.setStatusToCreate();
  } // --------- end of save changes function

  //==============================UTILITY==================================
  updateRoutedToSelection(newSelection: string) {
    this.routedToSelection = newSelection;
  }

  updateStatusID(newStatusID: number) {
    this.statusID = newStatusID;
  }
}
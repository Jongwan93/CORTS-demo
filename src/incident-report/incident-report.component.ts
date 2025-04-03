import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ReportService } from '../app/services/report.service';
import { validateRequiredFields } from '../app/utils/validateFields';
import { LookupService } from '../app/services/lookup.service';
import { HeaderComponent } from '../app/header/header.component';
import { NarrativeComponent } from '../app/narrative/narrative.component';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    NgFor,
    CommonModule,
    HeaderComponent,
    NarrativeComponent,
    BasicInformationComponent,
  ],
  templateUrl: './incident-report.component.html',
  styleUrls: ['./incident-report.component.css'],
})
export class IncidentReportComponent implements OnInit {
  // now you can use function in basic-information component
  @ViewChild(BasicInformationComponent)
  basicInfoComponent!: BasicInformationComponent;

  ngAfterViewInit(): void {
    this.statusID = this.basicInfoComponent.statusID;
    this.corType = this.basicInfoComponent.corType;
    this.corTypeKey = this.basicInfoComponent.corTypeKey;
  }

  constructor() {
    this.titleService.setTitle('CORTS - COR Entry (New)'); // browser title name
  }

  // services
  private titleService = inject(Title);
  private reportService = inject(ReportService);
  private lookupService = inject(LookupService);
  private router = inject(Router);

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
  corMainKey: string = ''; // Primary key to find the exisitng report

  narrativesArray: any[] = []; // temp

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
  isSaved: boolean = false;

  // save changes button
  saveChanges() {
    const isValid = validateRequiredFields();

    if (!isValid) {
      this.isSaved = false;
      return;
    }

    const isNewReport = this.basicInfoComponent.corNumber === 'New';

    this.combinedEntries = [...this.combinedEntries];

    // New - Routed To, Incident Type
    if (isNewReport) {
      this.updateFields('CREATE', []);
      this.updateFields('REASSIGN', [this.routedToSelection]);
    
      this.previousRoutedTo = this.routedToSelection;

      // show duplicated and close COR buttons
      this.basicInfoComponent.isDupCloseCorButtonsVisible = true;
    }
    
    // Update - when Routed To is changed
    if (!isNewReport && this.previousRoutedTo !== this.routedToSelection) {
      this.updateFields('CHANGE', [
        'Routed To',
        this.routedToSelection,
        this.previousRoutedTo,
      ]);
      this.previousRoutedTo = this.routedToSelection;
    }

    // Update - when Incident Type is changed
    if (!isNewReport && this.previousIncidentTypeKey !== this.incidentTypeKey) {
      this.updateFields('CHANGE', [
        'Incident Type',
        this.getIncidentTypeText(this.incidentTypeKey),
        this.getIncidentTypeText(this.previousIncidentTypeKey),
      ]);
      this.previousIncidentTypeKey = this.incidentTypeKey;
    }

    // user's incident comment added
    if (this.incidentCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(this.now),
        time: this.basicInfoComponent.formatTime(this.now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.incidentCommentText.trim(),
        type: 'incident',
      });
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      this.addNarrativeEntry(this.narrativeCommentText.trim(), false);
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
      incidentDetails: this.incidentCommentText.trim(),
      userGroup: this.basicInfoComponent.groupCodeID,
      narratives: this.narrativesArray,
      relatedCors: [],
    };

    console.log('create request body: ', createRequestBody);

    // Update body
    const updateRequestBody = {
      corMainKey: this.corMainKey,
      corNumber: this.corNumber,
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
      narratives: this.narrativesArray,
    };

    // API call
    if (this.corNumber === 'New') {
      this.reportService.createIncident(createRequestBody).subscribe(
        (response) => {
          this.reportService.setIncidentResponse(response);
          this.corNumber = this.reportService.getCorNumber();
          this.corMainKey = this.reportService.getcorMainKey();

          this.incidentCommentText = '';
          this.narrativeCommentText = '';

          alert('Incident Report Successfully Created');
        },
        (error) => {
          console.error('Error:', error);
          alert('Failed to Create Incident Report');
        }
      );
    } else {
      this.reportService.updateIncident(updateRequestBody).subscribe(
        (response) => {
          this.reportService.setIncidentResponse(response);
          console.log('request body: ', updateRequestBody);

          this.incidentCommentText = '';
          this.narrativeCommentText = '';

          alert('Incident Report Successfully Updated');
        },
        (error) => {
          console.error('Error:', error);
          alert('Failed to Update Incident Report');
        }
      );
    }

    this.basicInfoComponent.setStatusToCreate();

    this.isSaved = true;
  } // --------- end of save changes function

  // button Save Changes and Exit
  saveChangesExit() {
    if (!this.isSaved) {
      this.saveChanges();

      const interval = setInterval(() => {
        if (this.isSaved) {
          clearInterval(interval);
          window.alert('Changes Saved');
          this.isSaved = false;
          this.router.navigate(['/mainpage']);
        }
      }, 100);
    } else {
      this.router.navigate(['/mainpage']);
    }
  }

  // button Reload Page
  reload() {
    const userChoice = window.confirm('Do you want to refresh the page?');
    if (userChoice) {
      location.reload();
    }
  }

  //==============================UTILITY==================================
  updateRoutedToSelection(newSelection: string) {
    this.routedToSelection = newSelection;
  }

  updateStatusID(newStatusID: number) {
    this.statusID = newStatusID;
  }

  // finding incident type name according to the incident type key
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

  now = new Date();
  currentTimestamp = this.now.toISOString();

  private addNarrativeEntry = (comment: string, systemGenerated: boolean) => {
    this.combinedEntries.unshift({
      date: this.basicInfoComponent.formatDate(this.now),
      time: this.basicInfoComponent.formatTime(this.now),
      user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
      comment: comment,
      type: 'narrative',
    });
    this.narrativesArray.push({
      narrativeKey: 0,
      corFk: 0,
      timeStamp: this.currentTimestamp,
      systemGenerated: systemGenerated,
      createdBy: this.basicInfoComponent.userName,
      createdByInitials: this.loginUserName,
      narrativeText: comment,
    });
  };

  // reflect field changes and send messages to narrative
  private updateFields(
    messageCode: string,
    values: string[],
    systemGenerated: boolean = true
  ) {
    const msgTemplate = this.lookupService.getSystemMessageByCode(messageCode);

    if (!msgTemplate) return;

    let formattedMessage = msgTemplate;

    values.forEach((val, index) => {
      formattedMessage = formattedMessage.replace(`%${index + 1}`, val);
    });

    this.addNarrativeEntry(formattedMessage, systemGenerated);
  }
}

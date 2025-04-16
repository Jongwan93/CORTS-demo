import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../app/services/lookup.service';
import { ReportService } from '../app/services/report.service';
import { validateRequiredFields } from '../app/utils/validateFields';
import { HeaderComponent } from '../app/header/header.component';
import { NarrativeComponent } from '../app/narrative/narrative.component';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';

@Component({
  selector: 'app-cacc-equipment-failure-report',
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
  templateUrl: './cacc-equipment-failure.component.html',
  styleUrls: ['./cacc-equipment-failure.component.css'],
})
export class caccEquipmentFailureComponent implements OnInit {
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
  private lookupService = inject(LookupService);
  private router = inject(Router);
  private reportService = inject(ReportService);

  //(DO NOT TOUCH)--------------------------------------------------------
  loginUserName: string = ''; // login ID                                |
  corNumber = 'New'; // COR#                                             |
  corTypeKey: number = 0; // COR Type Key for API                        |
  corType: string = ''; // COR Type (Display Name)                       |
  routedToSelection: string = ''; // user choice of routed to            |
  previousRoutedTo: string = ''; // if user chose new Routed To          |
  statusID: number = 0; // status translated to ID for API call          |
  //(DO NOT TOUCH)--------------------------------------------------------

  //Variables
  equipmentTypeList: any[] = []; // to send it to html
  equipmentLocationList: any[] = []; // to send it to html
  isSystemGenerated: boolean = true; // "Routed To.." "New Report Created"
  corMainKey: string = ''; // Primary key to find the exisitng report

  narrativesArray: any[] = [];

  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || ''; // 29030

    // sent the list of Equipment types to drop down menu of Equipment Type
    const equipmentTypeData =
      this.lookupService.getLookupData('equipment-type');
    if (equipmentTypeData && equipmentTypeData.data) {
      this.equipmentTypeList = equipmentTypeData.data;
    }

    const equipmentLocationData =
      this.lookupService.getLookupData('equipment-location');
    if (equipmentLocationData && equipmentLocationData.data) {
      this.equipmentLocationList = equipmentLocationData.data;
    }
  } // ++++++ end of ngOnInit() ++++++

  // ------------------------Equipment Report -----------------------------
  equipmentTypeKey: string = ''; // dropdown menu
  prevEquipmentTypeKey: string = ''; // to detect change
  equipmentDesc: string = '';

  locationKey: string = '';
  prevLocationKey: string = '';
  locationDesc: string = '';

  failureDateTime = '';
  prevFailureDateTime = '';

  // no need to print it on the table
  requestDateTime = '';
  requestTo: string = '';

  respondDateTime = '';
  respondBy: string = '';

  completedDateTime = '';
  completedBy: string = '';

  failureCommentText: string = ''; // Equipment details input

  responseDelay = '';
  isDelaySelected = false;
  delayHours: number = 0;
  delayMinutes: number = 0;
  elapsedDelay = '';

  equipmentFailureKey: string = ''; // API call purpose

  //Method toggles delayed field (To be able to input the time)
  toggleDelayTime() {
    if (!this.isDelaySelected) {
      this.responseDelay = '';
      this.delayHours = 0;
      this.delayMinutes = 0;
    } else {
      this.updateResponseDelay();
    }
  }

  // detect equipment and location type change
  equipmentTypeChange(newEquipmentTypeKey: string) {
    this.equipmentTypeKey = newEquipmentTypeKey;

    if (this.corNumber === 'New') {
      this.prevEquipmentTypeKey = this.equipmentTypeKey;
    }
  }

  equipmentLocationChange(newEquipmentLocationKey: string) {
    this.locationKey = newEquipmentLocationKey;

    if (this.corNumber === 'New') {
      this.prevLocationKey = this.locationKey;
    }
  }

  //--------------------------Narrative------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];
  isSaved: boolean = false;
  isNewReport: boolean = true;

  private buildRequestBody(mode: 'create' | 'update' | 'close'): any {
    const currentTimestamp = new Date().toISOString();
    const isUpdate = mode !== 'create';
  
    return {
      corMain: {
        corMainKey: isUpdate ? this.corMainKey : 0,
        corNumber: isUpdate ? this.corNumber : '',
        cadIncidentNum: '454-Z023046766',
        corTypeFk: this.corTypeKey,
        corStatusFk: this.basicInfoComponent.statusID,
        userGroupFk: this.basicInfoComponent.groupCodeID,
        createdBy: this.loginUserName.split(',')[0],
        createDate: this.basicInfoComponent.fullDateTime,
        closedBy: mode === 'close' ? this.loginUserName : '',
        closeDate: mode === 'close' ? currentTimestamp : '',
        lastAssignedTo: this.routedToSelection,
        lastAssignedDate: this.basicInfoComponent.fullDateTime,
        assignedTo: this.routedToSelection,
        assignedToGroup: this.basicInfoComponent.isAssignedtoGroup,
        assignedDate: this.basicInfoComponent.fullDateTime,
        dueDate: this.basicInfoComponent.dueDate
          ? new Date(this.basicInfoComponent.dueDate).toISOString()
          : null,
        lastModifiedBy: this.loginUserName,
        lastModifiedDate: currentTimestamp,
      },
  
      relatedCors: this.basicInfoComponent.relatedCORs ?? [],
  
      report: {
        equipmentFailureKey: isUpdate ? this.equipmentFailureKey : 0,
        corFk: isUpdate ? this.corMainKey : 0,
        equipmentTypeFk: this.equipmentTypeKey, // Equipment Type
        equipmentLocationFk: this.locationKey, // Location Type
        typeDescription: this.equipmentDesc.trim(),
        locationDescription: this.locationDesc.trim(),
        serviceRequestTo: this.requestTo.trim(),
        failureDate: this.failureDateTime,
        requestDate: this.requestDateTime,
        serviceRespondedBy: this.respondBy,
        respondedDate: this.respondDateTime,
        serviceCompletedBy: this.completedBy,
        completedDate: this.completedDateTime,
        responseDelay: 12,
        elapsedDelay: 12,
        description: this.failureCommentText.trim(),
      },
      narratives: this.narrativesArray.map((entry: any) => ({
        narrativeKey: 0,
        corFk: this.corMainKey || 0,
        timeStamp: currentTimestamp,
        systemGenerated: entry.systemGenerated ?? true,
        createdBy: this.routedToSelection,
        createdByInitials: this.loginUserName.split(',')[0],
        narrativeText: entry.narrativeText || '',
      })),
    };
  }

  saveChanges() {
    const isValid = validateRequiredFields()

    if(!isValid) {
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

    // Update - when Equipment Type is changed
    if (!isNewReport && this.prevEquipmentTypeKey !== this.equipmentTypeKey) {
      this.updateFields('CHANGE', [
        'Equipment Type',
        this.getEquipmentTypeText(this.equipmentTypeKey),
        this.getEquipmentTypeText(this.prevEquipmentTypeKey),
      ]);
      this.prevEquipmentTypeKey = this.equipmentTypeKey;
    }

    // Update - when Location Type is changed
    if (!isNewReport && this.prevLocationKey !== this.locationKey) {
      this.updateFields('CHANGE', [
        'Location Type',
        this.getEquipmentLocationText(this.locationKey),
        this.getEquipmentLocationText(this.prevLocationKey),
      ]);
      this.prevLocationKey = this.locationKey;
    }

    // user's incident comment added
    if (this.failureCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(this.now),
        time: this.basicInfoComponent.formatTime(this.now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.failureCommentText.trim(),
        type: 'equipment',
      });
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      this.addNarrativeEntry(this.narrativeCommentText.trim(), false);
      narrativeCommentValue = this.narrativeCommentText.trim();
    }


    this.submitIncident();

    this.isSaved = true;
  } // +++++++++++end of saveChanges() +++++++++++

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

  failureDateTimeChange(newFailureDateTime: string) {
    this.failureDateTime = newFailureDateTime;
  }

  requestDateTimeChange(newRequestDateTime: string) {
    this.requestDateTime = newRequestDateTime;
  }

  respondedDateTimeChange(newRespondedDateTime: string) {
    this.respondDateTime = newRespondedDateTime;
  }

  completedDateTimeChange(newCompletedDateTime: string) {
    this.completedDateTime = newCompletedDateTime;
  }

  updateResponseDelay() {
    const hours = this.padNumber(this.delayHours);
    const minutes = this.padNumber(this.delayMinutes);
    this.responseDelay = `${hours}:${minutes}`;
  }
  
  padNumber(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }  

  // finding Equipment type name according to the Equipment type key
  getEquipmentTypeText(value: string): string {
    const findEquipmentType = this.equipmentTypeList.find(
      (type) => type.equipmentTypeKey === Number(value)
    );
    return findEquipmentType ? findEquipmentType.displayName : 'Unknown';
  }

  // finding Equipment location name according to the Equipment type key
  getEquipmentLocationText(value: string) {
    const findEquipmentLocation = this.equipmentLocationList.find(
      (type) => type.equipmentLocationKey === Number(value)
    );
    return findEquipmentLocation
      ? findEquipmentLocation.displayName
      : 'Unknwon';
  }

  now = new Date();
  currentTimestamp = this.now.toISOString();

  addNarrativeEntry = (comment: string, systemGenerated: boolean) => {
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

  // API request succeeded
  private handleReportResponse(
    response: any,
    mode: 'create' | 'update' | 'close'
  ) {
    this.reportService.setIncidentResponse(response);

    if (mode === 'create') {
      this.corNumber = this.reportService.getCorNumber();
      this.corMainKey = this.reportService.getcorMainKey();
      this.basicInfoComponent.setStatusTo('Create');
    }

    this.failureCommentText = '';
    this.narrativeCommentText = '';

    const messages = {
      create: 'Equipment Failure Report Successfully Created',
      update: 'Equipment Failure Report Successfully Updated',
      close: 'Equipment Failure Report Successfully Closed',
    };

    alert(messages[mode]);
  }

  // when API request failed (test purpose)
  private handleReportError(mode: 'create' | 'update' | 'close', error: any) {
    console.error('Error:', error);

    const messages = {
      create: 'Failed to Create Equipment Failure Report',
      update: 'Failed to Update Equipment Failure Report',
      close: 'Failed to Close Equipment Failure Report',
    };

    alert(messages[mode]);
  }

  // API call
  private submitIncident() {
    if (this.corNumber === 'New') {
      const createRequestBody = this.buildRequestBody('create');
      console.log('Creatd Request Body: ', createRequestBody);
      this.reportService
        .createReport(createRequestBody, 'cacc-equipment-failure-report')
        .subscribe(
          (response) => {
            console.log('create response body: ', response); // print response
            this.corMainKey = response?.corMain?.corMainKey ?? 0;
            this.equipmentFailureKey = response?.incident?.incidentKey ?? 0;

            this.router.navigate(['/cacc-equipment-failure'], {
              queryParams: {
                corTypeKey: this.corTypeKey,
                corMainKey: this.corMainKey,
                corNumber: this.corNumber,
              },
              replaceUrl: true,
            });

            this.handleReportResponse(response, 'create');
          },
          (error) => this.handleReportError('create', error)
        );
    } else {
      const updateRequestBody = this.buildRequestBody('update');
      console.log('update request body: ', updateRequestBody);

      this.reportService
        .updateIncident(updateRequestBody, 'cacc-equipment-failure-report')
        .subscribe(
          (response) => {
            console.log('update response body: ', response); // print response
            this.handleReportResponse(response, 'update');
          },
          (error) => this.handleReportError('update', error)
        );
    }
  }
}

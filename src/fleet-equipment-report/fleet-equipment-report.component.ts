import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../app/services/lookup.service';
import { ReportService } from '../app/services/report.service';
import { HeaderComponent } from '../app/header/header.component';
import { NarrativeComponent } from '../app/narrative/narrative.component';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';
import { validateRequiredFields } from '../app/utils/validateFields';
import { DisableIfClosed } from '../app/services/disable.service';

@Component({
  selector: 'app-fleet-equipment-report',
  imports: [
    FormsModule,
    RouterModule,
    NgFor,
    CommonModule,
    HeaderComponent,
    NarrativeComponent,
    BasicInformationComponent,
    DisableIfClosed,
  ],
  templateUrl: './fleet-equipment-report.component.html',
  styleUrls: ['./fleet-equipment-report.component.css'],
})
export class FleetEquipmentReportComponent implements OnInit {
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
  breakDownTypeList: any[] = []; // to send it to html
  corMainKey: string = ''; // Primary key to find the exisitng report

  narrativesArray: any[] = []; // temp

  vehicleFailureKey: string = ''; // for update API request

  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || ''; // 29030

    // sent the list of fleet types to drop down menu of fleet Type
    const breakDownType = this.lookupService.getLookupData('breakdown-type');
    if (breakDownType && breakDownType.data) {
      this.breakDownTypeList = breakDownType.data;
    }
  } // ++++++ end of ngOnInit() ++++++

  // -------------------------------Basic Information---------------------------
  // Moved to Basic-information.component.ts

  // ------------------------Fleet Report-----------------------------

  breakDownTypeKey: string = ''; // dropdown menu
  prevBreakDownTypeKey: string = ''; // to detect change

  failureDateTime = '';
  prevFailureDateTime = '';

  serviceStation: string = '';
  prevServiceStation: string = '';

  unitID: string = '';
  prevUnitID: string = '';

  delayHours: number = 0;
  delayMinutes: number = 0;
  responseDelay = '';
  isDelaySelected = false;

  isPatientOnBoard: boolean = false;

  //Method toggles delayed field
  toggleDelayTime() {
    this.isDelaySelected = !this.isDelaySelected;
    if (!this.isDelaySelected) {
      this.delayHours = 0;
      this.delayMinutes = 0;
      this.responseDelay = '00:00';
    }
  }

  updateResponseDelay() {
    const hh = String(this.delayHours).padStart(2, '0');
    const mm = String(this.delayMinutes).padStart(2, '0');
    this.responseDelay = `${hh}:${mm}`;
  }

  // detect breakdown type change
  breakDownTypeChange(newBreakDownTypeKey: string) {
    this.breakDownTypeKey = newBreakDownTypeKey;
  }

  // ---------------------------------Narrative------------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  breakDownCommentText: string = '';
  failureCommentText: string = '';
  combinedEntries: any[] = [];
  isSaved: boolean = false;

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
        dueDate: new Date(this.basicInfoComponent.dueDate).toISOString(),
        lastModifiedBy: this.routedToSelection,
        lastModifiedDate: currentTimestamp,
      },
      relatedCors: this.basicInfoComponent.relatedCORs ?? [],
      report: {
        vehicleFailureKey: isUpdate? this.vehicleFailureKey : 0,
        corFK: isUpdate ? this.corMainKey : 0,
        breakDownTypeFK: this.breakDownTypeKey,
        typeDescription: this.breakDownCommentText.trim(),
        vehicleNum: this.unitID,
        serviceInfo: this.serviceStation,
        failureDate: new Date(this.failureDateTime).toISOString(),
        responseDelay: this.isDelaySelected,
        patientOnBoard: this.isPatientOnBoard,
        elapsedDelay: this.convertElapsedTimeToIso(this.responseDelay),
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

  saveChanges(): void {
    const isValid = validateRequiredFields();

    if (!isValid) {
      this.isSaved = false;
      return;
    }

    const isNewReport = this.basicInfoComponent.corNumber === 'New';

    this.combinedEntries = [...this.combinedEntries];

    // only update fields one time at the beginning
    if (this.corNumber === 'New') {
      this.prevBreakDownTypeKey = this.breakDownTypeKey;
      this.prevFailureDateTime = this.failureDateTime;
      this.prevServiceStation = this.serviceStation;
      this.prevUnitID = this.unitID;
    }

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

    // Update - when Breakdown Type is changed
    if (!isNewReport && this.prevBreakDownTypeKey !== this.breakDownTypeKey) {
      this.updateFields('CHANGE', [
        'Breakdown Type',
        this.getBreakDownTypeText(this.breakDownTypeKey),
        this.getBreakDownTypeText(this.prevBreakDownTypeKey),
      ]);
      this.prevBreakDownTypeKey = this.breakDownTypeKey;
    }

    // Update - when Service/Station is changed
    if (!isNewReport && this.prevServiceStation !== this.serviceStation) {
      this.updateFields('CHANGE', [
        'Service/Station',
        this.serviceStation,
        this.prevServiceStation
      ]);
      this.prevServiceStation = this.serviceStation;
    }

    // Update - when UnitID is changed
    if (!isNewReport && this.prevUnitID !== this.unitID) {
      this.updateFields('CHANGE', [
        'Unit ID',
        this.unitID,
        this.prevUnitID
      ]);
      this.prevUnitID = this.unitID;
    }

    // user's Filure Details or Other Info comment added
    if (this.breakDownCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(this.now),
        time: this.basicInfoComponent.formatTime(this.now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.breakDownCommentText.trim(),
        type: 'incident',
      });
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      this.addNarrativeEntry(this.narrativeCommentText.trim(), false);
      narrativeCommentValue = this.narrativeCommentText.trim();
    }

    this.submitReport();

    this.isSaved = true;
  } // +++++++++++++++ end of save changes function

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

  // ====================UTILITY===================
  convertElapsedTimeToIso(timeStr: string): string {
    if (!timeStr) return new Date().toISOString(); // fallback
    const [hours, minutes] = timeStr.split(':').map(Number);
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today.toISOString();
  }

  updateRoutedToSelection(newSelection: string) {
    this.routedToSelection = newSelection;
  }

  updateStatusID(newStatusID: number) {
    this.statusID = newStatusID;
  }

  // finding fleet type name according to the fleet type key
  getBreakDownTypeText(value: string): string {
    const findBreakDownType = this.breakDownTypeList.find(
      (type) => type.breakDownTypeKey === Number(value)
    );
    return findBreakDownType ? findBreakDownType.displayName : 'Unknown';
  }

  // find the key to send API
  getBreakDownTypeKey(displayName: string): number | null {
    const findFleetType = this.breakDownTypeList.find(
      (type) => type.displayName === displayName
    );
    return findFleetType ? findFleetType.fleetTypeKey : null;
  }

  //handler for close COR button
  handleCloseCor(message: string) {
    // add message to narrative
    this.addNarrativeEntry(message, true);

    // update request body and close overwrite to close
    const updateRequestBody = this.buildRequestBody('close');
    updateRequestBody.closedby = this.loginUserName;
    updateRequestBody.closeDate = new Date().toISOString();

    // call API
    console.log('Closing: Sending updateIncident: ', updateRequestBody);

    this.reportService
      .updateReport(updateRequestBody, 'fleet-equipment-failure-vehicle-breakdown-report')
      .subscribe(
        (response) => {
          console.log('Closing: Fleet-Equipment Failure & Vehicle Breakdown Report report SUCCESS');
          this.handleReportResponse(response, 'close');
        },
        (error) => {
          console.log('Closing: Fleet-Equipment Failure & Vehicle Breakdown Report report FAILED', error);
          this.handleReportError('close', error);
        }
      );
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

    this.breakDownCommentText = '';
    this.failureCommentText = '';
    this.narrativeCommentText = '';

    const messages = {
      create: 'Fleet-Equipment Failure & Vehicle Breakdown Report Successfully Created',
      update: 'Fleet-Equipment Failure & Vehicle Breakdown Report Successfully Updated',
      close: 'Fleet-Equipment Failure & Vehicle Breakdown Report Successfully Closed',
    };

    alert(messages[mode]);
  }

  // when API request failed (test purpose)
  private handleReportError(mode: 'create' | 'update' | 'close', error: any) {
    console.error('Error:', error);

    const messages = {
      create: 'Failed to Create Fleet-Equipment Failure & Vehicle Breakdown Report',
      update: 'Failed to Update Fleet-Equipment Failure & Vehicle Breakdown Report',
      close: 'Failed to Close Fleet-Equipment Failure & Vehicle Breakdown Report',
    };

    alert(messages[mode]);
  }

  // API call
  private submitReport() {
    if (this.corNumber === 'New') {
      const createRequestBody = this.buildRequestBody('create');
      console.log('Creatd Request Body: ', createRequestBody);
      this.reportService
        .createReport(createRequestBody, 'fleet-equipment-failure-vehicle-breakdown-report')
        .subscribe(
          (response) => {
            console.log('create response body: ', response); // print response
            this.corMainKey = response?.data?.corMain?.corMainKey ?? 0;
            this.vehicleFailureKey = response?.data?.report?.vehicleFailureKey ?? 0;

            this.router.navigate(['/fleet-equipment-failure-vehicle-breakdown'], {
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
        .updateReport(updateRequestBody, 'fleet-equipment-failure-vehicle-breakdown-report')
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

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
  selector: 'app-complaint-report',
  standalone: true,
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
  templateUrl: './complaint-report.component.html',
  styleUrls: ['./complaint-report.component.css'],
})
export class ComplaintReportComponent implements OnInit {
  @ViewChild(BasicInformationComponent)
  basicInfoComponent!: BasicInformationComponent;

  ngAfterViewInit(): void {
    this.statusID = this.basicInfoComponent.statusID;
    this.corType = this.basicInfoComponent.corType;
    this.corTypeKey = this.basicInfoComponent.corTypeKey;
  }

  constructor() {
    this.titleService.setTitle('CORTS - COR Entry (New)');
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

  complaintTypeList: any[] = []; // to send it to html
  narrativesArray: any[] = []; // temp
  corMainKey: string = ''; // Primary key to find the exisitng report
  complaintKey: string = ''; // for API update request

  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || ''; // 29030

    // sent the list of complaint types to drop down menu of Complaint Type
    const complaintTypes = this.lookupService.getLookupData('complaint-type');
    if (complaintTypes && complaintTypes.data) {
      this.complaintTypeList = complaintTypes.data;
    }
  } // ++++++ end of ngOnInit() ++++++

  // -------------------------------Basic Information---------------------------
  // Moved to Basic-information.component.ts

  // ------------------------Complaint Report-----------------------------

  complaintTypeKey: string = '';
  previousComplaintTypeKey: string = '';
  complaintDateTime = '';
  prevComplaintDateTime = '';
  complaintCommentText: string = '';

  firstName = '';
  prevFirstName = '';
  lastName = '';
  prevLastName = '';
  fullName = '';
  prevFullName = '';

  phoneNumber = '';
  prevPhoneNumber = '';

  complaintTypeChange(newComplaintTypeKey: string) {
    this.complaintTypeKey = newComplaintTypeKey;
  }

  // ------------------------------Narrative---------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];
  isSaved: boolean = false;

  private buildRequestBody(mode: 'create' | 'update' | 'close'): any {
    const currentTimestamp = new Date().toISOString();
    const isUpdate = mode !== 'create';

    return {
      caccId: 0,
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
        lastModifiedBy: this.loginUserName,
        lastModifiedDate: currentTimestamp,
      },
      relatedCors: this.basicInfoComponent.relatedCORs ?? [],
      report: {
        complaintKey: isUpdate ? this.complaintKey : 0,
        corFK: isUpdate ? this.corMainKey : 0,
        complaintTypeFK: this.complaintTypeKey,
        lastName: this.lastName,
        firstName: this.firstName,
        phoneNumber: this.phoneNumber,
        complaintDate: this.complaintDateTime,
        complaintDetails: this.complaintCommentText.trim(),
      },
      narratives: this.narrativesArray.map((entry: any) => ({
        narrativeKey: 0,
        corFk: isUpdate ? this.corMainKey : 0,
        timeStamp: currentTimestamp,
        systemGenerated: entry.systemGenerated ?? true,
        createdBy: this.routedToSelection,
        createdByInitials: this.loginUserName.split(',')[0],
        narrativeText: entry.narrativeText || '',
      })),
    };
  }

  saveChanges() {
    const isValid = validateRequiredFields();

    if (!isValid) {
      this.isSaved = false;
      return;
    }

    const isNewReport = this.basicInfoComponent.corNumber === 'New';

    this.combinedEntries = [...this.combinedEntries];

    if (this.corNumber === 'New') {
      this.previousComplaintTypeKey = this.complaintTypeKey;
      this.prevFullName = this.fullName;
      this.prevPhoneNumber = this.phoneNumber;
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

    // Update - when Complaint Type is changed
    if (
      !isNewReport &&
      this.previousComplaintTypeKey !== this.complaintTypeKey
    ) {
      this.updateFields('CHANGE', [
        'Complaint Type',
        this.getComplaintTypeText(this.complaintTypeKey),
        this.getComplaintTypeText(this.previousComplaintTypeKey),
      ]);
      this.previousComplaintTypeKey = this.complaintTypeKey;
    }

    // Update - when name is changed
    if (
      !isNewReport &&
      (this.prevFirstName !== this.firstName ||
        this.prevLastName !== this.lastName)
    ) {
      this.updateFields('CHANGE', [
        'Contact Information',
        this.fullName,
        this.prevFullName,
      ]);
      this.prevFirstName = this.firstName;
      this.prevLastName = this.lastName;
      this.prevFullName = this.fullName;
    }

    // Update - when phone number is changed
    if (
      !isNewReport &&
      this.prevPhoneNumber !== this.phoneNumber
    ) {
      this.updateFields('CHANGE', [
        'Phone Number',
        this.formatPhoneNumber(this.phoneNumber),
        this.formatPhoneNumber(this.prevPhoneNumber),
      ]);
      this.prevPhoneNumber = this.phoneNumber;
    }

    // user's incident comment added
    if (this.complaintCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(this.now),
        time: this.basicInfoComponent.formatTime(this.now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.complaintCommentText.trim(),
        type: 'complaint',
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
  } // ++++++++end of saveChanges()

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

  updateFullName(): void {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
  }

  formatPhoneNumber(phoneNumber: string) {
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length !== 10) {
      return 'Invalid phone number';
    }

    return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // finding complaint type name according to the complaint type key
  getComplaintTypeText(value: string): string {
    const findComplaintType = this.complaintTypeList.find(
      (type) => type.complaintTypeKey === Number(value)
    );
    return findComplaintType ? findComplaintType.displayName : 'Unknown';
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
      .updateReport(updateRequestBody, 'incident-report')
      .subscribe(
        (response) => {
          console.log('Closing: Incident report SUCCESS');
          this.handleReportResponse(response, 'close');
        },
        (error) => {
          console.log('Closing: Incident report FAILED', error);
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

    this.complaintCommentText = '';
    this.narrativeCommentText = '';

    const messages = {
      create: 'Complaint Report Successfully Created',
      update: 'Complaint Report Successfully Updated',
      close: 'Complaint Report Successfully Closed',
    };

    alert(messages[mode]);
  }

  // when API request failed (test purpose)
  private handleReportError(mode: 'create' | 'update' | 'close', error: any) {
    console.error('Error:', error);

    const messages = {
      create: 'Failed to Create Complaint Report',
      update: 'Failed to Update Complaint Report',
      close: 'Failed to Close Complaint Report',
    };

    alert(messages[mode]);
  }

  // API call
  private submitReport() {
    if (this.corNumber === 'New') {
      const createRequestBody = this.buildRequestBody('create');
      console.log('Creatd Request Body: ', createRequestBody);
      this.reportService
        .createReport(createRequestBody, 'complaint-inquiry-report')
        .subscribe(
          (response) => {
            console.log('create response body: ', response); // print response
            this.corMainKey = response?.data?.corMain?.corMainKey ?? 0;
            this.complaintKey = response?.data?.report?.complaintKey ?? 0;

            this.router.navigate(['/complaint-inquiry'], {
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
        .updateReport(updateRequestBody, 'complaint-inquiry-report')
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

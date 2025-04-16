import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../app/services/lookup.service';
import { ReportService } from '../app/services/report.service';
import { validateVsaReport } from '../app/utils/validateFields';
import { HeaderComponent } from '../app/header/header.component';
import { NarrativeComponent } from '../app/narrative/narrative.component';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';

@Component({
  selector: 'app-vsa-report',
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
  templateUrl: './vsa-report.component.html',
  styleUrls: ['./vsa-report.component.css'],
})
export class vsaReportComponent implements OnInit {
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
  private lookupService = inject(LookupService); // might use it?
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

  // Variables
  relatedCORInput: string = '';
  relatedCORs: string[] = [];

  dnrTypeList: any[] = [];
  narrativesArray: any[] = []; // temp

  corMainKey: string = ''; // Primary key to find the exisitng report

  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || ''; // 29030

    const dnrData = this.lookupService.getLookupData('dnr-status');
    if (dnrData && dnrData.data) {
      this.dnrTypeList = dnrData.data;
    }
  }

  // ----------------------------ALS/VSA Report----------------------------------
  isVSASelected: boolean = false;
  isALSSelected: boolean = false;
  isARSelected: boolean = false;
  isCPRSelected: boolean = false;

  dnrTypeKey: string = ''; // key from the dropdown menu
  previousDnrTypeKey: string = ''; // to detect change
  alsDateTime = '';
  alsCommentText: string = ''; // als details input
  pronouncedBy: string = '';
  prevPronouncedBy: string = '';
  pronouncedDateTime: string = '';
  prevPronouncedDateTime: string = '';

  // using NodeListOf<HTMLElement>, select all the class that has 'vsa-req-input'
  reqVSAElements: NodeListOf<HTMLElement> =
    document.querySelectorAll('.vsa-req-input');

  // toggle 'isVSASelected' if 'vsa' is selected and call vsaReInput()
  // toggle 'isALSSelected' if 'als' is selected
  // reportType - 'vsa' or 'als'
  toggleReportType(reportType: string, event: any): void {
    if (reportType === 'vsa') {
      this.isVSASelected = event.target.checked;
      this.vsaReqInput();
    } else if (reportType === 'als') {
      this.isALSSelected = event.target.checked;
    }
  }

  // change status depend on VSA input field
  // depend on isVSASelected, add/remove 'req-input' class
  // decide 'required' element
  vsaReqInput(): void {
    this.reqVSAElements.forEach((element) => {
      element.classList.toggle('req-input', this.isVSASelected);
      this.isVSASelected
        ? element.setAttribute('required', '')
        : element.removeAttribute('required');
    });
  }

  // detect dnr type change
  dnrTypeChange(newDnrTypeKey: string) {
    this.dnrTypeKey = newDnrTypeKey;

    // only update previousDnrTypeKey one time at the beginning
    if (this.corNumber === 'New') {
      this.previousDnrTypeKey = this.dnrTypeKey;
    }
  }

  // -------------------------Narrative--------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];
  isSaved: boolean = false;
  vsaKey: string = '';

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
        lastModifiedBy: this.loginUserName,
        lastModifiedDate: currentTimestamp,
      },
      relatedCors: this.basicInfoComponent.relatedCORs ?? [],

      report: {
        vsaKey: isUpdate ? this.vsaKey : 0,
        corFk: isUpdate ? this.corMainKey : 0,
        als: this.isALSSelected,
        vsa: this.isVSASelected,
        vsaDate: this.pronouncedDateTime
          ? new Date(this.pronouncedDateTime).toISOString()
          : null,
        pronounceDeadBy: this.pronouncedBy ?? '',
        arInstGiven: this.isARSelected,
        cprInstGiven: this.isCPRSelected,
        validDnrFk: this.dnrTypeKey,
        otherInfo: this.alsCommentText.trim() ?? '',
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

  // save Changes button
  saveChanges() {
    const isValid = validateVsaReport({
      isALSSelected: this.isALSSelected,
      isVSASelected: this.isVSASelected,
      incidentCallNumber: this.basicInfoComponent.incidentCallNumber,
      requiredFieldsSelector: '[required]',
    });

    if (!isValid) {
      this.isSaved = false;
      return;
    }

    const isNewReport = this.basicInfoComponent.corNumber === 'New';

    this.combinedEntries = [...this.combinedEntries];

    // New - Routed To, dnr Type
    if (isNewReport) {
      this.updateFields('CREATE', []);
      this.updateFields('REASSIGN', [this.routedToSelection]);

      this.previousRoutedTo = this.routedToSelection;

      if (this.pronouncedBy) {
        this.updateFields('Pronounced By: ', [this.pronouncedBy]);
        this.prevPronouncedBy = this.pronouncedBy;
      }

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

    // Update - when DNR Type is changed
    if (!isNewReport && this.previousDnrTypeKey !== this.dnrTypeKey) {
      this.updateFields('CHANGE', [
        'DNR Type',
        this.getDnrTypeText(this.dnrTypeKey),
        this.getDnrTypeText(this.previousDnrTypeKey),
      ]);
      this.previousDnrTypeKey = this.dnrTypeKey;
    }

    // user's ALS/VSA comment added
    if (this.alsCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(this.now),
        time: this.basicInfoComponent.formatTime(this.now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.alsCommentText.trim(),
        type: 'als',
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
  } // <=== end of saveChanges()

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

  //========================UTILITY===========================
  updateRoutedToSelection(newSelection: string) {
    this.routedToSelection = newSelection;
  }

  updateStatusID(newStatusID: number) {
    this.statusID = newStatusID;
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
    this.reportService
      .updateIncident(updateRequestBody, 'als-vsa-report')
      .subscribe(
        (response) => {
          console.log('Closing: ALS-VSA report SUCCESS');
          this.handleReportResponse(response, 'close');
        },
        (error) => {
          console.log('Closing: ALS-VSA report FAILED', error);
          this.handleReportError('close', error);
        }
      );
  }

  getDnrTypeText(value: string): string {
    const findDnrType = this.dnrTypeList.find((type) => type.code === value);
    return findDnrType ? findDnrType.displayName : 'Unknown';
  }

  // Method verifies of the Report Type is selected
  vsaTypeCheck(): boolean {
    if (this.isALSSelected || this.isVSASelected) {
      return true;
    } else {
      window.alert('You must select either ALS, VSA or both.');
      return false;
    }
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

    this.alsCommentText = '';
    this.narrativeCommentText = '';

    const messages = {
      create: 'ALS-VSA Report Successfully Created',
      update: 'ALS-VSA Report Successfully Updated',
      close: 'ALS-VSA Report Successfully Closed',
    };

    alert(messages[mode]);
  }

  // when API request failed
  private handleReportError(mode: 'create' | 'update' | 'close', error: any) {
    console.error('Error:', error);

    const messages = {
      create: 'Failed to Create ALS-VSA Report',
      update: 'Failed to Update ALS-VSA Report',
      close: 'Failed to Close ALS-VSA Report',
    };

    alert(messages[mode]);
  }

  // API call
  private submitReport() {
    if (this.corNumber === 'New') {
      const createRequestBody = this.buildRequestBody('create');
      console.log('create response body: ', createRequestBody);
      this.reportService
        .createReport(createRequestBody, 'als-vsa-report')
        .subscribe(
          (response) => {
            console.log('create response body: ', response); // print response
            this.corMainKey = response?.corMain?.corMainKey ?? 0;
            this.vsaKey = response?.incident?.incidentKey ?? 0;

            this.router.navigate(['/vsa-report'], {
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
        .updateIncident(updateRequestBody, 'als-vsa-report')
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

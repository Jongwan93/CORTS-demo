import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../../app/services/lookup.service';
import { validateVsaReport } from '../../app/utils/validateFields';
import { HeaderComponent } from '../../app/header/header.component';
import { NarrativeComponent } from '../../app/narrative/narrative.component';
import { BasicInformationComponent } from '../../app/basic-information/basic-information.component';

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

  isNewReport: boolean = true;

  ngAfterViewInit(): void {
    this.statusID = this.basicInfoComponent.statusID;
    this.corType = this.basicInfoComponent.corType;
    this.corTypeKey = this.basicInfoComponent.corTypeKey;
    this.isNewReport = this.basicInfoComponent.corNumber === 'New';
  }

  constructor() {
    this.titleService.setTitle('CORTS - COR Entry (New)');
  }

  // services
  private titleService = inject(Title);
  private lookupService = inject(LookupService); // might use it?
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
  isVSASelected = false;
  isALSSelected = false;

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
      this.vsaReqInput(); // VSA 선택 시 실행되는 함수
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
  /**
   * March 19th problem
   * isNewReport is boolean depending on corNumber
   * if corNumber stays 'New' isNewReport stays 'false'
   * which cause duplicate of system generated messages.
   * corNumber is generated and sent by API.
   * Require API to fix this matter.
   */
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];
  isSaved: boolean = false;

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

    /* corNumber is generated/assigned by API.
     *  currently ALS/VSA API isn't ready so corNumber is not being updated.
     *  therefore, isNewReport is always true.
     *  causing malfunctioning on ALS/VSA comments and Narrative comments
     */

    // make it const when API implemented

    this.combinedEntries = [...this.combinedEntries];

    // New - Routed To, dnr Type
    if (isNewReport) {
      this.updateFields('CREATE', []);
      this.updateFields('REASSIGN', [this.routedToSelection]);

      this.previousRoutedTo = this.routedToSelection;

      if(this.pronouncedBy){
        //this.updateFields('Pronounced By: ', [this.pronouncedBy]); <-- NEED API
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
    if (!this.isNewReport && this.previousDnrTypeKey !== this.dnrTypeKey) {
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

    // TODO: API implementation
    /*
    const createRequestBody = {

    }    
    */

    this.alsCommentText = '';
    this.narrativeCommentText = '';

    // TODO: API implementation
    /*
    const updateRequestBody = {

    }
    */

    // API call
    /*if (this.corNumber === 'New') {
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
    }*/

    //--------------TEMP------------------------------
    this.isNewReport = false;
    this.corNumber = '1234';
    //---------DELETE AFTER api IMPLEMENTED-----------

    this.basicInfoComponent.setStatusToCreate();

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

import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../../app/services/lookup.service';
import { validateVsaReport } from '../../app/utils/validateFields';
import { BasicInformationComponent } from '../../app/basic-information/basic-information.component';

@Component({
  selector: 'app-vsa-report',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    NgFor,
    CommonModule,
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

  // using NodeListOf<HTMLElement>, select all the class that has 'vsa-req-input'
  reqVSAElements: NodeListOf<HTMLElement> =
    document.querySelectorAll('.vsa-req-input');

  // toggle 'isVSASelected' if 'vsa' is selected and call vsaReInput()
  // toggle 'isALSSelected' if 'als' is selected
  // reportType - 'vsa' or 'als'
  toggleReportType(reportType: string, event: any): void {
    if (reportType === 'vsa') {
      this.isVSASelected = event.target.checked;
      this.vsaReqInput();  // VSA 선택 시 실행되는 함수
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

  saveChanges() {
    // if (this.isSaved) return;
    // this.isSaved = true;

    const isValid = validateVsaReport({
      isALSSelected: this.isALSSelected,
      isVSASelected: this.isVSASelected,
      incidentCallNumber: this.basicInfoComponent.incidentCallNumber,
      requiredFieldsSelector: '[required]'
    });

    if (!isValid) {
      return;
    }

    const now = new Date();
    const currentTimestamp = now.toISOString();
    /* corNumber is generated/assigned by API.
     *  currently ALS/VSA API isn't ready so corNumber is not being updated.
     *  therefore, isNewReport is always true.
     *  causing malfunctioning on ALS/VSA comments and Narrative comments
     */

    // make it const when API implemented

    this.combinedEntries = [...this.combinedEntries];

    const addNarrativeEntry = (comment: string, systemGenerated: boolean) => {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(now),
        time: this.basicInfoComponent.formatTime(now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: comment,
        type: 'narrative',
      });
      this.narrativesArray.push({
        narrativeKey: 0,
        corFk: 0,
        timeStamp: currentTimestamp,
        systemGenerated: systemGenerated,
        createdBy: this.basicInfoComponent.userName,
        createdByInitials: this.loginUserName,
        narrativeText: comment,
      });
    };

    // New - Routed To, dnr Type
    if (this.isNewReport) {
      const msgTemplateCreate =
        this.lookupService.getSystemMessageByCode('CREATE');
      const msgTemplateReassign =
        this.lookupService.getSystemMessageByCode('REASSIGN');

      // "new ALS/VSA report created" added
      if (msgTemplateCreate) {
        addNarrativeEntry(msgTemplateCreate, true);
      }

      // "Routed To..." message added
      if (msgTemplateReassign) {
        addNarrativeEntry(
          msgTemplateReassign.replace('%1', this.routedToSelection),
          true
        );
      }
      this.previousRoutedTo = this.routedToSelection;

      // show the duplicate and close COR button
      this.basicInfoComponent.isDupCloseCorButtonsVisible = true;
      this.isNewReport = false; // delete after API implemented
    }

    const msgTemplateChange =
      this.lookupService.getSystemMessageByCode('CHANGE');
    // Update - when Routed To is changed
    if (!this.isNewReport && this.previousRoutedTo !== this.routedToSelection) {
      if (msgTemplateChange) {
        addNarrativeEntry(
          msgTemplateChange
            .replace('%1', 'Routed To')
            .replace('%2', this.routedToSelection)
            .replace('%3', this.previousRoutedTo),
          true
        );
      }
      this.previousRoutedTo = this.routedToSelection;
    }

    // Update - when DNR Type is changed
    if (!this.isNewReport && this.previousDnrTypeKey !== this.dnrTypeKey) {
      if (msgTemplateChange) {
        addNarrativeEntry(
          msgTemplateChange
            .replace('%1', 'DNR Type')
            .replace('%2', this.dnrTypeKey)
            .replace('%3', this.previousDnrTypeKey),
          true
        );
      }
      this.previousDnrTypeKey = this.dnrTypeKey;
    }

    // user's ALS/VSA comment added
    if (this.alsCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(now),
        time: this.basicInfoComponent.formatTime(now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.alsCommentText.trim(),
        type: 'als',
      });
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      addNarrativeEntry(this.narrativeCommentText.trim(), false);
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

    this.basicInfoComponent.setStatusToCreate();
  } // <=== end of saveChanges()

  // button Save Changes and Exit
  saveChangesExit() {
    if (!this.isSaved) {
      this.saveChanges();
    }

    // wait for API to save the data
    setTimeout(() => {
      this.isSaved = false;
      window.alert('Changes Saved');
      this.router.navigate(['/mainpage']);
    }, 500);
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
}

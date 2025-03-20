import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../app/services/lookup.service';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';

@Component({
  selector: 'app-complaint-report',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    NgFor,
    CommonModule,
    BasicInformationComponent,
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
  isSystemGenerated: boolean = true; // "Routed To.." "New Report Created"
  corMainKey: string = ''; // Primary key to find the exisitng report

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
  complaintCommentText: string = '';
  firstName = '';
  prevFirstName = '';
  lastName = '';
  prevLastName = '';
  phoneNumber = '';
  prevPhoneNumber = '';

  complaintTypeChange(newComplaintTypeKey: string) {
    this.complaintTypeKey = newComplaintTypeKey;

    if (this.corNumber === 'New') {
      this.previousComplaintTypeKey = this.complaintTypeKey;
    }
  }

  // ------------------------------Narrative---------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];

  saveChanges() {
    if(!this.validateReqFields()) {
      alert('Please complete all the required fields.');
      return;
    }

    /*
    if (
      !this.complaintCommentText.trim() ||
      !this.complaintTypeKey ||
      !this.complaintDateTime
    ) {
      alert('Please complete all the required fields.');
      return;
    }

    if (this.routedToSelection === '') {
      alert('Please select Route To option');
      return;
    }

    if (this.phoneNumber.length !== 10) {
      alert('invalid length of phone number');
      return;
    }
    */

    // format the phone number (xxx)xxx-xxxx
    this.formatPhoneNumber(this.phoneNumber) 

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

    // New - Routed To, Complaint Type
    if (isNewReport) {
      const msgTemplateCreate =
        this.lookupService.getSystemMessageByCode('CREATE');
      const msgTemplateReassign =
        this.lookupService.getSystemMessageByCode('REASSIGN');

      // "new Complaint report created" added
      if (msgTemplateCreate) {
        addNarrativeEntry(msgTemplateCreate);
      }

      // "Routed To..." message added
      if (msgTemplateReassign) {
        addNarrativeEntry(
          msgTemplateReassign.replace('%1', this.routedToSelection)
        );
      }
      this.previousRoutedTo = this.routedToSelection;

      if (this.lastName) {
        addNarrativeEntry(`last name is updated to: [${this.lastName}]`);
        this.prevLastName = this.lastName;
      }

      if (this.firstName) {
        addNarrativeEntry(`first name is updated to: [${this.firstName}]`);
        this.prevFirstName = this.firstName;
      }

      if (this.phoneNumber) {
        addNarrativeEntry(`phone number is updated to: [${this.phoneNumber}]`);
        this.prevPhoneNumber = this.phoneNumber;
      }

      // show the duplicate and close COR button
      this.basicInfoComponent.isDupCloseCorButtonsVisible = true;
    }

    const msgTemplateChange =
      this.lookupService.getSystemMessageByCode('CHANGE');
      
    // Update - when Routed To is changed
    if (!isNewReport && this.previousRoutedTo !== this.routedToSelection) {
      if (msgTemplateChange) {
        addNarrativeEntry(
          msgTemplateChange
            .replace('%1', 'Routed To')
            .replace('%2', this.routedToSelection)
            .replace('%3', this.previousRoutedTo)
        );
      }
      this.previousRoutedTo = this.routedToSelection;
    }


    // Update - when complaint Type is changed
    if (
      !isNewReport &&
      this.previousComplaintTypeKey !== this.complaintTypeKey
    ) {
      if (msgTemplateChange) {
        addNarrativeEntry(
          msgTemplateChange
            .replace('%1', 'Complant Type')
            .replace('%2', this.complaintTypeKey)
            .replace('%3', this.previousComplaintTypeKey)
        );
      }
      this.previousComplaintTypeKey = this.complaintTypeKey;
    }

    // Update - first name or last name or phone number
    if (
      this.prevFirstName !== this.firstName ||
      this.prevLastName !== this.lastName ||
      this.prevPhoneNumber !== this.phoneNumber
    ) {
      addNarrativeEntry(
        `Personal information is updated to [${this.firstName} ${this.lastName} #${this.phoneNumber}]`
      );
      this.prevFirstName = this.firstName;
      this.prevFirstName = this.firstName;
      this.prevPhoneNumber = this.phoneNumber;
    }

    // user's Complaint comment added
    if (this.complaintCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(now),
        time: this.basicInfoComponent.formatTime(now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.complaintCommentText.trim(),
        type: 'complaint',
      });
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      addNarrativeEntry(this.narrativeCommentText.trim());
      narrativeCommentValue = this.narrativeCommentText.trim();
    }

    // TO DO: API call request and update body
    //
    //
    //

    this.basicInfoComponent.setStatusToCreate();
  } // ++++++++end of saveChanges()

  // button Save Changes and Exit
  saveChangesExit() {
    this.saveChanges();
    // wait for API to save the data
    setTimeout(() => {
      window.alert('Changes Saved');
      this.router.navigate(['/mainpage']);
    }, 500);
  }

  // button Reload Page
  reload() {
    window.alert('do you want to refresh the page?');
    location.reload();
  }

  //==============================UTILITY==================================
  updateRoutedToSelection(newSelection: string) {
    this.routedToSelection = newSelection;
  }

  updateStatusID(newStatusID: number) {
    this.statusID = newStatusID;
  }

  formatPhoneNumber(phoneNumber: string) {
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length !== 10) {
      return 'Invalid phone number';
    }

    return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Method verifies if all Required Fields are filled in
  validateReqFields(): boolean {
    const reqFields = document.querySelectorAll('[required]');
    for (let field of reqFields) {
      const inputField = field as HTMLInputElement;
      if (!inputField.value) {
        console.error('Required field not filled:', field);
        window.alert('Error: Not all required fields are filled in.');
        return false;
      }
    }
    return true;
  }

  getComplaintTypeText(value: string): string {
    const findComplaintType = this.complaintTypeList.find(
      (type) => type.complaintTypeKey === Number(value)
    );
    return findComplaintType ? findComplaintType.displayName : 'Unknown';
  }
}

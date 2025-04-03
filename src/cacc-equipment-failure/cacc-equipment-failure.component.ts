import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../app/services/lookup.service';
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
  equipmentLocationKey: string = '';
  prevEquipmentLocationKey: string = '';
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
    this.equipmentLocationKey = newEquipmentLocationKey;

    if (this.corNumber === 'New') {
      this.prevEquipmentLocationKey = this.equipmentLocationKey;
    }
  }

  //--------------------------Narrative------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];
  isSaved: boolean = false;
  isNewReport: boolean = true;

  saveChanges() {
    const isValid = validateRequiredFields()

    if(!isValid) {
      this.isSaved = false;
      return;
    }

    const now = new Date();
    const currentTimestamp = now.toISOString();
    const isNewReport = this.basicInfoComponent.corNumber === 'New';

    this.combinedEntries = [...this.combinedEntries];

    const narrativesArray: any[] = [];

    const addNarrativeEntry = (comment: string, systemGenerated: boolean) => {
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

    // New - Routed To, Equipment Type
    if (isNewReport) {
      // "new Equipment report created" added
      const msgTemplateCreate =
        this.lookupService.getSystemMessageByCode('CREATE');
      const msgTemplateReassign =
        this.lookupService.getSystemMessageByCode('REASSIGN');

      if (msgTemplateCreate) {
        addNarrativeEntry(msgTemplateCreate, true);
      }

      // "Routed To..." message added
      if (msgTemplateReassign) {
        addNarrativeEntry(
          msgTemplateReassign.replace('%1', this.routedToSelection),
        true);
      }
      this.previousRoutedTo = this.routedToSelection;

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
            .replace('%3', this.previousRoutedTo), 
        true);
      }
      this.previousRoutedTo = this.routedToSelection;
    }

    // Update - when Equipment Type is changed
    if (!isNewReport && this.prevEquipmentTypeKey !== this.equipmentTypeKey) {
      if (msgTemplateChange) {
        addNarrativeEntry(
          msgTemplateChange
            .replace('%1', 'Equipment Type')
            .replace('%2', this.getEquipmentTypeText(this.equipmentTypeKey))
            .replace('%3', this.getEquipmentTypeText(this.prevEquipmentTypeKey)), true);
      }
      this.prevEquipmentTypeKey = this.equipmentTypeKey;
    }

    // Update - when Equipment Location is changed
    if (!isNewReport && this.prevEquipmentLocationKey !== this.equipmentLocationKey) {
      if(msgTemplateChange){
        addNarrativeEntry(
          msgTemplateChange
          .replace('%1', 'Equipment Location')
          .replace('%2', this.getEquipmentLocationText(this.equipmentLocationKey))
          .replace('%3', this.getEquipmentLocationText(this.prevEquipmentLocationKey)), true
        );
      }
      this.prevEquipmentLocationKey = this.equipmentLocationKey;
    }

    // Update - when Failure date/time is changed
    if (!isNewReport && this.prevFailureDateTime !== this.failureDateTime) {
      if(msgTemplateChange){
        addNarrativeEntry(
          msgTemplateChange
          .replace('%1', 'Failure Date/Time')
          .replace('%2', this.failureDateTime)
          .replace('%3', this.prevFailureDateTime), true
        );
      }
      this.prevEquipmentLocationKey = this.equipmentLocationKey;
    }

    // user's equipment comment added
    if (this.failureCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(now),
        time: this.basicInfoComponent.formatTime(now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.failureCommentText.trim(),
        type: 'equipment',
      });
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      addNarrativeEntry(this.narrativeCommentText.trim(), false);
      narrativeCommentValue = this.narrativeCommentText.trim();
    }

    this.failureCommentText = '';
    this.narrativeCommentText = '';

    //------------TEMP---------------------------
    this.isNewReport = true;
    this.corNumber = '1234';
    //-----DELETE IT AFTER api IMPLEMENTATION-----

    this.basicInfoComponent.setStatusToCreate();

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
}

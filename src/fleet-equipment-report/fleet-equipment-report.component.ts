import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { LookupService } from '../app/services/lookup.service';
import { HeaderComponent } from '../app/header/header.component';
import { NarrativeComponent } from '../app/narrative/narrative.component';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';
import { validateRequiredFields } from '../app/utils/validateFields';

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
  isDelaySelected = false;

  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || ''; // 29030

    // sent the list of fleet types to drop down menu of fleet Type
    const breakDownType = this.lookupService.getLookupData('breakdown-type');
    if (breakDownType && breakDownType.data) {
      this.breakDownTypeList = breakDownType.data;
    }
  } // ++++++ end of ngOnInit() ++++++

  //Method toggles delayed field (To be able to input the time)
  toggleDelayTime() {
    this.isDelaySelected = !this.isDelaySelected;
  }

  // -------------------------------Basic Information---------------------------
  // Moved to Basic-information.component.ts

  // ------------------------Fleet Report-----------------------------

  breakDownTypeKey: string = ''; // dropdown menu
  prevBreakDownTypeKey: string = ''; // to detect change
  failureDateTime = '';
  prevFailureDateTime = '';
  
  // detect breakdown type change
  fleetTypeChange(newBreakDownTypeKey: string) {
    this.breakDownTypeKey = newBreakDownTypeKey;

    // only update previousBreakDownTypeKey one time at the beginning
    if (this.corNumber === 'New') {
      this.prevBreakDownTypeKey = this.breakDownTypeKey;
    }
  }

  // ---------------------------------Narrative------------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  breakDownCommentText: string = '';
  failureCommentText: string = '';
  combinedEntries: any[] = [];
  isSaved: boolean = false;

  saveChanges(): void {
    const isValid = validateRequiredFields();

    if (!isValid) {
      this.isSaved = false;
      return;
    }

    const now = new Date();
    const currentTimestamp = now.toISOString();
    const isNewReport = this.basicInfoComponent.corNumber === 'New';

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

    // New - Routed To, breakdown Type
    if (isNewReport) {
      const msgTemplateCreate =
        this.lookupService.getSystemMessageByCode('CREATE');
      const msgTemplateReassign =
        this.lookupService.getSystemMessageByCode('REASSIGN');

      // "new report created" added
      if (msgTemplateCreate) {
        addNarrativeEntry(msgTemplateCreate, true);
      }

      // "COR Routed To..." message added
      if (msgTemplateReassign) {
        addNarrativeEntry(
          msgTemplateReassign.replace('%1', this.routedToSelection),
          true
        );
      }
      this.previousRoutedTo = this.routedToSelection;

      // show the duplicate and close COR button
      this.basicInfoComponent.isDupCloseCorButtonsVisible = true;
    }

    const msgTemplateChange =
      this.lookupService.getSystemMessageByCode('CHANGE');

    if (!isNewReport) {
      if (this.previousRoutedTo !== this.routedToSelection) {
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

      // Update - when Breakdown Type is changed
      if (this.prevBreakDownTypeKey !== this.breakDownTypeKey) {
        if (msgTemplateChange) {
          addNarrativeEntry(
            msgTemplateChange
              .replace('%1', 'Breakdown Type')
              .replace('%2', this.breakDownTypeKey)
              .replace('%3', this.prevBreakDownTypeKey),
            true
          );
        }
        this.prevBreakDownTypeKey = this.breakDownTypeKey;
      }

      // adding break down type comment
      if (this.breakDownCommentText) {
        addNarrativeEntry(this.breakDownCommentText, true);
      }
    }

    // user's failure comment added
    if (this.failureCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(now),
        time: this.basicInfoComponent.formatTime(now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.failureCommentText.trim(),
        type: 'failure',
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

    // To Do: need API call
    

    this.basicInfoComponent.setStatusTo('Create');

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
  updateRoutedToSelection(newSelection: string) {
    this.routedToSelection = newSelection;
  }

  updateStatusID(newStatusID: number) {
    this.statusID = newStatusID;
  }

  // finding fleet type name according to the fleet type key
  getFleetTypeText(value: string): string {
    const findFleetType = this.breakDownTypeList.find(
      (type) => type.fleetTypeKey === Number(value)
    );
    return findFleetType ? findFleetType.displayName : 'Unknown';
  }

  // find the key to send API
  getFleetTypeKey(displayName: string): number | null {
    const findFleetType = this.breakDownTypeList.find(
      (type) => type.displayName === displayName
    );
    return findFleetType ? findFleetType.fleetTypeKey : null;
  }
}

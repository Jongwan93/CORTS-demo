// basic-information.component.ts

import {
  Component,
  Input,
  Output,
  OnInit,
  inject,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { LookupService } from '../services/lookup.service';
import { CorStateService } from '../services/corStatus.service';
import { DisableIfClosed } from '../services/disable.service';

@Component({
  selector: 'app-basic-information',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableIfClosed],
  templateUrl: './basic-information.component.html',
  styleUrls: ['./basic-information.component.css'],
})
export class BasicInformationComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private lookupService = inject(LookupService);
  private corStatusService = inject(CorStateService);

  @Input() corNumber: string = 'New'; // cor#
  @Output() corNumberChange = new EventEmitter<string>();

  @Input() status: string = '';
  @Output() statusChange = new EventEmitter<string>();

  @Input() routedToSelection: string = '';
  @Output() routedToSelectionChangeDetect = new EventEmitter<string>();

  @Input() statusID: number = 0;
  @Output() statusIDChange = new EventEmitter<number>();

  corTypeKey: number = 0;
  corType: string = '';
  userName: string = '';
  groupName: string = '';

  groupCode: string = ''; // user's functionality group code
  groupCodeID: number = 0; // group code ID for create incident report API request body
  routedToGroup: string = ''; // Routed To group full name
  isAssignedtoGroup: boolean = true; // Routed To. group or person?
  previousRoutedTo: string = ''; // if user chose new Routed To

  incidentCallNumber: string = ''; // Incident (Call) #

  isDupCloseCorButtonsVisible: boolean = false; // default not showing buttons

  isCorClosed: boolean = false;

  createdDate: string = 'New';
  createdTime: string = '';

  ngOnInit() {
    this.userName = this.authService.getUserName(); // 29030, CASSONDRA FOERTER
    this.groupCode = this.authService.getGroupCode(); // fetch group code (COM)
    this.groupName = this.authService.getGroupName(); // COM Officer

    // getting user name from authService
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.personnel.name || 'Unknown';
    }

    // Depend on the cor Type, it will set the COR Type value.
    // if incident-report, corType = incident
    this.route.paramMap.subscribe((params) => {
      const key = params.get('corTypeKey');
      if (key) {
        this.corTypeKey = parseInt(key, 10);
        this.fetchCorTypeDisplayName();
      }
    });

    // find Route To group name
    const userGroups = localStorage.getItem('lookup-user-group');
    if (userGroups) {
      const parsedUserGroups = JSON.parse(userGroups);
      // loop through the userGroup object
      const matchedGroup = parsedUserGroups.data.find(
        (group: any) => group.code === this.groupCode
      );

      if (matchedGroup) {
        this.routedToGroup = matchedGroup.displayName;
        this.groupCodeID = matchedGroup.userGroupKey;
      }
    }

    // set Status to "Initial Assignment"
    this.setStatusTo('Initial Assignment');

    // update initial time
    if (this.status == 'Initial Assignment') {
      this.setCurrentTime();
    }
  } // ===============end of ngOnInit============

  ngOnChanges(changes: SimpleChanges) {}

  // change status to CREATE when save change button is clicked
  setStatusTo(newStatus: string) {
    const CORstatus = localStorage.getItem('lookup-corts-status');

    if (CORstatus) {
      const parsedStatus = JSON.parse(CORstatus);
      const foundStatus = parsedStatus.data.find(
        (status: any) => status.displayName === newStatus
      );

      if (foundStatus) {
        this.status = foundStatus.displayName;
        this.statusID = foundStatus.cORStatusKey;
        console.log('StatusID: ', this.statusID);
        this.statusIDChange.emit(this.statusID);
      }
    }
  }

  // Fetches the display name of the COR Type based on the stored corTypeKey
  fetchCorTypeDisplayName() {
    const cortTypeData = localStorage.getItem('lookup-cort-type');
    if (cortTypeData) {
      const parsedData = JSON.parse(cortTypeData);
      const matchedCORType = parsedData.data.find(
        (type: any) => type.cORTypeKey === this.corTypeKey // cORTypeKey not a misspell
      );

      if (matchedCORType) {
        this.corType = matchedCORType.displayName;
      }
    }
  }

  // Routed To selection detecting &&
  // find if report is assigned to group
  routedToSelectionChange(event: Event): void {
    const selection = event.target as HTMLSelectElement;
    this.routedToSelection = selection.value;
    if (this.corNumber === 'New') {
      this.previousRoutedTo = this.routedToSelection;
    }

    const userGroups = localStorage.getItem('lookup-user-group');
    if (userGroups) {
      const parsedUserGroups = JSON.parse(userGroups);
      // loop through the userGroup object
      const matchedGroup = parsedUserGroups.data.find(
        (group: any) => group.displayName === this.routedToSelection
      );
      if (matchedGroup) {
        this.isAssignedtoGroup = true;
      } else {
        this.isAssignedtoGroup = false;
      }
    }
  }

  // detects routedTo change and execute routedToSelectinoChange()
  routedToSelectionChangeHandler(event: Event) {
    this.routedToSelectionChange(event);
    const selection = (event.target as HTMLSelectElement).value;
    this.routedToSelection = selection;
    this.routedToSelectionChangeDetect.emit(this.routedToSelection);
  }

  // related COR: add new COR logic
  relatedCORsInput: string = '';
  relatedCORs: string[] = []; // List of related CORs
  selectedRelatedCOR: string = '';

  addRelatedCOR(event: Event) {
    event.preventDefault();
    // event not empty, COR does not overlap
    if (
      this.relatedCORsInput &&
      !this.relatedCORs.includes(this.relatedCORsInput)
    ) {
      // often, push is not recognized by Angular
      // better to use array to trigger change detection
      this.relatedCORs = [...this.relatedCORs, this.relatedCORsInput];
      this.relatedCORsInput = ''; // reset
    }
  }

  // related COR: remove COR logic
  removeSelectedCOR(event: Event) {
    event.preventDefault();
    if (this.selectedRelatedCOR) {
      this.relatedCORs = this.relatedCORs.filter(
        (cor) => cor !== this.selectedRelatedCOR
      );
      this.selectedRelatedCOR = '';
    }
  }

  // close the COR report
  @Output() closeCorMessage = new EventEmitter<string>();
  closeCOR() {
    const msgTemplateClose =
      this.lookupService.getSystemMessageByCode('CLOSED');

    this.setStatusTo('Closed');
    this.statusIDChange.emit(this.statusID);
    if (msgTemplateClose) {
      this.closeCorMessage.emit(msgTemplateClose);
    }

    this.corStatusService.setDisabledState(true);
  } // +++++++++ end of closeCOR function +++++++++++

  @Output() dupCorMessage = new EventEmitter<string>();
  dupCOR() {
    const msgTemplateDup =
      this.lookupService.getSystemMessageByCode('DUPLICATED');
    if (msgTemplateDup) {
      this.dupCorMessage.emit(msgTemplateDup);
    }
  }

  //---------------------------UTILITY------------------------------
  fullDateTime: string = 'New'; // Current date + time
  dueDate: string = 'New'; // Due date (two days after)

  setCurrentTime() {
    const now = new Date();
    this.fullDateTime = now.toISOString();
    this.createdDate = this.formatDate(now);
    this.createdTime = this.formatTime(now);

    const dueDateCalc = new Date(now);
    dueDateCalc.setDate(dueDateCalc.getDate() + 2);
    this.dueDate = this.formatDate(dueDateCalc);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  // (MM/DD/YYYY HH:mm:ss)
  formatDisplayDateTime(isoString: string): string {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  }

  getLabelText(): string {
    return this.corType === 'ALS/VSA'
      ? 'Incident (Call) #*'
      : 'Incident (Call) #';
  }
}
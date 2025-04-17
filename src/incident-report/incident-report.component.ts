import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgFor, CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ReportService } from '../app/services/report.service';
import { validateRequiredFields } from '../app/utils/validateFields';
import { LookupService } from '../app/services/lookup.service';
import { HeaderComponent } from '../app/header/header.component';
import { NarrativeComponent } from '../app/narrative/narrative.component';
import { BasicInformationComponent } from '../app/basic-information/basic-information.component';
// import { CorStateService } from '../app/services/corStatus.service';
import { DisableIfClosed } from '../app/services/disable.service';

@Component({
  selector: 'app-incident-report',
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
  templateUrl: './incident-report.component.html',
  styleUrls: ['./incident-report.component.css'],
})
export class IncidentReportComponent implements OnInit {
  // now you can use function in basic-information component
  @ViewChild(BasicInformationComponent)
  basicInfoComponent!: BasicInformationComponent;

  ngAfterViewInit(): void {
    this.statusID = this.basicInfoComponent.statusID;
    this.corTypeKey = this.basicInfoComponent.corTypeKey;
    this.corType = this.basicInfoComponent.corType;
  }

  constructor() {
    this.titleService.setTitle('CORTS - COR Entry (New)'); // browser title name
  }

  // services
  private titleService = inject(Title);
  private reportService = inject(ReportService);
  private lookupService = inject(LookupService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  // private http = inject(HttpClient);

  //(DO NOT TOUCH)--------------------------------------------------------
  loginUserName: string = ''; // login ID                                |
  corNumber = 'New'; // COR#                                             |
  corTypeKey: number = 0; // COR Type Key for API                        |
  corType: string = ''; // COR Type (Display Name)                       |
  routedToSelection: string = ''; // user choice of routed to            |
  previousRoutedTo: string = ''; // if user chose new Routed To          |
  statusID: number = 0; // status translated to ID for API call          |
  //(DO NOT TOUCH)--------------------------------------------------------

  incidentTypeList: any[] = []; // to send it to html
  corMainKey: string = ''; // Primary key to find the exisitng report

  narrativesArray: any[] = []; // temp

  ngOnInit() {
    this.loginUserName = localStorage.getItem('loginUserName') || ''; // 29030

    // sent the list of incident types to drop down menu of Incident Type
    const incidentData = this.lookupService.getLookupData('incident-type');
    if (incidentData && incidentData.data) {
      this.incidentTypeList = incidentData.data;
    }

    const isDuplicated = this.route.snapshot.queryParams['isDuplicated'];
    if (isDuplicated === 'true') {
      const raw = sessionStorage.getItem('duplicated-cor-request');
      if (raw) {
        const duplicatedRequest = JSON.parse(raw);

        console.log('Duplicated create report: ', duplicatedRequest);

        duplicatedRequest.corMain.corMainKey = 0;
        duplicatedRequest.corMain.corNumber = '';
        duplicatedRequest.corMain.createDate = new Date().toISOString();
        duplicatedRequest.corMain.closedBy = '';
        duplicatedRequest.corMain.closeDate = '';
        duplicatedRequest.corMain.lastModifiedDate = new Date().toISOString();

        const originalCor = this.route.snapshot.queryParams['related'];
        if (originalCor) {
          duplicatedRequest.relatedCors = [originalCor];
        }

        duplicatedRequest.narratives = [];

        this.reportService
          .createReport(duplicatedRequest, 'incident')
          .subscribe((res) => {
            this.corMainKey = res?.corMain?.corMainKey ?? 0;
            this.corNumber = res?.corMain?.corNumber ?? 'New';
            this.incidentKey = res?.incident?.incidentKey ?? 0;

            this.incidentCommentText =
              duplicatedRequest.incidentCommentText || '';
            this.narrativeCommentText =
              duplicatedRequest.narrativeCommentText || '';

            this.populateUIFromRequestBody(duplicatedRequest);

            this.handleReportResponse(res, 'create');
          });
      }
    }
  } // ++++++ end of ngOnInit() ++++++

  // -------------------------------Basic Information---------------------------
  // Moved to Basic-information.component.ts

  // ------------------------Incident Report-----------------------------
  incidentTypeKey: string = ''; // dropdown menu
  previousIncidentTypeKey: string = ''; // to detect change
  incidentDateTime = '';
  incidentCommentText: string = ''; // incident details input

  // detect incident type change
  incidentTypeChange(newIncidentTypeKey: string) {
    this.incidentTypeKey = newIncidentTypeKey;

    // only update previousInicdnetTypeKey one time at the beginning
    if (this.corNumber === 'New') {
      this.previousIncidentTypeKey = this.incidentTypeKey;
    }
  }

  // ---------------------------------Narrative------------------------------------
  narrativeCommentText: string = ''; // narrative commnet input
  combinedEntries: any[] = [];
  isSaved: boolean = false;
  incidentKey: string = ''; // incident Key for API update request

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
        incidentKey: isUpdate ? this.incidentKey : 0,
        corKey: isUpdate ? this.corMainKey : 0,
        incidentType: this.incidentTypeKey,
        incidentDate: new Date(this.incidentDateTime).toISOString(),
        incidentDescription: this.incidentCommentText.trim(),
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

  // save changes button
  saveChanges() {
    const isValid = validateRequiredFields();

    if (!isValid) {
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

    // Update - when Incident Type is changed
    if (!isNewReport && this.previousIncidentTypeKey !== this.incidentTypeKey) {
      this.updateFields('CHANGE', [
        'Incident Type',
        this.getIncidentTypeText(this.incidentTypeKey),
        this.getIncidentTypeText(this.previousIncidentTypeKey),
      ]);
      this.previousIncidentTypeKey = this.incidentTypeKey;
    }

    // user's incident comment added
    if (this.incidentCommentText.trim()) {
      this.combinedEntries.unshift({
        date: this.basicInfoComponent.formatDate(this.now),
        time: this.basicInfoComponent.formatTime(this.now),
        user: this.basicInfoComponent.userName.split(', ')[0] || 'Unknown',
        comment: this.incidentCommentText.trim(),
        type: 'incident',
      });
    }

    // user's narrative comment added
    let narrativeCommentValue = '';
    if (this.narrativeCommentText.trim()) {
      this.addNarrativeEntry(this.narrativeCommentText.trim(), false);
      narrativeCommentValue = this.narrativeCommentText.trim();
    }

    //-----------------------create incident API call-------------------------
    this.submitReport();

    this.isSaved = true;
  } // --------- end of save changes function

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
      .updateIncident(updateRequestBody, 'incident-report')
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

  // handler for duplicate COR button
  handleDupCor(message: string) {
    const originalCorNumber = this.corNumber;
    const createRequestBody = this.buildRequestBody('create');

    createRequestBody.incidentCommentText = this.incidentCommentText;
    createRequestBody.narrativeCommentText = this.narrativeCommentText;

    sessionStorage.setItem(
      'duplicated-cor-request',
      JSON.stringify(createRequestBody)
    );

    const url = `/incident-report?corTypeKey=${this.corTypeKey}&isDuplicated=true`;
    window.open(url, '_blank');
  }

  // finding incident type name according to the incident type key
  getIncidentTypeText(value: string): string {
    const findIncidentType = this.incidentTypeList.find(
      (type) => type.incidentTypeKey === Number(value)
    );
    return findIncidentType ? findIncidentType.displayName : 'Unknown';
  }

  // find the key to send API
  getIncidentTypeKey(displayName: string): number | null {
    const findIncidentType = this.incidentTypeList.find(
      (type) => type.displayName === displayName
    );
    return findIncidentType ? findIncidentType.incidentTypeKey : null;
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

    this.incidentCommentText = '';
    this.narrativeCommentText = '';

    const messages = {
      create: 'Incident Report Successfully Created',
      update: 'Incident Report Successfully Updated',
      close: 'Incident Report Successfully Closed',
    };

    alert(messages[mode]);
  }

  // when API request failed (test purpose)
  private handleReportError(mode: 'create' | 'update' | 'close', error: any) {
    console.error('Error:', error);

    const messages = {
      create: 'Failed to Create Incident Report',
      update: 'Failed to Update Incident Report',
      close: 'Failed to Close Incident Report',
    };

    alert(messages[mode]);
  }

  // API call
  private submitReport() {
    if (this.corNumber === 'New') {
      const createRequestBody = this.buildRequestBody('create');
      console.log('Creatd Request Body: ', createRequestBody);
      this.reportService
        .createReport(createRequestBody, 'incident-report')
        .subscribe(
          (response) => {
            console.log('create response body: ', response); // print response
            this.corMainKey = response?.data?.corMain?.corMainKey ?? 0;
            this.incidentKey = response?.data?.report?.incidentKey ?? 0;

            this.router.navigate(['/incident-report'], {
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
        .updateIncident(updateRequestBody, 'incident-report')
        .subscribe(
          (response) => {
            console.log('update response body: ', response); // print response
            this.handleReportResponse(response, 'update');
          },
          (error) => this.handleReportError('update', error)
        );
    }
  }

  private populateUIFromRequestBody(request: any) {
    const corMain = request.corMain;
    const incident = request.incident;

    this.routedToSelection = corMain.assignedTo;
    this.basicInfoComponent.setRoutedTo(corMain.assignedTo);

    this.incidentTypeKey = String(incident.incidentType);
    this.incidentDateTime = new Date(incident.incidentDate).toISOString();
  }
}

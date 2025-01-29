import { Routes } from '@angular/router';
import { MainpageComponent } from '../mainpage/mainpage.component';
import { QueryComponent } from '../query/query.component';
import { IncidentReportComponent } from '../incident-report/incident-report.component';
import { vsaReportComponent } from '../ALS/vsa-report/vsa-report.component';
import { caccEquipmentFailureComponent } from '../cacc-equipment-failure/cacc-equipment-failure.component';

export const routes: Routes = [
  { path: '', component: MainpageComponent },
  { path: 'query', component: QueryComponent },
  { path: 'incident-report', component: IncidentReportComponent },
  { path: 'vsa-report', component: vsaReportComponent },
  { path: 'cacc-equipment-failure', component: caccEquipmentFailureComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

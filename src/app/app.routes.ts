import { Routes } from '@angular/router';
import { MainpageComponent } from '../mainpage/mainpage.component';
import { QueryComponent } from '../query/query.component';
import { IncidentReportComponent } from '../incident-report/incident-report.component';
import { vsaReportComponent } from '../ALS/vsa-report/vsa-report.component';
import { caccEquipmentFailureComponent } from '../cacc-equipment-failure/cacc-equipment-failure.component';
import { ComplaintReportComponent } from '../complaint-report/complaint-report.component';
import { FleetEquipmentReportComponent } from '../fleet-equipment-report/fleet-equipment-report.component';
import { LoginComponent } from '../login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, data: {title: 'CORTS - Login'} },
  { path: 'mainpage', component: MainpageComponent, data: {title: 'CORTS - Start Page'} },
  { path: 'query', component: QueryComponent, data: {title: 'CORTS - Query'} },
  { path: 'incident-report', component: IncidentReportComponent, data: {title: 'CORTS - COR entry (new)'} },
  { path: 'vsa-report', component: vsaReportComponent, data: {title: 'CORTS - COR entry (new)'} },
  { path: 'cacc-equipment-failure', component: caccEquipmentFailureComponent, data: {title: 'CORTS - COR entry (new)'} },
  { path: 'complaint-report', component: ComplaintReportComponent, data: {title: 'CORTS - COR entry (new)'} },
  { path: 'fleet-equipment-report', component: FleetEquipmentReportComponent, data: {title: 'CORTS - COR entry (new)'} },
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];

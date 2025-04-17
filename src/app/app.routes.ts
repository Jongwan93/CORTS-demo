import { Routes } from '@angular/router';
import { MainpageComponent } from '../mainpage/mainpage.component';
import { QueryComponent } from '../query/query.component';
import { IncidentReportComponent } from '../incident-report/incident-report.component';
import { vsaReportComponent } from '../vsa-report/vsa-report.component';
import { caccEquipmentFailureComponent } from '../cacc-equipment-failure/cacc-equipment-failure.component';
import { ComplaintReportComponent } from '../complaint-report/complaint-report.component';
import { FleetEquipmentReportComponent } from '../fleet-equipment-report/fleet-equipment-report.component';
import { LoginComponent } from '../login/login.component';
import { LogoutComponent } from '../logout/logout.component';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, data: {title: 'CORTS - Login'} },
  { path: 'mainpage', component: MainpageComponent,  canActivate: [AuthGuard], data: {title: 'CORTS - Start Page'} },
  { path: 'query', component: QueryComponent,  canActivate: [AuthGuard], data: {title: 'CORTS - Query'} },
  { path: 'incident-report', component: IncidentReportComponent,  canActivate: [AuthGuard], data: {title: 'CORTS - COR entry (new)'} },
  { path: 'vsa-report', component: vsaReportComponent,  canActivate: [AuthGuard], data: {title: 'CORTS - COR entry (new)'} },
  { path: 'cacc-equipment-failure', component: caccEquipmentFailureComponent,  canActivate: [AuthGuard], data: {title: 'CORTS - COR entry (new)'} },
  { path: 'complaint-inquiry', component: ComplaintReportComponent,  canActivate: [AuthGuard], data: {title: 'CORTS - COR entry (new)'} },
  { path: 'fleet-equipment-report', component: FleetEquipmentReportComponent,  canActivate: [AuthGuard], data: {title: 'CORTS - COR entry (new)'} },
  { path: 'logout', component: LogoutComponent,  canActivate: [AuthGuard], data: {title: 'you are logged out!'}},
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];

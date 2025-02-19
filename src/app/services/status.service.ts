import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  getStatusDisplayName(statuses: any[], key: number): string {
    const status = statuses.find(s => s.cORStatusKey === key);
    return status ? status.displayName : 'Unknown';
  }
}

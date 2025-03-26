import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LookupService {
  private baseURL = '/api/reports/lookup';
  private lookupEndpoints = [
    'complaint-type',
    'cort-type',
    'corts-status',
    'dnr-status',
    'employees',
    'equipment-location',
    'equipment-type',
    'incident-type',
    'system-messages',
    'user-group',
    'breakdown-type',
  ];

  constructor(private http: HttpClient) {}

  async fetchAndStoreLookups(): Promise<void> {
    const token = localStorage.getItem('login-token');
    if (!token) {
      console.error('Login Token missing');
      return;
    }

    const headers = new HttpHeaders({
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    });
    
    const requests = this.lookupEndpoints.map((endpoint) => {
      const url = `${this.baseURL}/${endpoint}`;
      return this.http.get(url, { headers }).pipe(
        map((data) => {
          localStorage.setItem(`lookup-${endpoint}`, JSON.stringify(data));
          console.log(`${endpoint} SAVED!`);
          return true;
        })
      );
    });

    try {
      await firstValueFrom(forkJoin(requests));
    } catch (err) {
      console.error('One or more lookup requests failed:', err);
      throw err;
    }
  }

  getLookupData(endpoint: string) {
    const data = localStorage.getItem(`lookup-${endpoint}`);
    return data ? JSON.parse(data) : null;
  }

  getSystemMessageByCode(messageCode: string): string | null {
    const data = this.getLookupData('system-messages');
    if (data && data.data) {
      const messageObj = data.data.find((msg: any) => msg.messageCode === messageCode);
      return messageObj ? messageObj.message : null;
    }
    return null;
  }
}

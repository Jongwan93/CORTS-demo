import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class LookupService {
  private baseURL = '/api/reports/lookup'; // common url
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
  ];

  constructor(private http: HttpClient) {}
  fetchAndStoreLookups() {
    const token = localStorage.getItem('login-token');
    if (!token) {
      console.error('Login Token missing');
      return;
    }

    const headers = new HttpHeaders({
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    });

    this.lookupEndpoints.forEach((endpoint) => {
      const url = `${this.baseURL}/${endpoint}`; // entire API URL created
      this.http.get(url, { headers }).subscribe({
        next: (data) => {
          localStorage.setItem(`lookup-${endpoint}`, JSON.stringify(data));
          console.log(`${endpoint} SAVED!`);
        },
        error: (err) => {
          console.error(`${endpoint} FAILED...:`, err);
        },
      });
    });
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

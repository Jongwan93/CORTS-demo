import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private incidentResponse: any = null;
  private apiBaseUrl = '/api/reports/incident-report'; // basic API Url

  constructor(private http: HttpClient) {}

  // get the token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('login-token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // post
  createIncident(createRequestBody: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/create`, createRequestBody, {
      headers: this.getHeaders(),
    });
  }

  // update incident
  updateIncident(updateRequestBody: any): Observable<any> {
    console.log('Update Request Body:', updateRequestBody);
    return this.http.post(`${this.apiBaseUrl}/update`, updateRequestBody, {
      headers: this.getHeaders(),
    });
  }

  // store the response
  setIncidentResponse(response: any) {
    this.incidentResponse = response;
    localStorage.setItem('incidentReport', JSON.stringify(response));
  }

  getIncidentResponse() {
    const storedData = localStorage.getItem('incidentReport');

    return storedData ? JSON.parse(storedData) : this.incidentResponse;
  }

  getTimestamp(): string {
    return this.getIncidentResponse()?.timestamp || '';
  }

  getCorNumber(): string {
    return this.getIncidentResponse()?.data.corMain?.corNumber || 'New';
  }

  getcorMainKey(): string {
    return this.getIncidentResponse()?.data.corMain?.corMainKey || '';
  }
}

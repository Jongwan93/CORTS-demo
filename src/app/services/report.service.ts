import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private incidentResponse: any = null;
  private apiBaseUrl = '/api/reports'; // basic API Url

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
  createReport(createRequestBody: any, reportType: string): Observable<any> {
    const url = `${this.apiBaseUrl}/${reportType}/create`;
    return this.http.post(url, createRequestBody, {
      headers: this.getHeaders(),
    });
  }

  // update incident
  updateIncident(updateRequestBody: any, reportType: string): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/${reportType}/update`, updateRequestBody, {
      headers: this.getHeaders(),
    });
  }

  // search incident
  searchIncident(updateRequestBody: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/search`, updateRequestBody, {
      headers: this.getHeaders(),
    });
  }

  // search report /get
  getIncidentDetailsByCorMainKey(corMainKey: number): Observable<any> {
    const url = `${this.apiBaseUrl}/details/${corMainKey}`;
    return this.http.get(url, {
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

  getIncidentByCorNumber(corNumber: string) {
    return this.http.get(`/api/incidents/${corNumber}`);
  }
}

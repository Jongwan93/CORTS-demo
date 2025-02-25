import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private incidentResponse: any = null;

  setIncidentResponse(response: any) {
    this.incidentResponse = response;
  }

  getIncidentResponse() {
    return this.incidentResponse;
  }

  getTimestamp(): string {
    console.log("this is:" + this.incidentResponse.timestamp)
    return this.incidentResponse?.timestamp || '';
  }

  getCorNumber(): string{
    return this.incidentResponse?.data.corMain?.corNumber || 'New';
  }
}

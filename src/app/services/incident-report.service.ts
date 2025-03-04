import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private incidentResponse: any = null;

  setIncidentResponse(response: any) {
    this.incidentResponse = response;
    console.log("response: " + JSON.stringify(response))
  }

  getIncidentResponse() {
    return this.incidentResponse;
  }

  getTimestamp(): string {
    return this.incidentResponse?.timestamp || '';
  }

  getCorNumber(): string{
    return this.incidentResponse?.data.corMain?.corNumber || 'New';
  }

  getcorMainKey(): string{
    return this.incidentResponse?.data.corMain?.corMainKey || '';
  }
}

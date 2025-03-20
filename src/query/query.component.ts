import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-query',
  standalone: true,
  imports: [RouterModule, FormsModule, NgFor, CommonModule],
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.css'],
})
export class QueryComponent implements OnInit {
  cortTypes: any[] = [];
  employees: any[] = [];
  statuses: any[] = [];
  routes: any[] = [];
  groupedRoutes: any = {};

  constructor(private titleService: Title, private http: HttpClient) {
    this.titleService.setTitle('CORTS - Query');
  }

  ngOnInit() {
    this.displayCortsType();
    this.displayCreator();
    this.displayStatus();
    this.displayRoutes();
  }

  // display corts type
  displayCortsType() {
    const storedData = localStorage.getItem('lookup-cort-type');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (Array.isArray(parsedData.data)) {
        this.cortTypes = parsedData.data.map((item: any) => ({
          cORTypeKey: item.cORTypeKey,
          code: item.code,
          displayName: item.displayName,
          valid: item.valid,
        }));
      }
    }
  }

  // display creator. Employees
  displayCreator() {
    const storedData = localStorage.getItem('lookup-employees');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (Array.isArray(parsedData.data)) {
        this.employees = parsedData.data
          .map(
            (item: { // specify the types for sorting
              code: string;
              empId: string;
              empName: string;
              empRecId: number;
              fgRecId: number;
              functionalityGroup: string;
            }) => ({ // assign the values
              code: item.code,
              empId: item.empId,
              empName: item.empName,
              empRecId: item.empRecId,
              fgRecId: item.fgRecId,
              functionalityGroup: item.functionalityGroup,
            })
          )
          // sort the creator list ascending order
          .sort((a: { empName: string }, b: { empName: string }) =>
            a.empName.localeCompare(b.empName)
          );
      }
    }
  }

  // display status
  displayStatus() {
    const storedData = localStorage.getItem('lookup-corts-status');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (Array.isArray(parsedData.data)) {
        this.statuses = parsedData.data.map((item: any) => ({
          cORStatusKey: item.cORStatusKey,
          code: item.code,
          displayName: item.displayName,
          valid: item.valid,
        }));
      }
    }
  }

  // fetch routed to options for employee category
  displayRoutes() {
    const storedData = localStorage.getItem('lookup-user-group');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (Array.isArray(parsedData.data)) {
        this.routes = parsedData.data.map((items: any) => ({
          code: items.code,
          displayName: items.displayName,
          rank: items.rank,
          userGroupKey: items.userGroupKey,
        }));
      }
    }
    this.groupEmployeesByRoute(); // need display Routes info so executed afterwards
  }

  // categorize the employees
  groupEmployeesByRoute() {
    this.groupedRoutes = {};

    this.groupedRoutes = this.employees.filter((emp) => emp.code === 'COM');

    this.routes.forEach((route) => {
      this.groupedRoutes[route.displayName] = this.employees.filter(
        (emp) => emp.code === route.code
      );
    });
  }

  EnableDate(asObjectID: string) {
    const isChecked = (event?.target as HTMLInputElement).checked;
    document
      .getElementById(`${asObjectID}From`)
      ?.toggleAttribute('disabled', isChecked);
    document
      .getElementById(`${asObjectID}To`)
      ?.toggleAttribute('disabled', isChecked);
  }

  SetDirection(direction: string) {
    console.log(`Direction: ${direction}`);
  }
}

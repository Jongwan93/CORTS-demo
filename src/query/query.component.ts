import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
// import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../app/header/header.component';
import { ReportService } from '../app/services/report.service';

@Component({
  selector: 'app-query',
  standalone: true,
  imports: [RouterModule, FormsModule, NgFor, CommonModule, HeaderComponent],
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.css'],
})
export class QueryComponent implements OnInit {
  constructor() {
    this.titleService.setTitle('CORTS - Query');
  }

  private titleService = inject(Title);
  private route = inject(ActivatedRoute);
  private reportService = inject(ReportService);

  cortTypes: any[] = [];
  employees: any[] = [];
  statuses: any[] = [];
  routes: any[] = [];
  groupedRoutes: any = {};

  data: any[] = [];
  sortedColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  dateCreatedFrom = '';
  dateCreatedTo = '';
  dateDue = '';
  queryCorNumber: string = '';
  queryIncidentCallNumber: string = '';
  queryCreator: string = '';
  queryCorType: string = '';
  queryCorStatus: string = '';
  queryRoutedTo: string = '';
  searchText: string = '';

  isAllDatesCreated: boolean = false;
  isAllDatesDueDate: boolean = false;

  ngOnInit() {
    this.displayCortsType();
    this.displayCreator();
    this.displayStatus();
    this.displayRoutes();

    const source = this.route.snapshot.queryParams['source'];
    if (source === 'mainpage') {
      const raw = localStorage.getItem('search-results');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.data = parsed.map((item: any) => ({
              dateTime: this.formatDate(item.createDate),
              type: this.getCorTypeName(item.corTypeFk),
              incident: item.cadIncidentNum || 'N/A',
              cor: item.corNumber,
              creator: item.createdBy,
              routedTo: item.assignedTo || '—',
              dateDue: this.formatDate(item.dueDate),
              status: this.getStatusName(item.corStatusFk),
            }));
          }
        } catch (e) {
          console.error('Failed to parse search-results:', e);
        }
      }
    }
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
            (item: {
              // specify the types for sorting
              code: string;
              empId: string;
              empName: string;
              empRecId: number;
              fgRecId: number;
              functionalityGroup: string;
            }) => ({
              // assign the values
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

  // =================================Search Result==================================

  currentPage = 1;
  itemsPerPage = 20;
  itemsPerPageOptions = [20, 50, 100];

  get currentPageData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.data.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.data.length / this.itemsPerPage);
  }

  // update page number according to next, prev button
  SetDirection(direction: string) {
    if (direction === 'Next' && this.currentPage < this.totalPages) {
      this.currentPage++;
    } else if (direction === 'Prev' && this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // change number of items displayed per page
  onItemsPerPageChange(event: any) {
    this.itemsPerPage = +event.target.value;
    this.currentPage = 1;
  }

  searchCORs() {
    this.currentPage = 1;

    if (this.isAllDatesCreated) {
      this.dateCreatedFrom = '';
      this.dateCreatedTo = '';
    }

    if (this.isAllDatesDueDate) {
      this.dateDue = '';
    }

    this.submitSearch();
  }

  //================================UTILITY=========================================

  // sorting algorithm
  sortTable(column: string) {
    if (this.sortedColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortedColumn = column;
      this.sortDirection = 'asc';
    }

    this.data.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (column.toLowerCase().includes('date')) {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  getCorTypeName(corTypeKey: number): string {
    const match = this.cortTypes.find((t) => t.cORTypeKey === corTypeKey);
    return match?.displayName || 'Unknown';
  }

  getStatusName(statusKey: number): string {
    const match = this.statuses.find((s) => s.cORStatusKey === statusKey);
    return match?.displayName || 'Unknown';
  }

  // API call
  private submitSearch() {
    const searchCorBody = {
      corNumber: this.queryCorNumber,
      cadIncidentNum: this.queryIncidentCallNumber,
      createdBy: this.queryCreator,
      routedTo: this.queryRoutedTo,
      corStatus: this.queryCorStatus,
      corType: this.queryCorType,
      dueDate: this.dateDue,
      createDateFrom: this.dateCreatedFrom,
      createDateTo: this.dateCreatedTo,
      text: this.searchText,
    };

    this.reportService.searchReport(searchCorBody).subscribe({
      next: (res) => {
        console.log('Search result:', res);
        const rawResults = res?.data || [];

        this.data = rawResults.map((item: any) => ({
          dateTime: this.formatDate(item.createDate),
          type: this.getCorTypeName(item.corTypeFk),
          incident: item.cadIncidentNum || 'N/A',
          cor: item.corNumber,
          creator: item.createdBy,
          routedTo: item.assignedTo || '—',
          dateDue: this.formatDate(item.dueDate),
          status: this.getStatusName(item.corStatusFk),
        }));

        localStorage.setItem('search-results', JSON.stringify(rawResults));
      },
      error: (err) => {
        console.error('Search failed:', err);
      },
    });
  }
}

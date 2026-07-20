import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import * as XLSX from 'xlsx';

interface SchoolDivision {
  id: number;
  schoolDivision: string;
}

interface MouCategory {
  id: number;
  CategoryName: string;
}

@Component({
  selector: 'app-mou-records-table',
  templateUrl: './mou-records-table.component.html',
  styleUrl: './mou-records-table.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, MatPaginatorModule, NgxDatatableModule]
})
export class MouRecordsTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() mouDocuments: any[] = [];
  @Input() allSchoolDivisions: SchoolDivision[] = [];
  @Input() allMouCategories: MouCategory[] = [];
  @Input() showFilters: boolean = true;
  @Input() exportEnabled: boolean = true;
  @Input() isLoading: boolean = false;

  @Output() onRenewClick = new EventEmitter<any>();
  @Output() onHistoryClick = new EventEmitter<any>();
  @Output() onDownloadFile = new EventEmitter<string>();

  @ViewChild('scrollTopWrapper') scrollTopWrapper!: ElementRef;
  @ViewChild('mouTable') mouTable!: any;

  statusFilter: string = 'all';
  searchQuery: string = '';
  selectedSchoolDivision: any = '0';
  SelectedMouCategory: any = null;

  filteredMouDocumentsData: any[] = [];
  pagedMouDocumentsData: any[] = [];
  recordsPerPage: number = 5;
  currentPage: number = 1;
  tableWidth: number = 0;
  datatableBodyEl: HTMLElement | null = null;
  private resizeObserver!: ResizeObserver;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateTableWidth(), 500);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mouDocuments']) {
      this.applyFilters();
      setTimeout(() => this.updateTableWidth(), 500);
    }
  }

  initScrollSync(): void {
    if (this.mouTable && this.mouTable.element) {
      this.datatableBodyEl = this.mouTable.element.querySelector('.datatable-body');
      if (this.datatableBodyEl) {
        this.datatableBodyEl.addEventListener('scroll', (event: any) => this.onTableScroll(event));
        
        if (this.resizeObserver) {
          this.resizeObserver.disconnect();
        }
        this.resizeObserver = new ResizeObserver(() => {
          if (this.datatableBodyEl) {
            this.tableWidth = this.datatableBodyEl.scrollWidth;
            this.cdr.detectChanges();
          }
        });
        this.resizeObserver.observe(this.datatableBodyEl);
      }
    }
  }

  updateTableWidth(): void {
    if (!this.datatableBodyEl) {
      this.initScrollSync();
    }
    if (this.datatableBodyEl) {
      this.tableWidth = this.datatableBodyEl.scrollWidth;
      this.cdr.detectChanges();
    }
  }

  // Double horizontal scroll synchronizers
  onTopScroll(event: any): void {
    const topScroll = event.target.scrollLeft;
    if (this.datatableBodyEl) {
      if (this.datatableBodyEl.scrollLeft !== topScroll) {
        this.datatableBodyEl.scrollLeft = topScroll;
      }
    }
  }

  onTableScroll(event: any): void {
    const tableScroll = event.target.scrollLeft;
    if (this.scrollTopWrapper && this.scrollTopWrapper.nativeElement) {
      if (this.scrollTopWrapper.nativeElement.scrollLeft !== tableScroll) {
        this.scrollTopWrapper.nativeElement.scrollLeft = tableScroll;
      }
    }
  }

  onStatusChange(event: any): void {
    this.applyFilters();
  }

  onSchoolDivisionChange(event: any): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.mouDocuments];

    // Status Filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (this.statusFilter) {
          case 'active':
            return item.mouStatus === 'Active';
          case 'expired':
            return item.mouStatus === 'Expired' && (item.renewalCount == null || Number(item.renewalCount) === 0);
          case 'renewed':
            return item.renewalCount != null && Number(item.renewalCount) > 0;
          default:
            return true;
        }
      });
    }

    // Category Filter
    if (this.SelectedMouCategory && this.SelectedMouCategory !== 'All') {
      const categoryName = typeof this.SelectedMouCategory === 'string'
        ? this.SelectedMouCategory
        : this.SelectedMouCategory.CategoryName;

      if (categoryName) {
        filtered = filtered.filter(item =>
          String(item.mouCategory ?? '').toLowerCase() === categoryName.toLowerCase()
        );
      }
    }

    // School Division Filter
    if (this.selectedSchoolDivision && this.selectedSchoolDivision !== '0') {
      filtered = filtered.filter(item => {
        if (!item.schoolDivisionInvolved) return false;
        return item.schoolDivisionInvolved
          .split(',')
          .map((id: string) => id.trim())
          .includes(this.selectedSchoolDivision.toString());
      });
    }

    // Search Filter
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(item =>
        Object.entries(item).some(([key, value]) => {
          if (value == null) return false;
          if (key === 'id') {
            const id = Number(value);
            return !isNaN(id) && (id.toString().includes(query) || `mou/${id}`.includes(query));
          }
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    this.filteredMouDocumentsData = filtered;
    this.currentPage = 1;
    this.updatePagedData();
    setTimeout(() => this.updateTableWidth(), 100);
  }

  getActiveCount(): number {
    return this.mouDocuments.filter(item => item.mouStatus === 'Active').length;
  }

  getExpiredCount(): number {
    return this.mouDocuments.filter(item => item.mouStatus === 'Expired').length;
  }

  getRenewedCount(): number {
    return this.mouDocuments.filter(item => item.renewalCount > 0 || (item.renewalCount != null && item.renewalCount !== '0' && item.renewalCount !== 'null')).length;
  }

  getDivisionNameById(id: any): string {
    const idStr = String(id).trim();
    const division = this.allSchoolDivisions.find(school => String(school.id) === idStr);
    return division ? division.schoolDivision : `ID ${idStr} not found`;
  }

  getDivisionNamesByIdss(ids: number[]): string {
    return ids.map(id => this.getDivisionNameById(id)).join(', ');
  }

  updatePagedData(): void {
    const startIndex = (this.currentPage - 1) * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    this.pagedMouDocumentsData = this.filteredMouDocumentsData.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.recordsPerPage = event.pageSize;
    this.updatePagedData();
  }

  exportToExcel(): void {
    const fileName = 'Mou_Document_report.xlsx';
    const exportedData = this.mouDocuments.map(item => ({
      NewMouid: item.newMouId ?? 'Disapproved',
      OldMOUId: "MOU/" + (item.id ?? 'N/A'),
      'Mou Partner Name': item.mouPartnerName ?? 'N/A',
      'Mou Start Date': item.mouStartDate ?? 'N/A',
      'Mou End Date': item.mouEndDate ?? 'N/A',
      'Mou Status': item.mouStatus ?? 'N/A',
      'SPOC Person Name (Mou Partner Organisation)': item.spocName ?? 'N/A',
      'SPOC Person Email (Mou Partner Organisation)': item.spocEmailId ?? 'N/A',
      'SPOC Person Contact (Mou Partner Organisation)': item.spocContactNo === 'undefined' ? 'N/A' : item.spocContactNo ?? 'N/A',
      'MOU Uploaded By Faculty Name': item.mouUploadedByFacultyName ?? 'N/A',
      'MOU Uploaded By Faculty UID': item.createdBy ?? 'N/A',
      'School/Division Involved Id': item.schoolDivisionInvolved ?? 'N/A',
      'Name of School/Division Involved': item.schoolDivisionInvolved
        ? this.getDivisionNamesByIdss(item.schoolDivisionInvolved.split(',').map(Number))
        : 'N/A',
      'Date of MOU Uploaded at Interface': item.createdOn
        ? new Date(item.createdOn).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).replace(/ /g, '-')
        : 'N/A',
      'Approval Status': item.disapprovalReason == null && item.isApproved === 1
        ? 'Approved'
        : item.disapprovalReason?.length > 10 && item.isApproved === 0
          ? 'Disapproved'
          : 'Pending'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    const wscols = Array(18).fill({ wpx: 240 });
    ws['!cols'] = wscols;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
  }
}

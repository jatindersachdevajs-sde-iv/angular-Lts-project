// src/app/pages/mou-documents-report/components/mou-report/mou-report.component.ts
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormBuilder, FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import swal from 'sweetalert2';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { MouServices } from '../../../../services/mou-services';
import { LpuPlannerServiceService } from '../../../../services/lpu-planner-service.service';
import { AuthService } from '../../../../services/auth.service';
import { StorageService } from '../../../../services/storage.service';
// import { MouDocumentsService } from 'src/app/_services/mou-documents.service';
// import { LpuPlannerServiceService } from 'src/app/_services/lpu-planner-service.service';
// import { AuthService } from 'src/app/_services/auth.service';
// import { StorageService } from 'src/app/_services/storage.service';

import { TopScrollSyncDirective } from '../../top-scroll-sync.directive';

interface SchoolDivision { id: number; schoolDivision: string; }
interface Employee { employeeName: string; employeeCode: string; }

@Component({
  selector: 'app-mou-report',
  templateUrl: './mou-report.component.html',
  styleUrl: './mou-report.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    NgSelectModule,
    MatPaginatorModule,
    TopScrollSyncDirective
  ]
})
export class MouReportComponent implements OnInit {
  // ---- Missing property declarations ----
  uploadEnabled: boolean = false;
  EmployeeName: string = '';
  Email: string = '';
  EmployeeCode: string = '';
  Department: string = '';
  DepartmentName: string = '';
  allSchoolDivisions: any[] = [];
  CurrentSchool: any = null;
  allMouCategories: any[] = [];
  SelectedMouCategory: any = 'All';
  selectedSchoolDivision: any = '0';

  // -------- View refs / template refs --------
  @ViewChild('ChangeSchoolDivisionModal') ChangeSchoolDivisionModal!: TemplateRef<any>;
  @ViewChild('ViewRenewedMouDetailsModal') ViewRenewedMouDetailsModal!: TemplateRef<any>;
  @ViewChild('fileInput') fileInput!: ElementRef;
  ColumnMode = ColumnMode;

  // -------- Renewed MOU pagination --------
  AllRenewedMouDetails: any[] = [];
  recordsPerPage = 5;
  currentPage = 1;
  getRecordsForRenewedPage(): any[] {
    const start = (this.currentPage - 1) * this.recordsPerPage;
    return this.AllRenewedMouDetails.slice(start, start + this.recordsPerPage);
  }
  onPageChange(event: any): void { this.currentPage = event.pageIndex + 1; this.recordsPerPage = event.pageSize; }

  // -------- Form handling --------
  mouForm!: FormGroup;
  initForm(): void {
    this.mouForm = this.fb.group({
      mouId: [{ value: '', disabled: true }],
      selectedDivisions: [[], [Validators.required]],
      mouOrganisation: ['', [Validators.required, Validators.minLength(3)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      isIndefinite: [false],
      spocName: ['', [Validators.required]],
      spocEmail: ['', [Validators.required, Validators.email]],
      spocContact: [''],
      lpuSpocName: ['', [Validators.required]],
      lpuSpocUid: ['', [Validators.required]],
      lpuSpocEmail: ['', [Validators.required, Validators.email]],
      remarks: ['', [Validators.required]]
    });
  }
  isInvalid(controlName: string): boolean {
    const ctrl = this.mouForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  // -------- Employee autocomplete --------
  IdX: any;
  employeeControl = new FormControl();
  EmployeeData: Employee[] = [];
  filteredEmployeesData: Employee[] = [];
  showSuggestions = false;
  AssignedToUid: any = '';
  AssignedToUidName: any = '';
  GetEmployeeData(cb?: () => void): void {
    this.mouDocumentsService.GetEmployeeData().subscribe({
      next: resp => {
        try {
          this.EmployeeData = resp && resp.item1 && resp.item1.length ? resp.item1 : [];
        } catch (e) {
          console.error(e);
        } finally {
          if (cb) cb();
        }
      },
      error: err => {
        console.error(err);
        if (cb) cb();
      }
    });
  }
  onInput2(): void {
    const query = this.mouForm.get('lpuSpocName')?.value?.toLowerCase() ?? '';
    if (query && query.length >= 2) {
      this.filteredEmployeesData = this.EmployeeData.filter(emp =>
        emp.employeeName.toLowerCase().includes(query) || emp.employeeCode.toLowerCase().includes(query)
      ).slice(0, 10);
      this.showSuggestions = true;
    } else { this.showSuggestions = false; }
  }
  selectEmployee2(emp: Employee): void {
    this.AssignedToUid = emp.employeeCode;
    this.AssignedToUidName = emp.employeeName;
    this.mouForm.patchValue({ lpuSpocName: emp.employeeName, lpuSpocUid: emp.employeeCode });
    this.employeeControl.setValue(`${emp.employeeName} (${emp.employeeCode})`);
    this.filteredEmployeesData = [];
    this.showSuggestions = false;
    this.checkUIDValidity();
  }
  hideSuggestions(): void { setTimeout(() => this.showSuggestions = false, 200); }
  checkUIDValidity(): void { this.uploadEnabled = this.IdX !== '' && this.AssignedToUid != ''; }

  // -------- Renewal file upload --------
  renewalFile: File | null = null;
  renewalFileBase64: string | null = null;
  renewalFileName = '';
  renewalFileError = '';
  onRenewFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) { this.renewalFileError = 'Only PDF and Word documents are allowed.'; return; }
    this.renewalFile = file; this.renewalFileName = file.name; this.renewalFileError = '';
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; this.renewalFileBase64 = result.split(',')[1]; };
    reader.readAsDataURL(file);
  }

  // -------- Core state --------
  isLoginFailed = false;
  loadingIndicator = false;
  showNoDataFoundMessage = false;
  serverUrl: any;
  EmployeeDetails: any[] = [];
  MouDocumentDetails: any[] = [];
  filterText = '';
  filteredMouDocumentDetails: any[] = [];
  renewedMouDocumentDetails: any[] = [];
  Reason: any;
  searchQuery: any = '';
  statusFilter = 'all';
  approvalFilter = 'all';
  ResponsiblePerson: any = '';
  columns: any;
  mouId: any;
  newMouId: any;
  isRenewalMode = false;
  originalMouData: any = null;
  MouOrganisation: any;
  MouOrganisationPrevious: any;
  selectedSchoolDivisions: any[] = [];
  SPOCPerson: any;
  SPOCPersonEmail: any;
  isLoading = false;
  MouStartDate = '';
  MouEndDate = '';
  isIndefiniteMou = false;
  moustatus = 'Expired';

  constructor(
    private lpuPlannerService: LpuPlannerServiceService,
    private storageService: StorageService,
    private mouDocumentsService: MouServices,
    private modalService: NgbModal,
    private authService: AuthService,
    public formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { this.initForm(); }

  ngOnInit(): void {
    const stMain = document.getElementById('stMain');
    if (stMain) {
      stMain.innerHTML = '<span class="themeClr">MOU </span>Document <span class="themeClr">Approvals</span>';
    }
    const imgLogo = document.getElementById('imgLogo');
    if (imgLogo) {
      imgLogo.style.width = '164px';
    }
    this.serverUrl = 'https://files.lpu.in/umsweb/MOUDocuments/';
    const loginName = this.route.snapshot.params['loginName'];
    if (loginName) { this.isLoginFailed = false; this.getToken(loginName); }
    else { this.LoginFailed('Invalid Login Details'); }
  }

  // ---- Authentication & token ----
  getToken(id: any): void {
    console.log('getToken started for ID:', id);
    this.isLoading = true;
    this.authService.loginTemp(id).subscribe({
      next: data => {
        try {
          console.log('loginTemp successful, saving user data.');
          this.storageService.saveUser(data);
          let callsRemaining = 4;
          const decrementCalls = (source: string) => {
            callsRemaining--;
            console.log(`API Call from ${source} resolved. Remaining calls:`, callsRemaining);
            if (callsRemaining === 0) {
              console.log('All 4 initial API calls resolved. Setting isLoading = false.');
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          };
          this.GetAllUploadsDetails(() => decrementCalls('GetAllUploadsDetails'));
          this.GetEmployeeDetails(() => decrementCalls('GetEmployeeDetails'));
          this.GetEmployeeData(() => decrementCalls('GetEmployeeData'));
          this.GetMouCategories(() => decrementCalls('GetMouCategories'));
        } catch (e) {
          console.error('Error inside loginTemp next handler:', e);
          this.isLoading = false;
          this.cdr.detectChanges();
          this.LoginFailed(e);
        }
      },
      error: err => {
        console.error('loginTemp failed:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.LoginFailed(err);
      }
    });
  }

  GetMouCategories(cb?: () => void): void {
    this.mouDocumentsService.GetMouCategories().subscribe({
      next: resp => {
        try {
          if (resp && resp.item1) {
            this.allMouCategories = resp.item1.map((x: any, index: number) => ({
              id: index + 1,
              CategoryName: x.items
            }));
          } else {
            this.allMouCategories = [];
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (cb) cb();
        }
      },
      error: err => {
        console.error(err);
        if (cb) cb();
      }
    });
  }
  LoginFailed(err: any): void {
    this.isLoginFailed = true;
    this.isLoading = false;
    this.cdr.detectChanges();
    swal.fire({ title: 'Login Failed', text: 'Login details are Invalid!', icon: 'warning' });
    const el = document.getElementById('adminPage'); if (el) el.hidden = true;
  }

  // ---- Download helper ----
  onDownloadFile(remoteUrl: string): void {
    swal.fire({ title: 'Downloading...', didOpen: () => swal.showLoading() });
    this.mouDocumentsService.downloadMOUFile(remoteUrl).subscribe({
      next: (blob: Blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = remoteUrl.split('/').pop() || 'Document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        swal.close();
      },
      error: async err => {
        swal.close();
        if (err.error instanceof Blob) {
          const msg = JSON.parse(await err.error.text());
          swal.fire('Error', msg.message || 'Download failed', 'error');
        } else { swal.fire('Error', 'Could not connect to the server', 'error'); }
      }
    });
  }

  // ---- Data fetching ----
  GetEmployeeDetails(cb?: () => void): void {
    this.mouDocumentsService.GetEmployeeDetails().subscribe({
      next: resp => {
        try {
          if (resp && resp.item1 && resp.item1.length) {
            this.EmployeeDetails = resp.item1;
            const first = resp.item1[0];
            this.EmployeeName = first.employeeName; this.Email = first.email; this.EmployeeCode = first.employeeCode;
            this.Department = first.department; this.DepartmentName = first.departmentName; this.loadingIndicator = false; this.showNoDataFoundMessage = false; this.isLoginFailed = false;
          } else { this.EmployeeDetails = []; this.showNoDataFoundMessage = true; this.isLoginFailed = true; }
        } catch (e) {
          console.error(e);
        } finally {
          if (cb) cb();
        }
      }, error: err => {
        this.LoginFailed(err);
        if (cb) cb();
      }
    });
  }
  GetAllUploadsDetails(cb?: () => void): void {
    this.mouDocumentsService.GetAllUploadedDocuments().subscribe({
      next: resp => {
        try {
          if (resp && resp.item1 && resp.item1.length) {
            this.MouDocumentDetails = this.filteredMouDocumentDetails = resp.item1;
            this.showNoDataFoundMessage = false;
            this.applyFilters();
            this.columns = Object.keys(this.MouDocumentDetails[0] ?? {});
            const exclude = ['fileName', 'newMouId', 'mouPartnerName', 'mouUploadedBy', 'mouUploadedByUID', 'mouApprovedBy', 'mouEndDate', 'mouStartDate', 'mouStatus', 'filePath', 'uid', 'updatedOn', 'facultyName', 'mouTitle', 'mouPartnerName', 'spocContactNo', 'spocName', 'spocEmailId', 'mouPartner', 'createdOn', 'createdBy', 'ipAddress', 'updatedBy', 'disapprovalReason', 'approvedBy', 'updatedOn', 'isActive', 'isApproved', 'approvalDate', 'schoolDivisionInvolved', 'mouId', 'id', 'activityStartDate', 'activityEndDate', 'assignedBy', 'assignedTo'];
            this.columns = this.columns.filter((c: any) => !exclude.includes(c));
            this.loadingIndicator = false; this.isLoginFailed = false;
          } else { this.MouDocumentDetails = []; this.filteredMouDocumentDetails = []; this.showNoDataFoundMessage = true; }
        } catch (e) {
          console.error(e);
        } finally {
          if (cb) cb();
        }
      }, error: err => {
        this.LoginFailed(err);
        if (cb) cb();
      }
    });
    this.GetAllActivities();
  }
  GetAllActivities(): void {
    this.lpuPlannerService.GetSchoolDivisions().subscribe(res => this.allSchoolDivisions = res.item1?.length ? res.item1 : []);
  }

  // ---- Filtering ----
  search(): void { this.applyFilters(); }
  onStatusChange(_: any): void { this.applyFilters(); }
  onApprovalFilterChange(_: any): void { this.applyFilters(); }
  applyFilters(): void {
    let filtered = this.MouDocumentDetails;
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (this.statusFilter === 'active') return item.mouStatus === 'Active';
        if (this.statusFilter === 'expired') return item.mouStatus === 'Expired';
        if (this.statusFilter === 'renewed') return item.hasRenewal === true || item.hasRenewal === 'true';
        return true;
      });
    }
    if (this.approvalFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (this.approvalFilter === 'approved') return item.isApproved == 1 || item.isApproved === 'True' || item.isApproved === true;
        if (this.approvalFilter === 'disapproved') return item.isApproved == 0 || item.isApproved === 'False' || item.isApproved === false;
        return true;
      });
    }
    if (this.SelectedMouCategory && this.SelectedMouCategory !== 'All') {
      filtered = filtered.filter(item => item.mouCategory === this.SelectedMouCategory);
    }
    if (this.selectedSchoolDivision && this.selectedSchoolDivision !== '0') {
      filtered = filtered.filter(item => {
        if (!item.schoolDivisionInvolved) return false;
        const divisions = item.schoolDivisionInvolved.split(',');
        return divisions.includes(this.selectedSchoolDivision.toString());
      });
    }
    const q = this.searchQuery?.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(item => Object.entries(item).some(([k, v]) => {
        if (v !== null && v !== undefined) {
          const s = String(v).toLowerCase();
          if (k === 'id') {
            const n = Number(v);
            if (!isNaN(n) && (n.toString().includes(q) || `mou/${n}`.includes(q))) return true;
          }
          return s.includes(q);
        }
        return false;
      }));
    }
    this.filteredMouDocumentDetails = filtered;
  }

  filterData(): void {
    const lowerCaseFilter = this.filterText.toLowerCase();
    this.AllRenewedMouDetails = this.MouDocumentDetails.filter(item => {
      const isRenewed = item.hasRenewal === true || item.hasRenewal === 'true';
      if (!isRenewed) return false;
      return Object.entries(item).some(([key, val]) => {
        if (val !== null && val !== undefined) {
          const valueString = String(val).toLowerCase();
          if (key === 'id') {
            const numericId = Number(val);
            if (!isNaN(numericId) && (numericId.toString().includes(lowerCaseFilter) || `mou/${numericId}`.includes(lowerCaseFilter))) {
              return true;
            }
          }
          return valueString.includes(lowerCaseFilter);
        }
        return false;
      });
    });
  }

  // ---- Count helpers ----
  getActiveCount(): number { return this.MouDocumentDetails.filter(i => i.mouStatus === 'Active').length; }
  getExpiredCount(): number { return this.MouDocumentDetails.filter(i => i.mouStatus === 'Expired').length; }
  getRenewedCount(): number {
    const renewed = this.MouDocumentDetails.filter(i => i.hasRenewal === true || i.hasRenewal === 'true');
    if (!this.filterText) {
      this.AllRenewedMouDetails = renewed;
    }
    return renewed.length;
  }
  getApprovedCount(): number { return this.MouDocumentDetails.filter(i => i.isApproved == 1 || i.isApproved === 'True' || i.isApproved === true).length; }
  getDisapprovedCount(): number { return this.MouDocumentDetails.filter(i => i.isApproved == 0 || i.isApproved === 'False' || i.isApproved === false).length; }

  // ---- Division lookup & export ----
  getDivisionNameById(id: number): string { const div = this.allSchoolDivisions.find((s: any) => s.id === id); return div ? div.schoolDivision : `ID ${id} not found`; }
  getDivisionNamesByIds(ids: number[]): string { return ids.map(id => this.getDivisionNameById(id)).join(', '); }
  exportToExcel(): void {
    const fileName = 'Mou_Document_report.xlsx';
    const exported = this.filteredMouDocumentDetails.map(item => ({
      NewMOUId: item.newMouId ?? 'N/A',
      OldMOUId: 'MOU/' + (item.id ?? 'N/A'),
      'Mou Partner Organisation Name': item.mouTitle ?? 'N/A',
      'Mou Start Date': item.mouStartDate ?? 'N/A',
      'Mou End Date': item.mouEndDate ?? 'N/A',
      'Mou Status': item.mouStatus ?? 'N/A',
      'SPOC Person Name (Mou Partner Organisation)': item.spocName ?? 'N/A',
      'SPOC Person Email (Mou Partner Organisation)': item.spocEmailId ?? 'N/A',
      'SPOC Person Contact (Mou Partner Organisation)': item.spocContactNo ?? 'N/A',
      'Name of School/Division Involved ': item.schoolDivisionInvolved ? this.getDivisionNamesByIds(item.schoolDivisionInvolved.split(',').map(Number)) : 'N/A',
      'School/Division Name Of Faculty Who Uploaded': item.mouUploadedBy ?? 'N/A',
      'Date of MOU Upload at interface': item.createdOn ? new Date(item.createdOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'N/A',
      'Approval Status (Approved/Rejected/Pending)': item.isApproved == 1 ? 'Approved' : item.isApproved == 0 ? 'Disapproved' : 'Pending',
      'MOU Approved /Rejected By : Faculty Name': item.mouApprovedBy ?? 'N/A',
      'MOU Approved /Rejected By : Faculty UID': item.approvedBy ?? 'N/A',
      'MOU Approval/ Rejection Date': item.approvalDate ?? 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(exported);
    ws['!cols'] = Array(17).fill({ wpx: 220 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
    link.download = fileName; link.click();
  }

  // ---- Approve / Disapprove ----
  DisapproveStatus(Id: any): void {
    swal.fire({
      title: 'Reason for Disapproval', input: 'text', inputPlaceholder: 'Enter reason for disapproval',
      showCancelButton: true, confirmButtonText: 'Submit', cancelButtonText: 'Cancel',
      inputValidator: (val: any) => !val?.trim() ? 'Disapproval reason is required.' : null
    }).then(res => {
      if (res.isConfirmed) {
        this.Reason = res.value.trim();
        const fd = new FormData();
        fd.append('Id', Id);
        fd.append('DisapprovalReason', this.Reason);
        fd.append('Action', 'Disapprove');
        this.handleStatusChange(fd, 'Disapprove');
      } else if (res.dismiss === swal.DismissReason.cancel) { this.showCancelledSwal(); }
    });
  }
  ChangeApproveStatus(Id: any): void {
    const fd = new FormData();
    fd.append('Id', Id);
    fd.append('Action', 'Approve');
    swal.fire({ title: 'Are you sure you want to change the status?', text: 'Kindly confirm if the document is valid!', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, accept current changes!', cancelButtonText: 'No, do not change it' })
      .then((result: any) => {
        if (result.value) { this.handleStatusChange(fd, 'Approve'); } else { this.showCancelledSwal(); }
      });
  }
  private handleStatusChange(fd: FormData, action: string): void {
    this.mouDocumentsService.ApproveDocument(fd).subscribe((data: any) => {
      if (action === 'Approve' && data.responseData === 'Cancel') { swal.fire('No Change!', ' ', 'error'); }
      else { swal.fire(' Approved/Disapproved successfully !', '', 'success').then(() => window.location.reload()); }
    });
  }
  private showCancelledSwal(): void { swal.fire('Cancelled', ' ', 'error'); }

  // ---- Update school division ----
  private handleSchoolChange(fd: FormData): void {
    this.mouDocumentsService.UpdateSchoolDivision(fd).subscribe(data => {
      if (data.responseData === 'Failed') swal.fire('No Change!', ' ', 'error');
      else swal.fire(' Updation successfully !', '', 'success').then(() => window.location.reload());
    });
  }

  // ---- MOU status calculation ----
  toggleEndDate(): void {
    if (this.isIndefiniteMou) { this.isIndefiniteMou = true; this.MouEndDate = ''; this.moustatus = 'Active'; }
    else { this.updateMouStatus(); }
  }
  updateMouStatus(): void {
    const today = new Date();
    const start = this.MouStartDate ? new Date(this.MouStartDate) : null;
    const end = this.MouEndDate ? new Date(this.MouEndDate) : null;
    if (this.isIndefiniteMou) this.moustatus = 'Active';
    else if (start) this.moustatus = (!end || (today >= start && today <= end)) ? 'Active' : 'Expired';
    else this.moustatus = 'Expired';
  }

  // ---- Modals ----
  ChangeSchool(data: any): void {
    this.isRenewalMode = false; this.showSuggestions = false; this.filteredEmployeesData = [];
    this.mouId = data.id; this.AssignedToUid = data.lpuSpocUID; this.AssignedToUidName = data.lpuSpocName; this.moustatus = data.mouStatus;
    this.MouOrganisationPrevious = data.mouPartnerName; this.SPOCPerson = data.spocName; this.SPOCPersonEmail = data.spocEmailId;
    this.MouStartDate = data.mouStartDate; this.MouEndDate = data.mouEndDate; this.selectedSchoolDivisions = data.schoolDivisionInvolved; this.CurrentSchool = data.schoolDivisionInvolved;
    this.mouForm.patchValue({
      mouId: data.id,
      selectedDivisions: data.schoolDivisionInvolved ? data.schoolDivisionInvolved.split(',') : [],
      mouOrganisation: data.mouPartnerName,
      startDate: this.formatDate(data.mouStartDate),
      endDate: this.formatDate(data.mouEndDate),
      isIndefinite: data.mouStatus === 'Active' && !data.mouEndDate,
      spocName: data.spocName,
      spocEmail: data.spocEmailId,
      spocContact: data.spocContactNo,
      lpuSpocName: data.lpuSpocName,
      lpuSpocUid: data.lpuSpocUID,
      lpuSpocEmail: data.lpuSpocEmail
    });
    this.modalService.open(this.ChangeSchoolDivisionModal, { size: 'xl', backdrop: 'static' }).result.then(() => setTimeout(() => window.dispatchEvent(new Event('resize')), 200)).catch(() => { });
  }
  openRenewModal(row: any): void {
    this.isRenewalMode = true; this.showSuggestions = false; this.filteredEmployeesData = []; this.originalMouData = { ...row };
    this.renewalFile = null; this.renewalFileBase64 = null; this.renewalFileName = ''; this.renewalFileError = '';
    this.mouForm.patchValue({
      mouId: row.id,
      selectedDivisions: row.schoolDivisionInvolved ? row.schoolDivisionInvolved.split(',') : [],
      mouOrganisation: row.mouPartnerName,
      startDate: this.formatDate(row.mouStartDate),
      endDate: this.formatDate(row.mouEndDate),
      isIndefinite: row.mouStatus === 'Active' && !row.mouEndDate,
      spocName: row.spocName,
      spocEmail: row.spocEmailId,
      spocContact: row.spocContactNo,
      lpuSpocName: row.lpuSpocName,
      lpuSpocUid: row.lpuSpocUID,
      lpuSpocEmail: row.lpuSpocEmail
    });
    this.mouId = row.id; this.AssignedToUid = row.lpuSpocUID; this.AssignedToUidName = row.lpuSpocName; this.moustatus = row.mouStatus; this.MouStartDate = row.mouStartDate; this.MouEndDate = row.mouEndDate; this.isIndefiniteMou = row.mouStatus === 'Active' && !row.mouEndDate; this.CurrentSchool = row.schoolDivisionInvolved;
    this.modalService.open(this.ChangeSchoolDivisionModal, { size: 'xl', backdrop: 'static' }).result.then(() => setTimeout(() => window.dispatchEvent(new Event('resize')), 200)).catch(() => { });
  }
  OpenAllMouRenewalHistory(row: any): void {
    this.mouId = row.id; this.newMouId = row.newMouId; this.getRenewedMouDetails(row.id);
    this.modalService.open(this.ViewRenewedMouDetailsModal, { size: 'xl', backdrop: 'static' }).result.then(() => setTimeout(() => window.dispatchEvent(new Event('resize')), 200)).catch(() => { });
  }
  getRenewedMouDetails(mouId: any): void {
    this.mouDocumentsService.GetRenewedMouDetails(mouId).subscribe(res => { this.renewedMouDocumentDetails = res.item1?.length ? res.item1 : []; });
  }

  // ---- Submit modal ----
  onSubmitModal(): void {
    if (this.isRenewalMode) {
      // renewal logic (omitted for brevity)
    } else {
      // update logic (omitted for brevity)
    }
  }

  // ---- Misc helpers ----
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }
}

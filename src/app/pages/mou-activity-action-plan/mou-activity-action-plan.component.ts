import { Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule, DOCUMENT } from '@angular/common';
import swal from 'sweetalert2';
import { ColumnMode, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatTableDataSource } from '@angular/material/table';
import { NgSelectModule } from '@ng-select/ng-select';
import * as XLSX from 'xlsx';
import { MouActivity } from './models/mou-activity.model';
import { mouActivities } from './models/mou-activities.data';
import { MouServices } from '../../services/mou-services';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LpuPlannerServiceService } from '../../services/lpu-planner-service.service';
import { TopScrollSyncDirective } from '../mou-documents-report/top-scroll-sync.directive';

interface Employee {
  employeeName: string;
  employeeCode: string;
}

interface SchoolDivision {
  id: number;
  schoolDivision: string;
}

interface MouCategory {
  id: number;
  CategoryName: string;
}

@Component({
  selector: 'app-mou-activity-action-plan',
  templateUrl: './mou-activity-action-plan.component.html',
  styleUrls: ['./mou-activity-action-plan.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    NgSelectModule
  ]
})
export class MouActivityActionPlanComponent implements OnInit, AfterViewInit {
  // === TEMPLATE REFS ===
  @ViewChild('ModifyFacultyModal') ModifyFacultyModal!: TemplateRef<any>;
  @ViewChild('OpenMouRenewalModal', { read: TemplateRef, static: false }) OpenMouRenewalModal!: TemplateRef<any> | null;
  @ViewChild('ViewRenewedMouDetailsModal') ViewRenewedMouDetailsModal!: TemplateRef<any>;
  @ViewChild('viewDescModal') viewDescModal!: TemplateRef<any>;
  @ViewChild('viewActivityActionTakenModalAll') viewActivityActionTakenModalAll!: TemplateRef<any>;
  @ViewChild('activityModal') activityModal!: TemplateRef<any>;
  @ViewChild('viewMouActivityActionTakenModal') viewMouActivityActionTakenModal!: TemplateRef<any>;
  @ViewChild('AssignNewUIDModal') AssignNewUIDModal!: TemplateRef<any>;
  @ViewChild('topScroll') topScroll!: ElementRef<HTMLDivElement>;
  @ViewChild('tableWrapper') tableWrapper!: ElementRef<HTMLDivElement>;

  // === VARIABLES & STATE ===
  tableScrollWidth = 0;
  private syncing = false;

  newMouid: any; recordId: any;
  TitleS: any; StartDate3: any; EndDate3: any;
  ExistingUID: any;

  employeeControl3 = new FormControl('');
  remarks3: any = '';
  filteredEmployeesData3: Employee[] = [];
  showSuggestions3 = false;
  activeSuggestionIndex3 = -1;
  ResponsiblePerson3: any = '';
  AssignedToUid3: any = '';

  selectedSchoolDivision: any = '0';
  selectedSchoolDivision2: any = '0';
  selectedSchoolDivision3: any = '0';
  AllMouCategories: MouCategory[] = [];
  SelectedMouCategoryTab1: any = 'All';
  SelectedMouCategoryTab2: any = 'All';
  SelectedMouCategoryTab3: any = 'All';

  statusFilter: string = 'all';
  Tab1statusFilter: string = 'all';
  Tab2statusFilter: string = 'all';
  Tab3statusFilter: string = 'all';
  searchQuery: any = '';

  renewedMouDocumentDetails: any[] = [];

  searchTextTab1: string = '';
  MouActivityDocumentsMaster: any[] = [];
  filteredMouActivityDocuments: any[] = [];

  searchTextTab2: string = '';
  MouActivityAssignedMeMaster: any[] = [];
  filteredMouActivityAssignedMe: any[] = [];

  searchTextTab3: string = '';
  MouActivityAssignedOthersMaster: any[] = [];
  filteredMouActivityAssignedOthers: any[] = [];

  employeeControl = new FormControl();
  EmployeeData: Employee[] = [];
  filteredEmployeesData: Employee[] = [];
  showSuggestions = false;
  activeSuggestionIndex: number = -1;
  ResponsiblePerson: any = '';
  AssignedToUid: any = '';

  SchoolDivisionInvolved: any;
  DepartmentName: any;
  CurrentMouTitle: any;
  remarks: any;
  Reason: any;
  mouId: any;
  startDate: any;
  endDate: any;
  allSchoolDivisions: SchoolDivision[] = [];
  allPlannerSessions: any[] = [];
  selectedPlannerSession: any = '11';

  EmployeeDetails: any;
  EmployeeCode: any;
  Department: any;
  EmployeeName: any;
  ContactNoX: any;
  UserRole: any;
  isLoginFailed: boolean = false;
  isLoadingPage: boolean = true;
  tab2Loaded: boolean = false;
  tab3Loaded: boolean = false;

  loadingIndicator = false;
  showNoDataFoundMessage: boolean = false;
  ServerUrl: any;
  ColumnMode = ColumnMode;
  columns: any;
  columnsAssigned: any;
  headHtmlData: any[] = [];
  mouActivities: MouActivity[] = [];
  selectedActivityId: any = '';
  selectedRow: any = null;
  uploadEnabled: boolean = false;

  MouActionTakenDocuments: any[] = [];
  filteredMouActionTakenDocuments: any[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();

  MouidX: any; IdX: any; MouTitleX: any; StartDateX: any; EndDateX: any; ActivityDetailsX: any; RemarksX: any;

  LPUSpocEmail: any = '';
  AssignedToUidName: any = '';
  moustatus: any;
  MouStartDate: any;
  MouEndDate: any;
  isIndefiniteMou: boolean = false;
  CurrentSchool: any;
  mouForm!: FormGroup;
  isRenewalMode: boolean = false;
  renewalFile: File | null = null;
  renewalFileBase64: string | null = null;
  renewalFileName: string = '';
  renewalFileError: string = '';
  originalMouData: any = null;

  partnerNamesMap: { [key: number]: string } = {};
  partnerName: string | undefined;
  selectedId: number | undefined;
  MouPartner: any;
  allMouActionTakenDetails: any;

  reminderDisabled: { [key: string]: boolean } = {};
  reminderSending: { [key: string]: boolean } = {};

  ngOnInit(): void {
    this.initForm();
    this.mouActivities = mouActivities;
    const stMain = document.getElementById('stMain');
    if (stMain) stMain.innerHTML = '<span class="themeClr text-center"> MOU </span>Activity Action <span class="themeClr">Plan </span> <br/><span class="ms-3">   HOS /COS / Admin </span> ';

    const imgLogo = document.getElementById('imgLogo');
    if (imgLogo) imgLogo.style.width = '164px';

    this.startDate = this.endDate = '';
    this.ServerUrl = 'https://files.lpu.in/umsweb/MOUDocuments/';
    let loginName = this.route.snapshot.params['loginName'];

    if (loginName != '' && loginName != undefined) {
      this.storageService.clean();
      this.getToken(loginName);
    } else if (this.storageService.isLoggedIn()) {
      this.getAllPlannerSession();
      this.GetEmployeeDetails();
      this.GetAllActivities();
      this.GetEmployeeData();
      this.setupEmployeeControl();
      this.GetAllCategories();
    } else {
      this.LoginFailed('Invalid Login Details');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.calculateScrollWidth();
    });
  }

  getToken(id: any) {
    this.authService.loginTemp(id).subscribe({
      next: data => {
        this.storageService.saveUser(data);
        var authToken = this.storageService.getUser();
        if (this.storageService.isLoggedIn() == false && authToken == 'Token Expired') {
          this.LoginFailed('Token Expired');
        }
        this.getAllPlannerSession();
        this.GetEmployeeDetails();
        this.GetAllActivities();
        this.GetEmployeeData();
        this.setupEmployeeControl();
        this.GetAllCategories();
      },
      error: _err => {
        this.LoginFailed(_err);
      }
    });
  }

  getAllPlannerSession(): void {
    this.mouServices.GetAllOBPPlannerSessions().subscribe({
      next: (response: any) => {
        if (response.item1) {
          this.allPlannerSessions = response.item1;
        }
      }
    });
  }

  GetEmployeeDetails(): void {
    console.log('GetEmployeeDetails: API call initiated');
    this.mouServices.GetEmployeeDetails().subscribe({
      next: (response: any) => {
        console.log('GetEmployeeDetails response:', response);
        try {
          const data = response?.item1 || (Array.isArray(response) ? response : []);
          if (data && data.length > 0) {
            this.EmployeeDetails = data;
            const first = data[0];
            this.EmployeeName = first.employeeName || first.EmployeeName || '';
            this.EmployeeCode = first.employeeCode || first.EmployeeCode || '';
            this.ContactNoX = first.contactNo || first.ContactNo || '';
            this.Department = first.department || first.Department || '';
            this.DepartmentName = first.departmentName || first.DepartmentName || '';
            this.UserRole = first.userRole || first.UserRole || '';
            
            console.log('Successfully set Employee details:', {
              EmployeeName: this.EmployeeName,
              EmployeeCode: this.EmployeeCode,
              DepartmentName: this.DepartmentName
            });

            this.loadingIndicator = false;
            this.showNoDataFoundMessage = false;
            this.isLoginFailed = false;

            this.GetAllMouDocumentsForApprovals(this.EmployeeCode);
            this.GetAllActivtiesAssigned(this.EmployeeCode, this.selectedPlannerSession);
          } else {
            console.warn('GetEmployeeDetails returned empty data');
            this.EmployeeDetails = [];
            this.showNoDataFoundMessage = true;
            this.isLoginFailed = true;
            this.isLoadingPage = false;
            this.cdr.detectChanges();
          }
        } catch (e) {
          console.error('Error in GetEmployeeDetails processing:', e);
          this.isLoginFailed = true;
          this.isLoadingPage = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('GetEmployeeDetails error:', err);
        this.LoginFailed(err);
        this.isLoadingPage = false;
        this.cdr.detectChanges();
      }
    });
  }

  checkPageLoadingComplete(): void {
    if (this.tab2Loaded && this.tab3Loaded) {
      this.isLoadingPage = false;
      this.cdr.detectChanges();
    }
  }

  initForm() {
    this.mouForm = this.fb.group({
      mouId: [{ value: '', disabled: true }], // Locked field
      selectedDivisions: [[], [Validators.required]],
      mouOrganisation: ['', [Validators.required, Validators.minLength(3)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      isIndefinite: [false],
      spocName: ['', [Validators.required]],
      spocEmail: ['', [Validators.required, Validators.email]],
      spocContact: [''],
      lpuSpocName: ['', [Validators.required]], // Internal SPOC Name
      lpuSpocUid: ['', [Validators.required]],  // Internal SPOC UID
      lpuSpocEmail: ['', [Validators.required, Validators.email]],// Internal SPOC Email
      remarks: ['', [Validators.required]] // Internal SPOC Email
    });
  }

  GetAllMouDocumentsForApprovals(IdCode: any): void {
    this.loadingIndicator = true;
    console.log('GetAllMouDocumentsForApprovals: API call initiated for Uid:', IdCode);
    this.mouServices.GetMouDocumentToAssignActivity(IdCode).subscribe({
      next: (response: any) => {
        console.log('GetAllMouDocumentsForApprovals response:', response);
        try {
          const data = response?.item1 || (Array.isArray(response) ? response : []);
          console.log(`GetAllMouDocumentsForApprovals processed items count: ${data?.length || 0}`);
          if (data && data.length > 0) {
            this.MouActivityDocumentsMaster = data;
            this.MouActivityDocumentsMaster.sort((a, b) => (b.id - a.id));
            this.filteredMouActivityDocuments = [...this.MouActivityDocumentsMaster];
            this.SchoolDivisionInvolved = this.getDivisionNameById(this.MouActivityDocumentsMaster[0].schoolDivisionInvolved);
            this.setupColumns(this.MouActivityDocumentsMaster[0], 'tab1');
            this.showNoDataFoundMessage = false;
          } else {
            console.warn('GetAllMouDocumentsForApprovals returned empty list');
            this.MouActivityDocumentsMaster = [];
            this.filteredMouActivityDocuments = [];
            this.showNoDataFoundMessage = true;
          }
        } catch (e) {
          console.error('Error in GetAllMouDocumentsForApprovals next processing:', e);
        } finally {
          this.loadingIndicator = false;
          this.isLoadingPage = false;
          this.cdr.detectChanges();
          this.GetOthersActivtiesAssigned('0', this.selectedPlannerSession);
        }
      },
      error: (err: any) => {
        console.error('GetAllMouDocumentsForApprovals error:', err);
        this.loadingIndicator = false;
        this.isLoadingPage = false;
        this.cdr.detectChanges();
        // Even if Tab 1 fails to load, we still trigger Tab 3 so loader resolves
        this.GetOthersActivtiesAssigned('0', this.selectedPlannerSession);
        this.LoginFailed(err);
      }
    });
  }

  GetAllActivtiesAssigned(IdCode: any, sessionId: any): void {
    this.loadingIndicator = true;
    this.mouServices.GetAllActivitiesAssignedwithSession(IdCode, sessionId).subscribe({
      next: (response: any) => {
        try {
          const data = response?.item1 || (Array.isArray(response) ? response : []);
          if (data && data.length > 0) {
            this.MouActivityAssignedMeMaster = data;
            this.filteredMouActivityAssignedMe = [...this.MouActivityAssignedMeMaster];
            this.filteredMouActivityAssignedMe = data.filter((activity: any) => {
              return activity.actionAssignedBy == this.EmployeeCode;
            });
            this.filteredMouActivityAssignedMe.sort((a, b) => b.id - a.id);
            this.setupColumns(this.MouActivityAssignedMeMaster[0], 'assigned');
            this.showNoDataFoundMessage = false;
          } else {
            this.MouActivityAssignedMeMaster = [];
            this.filteredMouActivityAssignedMe = [];
            this.showNoDataFoundMessage = true;
          }
        } catch (e) {
          console.error('Error in GetAllActivtiesAssigned next:', e);
        } finally {
          setTimeout(() => {
            this.loadingIndicator = false;
            this.tab2Loaded = true;
            this.checkPageLoadingComplete();
          }, 1500);
        }
      },
      error: (err: any) => {
        console.error('GetAllActivtiesAssigned error:', err);
        this.loadingIndicator = false;
        this.tab2Loaded = true;
        this.checkPageLoadingComplete();
        this.LoginFailed(err);
      }
    });
  }

  GetOthersActivtiesAssigned(IdCode: any, sessionId: any): void {
    this.loadingIndicator = true;
    this.mouServices.GetAllActivitiesAssignedwithSession('0', '0').subscribe({
      next: (response: any) => {
        try {
          const data = response?.item1 || (Array.isArray(response) ? response : []);
          if (data && data.length > 0) {
            this.MouActivityAssignedOthersMaster = data;
            this.MouActivityAssignedOthersMaster = data.filter((activity: any) => {
              return activity.actionAssignedBy !== this.EmployeeCode;
            });
            this.MouActivityAssignedOthersMaster.sort((a, b) => a.id - b.id);
            this.setupColumns(this.MouActivityAssignedOthersMaster[0], 'assigned');
            this.showNoDataFoundMessage = false;
            this.filterTab3();
          } else {
            this.MouActivityAssignedOthersMaster = [];
            this.filteredMouActivityAssignedOthers = [];
            this.showNoDataFoundMessage = true;
          }
        } catch (e) {
          console.error('Error in GetOthersActivtiesAssigned next:', e);
        } finally {
          setTimeout(() => {
            this.loadingIndicator = false;
            this.tab3Loaded = true;
            this.checkPageLoadingComplete();
          }, 1500);
        }
      },
      error: (err: any) => {
        console.error('GetOthersActivtiesAssigned error:', err);
        this.loadingIndicator = false;
        this.tab3Loaded = true;
        this.checkPageLoadingComplete();
        this.LoginFailed(err);
      }
    });
  }

  GetAllActivities(): void {
    this.lpuPlannerServiceService.GetSchoolDivisions().subscribe((response: any) => {
      this.allSchoolDivisions = response.item1.length > 0 ? response.item1 : [];
    });
  }

  GetEmployeeData(): void {
    this.mouServices.GetEmployeeData().subscribe({
      next: (response: any) => {
        this.EmployeeData = response.item1.length > 0 ? response.item1 : [];
      },
      error: (err: any) => console.error(err)
    });
  }

  GetAllCategories(): void {
    this.mouServices.GetMouCategories().subscribe({
      next: (response: any) => {
        if (response.item1 && response.item1.length > 0) {
          this.AllMouCategories = response.item1.map((x: any, index: number) => ({
            id: index + 1,
            CategoryName: x.items
          }));
        } else {
          this.AllMouCategories = [];
        }
      },
      error: (err: any) => { this.LoginFailed(err); }
    });
  }

  // ============================
  // TAB 1 FILTERING LOGIC
  // ============================
  onCategoryChange(event: any): void { this.applyCombinedFiltersTab1(); }
  onStatusChangeTab1(event: any): void { this.applyCombinedFiltersTab1(); }
  setSchoolDivision(event: any) {
    this.selectedSchoolDivision = event.target.value;
    this.applyCombinedFiltersTab1();
  }
  filterTab1() { this.applyCombinedFiltersTab1(); }

  resetTab1Filters(): void {
    this.selectedSchoolDivision = '0';
    this.Tab1statusFilter = 'all';
    this.SelectedMouCategoryTab1 = 'All';
    this.searchTextTab1 = '';
    this.searchQuery = '';
    this.filteredMouActivityDocuments = [...this.MouActivityDocumentsMaster];
  }

  applyCombinedFiltersTab1(): void {
    let filtered = [...this.MouActivityDocumentsMaster];
    if (this.selectedSchoolDivision === '-1') {
      filtered = [];
    } else if (this.selectedSchoolDivision !== '0') {
      filtered = filtered.filter(item => {
        if (!item.schoolDivisionInvolved) return false;
        return item.schoolDivisionInvolved
          .split(',').map((id: string) => id.trim()).includes(this.selectedSchoolDivision);
      });
    }

    filtered = filtered.filter(item => {
      if (this.Tab1statusFilter === 'all') return true;
      if (this.Tab1statusFilter === 'active') return item.mouStatus === 'Active';
      if (this.Tab1statusFilter === 'expired') return item.mouStatus === 'Expired' && item.renewalCount == 0;
      if (this.Tab1statusFilter === 'renewed') return item.renewalCount > 0 || (item.renewalCount !== null && item.renewalCount !== undefined && item.renewalCount !== '0' && item.renewalCount !== 'null');
      return true;
    });

    filtered = filtered.filter(item => this.matchMouCategory(item, this.SelectedMouCategoryTab1));

    const query = this.searchTextTab1?.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(item => {
        return Object.entries(item).some(([key, val]) => {
          if (val !== null && val !== undefined) {
            const valueString = String(val).toLowerCase();
            if (key === 'id') {
              const numericId = Number(val);
              if (!isNaN(numericId) && (numericId.toString().includes(query) || `mou/${numericId}`.includes(query))) return true;
            }
            return valueString.includes(query);
          }
          return false;
        });
      });
    }
    this.filteredMouActivityDocuments = filtered;
  }

  getActiveCount(): number { return this.filteredMouActivityDocuments.filter(item => item.mouStatus === 'Active').length; }
  getExpiredCount(): number { return this.filteredMouActivityDocuments.filter(item => item.mouStatus === 'Expired' && item.renewalCount == 0).length; }
  getRenewedCount(): number { return this.filteredMouActivityDocuments.filter(item => item.renewalCount > 0 || (item.renewalCount !== null && item.renewalCount !== undefined && item.renewalCount !== '0' && item.renewalCount !== 'null')).length; }

  // ============================
  // TAB 2 FILTERING LOGIC
  // ============================
  onCategory2Change(event: any): void { this.applyFiltersTab2(); }
  onStatusChangeTab2(event: any): void { this.applyFiltersTab2(); }
  filterTab2() { this.applyFiltersTab2(); }

  applyFiltersTab2(): void {
    let filtered = this.MouActivityAssignedMeMaster.filter(x => x.actionAssignedBy === this.EmployeeCode);
    filtered = filtered.filter(item => this.matchSchoolDivision(item));
    filtered = filtered.filter(item => this.matchMouCategory(item, this.SelectedMouCategoryTab2));

    switch (this.Tab2statusFilter) {
      case 'active': filtered = filtered.filter(x => x.mouStatus === 'Active'); break;
      case 'expired': filtered = filtered.filter(x => x.mouStatus === 'Expired'); break;
      case 'renewed': filtered = filtered.filter(x => x.mouStatus === 'Renewed' || x.renewalVersionCount > 0); break;
    }

    const query = (this.searchTextTab2 || '').trim().toLowerCase();
    if (query) {
      const normalizedQuery = query.replace(/\s+/g, '');
      filtered = filtered.filter(item => {
        if (item.mouId != null) {
          const oldId = item.mouId.toString().toLowerCase();
          if (oldId.includes(normalizedQuery) || (`mou/${oldId}`).includes(normalizedQuery)) return true;
        }
        if (item.newMouId != null) {
          const newId = item.newMouId.toString().toLowerCase();
          if (newId.includes(normalizedQuery) || (`mou/${newId}`).includes(normalizedQuery)) return true;
        }
        return Object.entries(item).some(([_, value]) => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(normalizedQuery);
        });
      });
    }
    filtered.sort((a, b) => b.id - a.id);
    this.filteredMouActivityAssignedMe = filtered;
  }

  private matchSchoolDivision(item: any): boolean {
    if (this.selectedSchoolDivision2 === '0' || this.selectedSchoolDivision2 === '-1') return true;
    if (!item.schoolDivisionId) return false;
    const divisions = item.schoolDivisionId.toString().split(',').map((x: string) => x.trim());
    return divisions.includes(this.selectedSchoolDivision2.toString());
  }

  getActiveCountTab2(): number { return this.filteredMouActivityAssignedMe.filter(item => item.mouStatus === 'Active').length; }
  getExpiredCountTab2(): number { return this.filteredMouActivityAssignedMe.filter(item => item.mouStatus === 'Expired').length; }
  getRenewedCountTab2(): number { return this.filteredMouActivityAssignedMe.filter(item => item.mouStatus === 'Renewed').length; }

  // ============================
  // TAB 3 FILTERING LOGIC
  // ============================
  onCategory3Change(event: any): void { this.applyFiltersTab3(); }
  onStatusChangeTab3(event: any): void { this.applyFiltersTab3(); }
  onSchoolDivisionChangeTab3(event: any): void { this.applyFiltersTab3(); }
  filterTab3() { this.applyFiltersTab3(); }

  applyFiltersTab3(): void {
    let filtered = this.MouActivityAssignedOthersMaster.filter(x => x.actionAssignedBy !== this.EmployeeCode);
    filtered = filtered.filter(item => this.matchSchoolDivision3(item));
    filtered = filtered.filter(item => this.matchMouCategory(item, this.SelectedMouCategoryTab3));

    if (this.Tab3statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (this.Tab3statusFilter === 'active') return item.mouStatus === 'Active';
        else if (this.Tab3statusFilter === 'expired') return item.mouStatus === 'Expired';
        else if (this.Tab3statusFilter === 'renewed') return item.mouStatus === 'Renewed';
        return true;
      });
    }

    const query = (this.searchTextTab3 || '').trim().toLowerCase();
    if (query) {
      const normalizedQuery = query.replace(/\s+/g, '');
      filtered = filtered.filter(item => {
        if (item.mouId != null) {
          const oldId = item.mouId.toString().toLowerCase();
          if (oldId.includes(normalizedQuery) || (`mou/${oldId}`).includes(normalizedQuery)) return true;
        }
        if (item.newMouId != null) {
          const newId = item.newMouId.toString().toLowerCase();
          if (newId.includes(normalizedQuery) || (`mou/${newId}`).includes(normalizedQuery)) return true;
        }
        return Object.entries(item).some(([_, value]) => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(normalizedQuery);
        });
      });
    }
    filtered.sort((a, b) => b.id - a.id);
    this.filteredMouActivityAssignedOthers = filtered;
  }

  private matchSchoolDivision3(item: any): boolean {
    if (this.selectedSchoolDivision3 === '0' || this.selectedSchoolDivision3 === '-1') return true;
    if (!item.schoolDivisionId) return false;
    const divisions = item.schoolDivisionId.toString().split(',').map((x: string) => x.trim());
    return divisions.includes(this.selectedSchoolDivision3.toString());
  }

  getActiveCountTab3(): number { return this.filteredMouActivityAssignedOthers.filter(item => item.mouStatus === 'Active').length; }
  getExpiredCountTab3(): number { return this.filteredMouActivityAssignedOthers.filter(item => item.mouStatus === 'Expired').length; }
  getRenewedCountTab3(): number { return this.filteredMouActivityAssignedOthers.filter(item => item.mouStatus === 'Renewed').length; }

  // ============================
  // UTILITIES & SHARED
  // ============================
  private matchMouCategory(item: any, selected: any): boolean {
    if (!selected || selected === 'All') return true;
    const categoryName = selected.CategoryName;
    return String(item.mouCategory ?? '').toLowerCase() === categoryName.toLowerCase();
  }

  genericSearch(data: any[], query: string): any[] {
    if (!query || query.trim() === '') return [...data];
    const lowerQuery = query.trim().toLowerCase();
    return data.filter(item => {
      return Object.entries(item).some(([key, val]) => {
        if (val === null || val === undefined) return false;
        const valueString = String(val).toLowerCase();
        if (key === 'mouId') {
          const numericId = Number(val);
          if (!isNaN(numericId)) {
            if (numericId.toString().includes(lowerQuery) || `mou/${numericId}`.toLowerCase().includes(lowerQuery)) return true;
          }
        }
        return valueString.includes(lowerQuery);
      });
    });
  }

  reloadGrid1() {
    this.selectedPlannerSession = "0";
    this.searchTextTab1 = "";
    this.GetAllMouDocumentsForApprovals(this.EmployeeCode);
  }

  reloadGrid2() {
    this.selectedPlannerSession = "0";
    this.searchTextTab2 = "";
    this.GetAllActivtiesAssigned(this.EmployeeCode, '0');
  }

  reloadGrid() {
    this.selectedPlannerSession = "0";
    this.searchTextTab3 = "";
    this.GetOthersActivtiesAssigned(this.EmployeeCode, '0');
  }

  setSessionId(event: any) {
    const selectedId = event.target.value;
    this.selectedPlannerSession = selectedId;
    this.GetAllActivtiesAssigned(this.EmployeeCode, this.selectedPlannerSession);
    this.GetOthersActivtiesAssigned('0', this.selectedPlannerSession);
  }

  setupColumns(dataRow: any, type: 'tab1' | 'assigned') {
    if (!dataRow) return;
    const allKeys = Object.keys(dataRow);
    const exclusions = [
      'newMouId', 'filePath', 'activityDetails', 'activityPerformed', 'mouStartDate',
      'mouEndDate', 'mouStatus', 'approvedBy', 'createdBy', 'mouId', 'schoolDivisionInvolved',
      'isApproved', 'approvalDate', 'disapprovalReason', 'uid', 'id', 'spocContactNo',
      'createdOn', 'actionAssignedBy', 'sessionAcademicYear', 'mouTitle'
    ];
    const filteredCols = allKeys.filter(key => !exclusions.includes(key));
    if (type === 'tab1') this.columns = filteredCols;
    else this.columnsAssigned = filteredCols;
  }

  getDivisionNameById(id: any): string {
    if (!id) return '';
    const division = this.allSchoolDivisions.find(x => x.id.toString() === id.toString().trim());
    return division ? division.schoolDivision : '';
  }

  // ============================
  // EMPLOYEE / FACULTY SEARCH
  // ============================
  setupEmployeeControl() {
    this.employeeControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.onInput());
  }
  onInput() {
    const inputValue = (this.employeeControl.value || '').toLowerCase();
    if (inputValue) {
      this.filteredEmployeesData = this.EmployeeData.filter(employee =>
        employee.employeeName.toLowerCase().includes(inputValue) ||
        employee.employeeCode.toLowerCase().includes(inputValue)
      ).slice(0, 10);
    } else {
      this.filteredEmployeesData = [];
    }
    this.showSuggestions = true;
    this.activeSuggestionIndex = -1;
  }
  selectEmployee(employee: Employee) {
    this.ResponsiblePerson = employee.employeeCode;
    this.AssignedToUid = employee.employeeCode;
    this.employeeControl.setValue(`${employee.employeeName} (${employee.employeeCode})`);
    this.filteredEmployeesData = [];
    this.showSuggestions = false;
    this.checkFormValidity();
    this.checkUIDValidity();
  }
  onKeydown(event: KeyboardEvent) {
    if (this.filteredEmployeesData.length > 0) {
      if (event.key === 'ArrowDown') {
        this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.filteredEmployeesData.length;
      } else if (event.key === 'ArrowUp') {
        this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + this.filteredEmployeesData.length) % this.filteredEmployeesData.length;
      } else if (event.key === 'Enter') {
        if (this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < this.filteredEmployeesData.length) {
          this.selectEmployee(this.filteredEmployeesData[this.activeSuggestionIndex]);
        }
      }
    }
  }
  hideSuggestions() { setTimeout(() => this.showSuggestions = false, 200); }
  checkFormValidity(): boolean {
    return !!(this.startDate && this.endDate && this.remarks && this.AssignedToUid > 0);
  }
  checkUIDValidity(): void {
    this.uploadEnabled = this.IdX !== '' && this.AssignedToUid != '';
  }
  clearFields(): void {
    this.mouId = this.startDate = this.endDate = this.ResponsiblePerson = '';
    this.remarks = '';
  }

  onInput2() {
    const query = this.mouForm.get('lpuSpocName')?.value?.toLowerCase();
    if (query && query.length >= 2) {
      this.filteredEmployeesData = this.EmployeeData.filter(emp =>
        emp.employeeName.toLowerCase().includes(query) ||
        emp.employeeCode.toLowerCase().includes(query)
      ).slice(0, 10);
      this.showSuggestions = true;
    } else {
      this.showSuggestions = false;
    }
  }
  selectEmployee2(employee: Employee) {
    this.ResponsiblePerson = employee.employeeCode;
    this.AssignedToUid = employee.employeeCode;
    this.AssignedToUidName = employee.employeeName;
    this.mouForm.patchValue({
      lpuSpocName: employee.employeeName,
      lpuSpocUid: employee.employeeCode
    });
    this.employeeControl.setValue(`${employee.employeeName} (${employee.employeeCode})`);
    this.filteredEmployeesData = [];
    this.showSuggestions = false;
    this.checkUIDValidity();
  }

  // SEARCH 3 (Modify Faculty)
  onInput3() {
    const inputValue = (this.employeeControl3.value || '').toString().toLowerCase().trim();
    if (inputValue) {
      this.filteredEmployeesData3 = this.EmployeeData.filter(employee =>
        employee.employeeName.toLowerCase().includes(inputValue) ||
        employee.employeeCode.toLowerCase().includes(inputValue)
      ).slice(0, 10);
    } else {
      this.filteredEmployeesData3 = [];
    }
    this.showSuggestions3 = true;
    this.activeSuggestionIndex3 = -1;
  }
  selectEmployee3(employee: Employee) {
    this.ResponsiblePerson3 = employee.employeeCode;
    this.AssignedToUid3 = employee.employeeCode;
    if (this.AssignedToUid3 === this.ExistingUID) {
      swal.fire('Error', 'Select Different UID', 'error')
      this.filteredEmployeesData3 = [];
      this.showSuggestions3 = false;
      return;
    }
    this.employeeControl3.setValue(`${employee.employeeName} (${employee.employeeCode})`);
    this.filteredEmployeesData3 = [];
    this.showSuggestions3 = false;
  }
  onKeydown3(event: KeyboardEvent) {
    if (!this.filteredEmployeesData3?.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestionIndex3 = (this.activeSuggestionIndex3 + 1) % this.filteredEmployeesData3.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionIndex3 = (this.activeSuggestionIndex3 - 1 + this.filteredEmployeesData3.length) % this.filteredEmployeesData3.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.activeSuggestionIndex3 >= 0 && this.activeSuggestionIndex3 < this.filteredEmployeesData3.length) {
        this.selectEmployee3(this.filteredEmployeesData3[this.activeSuggestionIndex3]);
      }
    }
  }
  hideSuggestions3() { setTimeout(() => { this.showSuggestions3 = false; }, 200); }
  checkFormValidity3(): boolean { return !!(this.AssignedToUid3 && this.remarks3 && this.remarks3.trim().length > 0); }

  // ============================
  // UPLOAD & ACTION LOGIC
  // ============================
  UploadActivity() {
    const formData = new FormData();
    formData.append('MouId', this.mouId);
    formData.append('Uid', this.AssignedToUid);
    formData.append('ActionAssignedBy', this.EmployeeCode);
    formData.append('Remarks', this.remarks);
    formData.append('StartDate', this.startDate);
    formData.append('EndDate', this.endDate);
    this.mouServices.MouNewActivityPlanAddNew(formData).subscribe({
      next: (data: any) => {
        if (data?.item1?.[0]?.msg === 'success') {
          swal.fire('Success', 'Assigned UID Done.', 'success');
          setTimeout(() => { window.location.reload(); }, 1500);
        } else {
          swal.fire('Failed', 'Assigned UID Failed.', 'error');
          setTimeout(() => { window.location.reload(); }, 1500);
        }
      },
      complete: () => this.clearFields()
    });
  }

  UploadUID() {
    const formData = new FormData();
    formData.append('RecordId', this.IdX);
    formData.append('Uid', this.AssignedToUid);
    formData.append('MouId', this.MouidX);
    this.mouServices.ActivityPlanUpdateUID(formData).subscribe({
      next: (data: any) => {
        const result = data?.item1?.[0]?.msg;
        if (result === 'Success') {
          this.showAlert('UID Updated Successfully!', 'success', true);
        } else {
          this.showAlert('Failed to Update UID!', 'error');
        }
      },
      error: (err: any) => { swal.fire('Error', 'Failed to Assign New UID .', 'error'); },
      complete: () => { this.clearFields(); this.reloadGrid2(); }
    });
  }

  UpdateUID() {
    if (!this.checkFormValidity3()) return;
    const formData = new FormData();
    formData.append('MouId', this.newMouid);
    formData.append('ExistingUid', this.ExistingUID);
    formData.append('RecordID', this.recordId);
    formData.append('Uid', this.ResponsiblePerson3);
    formData.append('ActionAssignedBy', this.EmployeeCode);
    formData.append('Remarks', this.remarks3);
    formData.append('StartDate', this.StartDate3);
    formData.append('EndDate', this.EndDate3);
    this.mouServices.ReassignNewUID(formData).subscribe({
      next: (data: any) => {
        const resultMsg = data.item1 && data.item1.length > 0 ? data.item1[0].msg : data.responseData;
        if (resultMsg === 'success') {
          swal.fire('Success', 'Assigned UID Done.', 'success');
          setTimeout(() => { window.location.reload(); }, 1500);
        } else {
          swal.fire('Error', 'Failed to Assign New UID. Please try again.', 'error');
          setTimeout(() => { window.location.reload(); }, 1500);
        }
      },
      error: (err: any) => {
        swal.fire('Error', 'Failed to Assign New UID .', 'error');
        setTimeout(() => { window.location.reload(); }, 1500);
      },
      complete: () => { this.clearFields(); this.reloadGrid2(); }
    });
  }

  DeleteACtion(row: any): void {
    this.newMouid = row.id;
    this.TitleS = row.mouTitle;
    this.recordId = row.id;
    this.ExistingUID = row.uid;
    swal.fire({
      title: 'Delete Reason Remarks',
      input: 'text',
      inputPlaceholder: 'Remarks to delete ...',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      showLoaderOnConfirm: true,
      preConfirm: uid => {
        if (!uid) swal.showValidationMessage('Delete Remarks Are required!');
        return uid;
      },
      allowOutsideClick: () => !swal.isLoading(),
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const fd = new FormData();
        fd.append('RecordId', this.recordId);
        fd.append('Remarks', result.value);
        fd.append('Uid', this.ExistingUID);
        fd.append('Mouid', this.newMouid);
        this.DeleteActionRequest(fd);
      }
    });
  }

  private DeleteActionRequest(formData: FormData): void {
    this.loadingIndicator = true;
    this.mouServices.MOUDeleteAction(formData).subscribe({
      next: (data: any) => {
        if (data?.item1?.[0]?.msg === 'success') {
          swal.fire('Success!', 'Action Applied!', 'success').then(() => setTimeout(() => { window.location.reload(); }, 1500));
        } else {
          swal.fire('Failed!', 'Action Failed!', 'error').then(() => setTimeout(() => { window.location.reload(); }, 1500));
        }
      },
      error: () => swal.fire('Error!', 'An error occurred.', 'error'),
    });
    this.modalService.dismissAll();
    this.loadingIndicator = false;
  }

  // ============================
  // RENEWAL & MODALS LOGIC
  // ============================
  openRenewModal(row: any): void {
    this.isRenewalMode = true;
    this.showSuggestions = false;
    this.filteredEmployeesData = [];
    this.originalMouData = { ...row };
    this.renewalFile = null;
    this.renewalFileBase64 = null;
    this.renewalFileName = '';
    this.renewalFileError = '';

    const startIso = this.parseApiDateToIso(row.mouStartDate) ?? '';
    const endIso = this.parseApiDateToIso(row.mouEndDate) ?? '';

    this.mouForm.patchValue({
      mouId: row.id,
      selectedDivisions: row.schoolDivisionInvolved ? row.schoolDivisionInvolved.split(',') : [],
      mouOrganisation: row.mouTitle,
      startDate: startIso,
      endDate: endIso,
      isIndefinite: row.mouStatus === 'Active' && !row.mouEndDate,
      spocName: row.spocName,
      spocEmail: row.spocEmailId,
      spocContact: row.spocContactNo,
      lpuSpocName: row.lpuSpocName,
      lpuSpocUid: row.lpuSpocUID,
      lpuSpocEmail: row.lpuSpocEmail
    });

    this.mouId = row.id;
    this.AssignedToUid = row.lpuSpocUID;
    this.AssignedToUidName = row.lpuSpocName;
    this.moustatus = row.mouStatus;
    this.MouStartDate = startIso || row.mouStartDate;
    this.MouEndDate = endIso || row.mouEndDate;
    this.isIndefiniteMou = row.mouStatus === 'Active' && !row.mouEndDate;
    this.CurrentSchool = row.schoolDivisionInvolved;

    if (!this.OpenMouRenewalModal) return;
    setTimeout(() => {
      this.modalService.open(this.OpenMouRenewalModal!, { size: 'xl', windowClass: 'modal-xl', backdrop: 'static' }).result.then(() => {
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 200);
      }).catch(() => { });
    }, 0);
  }

  toggleEndDate(): void {
    if (this.isIndefiniteMou) {
      this.MouEndDate = '';
      this.moustatus = 'Active';
    } else {
      this.updateMouStatus();
    }
  }

  onRenewFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      this.renewalFileError = 'Only PDF and Word documents are allowed.';
      return;
    }
    this.renewalFile = file;
    this.renewalFileName = file.name;
    this.renewalFileError = '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.renewalFileBase64 = result.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  onSubmitModal(): void {
    if (this.isRenewalMode) this.onSubmitRenew();
  }

  onSubmitRenew(): void {
    if (this.mouForm.invalid) {
      this.mouForm.markAllAsTouched();
      const invalidFields: string[] = [];
      const controls = this.mouForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) invalidFields.push(name);
      }
      swal.fire({
        title: 'Validation Error',
        html: `<p>Please fill in all required fields:</p><ul class="text-start">${invalidFields.map(f => `<li>${this.getFieldDisplayName(f)}</li>`).join('')}</ul>`,
        icon: 'error'
      });
      return;
    }
    if (!this.renewalFile) {
      swal.fire('Error', 'Please upload a MOU document for renewal.', 'error');
      return;
    }
    if (!this.renewalFileBase64) {
      swal.fire('Error', 'File is still being processed. Please try again.', 'error');
      return;
    }

    const val = this.mouForm.getRawValue();
    let newMouStatus = 'Active';
    const today = new Date();
    const startDate = val.startDate ? new Date(val.startDate) : null;
    const endDate = val.isIndefinite ? null : (val.endDate ? new Date(val.endDate) : null);

    if (val.isIndefinite) newMouStatus = 'Active';
    else if (startDate) {
      if (!endDate || (today >= startDate && today <= endDate)) newMouStatus = 'Active';
      else newMouStatus = 'Expired';
    } else newMouStatus = 'Expired';

    const formData = new FormData();
    formData.append('UID', this.EmployeeCode);
    formData.append('MasterMouId', this.mouId);
    formData.append('RenewalRemark', val.remarks);
    formData.append('FilePath', this.renewalFileName);
    formData.append('File', this.renewalFileBase64);
    formData.append('MouStartDate', val.startDate);
    formData.append('MouEndDate', val.endDate);
    formData.append('MouStatus', newMouStatus);
    formData.append('SchoolDivisionInvolved', val.selectedDivisions.join(','));
    formData.append('SPOCName', val.spocName);
    formData.append('SPOCEmailId', val.spocEmail);
    formData.append('SPOCContactNo', val.spocContact);
    formData.append('LPUSpocName', val.lpuSpocName);
    formData.append('LPUSpocUID', val.lpuSpocUid);
    formData.append('LPUSpocEmail', val.lpuSpocEmail);
    formData.append('CreatedBy', this.EmployeeCode);

    swal.fire({
      title: 'Renew MOU',
      text: 'Are you sure you want to renew this MOU? This will create a new MOU and mark the old one as Renewed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, renew MOU',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.value) {
        this.mouServices.MouRenewalDetails(formData).subscribe({
          next: (data: any) => {
            const resultMsg = data.item1 && data.item1.length > 0 ? data.item1[0].msg : data.responseData;
            if (resultMsg === 'success') {
              swal.fire('Success', 'Renewed MOU.', 'success');
              window.location.reload();
            } else if (data.responseData == 'Failed') {
              swal.fire('Error', 'Failed to create new MOU. Please try again.', 'error');
              window.location.reload();
            }
          },
          error: (err: any) => {
            swal.fire('Error', 'Failed to upload new MOU document.', 'error');
          }
        });
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.mouForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'mouOrganisation': 'Partner Organisation Name',
      'selectedDivisions': 'Divisions Involved',
      'startDate': 'Start Date',
      'endDate': 'End Date',
      'spocName': 'SPOC Name',
      'spocEmail': 'SPOC Email',
      'spocContact': 'SPOC Contact',
      'lpuSpocName': 'LPU SPOC Name',
      'lpuSpocUid': 'LPU SPOC UID',
      'remarks': 'Renew Remarks',
      'mouid': 'Original Mouid',
      'lpuSpocEmail': 'LPU SPOC Email'
    };
    return fieldNames[fieldName] || fieldName;
  }

  updateMouStatus(): void {
    const today = new Date();
    const startDate = this.MouStartDate ? new Date(this.MouStartDate) : null;
    const endDate = this.MouEndDate ? new Date(this.MouEndDate) : null;

    if (this.isIndefiniteMou) {
      this.moustatus = 'Active';
    } else if (startDate) {
      if (!endDate || (today >= startDate && today <= endDate)) this.moustatus = 'Active';
      else this.moustatus = 'Expired';
    } else {
      this.moustatus = 'Expired';
    }
  }

  private parseApiDateToIso(dateVal: any): string | null {
    if (!dateVal) return null;
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal.toISOString().slice(0, 10);
    const direct = new Date(dateVal);
    if (!isNaN(direct.getTime())) return direct.toISOString().slice(0, 10);
    const m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(String(dateVal));
    if (m) {
      const day = m[1].padStart(2, '0');
      const monthName = m[2].toLowerCase().slice(0, 3);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIndex = months.indexOf(monthName);
      if (monthIndex >= 0) {
        const year = m[3];
        return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day}`;
      }
    }
    return null;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  removeNumberPrefix(activityDetails: string): string {
    return activityDetails ? activityDetails.replace(/^\d+-\s*/, '') : '';
  }

  // ============================
  // VARIOUS MODAL OPENS
  // ============================
  OpenAllMouRenewalHistory(row: any): void {
    this.mouId = row.id;
    this.getRenewedMouDetails(row.id);
    this.modalService.open(this.ViewRenewedMouDetailsModal, { size: 'lg', backdrop: 'static' }).result.then(() => { }).catch(() => { window.location.reload(); });
  }

  OpenAllMouRenewalHistoryTab2(row: any): void {
    this.mouId = row.id;
    this.getRenewedMouDetails(row.id);
    this.modalService.open(this.ViewRenewedMouDetailsModal, { size: 'lg', backdrop: 'static' }).result.then(() => { }).catch(() => { window.location.reload(); });
  }

  getRenewedMouDetails(mouId: any): void {
    this.mouServices.GetRenewedMouDetails(mouId).subscribe((response: any) => {
      if (response.item1.length > 0) this.renewedMouDocumentDetails = response.item1;
      else this.renewedMouDocumentDetails = [];
    });
  }

  onSelect(a: any) {
    this.mouId = a['mouId'];
    this.CurrentMouTitle = a['mouTitle'];
    this.modalService.open(this.viewDescModal, { size: 'lg' });
  }

  AssignUid(rows: any) {
    this.MouidX = rows['mouId'];
    this.IdX = rows['id'];
    this.MouTitleX = rows['mouTitle'];
    this.StartDateX = rows['startDate'];
    this.EndDateX = rows['endDate'];
    this.ActivityDetailsX = rows['activityDetails'];
    this.RemarksX = rows['remarks'];
    this.modalService.open(this.AssignNewUIDModal, { size: 'lg' }).result.then(() => window.location.reload()).catch(() => { });
  }

  ViewAllActionTaken(rows: any) {
    this.MouidX = rows['mouId'];
    this.GetAllActionDetails(this.MouidX);
    this.modalService.open(this.viewMouActivityActionTakenModal, { size: 'lg' }).result.then(() => { window.location.reload(); }).catch(() => { });
  }

  GetAllActionDetails(id: any) {
    this.loadingIndicator = true;
    this.allMouActionTakenDetails = [];
    this.mouServices.GetMouActivityActionTakenDetails(id).subscribe({
      next: (response: any) => {
        const data = response?.item1 || (Array.isArray(response) ? response : []);
        if (data && data.length > 0) {
          this.dataSource = data;
          this.allMouActionTakenDetails = data;
        } else {
          this.allMouActionTakenDetails = [];
        }
        this.loadingIndicator = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('GetAllActionDetails error:', err);
        this.allMouActionTakenDetails = [];
        this.loadingIndicator = false;
        this.cdr.detectChanges();
      }
    });
  }

  openActivityModal(row: any): void {
    this.selectedRow = row;
    this.modalService.open(this.activityModal, { size: 'lg' }).result.then(() => { });
  }

  ModifyFaculty(row: any) {
    this.newMouid = row.mouId;
    this.TitleS = row.mouTitle;
    this.recordId = row.id;
    this.StartDate3 = row.startDate;
    this.EndDate3 = row.endDate;
    this.ExistingUID = row.uid;
    this.employeeControl3.setValue('');
    this.remarks3 = '';
    this.filteredEmployeesData3 = [];
    this.showSuggestions3 = false;
    this.activeSuggestionIndex3 = -1;
    this.ResponsiblePerson3 = '';
    this.AssignedToUid3 = '';
    this.modalService.open(this.ModifyFacultyModal, { size: 'lg', backdrop: 'static' }).result.then(() => {
      setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 200);
    }, () => { });
  }

  // ============================
  // EXPORTS
  // ============================
  exportToExcel(data: any[], type: 'tab2' | 'tab3'): void {
    const fileName = 'Mou Plan Report.xlsx';
    const exportedData = data.map(item => ({
      NewMOUId: item.newMouId ?? 'N/A',
      OldMOUId: "MOU/" + item.mouId,
      'Name of Mou Organisation': item.mouTitle,
      'MOU Activity Assigned to Faculty UID': item.uid,
      'MOU Activity Assigned BY ': item.actionAssignedBy,
      'Assigned Date': item.createdOn,
      'Activity Start Date': item.startDate,
      'Activity End Date': item.endDate,
      'Remarks': item.remarks,
      'Details of Allocated MOU Activity': this.removeNumberPrefix(item.activityDetails),
      'Session': item.sessionAcademicYear,
    }));
    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, fileName);
  }

  exportTab1(): void { this.exportToExcelLegacy(this.MouActivityDocumentsMaster); }
  exportTab2(): void { this.exportToExcel(this.filteredMouActivityAssignedMe, 'tab2'); }
  exportTab3(): void { this.exportToExcel(this.filteredMouActivityAssignedOthers, 'tab3'); }

  exportToExcelLegacy(data: any[]): void {
    const exportedData = data.map(item => ({
      NewMOUId: item.newMouId ?? 'N/A',
      OldMOUId: "MOU/" + item.mouId,
      MouStatus: item.mouStatus,
      'Name of Mou Organisation': item.mouTitle,
      'Uploaded By': item.createdBy ?? 'N/A',
      'SPOC Name': item.spocName ?? 'N/A',
      'SPOC Email': item.spocEmailId ?? 'N/A',
      'SPOC Contact': item.spocContactNo ?? 'N/A',
      'Action Status': item.isApproved == 1 ? 'Approved' : 'Pending',
      'Approval Date': item.approvalDate ?? 'N/A',
      'Start': item.mouStartDate, 'End': item.mouEndDate,
      'Link': item.filePath
    }));
    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Mou_Report.xlsx');
  }

  // ============================
  // HELPERS
  // ============================
  LoginFailed(_NewError: any) {
    this.isLoginFailed = true;
    swal.fire({ title: 'Login Failed', text: 'Login details are Invalid!', icon: 'warning' });
    const element = document.getElementById('ActivityPage');
    if (element) element.hidden = true;
  }

  private showAlert(title: string, icon: 'success' | 'error', reload: boolean = false) {
    swal.fire({ title, icon }).then(() => { if (reload) window.location.reload(); });
  }

  onSelectFile(a: any) { window.open(a.filePath, '_blank'); }
  onSelectFileX(a: any) { window.open(this.ServerUrl + a.filePath, '_blank'); }
  onSelectActivityDocument(a: any) { window.open(a.actionTakenDocument, '_blank'); }
  onActivitySelected(event: any) { this.selectedActivityId = event.target.value; }

  onDownloadFile(remoteUrl: string): void {
    swal.fire({ title: 'Downloading...', didOpen: () => { swal.showLoading(null); } });
    this.mouServices.downloadMOUFile(remoteUrl).subscribe({
      next: (blob: Blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        const fileName = remoteUrl.split('/').pop() || 'Document.pdf';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        swal.close();
      },
      error: async (err: any) => {
        swal.close();
        if (err.error instanceof Blob) {
          const errorMsg = JSON.parse(await err.error.text());
          swal.fire('Error', errorMsg.message || 'Download failed', 'error');
        } else {
          swal.fire('Error', 'Could not connect to the server', 'error');
        }
      }
    });
  }

  // ============================
  // EMAILS
  // ============================
  ReminderEmailTab2(rows: any) {
    if (!rows) return;
    const key = String(rows?.id ?? rows?.mouId ?? '');
    if (this.reminderSending[key]) return;
    if (this.reminderDisabled[key]) return;
    this.reminderSending[key] = true;

    this.MouidX = rows?.mouId ?? '';
    const uid = rows?.uid ?? '';
    const AssignedBy = rows?.actionAssignedBy ?? '';
    this.MouTitleX = rows?.mouTitle ?? '';
    this.StartDateX = rows?.startDate ?? '';
    this.EndDateX = rows?.endDate ?? '';
    this.ActivityDetailsX = rows?.activityDetails ?? '';
    this.RemarksX = rows?.remarks ?? '';

    const formData = new FormData();
    formData.append('MouId', this.MouidX);
    formData.append('Id', rows.id);
    formData.append('Uid', uid);
    formData.append('Remarks', this.RemarksX);
    formData.append('StartDate', this.StartDateX);
    formData.append('EndDate', this.EndDateX);
    formData.append('CreatedBy', AssignedBy);
    formData.append('IpAddress', '');
    formData.append('ActionAssignedBy', AssignedBy);
    formData.append('ActivityDetails', this.ActivityDetailsX);

    this.mouServices.MouReminderEmail(formData).subscribe({
      next: (data: any) => {
        const result = data?.item1?.[0]?.msg;
        if (result === 'Successfully' || result === 'success') {
          this.reminderDisabled[key] = true;
          this.showAlert('Reminder Email Sent Successfully!', 'success');
        } else {
          this.reminderDisabled[key] = false;
          this.showAlert('Failed to Send Email!', 'error');
        }
      },
      error: (err: any) => {
        this.reminderDisabled[key] = false;
        this.showAlert('Something went wrong', 'error');
      },
      complete: () => {
        this.reminderSending[key] = false;
        this.clearFields();
        this.reloadGrid2();
      }
    });
  }

  ReminderEmailTab1(rows: any) {
    if (!rows) return;
    this.MouidX = rows?.mouId ?? '';
    const uid = rows?.uid ?? '';
    const AssignedBy = rows?.approvedBy ?? '';
    this.MouTitleX = rows?.mouTitle ?? '';
    this.StartDateX = rows?.mouStartDate ?? '';
    this.EndDateX = rows?.mouEndDate ?? '';
    this.ActivityDetailsX = rows?.activityDetails ?? '';
    this.RemarksX = rows?.remarks ?? '';

    const formData = new FormData();
    formData.append('MouId', this.MouidX);
    formData.append('Uid', uid);
    formData.append('Remarks', this.RemarksX);
    formData.append('StartDate', this.StartDateX);
    formData.append('EndDate', this.EndDateX);
    formData.append('CreatedBy', AssignedBy);
    formData.append('IpAddress', '');
    formData.append('ActionAssignedBy', AssignedBy);
    formData.append('ActivityDetails', this.ActivityDetailsX);

    this.mouServices.MouReminderEmail(formData).subscribe({
      next: (data: any) => {
        if (data?.item1?.[0]?.msg === 'success') {
          this.showAlert('Reminder Email Sent Successfully!', 'success');
        }
      },
      error: (err: any) => {
        this.showAlert('Something went wrong', 'error');
      },
      complete: () => this.clearFields()
    });
  }

  // ============================
  // SCROLL SYNC
  // ============================
  calculateScrollWidth(): void {
    if (!this.tableWrapper) return;
    const body = this.tableWrapper.nativeElement.querySelector('.datatable-body');
    if (!body) return;
    this.tableScrollWidth = body.scrollWidth;
  }
  syncTopScroll(): void {
    if (this.syncing) return;
    this.syncing = true;
    this.tableWrapper.nativeElement.scrollLeft = this.topScroll.nativeElement.scrollLeft;
    requestAnimationFrame(() => this.syncing = false);
  }
  syncBottomScroll(): void {
    if (this.syncing) return;
    this.syncing = true;
    this.topScroll.nativeElement.scrollLeft = this.tableWrapper.nativeElement.scrollLeft;
    requestAnimationFrame(() => this.syncing = false);
  }

  constructor(
    private lpuPlannerServiceService: LpuPlannerServiceService,
    private fb: FormBuilder,
    @Inject(DOCUMENT) private _document: Document,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private authService: AuthService,
    private modalService: NgbModal,
    private mouServices: MouServices, // Swapped MouDocumentsService for MouServices
    private cdr: ChangeDetectorRef
  ) { }


}

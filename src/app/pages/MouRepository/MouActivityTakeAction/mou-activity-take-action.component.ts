import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DOCUMENT } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatTableDataSource } from '@angular/material/table';
import { NgSelectModule } from '@ng-select/ng-select';
import swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { MouServices } from '../../../services/mou-services';
import { AuthService } from '../../../services/auth.service';
import { StorageService } from '../../../services/storage.service';
import { LpuPlannerServiceService } from '../../../services/lpu-planner-service.service';
import { Employee, MouActivity, MouCategory, SchoolDivision } from './models/mou-activity.model';
import { mouActivities } from './models/mou-activities.data';

@Component({
  selector: 'app-mou-activity-take-action',
  templateUrl: './mou-activity-take-action.component.html',
  styleUrls: ['./mou-activity-take-action.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    NgSelectModule
  ],
  providers: [
    DatePipe
  ]
})
export class MouActivityTakeActionComponent implements OnInit {
  // === TEMPLATE REFS ===
  @ViewChild('viewDescModal') viewDescModal!: TemplateRef<any>;
  @ViewChild('viewAllActionTakenUploadedDocumentModal') viewAllActionTakenUploadedDocumentModal!: TemplateRef<any>;
  @ViewChild('viewActivityActionTakenModal') viewActivityActionTakenModal!: TemplateRef<any>;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // === STATE & FLAGS ===
  activeTab: number = 1;
  isLoading: boolean = true;
  isLoginFailed = false;
  loadingIndicator = false;
  showNoDataFoundMessage = false;

  switchTab(tabIndex: number): void {
    this.activeTab = tabIndex;
    if (tabIndex === 2) {
      this.MyActionTkenData();
    }
    this.cdRef.detectChanges();
  }

  EmployeeDetails: any[] = [];
  EmployeeName: string = '';
  EmployeeCode: string = '';
  Department: string = '';
  DepartmentName: string = '';
  ServerUrl = 'http://files.lpu/umsweb/webftp/MOUDocuments/';

  mouActivities: MouActivity[] = mouActivities;
  selectedActivityId: number = 0;
  ColumnMode = ColumnMode;
  columns: any[] = [];
  headHtmlData: any[] = [];
  dataSource = new MatTableDataSource<any>();

  // === TAB 1: TAKE ACTION ===
  MouActivityDocumentsMaster: any[] = [];
  MouActivityDocuments: any[] = [];
  filteredMouActivityDocuments: any[] = [];
  Tab1StatusFilterTakeAction: string = 'all';
  SelectedMouCategoryTakeAction: any = 'All';
  searchQuery: string = '';

  // === TAB 2: MY ACTION TAKEN ===
  MouActionTakenDocumentsMaster: any[] = [];
  MouActionTakenDocuments: any[] = [];
  filteredMouActionTakenDocuments: any[] = [];
  Tab1statusFilter: string = 'all';
  SelectedMouCategoryActionTaken: any = 'All';
  selectedPlannerSession: any = '0';
  allPlannerSessions: any[] = [];
  AllMouCategories: MouCategory[] = [];
  allSchoolDivisions: SchoolDivision[] = [];
  AllProjectDocumentUploaded: any[] = [];

  // === MODAL FORM & ACTION STATE ===
  mouId: any = '';
  ActivityDetails: any = '';
  DocumentName: string = '';
  ExpectedstartDate: any = '';
  ExpectedEndDate: any = '';
  UploadedFileUrl: any = '';
  CurrentApprovalStatus: any;
  CurrentdisapprovalReason: any = '';
  MouStatus: any = '';
  PresentDate: any = '';
  CompletedDate: any = '';
  endDate: any = '';
  FacultyActivityStartDate: string = '';
  FacultyActivityEndDate: string = '';
  Remarks: string = '';
  sessionId: any = '';
  Activity: any = '';
  selectedActivityType: string = '';
  ParticipantsCount: any = '';
  ActivitiesSubmitted: any = '';

  fileData: File | null = null;
  FileData: any = null;
  fileName: string = '';
  fileStatus: boolean = false;
  fileChosen: { [key: number]: boolean } = {};
  uploadEnabled: boolean = false;

  items: any[] = []; // OBP planner sessions for form
  Activities: any[] = []; // Mou activities list from API

  // === MULTI-DOCUMENT UPLOAD STATE ===
  selectedDocuments: string[] = [];
  uploadedDocuments: string[] = [];
  allDocumentsUploaded: boolean = false;
  uploadedFileNames: { [key: string]: string } = {};
  ActivityFileData: any[] = [];
  ActivityFileName: any[] = [];
  ActivityFileStatus: boolean[] = [];

  activityDocuments: { [key: string]: string[] } = {
    'Research publication': [
      'Research-Paper',
      'Conference-Certificate',
      'Conference-Brochure'
    ],
    'Project ': [
      'Project-Report',
      'List-of-Students'
    ],
    'Academic exchange': [
      'Appointment-Letter',
      'Activity-Report',
      'Photographs'
    ],
    'Student exchange ': [
      'Letter-of-Acceptance',
      'Course-Completion-Certificate',
      'Student-Registration-Numbers'
    ],
    'Guest lecture ': [
      'Event-Report',
      'Participant-List',
      'Photographs'
    ],
    'Workshop ': [
      'Workshop-Report',
      'Attendance-Sheet',
      'Photographs'
    ],
    'Internship ': [
      'Internship-Certificate',
      'Student-Registration Number'
    ],
    'On job Training (OJT) ': [
      'Offer-Letter',
      'Joining-Letter',
      'Student-Registration-Number'
    ],
    'Co-Supervision ': [
      'Research-Paper',
      'NOC',
      'Undertaking'
    ],
    'Related to SDG ': [
      'Activity-Report',
      'Supporting-Documents'
    ],
    'Conference': [
      'Conference-Certificate',
      'Conference-Brochure',
      'Photographs'
    ],
    'Others': [
      'Supporting-Documents'
    ]
  };

  takeActionForm!: FormGroup;

  constructor(
    private mouServices: MouServices,
    private authService: AuthService,
    private storageService: StorageService,
    private lpuPlannerServiceService: LpuPlannerServiceService,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.mouActivities = mouActivities;
    const currentDate = new Date();
    this.CompletedDate = this.endDate = this.formatDate(currentDate);

    // Safety timeout: if loading takes > 6s, force hide fullscreen loader & trigger change detection
    setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.cdRef.detectChanges();
      }
    }, 6000);

    const loginName = this.route.snapshot.params['loginName'];
    if (loginName && loginName !== '') {
      this.getToken(loginName);
      const stMain = this.document.getElementById('stMain');
      if (stMain) {
        stMain.innerHTML = '<span class="themeClr">MOU </span>Activity Take <span class="themeClr">Action </span>';
      }
      const imgLogo = this.document.getElementById('imgLogo');
      if (imgLogo) {
        imgLogo.style.width = '164px';
      }
    } else {
      this.GetEmployeeDetails();
      this.getAllPlannerSession();
      this.GetAllCategories();
    }

    this.takeActionForm = this.fb.group({
      mouActivity: ['', Validators.required],
      remarks: ['', [Validators.required, Validators.minLength(10)]],
      completedDate: ['', Validators.required],
      file: [null],
      sessionId: ['', Validators.required],
      Activity: ['', Validators.required],
      FacultyActivityStartDate: ['', Validators.required],
      FacultyActivityEndDate: ['', Validators.required],
      ParticipantsCount: ['', [Validators.required, Validators.min(1)]],
      ActivitiesSubmitted: ['', [Validators.required, Validators.min(1)]]
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = this.padZero(date.getMonth() + 1);
    const day = this.padZero(date.getDate());
    return `${year}-${month}-${day}`;
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  getToken(id: any): void {
    this.authService.loginTemp(id).subscribe({
      next: data => {
        this.storageService.saveUser(data);
        this.getAllPlannerSession();
        this.GetEmployeeDetails();
        this.GetAllCategories();
      },
      error: err => {
        this.LoginFailed(err);
      }
    });
  }

  LoginFailed(err: any): void {
    this.isLoginFailed = true;
    this.isLoading = false;
    this.cdRef.detectChanges();
    swal.fire({
      title: 'Login Failed',
      text: 'Login details are Invalid!',
      icon: 'warning'
    });
    const element = this.document.getElementById('ActivityTakeActionPage');
    if (element) {
      element.hidden = true;
    }
  }

  GetEmployeeDetails(): void {
    this.mouServices.GetEmployeeDetails().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.EmployeeDetails = response.item1;
          this.EmployeeName = response.item1[0].employeeName;
          this.EmployeeCode = response.item1[0].employeeCode;
          this.Department = response.item1[0].department;
          this.DepartmentName = response.item1[0].departmentName;
          this.loadingIndicator = false;
          this.showNoDataFoundMessage = false;
          this.isLoginFailed = false;

          this.GetAllMouDocumentsForActions();
          this.getDropdownData();
          this.getAllMouActivities();
          this.GetAllActivities();
          this.GetAllMouActionsTaken();


          this.cdRef.detectChanges();
        } else {
          this.EmployeeDetails = [];
          this.showNoDataFoundMessage = true;
          this.isLoginFailed = true;
          this.isLoading = false;
          this.cdRef.detectChanges();
        }
      },
      error: err => {
        this.LoginFailed(err);
      }
    });
  }

  GetAllCategories(): void {
    this.mouServices.GetMouCategories().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.AllMouCategories = response.item1.map((x: any, index: number) => ({
            id: index + 1,
            CategoryName: x.items
          }));
        } else {
          this.AllMouCategories = [];
        }
      },
      error: err => {
        this.LoginFailed(err);
      }
    });
  }

  private matchMouCategory(item: any, selected: any): boolean {
    if (!selected || selected === 'All') {
      return true;
    }
    const categoryName = typeof selected === 'string' ? selected : selected.CategoryName;
    return String(item.mouCategory ?? '').toLowerCase() === categoryName.toLowerCase();
  }

  onCategoryChangeTakeAction(): void {
    this.applyFiltersTakeAction();
  }

  onCategoryChangeActionTaken(): void {
    this.applyFiltersTab1();
  }

  onStatusChangeTakeAction(value: string): void {
    this.Tab1StatusFilterTakeAction = value;
    this.applyFiltersTakeAction();
  }

  applyFiltersTakeAction(): void {
    let filtered = (this.MouActivityDocumentsMaster || []).slice();

    if (this.Tab1StatusFilterTakeAction && this.Tab1StatusFilterTakeAction !== 'all') {
      const status = this.Tab1StatusFilterTakeAction.toLowerCase();
      filtered = filtered.filter(item => {
        const mouStatus = (item.mouStatus || '').toString().toLowerCase();
        if (status === 'active') return mouStatus === 'active';
        if (status === 'expired') return mouStatus === 'expired';
        if (status === 'renewed') return mouStatus === 'renewed';
        return true;
      });
    }

    filtered = filtered.filter(item => this.matchMouCategory(item, this.SelectedMouCategoryTakeAction));

    const query = (this.searchQuery || '').toString().trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((item: any) => {
        return Object.entries(item).some(([_, val]) => {
          if (val !== null && val !== undefined) {
            return String(val).toLowerCase().includes(query);
          }
          return false;
        });
      });
    }

    this.filteredMouActivityDocuments = filtered;
  }

  private getStatusFromItem(item: any): string {
    if (!item) return '';
    const status = item.mouStatus ?? item.MouStatus ?? item.status ?? item.mou_status ?? item.mouApprovalStatus ?? '';
    return String(status).trim().toLowerCase();
  }

  getActiveCountTakeAction(): number {
    const master = (this.MouActivityDocumentsMaster && this.MouActivityDocumentsMaster.length > 0)
      ? this.MouActivityDocumentsMaster
      : (this.filteredMouActivityDocuments || []);
    return master.filter(item => this.getStatusFromItem(item) === 'active').length;
  }

  getExpiredCountTakeAction(): number {
    const master = (this.MouActivityDocumentsMaster && this.MouActivityDocumentsMaster.length > 0)
      ? this.MouActivityDocumentsMaster
      : (this.filteredMouActivityDocuments || []);
    return master.filter(item => this.getStatusFromItem(item) === 'expired').length;
  }

  getRenewedCountTakeAction(): number {
    const master = (this.MouActivityDocumentsMaster && this.MouActivityDocumentsMaster.length > 0)
      ? this.MouActivityDocumentsMaster
      : (this.filteredMouActivityDocuments || []);
    return master.filter(item => this.getStatusFromItem(item) === 'renewed').length;
  }

  getActiveCount(): number {
    const master = (this.MouActionTakenDocumentsMaster && this.MouActionTakenDocumentsMaster.length > 0)
      ? this.MouActionTakenDocumentsMaster
      : (this.filteredMouActionTakenDocuments || []);

    return master.filter(item => this.getStatusFromItem(item) === 'active').length;
  }

  getExpiredCount(): number {
    const master = (this.MouActionTakenDocumentsMaster && this.MouActionTakenDocumentsMaster.length > 0)
      ? this.MouActionTakenDocumentsMaster
      : (this.filteredMouActionTakenDocuments || []);
    return master.filter(item => this.getStatusFromItem(item) === 'expired').length;
  }

  getRenewedCount(): number {
    const master = (this.MouActionTakenDocumentsMaster && this.MouActionTakenDocumentsMaster.length > 0)
      ? this.MouActionTakenDocumentsMaster
      : (this.filteredMouActionTakenDocuments || []);
    return master.filter(item => this.getStatusFromItem(item) === 'renewed').length;
  }

  GetAllMouDocumentsForActions(): void {
    this.mouServices.MouDocumentstoTakeAction(this.EmployeeCode).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.MouActivityDocumentsMaster = response.item1;
          this.MouActivityDocuments = response.item1;
          this.applyFiltersTakeAction();
          this.dataSource.data = this.MouActivityDocuments;
          this.loadingIndicator = false;
        } else {
          this.dataSource.data = [];
          this.MouActivityDocuments = [];
          this.filteredMouActivityDocuments = [];
          this.MouActivityDocumentsMaster = [];
          this.showNoDataFoundMessage = true;
        }
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error: err => {
        this.isLoading = false;
        this.cdRef.detectChanges();
        this.LoginFailed(err);
      }
    });
  }

  onStatusChangeTab1(value: string): void {
    this.Tab1statusFilter = value;
    this.applyFiltersTab1();
  }

  applyFiltersTab1(): void {
    let filtered = (this.MouActionTakenDocumentsMaster || []).slice();

    if (this.Tab1statusFilter && this.Tab1statusFilter !== 'all') {
      const status = this.Tab1statusFilter.toLowerCase();
      filtered = filtered.filter(item => {
        const mouStatus = (item.mouStatus || '').toString().toLowerCase();
        if (status === 'active') return mouStatus === 'active';
        if (status === 'expired') return mouStatus === 'expired';
        if (status === 'renewed') return mouStatus === 'renewed';
        return true;
      });
    }

    filtered = filtered.filter(item => this.matchMouCategory(item, this.SelectedMouCategoryActionTaken));

    const query = (this.searchQuery || '').toString().trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((item: any) => {
        return Object.entries(item).some(([key, val]) => {
          if (val !== null && val !== undefined) {
            const valueString = String(val).toLowerCase();
            if (key === 'mouId' || key === 'id') {
              const numericId = Number(val);
              if (!isNaN(numericId) && (numericId.toString().includes(query) || `mou/${numericId}`.includes(query))) {
                return true;
              }
            }
            return valueString.includes(query);
          }
          return false;
        });
      });
    }

    this.filteredMouActionTakenDocuments = filtered;
  }

  GetAllMouActionsTaken(): void {
    this.loadingIndicator = true;
    this.showNoDataFoundMessage = false;

    this.mouServices.MouActionsTakenData(this.EmployeeCode, this.selectedPlannerSession).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.MouActionTakenDocumentsMaster = response.item1;
          this.MouActionTakenDocuments = response.item1;
          this.applyFiltersTab1();
          this.dataSource.data = this.MouActionTakenDocuments;
          this.showNoDataFoundMessage = false;
        } else {
          this.dataSource.data = [];
          this.filteredMouActionTakenDocuments = [];
          this.MouActionTakenDocuments = [];
          this.MouActionTakenDocumentsMaster = [];
          this.showNoDataFoundMessage = true;
        }
        this.loadingIndicator = false;
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error: err => {
        this.dataSource.data = [];
        this.filteredMouActionTakenDocuments = [];
        this.MouActionTakenDocuments = [];
        this.MouActionTakenDocumentsMaster = [];
        this.showNoDataFoundMessage = true;
        this.loadingIndicator = false;
        this.isLoading = false;
        this.cdRef.detectChanges();
        this.LoginFailed(err);
      }
    });
  }

  MyActionTkenData(): void {
    this.GetAllMouActionsTaken();
  }

  getDropdownData(): void {
    this.mouServices.GetAllOBPPlannerSessions().subscribe({
      next: response => {
        if (response.item1) {
          this.items = response.item1;
        }
      }
    });
  }

  getAllMouActivities(): void {
    this.mouServices.GetAllMouActivities().subscribe({
      next: response => {
        if (response.item1) {
          this.Activities = response.item1;
        }
      }
    });
  }

  GetAllActivities(): void {
    this.lpuPlannerServiceService.GetSchoolDivisions().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.allSchoolDivisions = response.item1;
        } else {
          this.allSchoolDivisions = [];
        }
      }
    });
  }

  getAllPlannerSession(): void {
    this.mouServices.GetAllOBPPlannerSessions().subscribe({
      next: response => {
        if (response.item1) {
          this.allPlannerSessions = response.item1;
        }
      }
    });
  }

  setSessionId(event: any): void {
    const selectedId = event.target.value;
    this.selectedPlannerSession = selectedId;
    this.GetAllMouActionsTaken();
  }

  onSelect(a: any): void {
    this.selectedActivityId = 0;
    this.selectedDocuments = [];
    this.uploadedDocuments = [];
    this.uploadedFileNames = {};
    this.ActivityFileData = [];
    this.ActivityFileName = [];
    this.ActivityFileStatus = [];

    this.mouId = a['mouId'];
    this.ActivityDetails = a['activityDetails'];
    if (this.ActivityDetails && this.ActivityDetails.length > 0) {
      const [id, description] = this.ActivityDetails.split('-', 2);
      this.selectedActivityId = parseInt(id, 10);
      this.DocumentName = description || '';
    }

    this.ExpectedstartDate = a['startDate'];
    this.ExpectedEndDate = a['endDate'];
    this.UploadedFileUrl = a['filePath'];
    this.CurrentApprovalStatus = a['approvalStatus'];
    this.CurrentdisapprovalReason = a['disapprovalReason'];
    this.MouStatus = a['mouStatus'] == null ? 'NA' : a['mouStatus'];
    this.PresentDate = this.datePipe.transform(new Date(), 'dd-MMM-yyyy');

    this.cdRef.detectChanges();
    this.modalService.open(this.viewDescModal, { size: 'lg', backdrop: 'static' }).result.then(() => {
      window.location.reload();
    }).catch(() => { });
  }

  onActivitySelected(event: any): void {
    this.selectedActivityId = event.target.value;
    const selectedActivity = this.mouActivities.find(act => act.id === +this.selectedActivityId);
    if (selectedActivity) {
      this.DocumentName = selectedActivity.description;
    }
  }

  testClick(a: any): void {
    if (!a) return;
    const fileUrl = `assets/MouTemplateDocuments/${this.selectedActivityId}.zip`;
    const link = document.createElement('a');
    const selectedActivity = this.mouActivities.find(act => act.id === +a);
    if (selectedActivity) {
      this.DocumentName = selectedActivity.description;
    }
    link.href = fileUrl;
    link.download = `${this.selectedActivityId}.zip`;
    link.click();
  }

  onActivityChange(activityTitle: string): void {
    this.selectedDocuments = this.activityDocuments[activityTitle] || [];
    this.uploadedDocuments = [];
    this.uploadedFileNames = {};
    this.ActivityFileData = [];
    this.ActivityFileName = [];
    this.ActivityFileStatus = [];
    this.allDocumentsUploaded = false;
  }

  onFileSelectedActivityFile(event: any, index: number): void {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;

    if (!file) {
      this.ActivityFileName[index] = '';
      this.ActivityFileData[index] = '';
      this.ActivityFileStatus[index] = false;
      return;
    }

    if (file.size > 3148576) {
      swal.fire({
        title: 'File size exceeds 3MB. Please upload a smaller file.',
        text: 'Invalid File size',
        icon: 'warning'
      });
      target.value = '';
      return;
    }

    let modifiedFile = file;
    let validFileName = file.name;
    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;

    if (!fileNameRegex.test(file.name)) {
      validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      modifiedFile = new File([file], validFileName, { type: file.type });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(modifiedFile);
      target.files = dataTransfer.files;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        const base64Data = result.split(',')[1];
        this.ActivityFileData[index] = base64Data;
        this.ActivityFileName[index] = validFileName;
        this.ActivityFileStatus[index] = true;
      }
    };
    reader.readAsDataURL(modifiedFile);
  }

  uploadRequiredDocument(documentName: string, index: number): void {
    if (!this.ActivityFileData[index] || !this.ActivityFileName[index]) {
      swal.fire({
        title: 'Please select a file first.',
        icon: 'warning'
      });
      return;
    }

    const formData = new FormData();
    formData.append('DocumentName', documentName);
    formData.append('MouId', this.mouId);
    formData.append('Uid', this.EmployeeCode);
    formData.append('FilePath', this.ActivityFileName[index]);
    formData.append('FileData', this.ActivityFileData[index]);
    formData.append('Action', 'Insert');

    this.mouServices.MouActionTakenDocumentsOperations(formData).subscribe({
      next: () => {
        if (!this.uploadedDocuments.includes(documentName)) {
          this.uploadedDocuments.push(documentName);
        }
        this.uploadedFileNames[documentName] = this.ActivityFileName[index];
        this.allDocumentsUploaded = this.uploadedDocuments.length === this.selectedDocuments.length;

        swal.fire({
          title: 'Success',
          text: documentName + ' uploaded successfully',
          icon: 'success'
        });
      },
      error: err => {
        console.error(err);
        swal.fire({
          title: 'Upload Failed',
          text: 'Unable to upload document.',
          icon: 'error'
        });
      }
    });
  }

  onFileSelected(event: any): void {
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)?.[0] || null;

    if (file) {
      if (file.size > 5001576) {
        swal.fire({
          title: 'File size exceeds 5MB. Please upload a smaller file.',
          text: 'Invalid File size',
          icon: 'warning'
        });
        target.value = '';
        this.fileData = null;
        this.fileStatus = false;
        this.checkFormValidity();
        return;
      }

      const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
      if (!fileNameRegex.test(file.name)) {
        const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const modifiedFile = new File([file], validFileName, { type: file.type });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(modifiedFile);
        target.files = dataTransfer.files;
        this.fileData = modifiedFile;
        this.fileName = validFileName;
      } else {
        this.fileData = file;
        this.fileName = file.name;
      }

      reader.readAsDataURL(this.fileData);
      reader.onload = () => {
        const result = reader.result as string;
        const resultArray = result.split(',');
        this.FileData = resultArray[1];
        this.fileStatus = true;
        this.checkFormValidity();
      };
    } else {
      this.fileData = null;
      this.fileStatus = false;
      this.checkFormValidity();
    }
  }

  isFieldInvalid(control: any): boolean {
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  checkFormsValidity(): void {
    if (
      this.FacultyActivityStartDate &&
      this.FacultyActivityEndDate &&
      new Date(this.FacultyActivityStartDate) > new Date(this.FacultyActivityEndDate)
    ) {
      swal.fire({
        title: 'Validation',
        text: 'Faculty Activity End Date must be greater than or equal to Start Date.',
        icon: 'warning'
      });
      this.FacultyActivityEndDate = '';
    }
  }

  checkFormValidity(): void {
    this.uploadEnabled =
      this.mouId !== '' &&
      this.Remarks?.length >= 4 &&
      this.DocumentName !== '' &&
      this.CompletedDate !== '' &&
      this.fileData != null &&
      this.FacultyActivityStartDate !== '' &&
      this.FacultyActivityEndDate !== '';
  }

  UploadActivity(form: NgForm): void {
    if (form.invalid) {
      swal.fire({
        title: 'Validation',
        text: 'Please complete all mandatory fields.',
        icon: 'warning'
      });
      return;
    }

    const formData = new FormData();
    formData.append('MouId', this.mouId);
    formData.append('Uid', this.EmployeeCode);
    formData.append('CompletedDate', this.CompletedDate);
    formData.append('FilePath', this.fileName);
    formData.append('File', this.FileData);
    formData.append('DocumentName', this.DocumentName ? this.DocumentName : this.Activity);
    formData.append('Remarks', this.Remarks);
    formData.append('MouStatus', this.MouStatus);
    formData.append('SessionId', this.sessionId);
    formData.append('ActivityTitle', this.Activity);
    formData.append('ActivityCategory', this.selectedActivityType);
    formData.append('ParticipantsCount', this.ParticipantsCount);
    formData.append('ActivityCount', this.ActivitiesSubmitted);
    formData.append('FacultyActivityStartDate', this.FacultyActivityStartDate);
    formData.append('FacultyActivityEndDate', this.FacultyActivityEndDate);

    this.mouServices.InsertMouActivityActionTaken(formData).subscribe({
      next: (data: any) => {
        const result = data.item1?.[0]?.['msg'];
        if (result === 'success') {
          swal.fire({
            title: 'Action Planned Stored Successfully!',
            icon: 'success'
          }).then(() => {
            window.location.reload();
          });
        } else if (result === '-1') {
          swal.fire({
            title: 'Error in File Upload Try again Later',
            icon: 'error'
          }).then(() => {
            window.location.reload();
          });
        } else {
          swal.fire({
            title: 'Something Went Wrong, Try again later',
            icon: 'error'
          }).then(() => {
            window.location.reload();
          });
        }
      },
      error: () => {
        swal.fire({
          title: 'Error',
          text: 'Failed to Upload.',
          icon: 'error'
        }).then(() => {
          window.location.reload();
        });
      },
      complete: () => {
        this.clearFields();
      }
    });
  }

  clearFields(): void {
    this.mouId = '';
    this.CompletedDate = '';
    const actId = this.selectedActivityId;

    if (actId === 11 || actId === 12 || actId === 23 || actId === 14) {
      swal.fire({
        title: 'Since this Activity is also involved IQAC Interface, redirecting to IQAC interface',
        text: 'You are kindly requested to fill the details in IQAC.',
        icon: 'success'
      }).then(() => {
        window.location.href = 'https://ums.lpu.in/lpuums/frmIQACdetails.aspx';
      });
    }
  }

  resetForm(): void {
    this.selectedActivityId = 0;
    this.FacultyActivityStartDate = '';
    this.FacultyActivityEndDate = '';
    this.Remarks = '';
    this.sessionId = '';
    this.Activity = '';
    this.selectedActivityType = '';
    this.fileName = '';
    this.FileData = null;
    this.selectedDocuments = [];
    this.uploadedDocuments = [];
    this.uploadedFileNames = {};
  }

  onDownloadFile(remoteUrl: string): void {
    if (!remoteUrl) return;
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
      error: async (err) => {
        swal.close();
        if (err.error instanceof Blob) {
          try {
            const errorMsg = JSON.parse(await err.error.text());
            swal.fire('Error', errorMsg.message || 'Download failed', 'error');
          } catch {
            swal.fire('Error', 'Download failed', 'error');
          }
        } else {
          swal.fire('Error', 'Could not connect to the server', 'error');
        }
      }
    });
  }

  onSelectFileX(row: any): void {
    if (row && row.filePath) {
      window.open(row.filePath, '_blank');
    }
  }

  getDocumentFiles(files: string): string[] {
    if (!files) return [];
    return files
      .split(',')
      .map(x => x.trim())
      .filter(x => x);
  }

  getFileName(fileUrl: string): string {
    if (!fileUrl) return '';
    return fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
  }

  GetAllAllProjectDocumentUploaded(mouId: any): void {
    const formData = new FormData();
    formData.append('MouId', mouId);
    formData.append('Uid', this.EmployeeCode);
    formData.append('Action', 'view');

    this.mouServices.GetAllActionTakenUploadedDocument(formData).subscribe({
      next: (response: any) => {
        if (response.item1 && response.item1.length > 0) {
          this.AllProjectDocumentUploaded = response.item1;
          this.loadingIndicator = false;
        } else {
          this.AllProjectDocumentUploaded = [];
          this.showNoDataFoundMessage = true;
        }
      },
      error: err => {
        this.LoginFailed(err);
      }
    });
  }

  viewAllUploadedDocs(data: any): void {
    this.GetAllAllProjectDocumentUploaded(data.mouId);
    this.modalService.open(this.viewAllActionTakenUploadedDocumentModal, { size: 'lg' }).result.then(() => {
      window.location.reload();
    }).catch(() => { });
  }

  getDivisionNamesByIdss(ids: number[]): string {
    if (!ids || !ids.length) return '-';
    return ids.map(id => this.getDivisionNameById(id)).join(', ');
  }

  getDivisionNameById(id: number): string {
    const idStr = id.toString();
    const school = this.allSchoolDivisions.find(s => +s.id === +idStr);
    return school ? school.schoolDivision : `ID ${idStr} not found`;
  }

  exportToExcel(): void {
    const fileName = 'Mou_Document_report.xlsx';
    const exportedData = (this.filteredMouActivityDocuments || []).map(item => ({
      NewMOUId: item.newMouId,
      OldMOUId: 'MOU/' + item.id,
      'Name of MOU Organisation': item.mouTitle ?? '-',
      'Assigned To Faculty Name': item.assignedToFacultyName ?? '-',
      'Assigned To Faculty Uid': item.uid ?? '-',
      'Name of School/Division Involved': item.schoolDivisionInvolved ? this.getDivisionNamesByIdss(item.schoolDivisionInvolved.split(',').map(Number)) : '-',
      'Details of Activity': item.activityDetails ?? '-',
      'Start Date of Mou Activity Assigned by HOS': item.startDate ?? '-',
      'End Date of Mou Activity Assigned by HOS': item.endDate ?? '-',
      'Details of Proof Submitted by Faculty': item.documentUploaded ?? '-',
      'Session Academic Year': item.sessionAcademicYear ?? '-',
      'Activity Category': item.activityTitle ?? '-',
      'Participants Count': item.participantsCount ?? '-',
      'Number of Activities Submitted': item.activityCount ?? '-',
      'Upload Activity Date': item.uploadActivityDate ?? '-',
      'Mou Approval Status': item.mouStatus ?? '-',
      'Mou Disapproval Reason': item.disapprovalReason ?? '-',
      'Mou Approved By FacultyName': item.mouApprovedByFacultyName ?? '-',
      'Mou Approval Date': item.approvalDate ?? '-',
      'Authority Remarks': item.authorityRemarks ?? '-',
      'DocumentUrl': item.filePath
    }));

    const header = [
      'New MOU Id',
      'Old MOU Id',
      'Name of MOU Organisation',
      'Assigned To Faculty Name',
      'Assigned To Faculty Uid',
      'School Division Involved',
      'Details of Activity',
      'Start Date of Mou Activity Assigned by HOS',
      'End Date of Mou Activity Assigned by HOS',
      'Details of Proof Submitted by Faculty',
      'Session AcademicYear ',
      'Activity Category',
      'Participants Count',
      'Number of Activities Submitted',
      'Upload Activity Date',
      'Mou Approval Status',
      'Mou Disapproval Reason',
      'Mou Approved By FacultyName',
      'Mou Approval Date',
      'Authority Remarks',
      'DocumentUrl'
    ];

    const ws_data = [header, ...exportedData.map(item => Object.values(item))];
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ws_data);

    for (let i = 1; i < ws_data.length; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: i, c: 20 });
      const cell = ws[cellAddress];
      if (cell && cell.v) {
        cell.f = `HYPERLINK("${cell.v}", "Download Attachment")`;
      }
    }

    const wscols = Array(21).fill({ wpx: 180 });
    ws['!cols'] = wscols;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
  }

  search(): void {
    this.applyFiltersTakeAction();
  }

  searchData(): void {
    this.applyFiltersTab1();
  }
}

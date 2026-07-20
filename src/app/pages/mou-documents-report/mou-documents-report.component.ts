// import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { FormBuilder, FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { ActivatedRoute } from '@angular/router';
// import * as XLSX from 'xlsx';
// import swal from 'sweetalert2';
// import { ColumnMode } from '@swimlane/ngx-datatable';
// import { MouDocumentsService } from 'src/app/_services/mou-documents.service';
// import { LpuPlannerServiceService } from 'src/app/_services/lpu-planner-service.service';
// import { AuthService } from 'src/app/_services/auth.service';
// import { StorageService } from 'src/app/_services/storage.service';

// interface SchoolDivision {
//   id: number;
//   schoolDivision: string;
// }

//   @ViewChild('ViewRenewedMouDetailsModal') ViewRenewedMouDetailsModal: TemplateRef<any>;
//   @ViewChild('fileInput') fileInput!: ElementRef;

//   ColumnMode = ColumnMode;

//   // ---------------------------------------------------------------------
//   // Renewed MOU pagination (View Renewed MOU tab)
//   // ---------------------------------------------------------------------
//   AllRenewedMouDetails: any[] = [];
//   recordsPerPage = 5;
//   currentPage = 1;

//   getRecordsForRenewedPage(): any[] {
//     const startIndex = (this.currentPage - 1) * this.recordsPerPage;
//     const endIndex = startIndex + this.recordsPerPage;
//     return this.AllRenewedMouDetails.slice(startIndex, endIndex);
//   }

//   onPageChange(event: any): void {
//     this.currentPage = event.pageIndex + 1;
//     this.recordsPerPage = event.pageSize;
//   }

//   filterData() {
//     const lowerCaseFilter = this.filterText.toLowerCase();
//     this.AllRenewedMouDetails = this.MouDocumentDetails.filter(item => {
//       return Object.entries(item).some(([key, val]) => {
//         if (val !== null && val !== undefined) {
//           const valueString = String(val).toLowerCase();

//           if (key === 'id') {
//             const numericId = Number(val);
//             if (!isNaN(numericId) && (numericId.toString().includes(lowerCaseFilter) || `mou/${numericId}`.includes(lowerCaseFilter))) {
//               return true;
//             }
//           }
//           return valueString.includes(lowerCaseFilter);
//         }
//         return false;
//       });
//     });
//   }

//   // ---------------------------------------------------------------------
//   // MOU Update / Renewal form
//   // ---------------------------------------------------------------------
//   mouForm: FormGroup;

//   isInvalid(controlName: string): boolean {
//     const control = this.mouForm.get(controlName);
//     return !!(control && control.invalid && (control.dirty || control.touched));
//   }

//   getFieldDisplayName(fieldName: string): string {
//     const fieldNames: { [key: string]: string } = {
//       mouOrganisation: 'Partner Organisation Name',
//       selectedDivisions: 'Divisions Involved',
//       startDate: 'Start Date',
//       endDate: 'End Date',
//       spocName: 'SPOC Name',
//       spocEmail: 'SPOC Email',
//       spocContact: 'SPOC Contact',
//       lpuSpocName: 'LPU SPOC Name',
//       lpuSpocUid: 'LPU SPOC UID',
//       remarks: 'Renew Remarks',
//       mouid: 'Original Mouid',
//       lpuSpocEmail: 'LPU SPOC Email'
//     };
//     return fieldNames[fieldName] || fieldName;
//   }

//   initForm() {
//     this.mouForm = this.fb.group({
//       mouId: [{ value: '', disabled: true }],
//       selectedDivisions: [[], [Validators.required]],
//       mouOrganisation: ['', [Validators.required, Validators.minLength(3)]],
//       startDate: ['', [Validators.required]],
//       endDate: [''],
//       isIndefinite: [false],
//       spocName: ['', [Validators.required]],
//       spocEmail: ['', [Validators.required, Validators.email]],
//       spocContact: [''],
//       lpuSpocName: ['', [Validators.required]],
//       lpuSpocUid: ['', [Validators.required]],
//       lpuSpocEmail: ['', [Validators.required, Validators.email]],
//       remarks: ['', [Validators.required]]
//     });
//   }

//   // ---------------------------------------------------------------------
//   // LPU SPOC employee search / autocomplete
//   // ---------------------------------------------------------------------
//   IdX: any;
//   LPUSpocEmail: any = '';
//   employeeControl = new FormControl();
//   EmployeeData: Employee[] = [];
//   filteredEmployeesData: Employee[] = [];
//   showSuggestions = false;

//   AssignedToUid: any = '';
//   AssignedToUidName: any = '';

//   GetEmployeeData(): void {
//     this.mouDocumentsService.GetEmployeeData().subscribe({
//       next: response => {
//         this.EmployeeData = response.item1.length > 0 ? response.item1 : [];
//       },
//       error: err => console.error(err)
//     });
//   }

//   onInput2() {
//     const query = this.mouForm.get('lpuSpocName')?.value?.toLowerCase();

//     if (query && query.length >= 2) {
//       this.filteredEmployeesData = this.EmployeeData.filter(emp =>
//         emp.employeeName.toLowerCase().includes(query) ||
//         emp.employeeCode.toLowerCase().includes(query)
//       ).slice(0, 10);

//       this.showSuggestions = true;
//     } else {
//       this.showSuggestions = false;
//     }
//   }

//   selectEmployee2(employee: Employee) {
//     this.ResponsiblePerson = employee.employeeCode;
//     this.AssignedToUid = employee.employeeCode;
//     this.AssignedToUidName = employee.employeeName;

//     this.mouForm.patchValue({
//       lpuSpocName: employee.employeeName,
//       lpuSpocUid: employee.employeeCode
//     });

//     this.employeeControl.setValue(`${employee.employeeName} (${employee.employeeCode})`);

//     this.filteredEmployeesData = [];
//     this.showSuggestions = false;
//     this.checkUIDValidity();
//   }

//   hideSuggestions() {
//     setTimeout(() => this.showSuggestions = false, 200);
//   }

//   checkUIDValidity(): void {
//     this.uploadEnabled = this.IdX !== '' && this.AssignedToUid != '';
//   }

//   // ---------------------------------------------------------------------
//   // Renewal document upload
//   // ---------------------------------------------------------------------
//   onRenewFileSelected(event: any): void {
//     const file = event.target.files[0];
//     if (!file) {
//       return;
//     }

//     const allowedTypes = [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ];
//     if (!allowedTypes.includes(file.type)) {
//       this.renewalFileError = 'Only PDF and Word documents are allowed.';
//       return;
//     }

//     this.renewalFile = file;
//     this.renewalFileName = file.name;
//     this.renewalFileError = '';

//     const reader = new FileReader();
//     reader.onload = () => {
//       const result = reader.result as string;
//       const base64Data = result.split(',')[1];
//       this.renewalFileBase64 = base64Data;
//     };
//     reader.readAsDataURL(file);
//   }

//   // ---------------------------------------------------------------------
//   // Core state
//   // ---------------------------------------------------------------------
//   isLoginFailed: boolean = false;
//   loadingIndicator = false;
//   showNoDataFoundMessage: boolean = false;
//   serverUrl: any;

//   EmployeeDetails: any[] = [];
//   MouDocumentDetails: any[] = [];
//   Email: any = '';
//   EmployeeName: any = '';
//   EmployeeCode: any = '';
//   Department: any = '';
//   DepartmentName: any;

//   allSchoolDivisions: SchoolDivision[] = [];
//   CurrentSchool: string;
//   uploadEnabled: boolean = false;

//   filterText: string = '';
//   filteredMouDocumentDetails: any[] = [];
//   renewedMouDocumentDetails: any[] = [];
//   Reason: any;

//   searchQuery: any = '';
//   statusFilter: string = 'all';
//   approvalFilter: string = 'all';

//   ResponsiblePerson: any = '';
//   columns: any;

//   mouId: any;
//   newMouId: any;
//   isRenewalMode: boolean = false;
//   renewalFile: File | null = null;
//   renewalFileBase64: string | null = null;
//   renewalFileName: string = '';
//   renewalFileError: string = '';
//   originalMouData: any = null;

//   MouOrganisation: any;
//   MouOrganisationPrevious: any;
//   selectedSchoolDivisions: any[] = [];

//   SPOCPerson: any;
//   SPOCPersonEmail: any;
//   isLoading: boolean = false;
//   MouStartDate: string = '';
//   MouEndDate: string = '';
//   isIndefiniteMou: boolean = false;
//   moustatus: string = 'Expired';

//   constructor(
//     private lpuPlannerServiceService: LpuPlannerServiceService,
//     private storageService: StorageService,
//     private mouDocumentsService: MouDocumentsService,
//     private modalService: NgbModal,
//     private authService: AuthService,
//     public formBuilder: UntypedFormBuilder,
//     private route: ActivatedRoute,
//     private fb: FormBuilder
//   ) { this.initForm(); }

//   ngOnInit(): void {
//     (<HTMLInputElement>document.getElementById('stMain')).innerHTML = '<span class="themeClr">MOU </span> Document <span class="themeClr">Approvals</span>';
//     (<HTMLInputElement>document.getElementById('imgLogo')).style.width = '164px';
//     this.serverUrl = 'https://files.lpu.in/umsweb/MOUDocuments/';
//     this.loadingIndicator = false;
//     const loginName = this.route.snapshot.params['loginName'];
//     if (loginName != '' && loginName != undefined) {
//       this.isLoginFailed = false;
//       this.getToken(loginName);
//     } else {
//       this.LoginFailed('Invalid Login Details');
//     }
//   }

//   getToken(id: any) {
//     this.authService.loginTemp(id).subscribe({
//       next: data => {
//         this.storageService.saveUser(data);
//         this.GetAllUploadsDetails();
//         this.GetEmployeeDetails();
//         this.GetEmployeeData();
//       },
//       error: err => {
//         this.LoginFailed(err);
//       }
//     });
//   }

//   LoginFailed(NewError: any) {
//     this.isLoginFailed = true;
//     swal.fire({
//       title: 'Login Failed',
//       text: 'Login details are Invalid!',
//       icon: 'warning',
//     });
//     const element = document.getElementById('adminPage');
//     if (element) {
//       element.hidden = true;
//     }
//   }

//   onDownloadFile(remoteUrl: string): void {
//     swal.fire({ title: 'Downloading...', didOpen: () => { swal.showLoading(null); } });

//     this.mouDocumentsService.downloadMOUFile(remoteUrl).subscribe({
//       next: (blob: Blob) => {
//         const downloadUrl = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = downloadUrl;

//         const fileName = remoteUrl.split('/').pop() || 'Document.pdf';
//         link.download = fileName;

//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(downloadUrl);

//         swal.close();
//       },
//       error: async (err) => {
//         swal.close();
//         if (err.error instanceof Blob) {
//           const errorMsg = JSON.parse(await err.error.text());
//           swal.fire('Error', errorMsg.message || 'Download failed', 'error');
//         } else {
//           swal.fire('Error', 'Could not connect to the server', 'error');
//         }
//       }
//     });
//   }

//   GetEmployeeDetails(): void {
//     this.mouDocumentsService.GetEmployeeDetails().subscribe({
//       next: response => {
//         if (response.item1.length > 0) {
//           this.EmployeeDetails = response.item1;
//           this.EmployeeName = response.item1[0].employeeName;
//           this.Email = response.item1[0].email;
//           this.EmployeeCode = response.item1[0].employeeCode;
//           this.Department = response.item1[0].department;
//           this.DepartmentName = response.item1[0].departmentName;
//           this.loadingIndicator = false;
//           this.showNoDataFoundMessage = false;
//           this.isLoginFailed = false;
//         } else {
//           this.EmployeeDetails = [];
//           this.showNoDataFoundMessage = true;
//           this.isLoginFailed = true;
//         }
//       },
//       error: err => {
//         this.LoginFailed(err);
//       }
//     });
//   }

//   GetAllUploadsDetails(): void {
//     this.mouDocumentsService.GetAllUploadedDocuments().subscribe({
//       next: response => {
//         if (response.item1.length > 0) {
//           this.MouDocumentDetails = this.filteredMouDocumentDetails = response.item1;
//           console.log()
//           this.showNoDataFoundMessage = false;

//           this.applyFilters();

//           this.columns = [];
//           this.columns = Object.keys(this.MouDocumentDetails[0]);
//           this.columns = this.columns.filter((item: any) => item !== 'fileName' && item !== 'newMouId' && item !== 'mouPartnerName' && item !== 'mouUploadedBy' && item !== 'mouUploadedByUID' && item !== 'mouApprovedBy' && item !== 'mouEndDate' && item !== 'mouStartDate' && item !== 'mouStatus' && item !== 'filePath' && item !== 'uid' && item !== 'updatedOn' && item !== 'facultyName' && item !== 'mouTitle' && item !== 'mouPartnerName' && item !== 'spocContactNo' && item !== 'spocName' && item !== 'spocEmailId' && item !== 'mouPartner' && item !== 'createdOn' && item !== 'createdBy' && item !== 'ipAddress' && item !== 'updatedBy' && item !== 'disapprovalReason' && item !== 'approvedBy' && item !== 'updatedOn' && item !== 'isActive' && item !== 'isApproved' && item !== 'approvalDate' && item !== 'schoolDivisionInvolved' && item !== 'mouId' && item !== 'id' && item !== 'activityStartDate' && item !== 'activityEndDate' && item !== 'assignedBy' && item !== 'assignedTo');

//           this.loadingIndicator = false;
//           this.isLoginFailed = false;
//         } else {
//           this.MouDocumentDetails = [];
//           this.filteredMouDocumentDetails = [];
//           this.showNoDataFoundMessage = true;
//         }
//       },
//       error: err => {
//         this.LoginFailed(err);
//       }
//     });
//     this.GetAllActivities();
//   }

//   GetAllActivities(): void {
//     this.lpuPlannerServiceService.GetSchoolDivisions().subscribe((response) => {
//       if (response.item1.length > 0) {
//         this.allSchoolDivisions = response.item1;
//       } else {
//         this.allSchoolDivisions = [];
//       }
//     });
//   }

//   // ---------------------------------------------------------------------
//   // Filtering (status / approval / search)
//   // ---------------------------------------------------------------------
//   search() {
//     this.applyFilters();
//   }

//   onStatusChange(event: any): void {
//     this.applyFilters();
//   }

//   onApprovalFilterChange(event: any): void {
//     this.applyFilters();
//   }

//   applyFilters(): void {
//     // Filter by MOU lifecycle status
//     let filtered = this.MouDocumentDetails.filter(item => {
//       if (this.statusFilter === 'all') {
//         return true;
//       }
//       if (this.statusFilter === 'active') {
//         return item.mouStatus === 'Active';
//       } else if (this.statusFilter === 'expired') {
//         return item.mouStatus === 'Expired';
//       } else if (this.statusFilter === 'renewed') {
//         return item.hasRenewal === true || item.hasRenewal === 'true';
//       }
//       return true;
//     });

//     // Filter by approval status
//     filtered = filtered.filter(item => {
//       if (this.approvalFilter === 'all') {
//         return true;
//       }
//       if (this.approvalFilter === 'approved') {
//         return item.isApproved == 1 || item.isApproved === 'True' || item.isApproved === true;
//       }
//       if (this.approvalFilter === 'disapproved') {
//         return item.isApproved == 0 || item.isApproved === 'False' || item.isApproved === false;
//       }
//       return true;
//     });

//     // Free text search
//     const query = this.searchQuery.trim().toLowerCase();
//     if (query) {
//       filtered = filtered.filter(item => {
//         return Object.entries(item).some(([key, val]) => {
//           if (val !== null && val !== undefined) {
//             const valueString = String(val).toLowerCase();

//             if (key === 'id') {
//               const numericId = Number(val);
//               if (!isNaN(numericId) && (numericId.toString().includes(query) || `mou/${numericId}`.includes(query))) {
//                 return true;
//               }
//             }
//             return valueString.includes(query);
//           }
//           return false;
//         });
//       });
//     }

//     this.filteredMouDocumentDetails = filtered;
//   }

//   getActiveCount(): number {
//     return this.MouDocumentDetails.filter(item => item.mouStatus === 'Active').length;
//   }

//   getExpiredCount(): number {
//     return this.MouDocumentDetails.filter(item => item.mouStatus === 'Expired').length;
//   }

//   getRenewedCount(): number {
//     this.AllRenewedMouDetails = this.MouDocumentDetails.filter(item => {
//       return item.hasRenewal === true || item.hasRenewal === 'true';
//     });
//     return this.AllRenewedMouDetails.length;
//   }

//   getApprovedCount(): number {
//     return this.MouDocumentDetails.filter(item => item.isApproved == 1 || item.isApproved === 'True' || item.isApproved === true).length;
//   }

//   getDisapprovedCount(): number {
//     return this.MouDocumentDetails.filter(item => item.isApproved == 0 || item.isApproved === 'False' || item.isApproved === false).length;
//   }

//   // ---------------------------------------------------------------------
//   // Division lookups / export
//   // ---------------------------------------------------------------------
//   getDivisionNameById(id: number): string {
//     const idStr = id.toString();
//     let division: SchoolDivision | undefined;
//     for (const school of this.allSchoolDivisions) {
//       if (+school.id === +idStr) {
//         division = school;
//         break;
//       }
//     }
//     return division ? division.schoolDivision : `ID ${idStr} not found`;
//   }

//   getDivisionNamesByIds(ids: number[]): string {
//     return ids.map(id => this.getDivisionNameById(id)).join(', ');
//   }

//   exportToExcel(): void {
//     const fileName = 'Mou_Document_report.xlsx';

//     const exportedData = this.filteredMouDocumentDetails.map(item => ({
//       NewMOUId: (item.newMouId ?? 'N/A'),
//       OldMOUId: 'MOU/' + (item.id ?? 'N/A'),
//       'Mou Partner Organisation Name': item.mouTitle ?? 'N/A',
//       'Mou Start Date': item.mouStartDate ?? 'N/A',
//       'Mou End Date': item.mouEndDate ?? 'N/A',
//       'Mou Status': item.mouStatus ?? 'N/A',
//       'SPOC Person Name (Mou Partner Organisation)': item.spocName ?? 'N/A',
//       'SPOC Person Email (Mou Partner Organisation)': item.spocEmailId ?? 'N/A',
//       'SPOC Person Contact (Mou Partner Organisation)': item.spocContactNo ?? 'N/A',
//       'Name of School/Division Involved ': item.schoolDivisionInvolved
//         ? this.getDivisionNamesByIds(item.schoolDivisionInvolved.split(',').map(Number))
//         : 'N/A',
//       'School/Division Name Of Faculty Who Uploaded': item.mouUploadedBy ?? 'N/A',
//       'Date of MOU Upload at interface': item.createdOn
//         ? new Date(item.createdOn).toLocaleDateString('en-GB', {
//           day: '2-digit',
//           month: 'short',
//           year: 'numeric'
//         }).replace(/ /g, '-')
//         : 'N/A',
//       'Approval Status (Approved/Rejected/Pending)': item.isApproved == 1 ? 'Approved' : item.isApproved == 0 ? 'Disapproved' : 'Pending',
//       'MOU Approved /Rejected By : Faculty Name': item.mouApprovedBy ?? 'N/A',
//       'MOU Approved /Rejected By : Faculty UID': item.approvedBy ?? 'N/A',
//       'MOU Approval/ Rejection Date': item.approvalDate ?? 'N/A'
//     }));

//     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
//     const wscols = Array(17).fill({ wpx: 220 });
//     ws['!cols'] = wscols;

//     const wb: XLSX.WorkBook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
//     const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
//     link.download = fileName;
//     link.click();
//   }

//   private formatDate(date: any): string {
//     if (!date) return '';
//     const d = new Date(date);
//     if (isNaN(d.getTime())) return '';
//     const month = '' + (d.getMonth() + 1);
//     const day = '' + d.getDate();
//     const year = d.getFullYear();
//     return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
//   }

//   // ---------------------------------------------------------------------
//   // Approve / Disapprove
//   // ---------------------------------------------------------------------
//   DisapproveStatus(Id: any) {
//     swal.fire({
//       title: 'Reason for Disapproval',
//       input: 'text',
//       inputPlaceholder: 'Enter reason for disapproval',
//       showCancelButton: true,
//       confirmButtonText: 'Submit',
//       cancelButtonText: 'Cancel',
//       inputValidator: (value) => {
//         if (!value || !value.trim()) {
//           return 'Disapproval reason is required.';
//         }
//         return null;
//       }
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.Reason = result.value.trim();

//         const formData = new FormData();
//         formData.append('Id', Id);
//         formData.append('DisapprovalReason', this.Reason);
//         formData.append('Action', 'Disapprove');

//         this.handleStatusChange(formData, 'Disapprove');
//       } else if (result.dismiss === swal.DismissReason.cancel) {
//         this.showCancelledSwal();
//       }
//     });
//   }

//   ChangeApproveStatus(Id: any) {
//     const formData = new FormData();
//     formData.append('Id', Id);
//     formData.append('Action', 'Approve');

//     swal.fire({
//       title: 'Are you sure you want to change the status?',
//       text: 'Kindly confirm if the document is valid!',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, accept current changes!',
//       cancelButtonText: 'No, do not change it'
//     }).then((result: any) => {
//       if (result.value) {
//         this.handleStatusChange(formData, 'Approve');
//       } else {
//         this.showCancelledSwal();
//       }
//     });
//   }

//   private handleStatusChange(formData: FormData, action: string) {
//     this.mouDocumentsService.ApproveDocument(formData).subscribe((data: any) => {
//       if (action === 'Approve' && data.responseData === 'Cancel') {
//         swal.fire('No Change!', ' ', 'error');
//       } else {
//         swal.fire(' Approved/Disapproved successfully !', '', 'success').then(() => {
//           window.location.reload();
//         });
//       }
//     });
//   }

//   private showCancelledSwal() {
//     swal.fire('Cancelled', ' ', 'error');
//   }

//   private handleSchoolChange(formData: FormData) {
//     this.mouDocumentsService.UpdateSchoolDivision(formData).subscribe((data: any) => {
//       if (data.responseData === 'Failed') {
//         swal.fire('No Change!', ' ', 'error');
//       } else {
//         swal.fire(' Updation successfully !', '', 'success').then(() => {
//           window.location.reload();
//         });
//       }
//     });
//   }

//   // ---------------------------------------------------------------------
//   // MOU status calculation (Indefinite / dates)
//   // ---------------------------------------------------------------------
//   toggleEndDate(): void {
//     if (this.isIndefiniteMou) {
//       this.isIndefiniteMou = true;
//       this.MouEndDate = '';
//       this.moustatus = 'Active';
//     } else {
//       this.updateMouStatus();
//     }
//   }

//   updateMouStatus(): void {
//     const today = new Date();
//     const startDate = this.MouStartDate ? new Date(this.MouStartDate) : null;
//     const endDate = this.MouEndDate ? new Date(this.MouEndDate) : null;

//     if (this.isIndefiniteMou) {
//       this.moustatus = 'Active';
//     } else if (startDate) {
//       if (!endDate || (today >= startDate && today <= endDate)) {
//         this.moustatus = 'Active';
//       } else {
//         this.moustatus = 'Expired';
//       }
//     } else {
//       this.moustatus = 'Expired';
//     }
//   }

//   // ---------------------------------------------------------------------
//   // Update / Renew MOU modal
//   // ---------------------------------------------------------------------
//   ChangeSchool(data: any) {
//     this.isRenewalMode = false;
//     this.showSuggestions = false;
//     this.filteredEmployeesData = [];

//     this.mouId = data.id;
//     this.AssignedToUid = data.lpuSpocUID;
//     this.AssignedToUidName = data.lpuSpocName;
//     this.moustatus = data.mouStatus;
//     this.MouOrganisationPrevious = data.mouPartnerName;
//     this.SPOCPerson = data.spocName;
//     this.SPOCPersonEmail = data.spocEmailId;
//     this.MouStartDate = data.mouStartDate;
//     this.MouEndDate = data.mouEndDate;
//     this.selectedSchoolDivisions = data.schoolDivisionInvolved;
//     this.CurrentSchool = data.schoolDivisionInvolved;

//     this.mouForm.patchValue({
//       mouId: data.id,
//       selectedDivisions: data.schoolDivisionInvolved ? data.schoolDivisionInvolved.split(',') : [],
//       mouOrganisation: data.mouPartnerName,
//       startDate: this.formatDate(data.mouStartDate),
//       endDate: this.formatDate(data.mouEndDate),
//       isIndefinite: data.mouStatus === 'Active' && !data.mouEndDate,
//       spocName: data.spocName,
//       spocEmail: data.spocEmailId,
//       spocContact: data.spocContactNo,
//       lpuSpocName: data.lpuSpocName,
//       lpuSpocUid: data.lpuSpocUID,
//       lpuSpocEmail: data.lpuSpocEmail
//     });

//     this.modalService.open(this.ChangeSchoolDivisionModal, { size: 'xl', backdrop: 'static' }).result.then(() => {
//       setTimeout(() => {
//         window.dispatchEvent(new Event('resize'));
//       }, 200);
//     }).catch(() => { });
//   }

//   openRenewModal(row: any): void {
//     this.isRenewalMode = true;
//     this.showSuggestions = false;
//     this.filteredEmployeesData = [];
//     this.originalMouData = { ...row };

//     this.renewalFile = null;
//     this.renewalFileBase64 = null;
//     this.renewalFileName = '';
//     this.renewalFileError = '';

//     this.mouForm.patchValue({
//       mouId: row.id,
//       selectedDivisions: row.schoolDivisionInvolved ? row.schoolDivisionInvolved.split(',') : [],
//       mouOrganisation: row.mouPartnerName,
//       startDate: this.formatDate(row.mouStartDate),
//       endDate: this.formatDate(row.mouEndDate),
//       isIndefinite: row.mouStatus === 'Active' && !row.mouEndDate,
//       spocName: row.spocName,
//       spocEmail: row.spocEmailId,
//       spocContact: row.spocContactNo,
//       lpuSpocName: row.lpuSpocName,
//       lpuSpocUid: row.lpuSpocUID,
//       lpuSpocEmail: row.lpuSpocEmail
//     });

//     this.mouId = row.id;
//     this.AssignedToUid = row.lpuSpocUID;
//     this.AssignedToUidName = row.lpuSpocName;
//     this.moustatus = row.mouStatus;
//     this.MouStartDate = row.mouStartDate;
//     this.MouEndDate = row.mouEndDate;
//     this.isIndefiniteMou = row.mouStatus === 'Active' && !row.mouEndDate;
//     this.CurrentSchool = row.schoolDivisionInvolved;

//     this.modalService.open(this.ChangeSchoolDivisionModal, { size: 'xl', backdrop: 'static' }).result.then(() => {
//       setTimeout(() => {
//         window.dispatchEvent(new Event('resize'));
//       }, 200);
//     }).catch(() => { });
//   }

//   OpenAllMouRenewalHistory(row: any): void {
//     this.mouId = row.id;
//     this.newMouId = row.newMouId;
//     this.getRenewedMouDetails(row.id);
//     this.modalService.open(this.ViewRenewedMouDetailsModal, { size: 'xl', backdrop: 'static' }).result.then(() => {
//       setTimeout(() => {
//         window.dispatchEvent(new Event('resize'));
//       }, 200);
//     }).catch(() => { });
//   }

//   getRenewedMouDetails(mouId: any): void {
//     this.mouDocumentsService.GetRenewedMouDetails(mouId).subscribe((response) => {
//       if (response.item1.length > 0) {
//         this.renewedMouDocumentDetails = response.item1;
//       } else {
//         this.renewedMouDocumentDetails = [];
//       }
//     });
//   }

//   onSubmitModal(): void {
//     if (this.isRenewalMode) {
//       this.onSubmitRenew();
//     } else {
//       this.onSubmitUpdate();
//     }
//   }

//   onSubmitUpdate() {
//     if (this.mouForm.invalid) {
//       this.mouForm.markAllAsTouched();

//       const invalidFields: string[] = [];
//       const controls = this.mouForm.controls;
//       for (const name in controls) {
//         if (name !== 'remarks' && controls[name].invalid) {
//           invalidFields.push(name);
//         }
//       }

//       if (invalidFields.length > 0) {
//         swal.fire({
//           title: 'Validation Error',
//           html: `<p>Please fill in all required fields:</p>
//              <ul class="text-start">
//                ${invalidFields.map(f => `<li>${this.getFieldDisplayName(f)}</li>`).join('')}
//              </ul>`,
//           icon: 'error'
//         });
//         return;
//       }
//     }

//     const val = this.mouForm.getRawValue();

//     const formData = new FormData();
//     formData.append('Id', val.mouId);
//     formData.append('SchoolInvolved', val.selectedDivisions.join(','));
//     formData.append('MouStartDate', val.startDate);
//     formData.append('MouEndDate', val.isIndefinite ? '' : val.endDate);
//     formData.append('MouStatus', this.moustatus);
//     formData.append('SPOCPerson', val.spocName);
//     formData.append('SPOCContat', val.spocContact);
//     formData.append('SPOCEmail', val.spocEmail);
//     formData.append('MouOrganisation', val.mouOrganisation);
//     formData.append('LPUSpocName', val.lpuSpocName);
//     formData.append('LPUSpocUID', val.lpuSpocUid);
//     formData.append('LPUSpocEmail', val.lpuSpocEmail);

//     swal.fire({
//       title: 'Are you sure you want to change the School?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, accept current changes!',
//       cancelButtonText: 'No, do not change it'
//     }).then((result: any) => {
//       if (result.value) {
//         this.handleSchoolChange(formData);
//       } else {
//         this.showCancelledSwal();
//       }
//     });
//   }

//   onSubmitRenew(): void {
//     if (this.mouForm.invalid) {
//       this.mouForm.markAllAsTouched();
//       const invalidFields: string[] = [];
//       const controls = this.mouForm.controls;
//       for (const name in controls) {
//         if (controls[name].invalid) {
//           invalidFields.push(name);
//         }
//       }
//       swal.fire({
//         title: 'Validation Error',
//         html: `<p>Please fill in all required fields:</p><ul class="text-start">${invalidFields.map(f => `<li>${this.getFieldDisplayName(f)}</li>`).join('')}</ul>`,
//         icon: 'error'
//       });
//       return;
//     }

//     if (!this.renewalFile) {
//       swal.fire('Error', 'Please upload a MOU document for renewal.', 'error');
//       return;
//     }

//     if (!this.renewalFileBase64) {
//       swal.fire('Error', 'File is still being processed. Please try again.', 'error');
//       return;
//     }

//     const val = this.mouForm.getRawValue();

//     let newMouStatus = 'Active';
//     const today = new Date();
//     const startDate = val.startDate ? new Date(val.startDate) : null;
//     const endDate = val.isIndefinite ? null : (val.endDate ? new Date(val.endDate) : null);

//     if (val.isIndefinite) {
//       newMouStatus = 'Active';
//     } else if (startDate) {
//       if (!endDate || (today >= startDate && today <= endDate)) {
//         newMouStatus = 'Active';
//       } else {
//         newMouStatus = 'Expired';
//       }
//     } else {
//       newMouStatus = 'Expired';
//     }

//     const formData = new FormData();
//     formData.append('UID', this.EmployeeCode);
//     formData.append('MasterMouId', this.mouId);
//     formData.append('RenewalRemark', val.remarks);
//     formData.append('FilePath', this.renewalFileName);
//     formData.append('File', this.renewalFileBase64);
//     formData.append('MouStartDate', val.startDate);
//     formData.append('MouEndDate', val.endDate);
//     formData.append('MouStatus', newMouStatus);
//     formData.append('SchoolDivisionInvolved', val.selectedDivisions.join(','));
//     formData.append('SPOCName', val.spocName);
//     formData.append('SPOCEmailId', val.spocEmail);
//     formData.append('SPOCContactNo', val.spocContact);
//     formData.append('LPUSpocName', val.lpuSpocName);
//     formData.append('LPUSpocUID', val.lpuSpocUid);
//     formData.append('LPUSpocEmail', val.lpuSpocEmail);
//     formData.append('SessionId', '18');
//     formData.append('CreatedBy', this.EmployeeCode);

//     swal.fire({
//       title: 'Renew MOU',
//       text: 'Are you sure you want to renew this MOU? This will create a new MOU and mark the old one as Renewed.',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, renew MOU',
//       cancelButtonText: 'Cancel'
//     }).then((result) => {
//       if (result.value) {
//         this.mouDocumentsService.MouRenewalDetails(formData).subscribe({
//           next: (data: any) => {
//             const resultMsg = data.item1 && data.item1.length > 0 ? data.item1[0].msg : data.responseData;
//             if (resultMsg === 'success' || data.responseData !== 'Failed') {
//               this.updateOldMouStatus(this.mouId, 'Renewed');
//             } else {
//               swal.fire('Error', 'Failed to create new MOU. Please try again.', 'error');
//             }
//           },
//           error: (err) => {
//             swal.fire('Error', 'Failed to upload new MOU document.', 'error');
//           }
//         });
//       }
//     });
//   }

//   updateOldMouStatus(oldId: any, newStatus: string): void {
//     if (!this.originalMouData) {
//       window.location.reload();
//       return;
//     }

//     const orig = this.originalMouData;
//     const formData = new FormData();
//     formData.append('Id', oldId);
//     formData.append('SchoolInvolved', orig.schoolDivisionInvolved);
//     formData.append('MouStartDate', orig.mouStartDate);
//     formData.append('MouEndDate', orig.mouEndDate);
//     formData.append('MouStatus', newStatus);
//     formData.append('SPOCPerson', orig.spocName);
//     formData.append('SPOCContat', orig.spocContactNo);
//     formData.append('SPOCEmail', orig.spocEmailId);
//     formData.append('MouOrganisation', orig.mouPartnerName);
//     formData.append('LPUSpocName', orig.lpuSpocName);
//     formData.append('LPUSpocUID', orig.lpuSpocUID);
//     formData.append('LPUSpocEmail', orig.lpuSpocEmail);

//     this.mouDocumentsService.UpdateSchoolDivision(formData).subscribe({
//       next: (data: any) => {
//         if (data.responseData === 'Failed') {
//           swal.fire('Warning', 'New MOU created but failed to update old MOU status to Renewed.', 'warning');
//         } else {
//           swal.fire('Success', 'MOU renewed successfully! Old MOU marked as Renewed.', 'success');
//         }
//         window.location.reload();
//       },
//       error: (err) => {
//         swal.fire('Warning', 'New MOU created but failed to update old MOU status.', 'warning');
//         window.location.reload();
//       }
//     });
//   }
// }

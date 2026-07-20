import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';

import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { MouServices } from '../../services/mou-services';
import { LpuPlannerServiceService } from '../../services/lpu-planner-service.service';

import { MouUploadFormComponent } from './components/mou-upload-form/mou-upload-form.component';
import { MouRecordsTableComponent } from './components/mou-records-table/mou-records-table.component';
import { MouRenewModalComponent } from './components/mou-renew-modal/mou-renew-modal.component';
import { MouRenewalHistoryModalComponent } from './components/mou-renewal-history-modal/mou-renewal-history-modal.component';

interface SchoolDivision {
  id: number;
  schoolDivision: string;
}

interface MouCategory {
  id: number;
  CategoryName: string;
}

interface Employee {
  employeeName: string;
  employeeCode: string;
}

@Component({
  selector: 'app-mou-documents-uploads',
  templateUrl: './mou-documents-uploads.component.html',
  styleUrls: ['./mou-documents-uploads.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    MouUploadFormComponent,
    MouRecordsTableComponent
  ]
})
export class MouDocumentsUploadsComponent implements OnInit {
  isLoginFailed: boolean = false;
  isLoading: boolean = true;
  isTableLoading: boolean = false;
  loadingIndicator = false;
  activeTab: string = 'UploadNewMou';
  
  EmployeeName: string = '';
  EmployeeCode: string = '';
  DepartmentName: string = '';
  
  AllMouCategories: MouCategory[] = [];
  allSchoolDivisions: SchoolDivision[] = [];
  EmployeeData: Employee[] = [];
  
  MouDocumentsData: any[] = [];
  AllRenewedMouDetails: any[] = [];

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    private mouDocumentsService: MouServices,
    private lpuPlannerServiceService: LpuPlannerServiceService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const stMain = document.getElementById('stMain');
    if (stMain) {
      stMain.innerHTML = '<span class="themeClr" >MOU </span> Document<span class="themeClr" > Upload </span>';
    }
    const imgLogo = document.getElementById('imgLogo');
    if (imgLogo) {
      imgLogo.style.width = '164px';
    }

    this.loadingIndicator = false;
    let loginName = this.route.snapshot.params['loginName'];
    if (loginName != '' && loginName != undefined) {
      this.getToken(loginName);
    } else {
      this.LoginFailed('Invalid Login Details');
    }

    // Safety timeout fallback: if data fetching takes more than 7 seconds, force hide the loader
    console.log('ngOnInit: Setting up 7s safety timeout. Current isLoading:', this.isLoading);
    setTimeout(() => {
      console.log('Safety timeout fired! Current isLoading:', this.isLoading);
      if (this.isLoading) {
        console.warn('MOU Data loading timed out. Force hiding loader.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 7000);
  }

  getToken(id: string): void {
    this.authService.loginTemp(id).subscribe({
      next: data => {
        this.storageService.saveUser(data);
        this.GetAllCategories();
        this.GetAllActivities();
        this.GetEmployeeDetails();
        this.GetEmployeeData();
      },
      error: err => {
        this.LoginFailed(err);
      }
    });
  }

  LoginFailed(error: any) {
    this.isLoginFailed = true;
    this.isLoading = false;
    this.cdr.detectChanges();
    swal.fire({
      title: 'Login Failed',
      text: 'Login details are Invalid!',
      icon: 'warning',
    });
    const element = document.getElementById('adminPage');
    if (element) {
      element.hidden = true;
    }
  }

  GetEmployeeDetails(): void {
    this.mouDocumentsService.GetEmployeeDetails().subscribe({
      next: response => {
        if (response && response.item1 && response.item1.length > 0) {
          const emp = response.item1[0];
          this.EmployeeName = emp.employeeName;
          this.EmployeeCode ='31930';// emp.employeeCode;
          this.DepartmentName = emp.departmentName;
          this.isLoginFailed = false;
          this.isLoading = false;
          this.cdr.detectChanges();
          this.GetAllUploadsDetails(this.EmployeeCode);
        } else {
          this.isLoginFailed = true;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: err => {
        this.LoginFailed(err);
      }
    });
  }

  GetAllCategories(): void {
    this.mouDocumentsService.GetMouCategories().subscribe({
      next: response => {
        this.AllMouCategories = response.item1.map((x: any, index: number) => ({
          id: index + 1,
          CategoryName: x.items
        }));
      }
    });
  }

  GetAllActivities(): void {
    this.lpuPlannerServiceService.GetSchoolDivisions().subscribe({
      next: response => {
        this.allSchoolDivisions = response.item1.length > 0 ? response.item1 : [];
      }
    });
  }

  GetEmployeeData(): void {
    this.mouDocumentsService.GetEmployeeData().subscribe({
      next: response => {
        this.EmployeeData = response.item1.length > 0 ? response.item1 : [];
      }
    });
  }

  GetAllUploadsDetails(Uid: any): void {
    this.isTableLoading = true;
    this.mouDocumentsService.GetUIDWiseUploadedDocuments(Uid).subscribe({
      next: response => {
        if (response && response.item1 && response.item1.length > 0) {
          this.MouDocumentsData = response.item1;
          this.getRenewedCount();
        } else {
          this.MouDocumentsData = [];
          this.AllRenewedMouDetails = [];
        }
        this.isTableLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to fetch MOU records:', err);
        this.isTableLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRenewedCount(): number {
    this.AllRenewedMouDetails = this.MouDocumentsData.filter(item => {
      return item.renewalCount > 0 || (item.renewalCount != null && item.renewalCount !== '0' && item.renewalCount !== 'null');
    });
    return this.AllRenewedMouDetails.length;
  }

  onUploadSuccess() {
    this.GetAllUploadsDetails(this.EmployeeCode);
  }

  openRenewModal(row: any): void {
    const modalRef = this.modalService.open(MouRenewModalComponent, { size: 'xl', windowClass: 'modal-xl', backdrop: 'static' });
    modalRef.componentInstance.mouRow = row;
    modalRef.componentInstance.allSchoolDivisions = this.allSchoolDivisions;
    modalRef.componentInstance.employeeCode = this.EmployeeCode;
    modalRef.componentInstance.employeeData = this.EmployeeData;

    modalRef.result.then((result) => {
      if (result === 'success') {
        this.GetAllUploadsDetails(this.EmployeeCode);
      }
    }).catch(() => {});
  }

  OpenAllMouRenewalHistory(row: any): void {
    const modalRef = this.modalService.open(MouRenewalHistoryModalComponent, { size: 'xl', windowClass: 'modal-xl', backdrop: 'static' });
    modalRef.componentInstance.mouId = row.id;
    modalRef.componentInstance.newMouid = row.newMouId;
    modalRef.componentInstance.allSchoolDivisions = this.allSchoolDivisions;
    modalRef.result.then(() => {}).catch(() => {});
  }
}

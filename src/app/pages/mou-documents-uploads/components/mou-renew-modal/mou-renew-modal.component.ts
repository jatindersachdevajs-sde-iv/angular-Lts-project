import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MouServices } from '../../../../services/mou-services';
import swal from 'sweetalert2';

interface SchoolDivision {
  id: number;
  schoolDivision: string;
}

interface Employee {
  employeeName: string;
  employeeCode: string;
}

@Component({
  selector: 'app-mou-renew-modal',
  templateUrl: './mou-renew-modal.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule]
})
export class MouRenewModalComponent implements OnInit {
  @Input() mouRow: any;
  @Input() allSchoolDivisions: SchoolDivision[] = [];
  @Input() employeeCode: string = '';
  @Input() employeeData: Employee[] = [];

  mouForm!: FormGroup;
  mouId: any;
  isRenewalMode: boolean = false;
  renewalFile: File | null = null;
  renewalFileBase64: string | null = null;
  renewalFileName: string = '';
  renewalFileError: string = '';
  moustatus: string = 'Expired';

  ResponsiblePerson: string = '';
  AssignedToUid: string = '';
  AssignedToUidName: string = '';
  showSuggestions: boolean = false;
  filteredEmployeesData: Employee[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private mouDocumentsService: MouServices
  ) {}

  ngOnInit(): void {
    this.isRenewalMode = true;
    this.initForm();
    this.populateForm();
  }

  initForm() {
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

  populateForm() {
    if (this.mouRow) {
      this.mouId = this.mouRow.id;
      this.isRenewalMode = this.mouRow.mouStatus === 'Expired';
      
      this.mouForm.patchValue({
        mouId: this.mouRow.id,
        selectedDivisions: this.mouRow.schoolDivisionInvolved ? this.mouRow.schoolDivisionInvolved.split(',') : [],
        mouOrganisation: this.mouRow.mouPartnerName,
        startDate: this.formatDate(this.mouRow.mouStartDate),
        endDate: this.formatDate(this.mouRow.mouEndDate),
        isIndefinite: this.mouRow.mouStatus === 'Active' && !this.mouRow.mouEndDate,
        spocName: this.mouRow.spocName,
        spocEmail: this.mouRow.spocEmailId,
        spocContact: this.mouRow.spocContactNo,
        lpuSpocName: this.mouRow.lpuSpocName,
        lpuSpocUid: this.mouRow.lpuSpocUID,
        lpuSpocEmail: this.mouRow.lpuSpocEmail,
        remarks: ''
      });

      this.AssignedToUid = this.mouRow.lpuSpocUID;
      this.AssignedToUidName = this.mouRow.lpuSpocName;
      this.moustatus = this.mouRow.mouStatus;
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  isInvalid(controlName: string): boolean {
    const control = this.mouForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  toggleEndDate(): void {
    const isIndefinite = this.mouForm.get('isIndefinite')?.value;
    if (isIndefinite) {
      this.mouForm.get('endDate')?.setValue('');
      this.moustatus = 'Active';
    } else {
      this.updateMouStatus();
    }
  }

  updateMouStatus(): void {
    const today = new Date();
    const startDateVal = this.mouForm.get('startDate')?.value;
    const endDateVal = this.mouForm.get('endDate')?.value;
    const isIndefinite = this.mouForm.get('isIndefinite')?.value;

    const startDate = startDateVal ? new Date(startDateVal) : null;
    const endDate = endDateVal ? new Date(endDateVal) : null;

    if (isIndefinite) {
      this.moustatus = 'Active';
    } else if (startDate) {
      if (!endDate || (today >= startDate && today <= endDate)) {
        this.moustatus = 'Active';
      } else {
        this.moustatus = 'Expired';
      }
    } else {
      this.moustatus = 'Expired';
    }
  }

  onInput2() {
    const query = this.mouForm.get('lpuSpocName')?.value?.toLowerCase();
    if (query && query.length >= 2) {
      this.filteredEmployeesData = this.employeeData.filter(emp =>
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

    this.filteredEmployeesData = [];
    this.showSuggestions = false;
  }

  onRenewFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
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
      const base64Data = result.split(',')[1];
      this.renewalFileBase64 = base64Data;
    };
    reader.readAsDataURL(file);
  }

  onSubmitModal(): void {
    if (this.isRenewalMode) {
      this.onSubmitRenew();
    }
  }

  onSubmitRenew(): void {
    if (this.mouForm.invalid) {
      this.mouForm.markAllAsTouched();
      const invalidFields: string[] = [];
      const controls = this.mouForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidFields.push(name);
        }
      }
      swal.fire({
        title: 'Validation Error',
        html: `<p>Please fill in all required fields:</p><ul class="text-start">${invalidFields.map(f => `<li>${this.getFieldDisplayName(f)}</li>`).join('')}</ul>`,
        icon: 'error'
      });
      return;
    }

    if (!this.renewalFile || !this.renewalFileBase64) {
      swal.fire('Error', 'Please upload a valid MOU document for renewal.', 'error');
      return;
    }

    const val = this.mouForm.getRawValue();
    let newMouStatus = 'Active';
    const today = new Date();
    const startDate = val.startDate ? new Date(val.startDate) : null;
    const endDate = val.isIndefinite ? null : (val.endDate ? new Date(val.endDate) : null);

    if (val.isIndefinite) {
      newMouStatus = 'Active';
    } else if (startDate) {
      if (!endDate || (today >= startDate && today <= endDate)) {
        newMouStatus = 'Active';
      } else {
        newMouStatus = 'Expired';
      }
    } else {
      newMouStatus = 'Expired';
    }

    const formData = new FormData();
    formData.append('UID', this.employeeCode);
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
    formData.append('CreatedBy', this.employeeCode);

    swal.fire({
      title: 'Renew MOU',
      text: 'Are you sure you want to renew this MOU? This will create a new MOU and mark the old one as Renewed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, renew MOU',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.value) {
        this.mouDocumentsService.MouRenewalDetails(formData).subscribe({
          next: (data: any) => {
            const resultMsg = data.item1 && data.item1.length > 0 ? data.item1[0].msg : data.responseData;
            if (resultMsg === 'success') {
              swal.fire('Success', 'Renewed MOU successfully.', 'success').then(() => {
                this.activeModal.close('success');
              });
            } else {
              swal.fire('Error', 'Failed to create new MOU. Please try again.', 'error');
            }
          },
          error: (err) => {
            swal.fire('Error', 'Failed to upload new MOU document.', 'error');
          }
        });
      }
    });
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
      'lpuSpocEmail': 'LPU SPOC Email'
    };
    return fieldNames[fieldName] || fieldName;
  }
}

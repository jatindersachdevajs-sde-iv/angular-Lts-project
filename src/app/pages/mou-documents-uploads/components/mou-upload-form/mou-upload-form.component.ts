import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { MouServices } from '../../../../services/mou-services';
import swal from 'sweetalert2';

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
  selector: 'app-mou-upload-form',
  templateUrl: './mou-upload-form.component.html',
  styleUrls: ['./mou-upload-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule]
})
export class MouUploadFormComponent implements OnInit {
  @Input() employeeName: string = '';
  @Input() employeeCode: string = '';
  @Input() departmentName: string = '';
  @Input() allSchoolDivisions: SchoolDivision[] = [];
  @Input() allMouCategories: MouCategory[] = [];

  @Output() uploadSuccess = new EventEmitter<void>();

  @ViewChild('myForm') myForm!: NgForm;

  isSubmitting: boolean = false;

  SelectedMouCategory: any = null;
  hasCategoryError: boolean = true;
  MouPartner: string = '';
  SOPCName: string = '';
  MouStartDate: string = '';
  isIndefiniteMou: boolean = false;
  MouEndDate: string = '';
  moustatus: string = 'Expired';
  SOPCEmail: string = '';
  SOPCNumber: string = '';
  
  ResponsiblePerson: string = '';
  employeeControl = new FormControl();
  EmployeeData: Employee[] = [];
  filteredEmployeesData: Employee[] = [];
  showSuggestions = false;
  activeSuggestionIndex: number = -1;
  AssignedToUid: string = '';
  AssignedToUidName: string = '';
  LPUSpocEmail: string = '';

  selectedSchoolDivisions: number[] = [];
  selectedDivisions: number[] = [];
  hasSelectionError: boolean = true;

  fileData: File | null = null;
  fileStatus: boolean = false;
  FileData: string = '';
  fileName: string = '';
  uploadEnabled: boolean = false;
  SchoolInvolved: string = '';

  constructor(private mouDocumentsService: MouServices) {}

  ngOnInit(): void {
    this.GetEmployeeData();
  }

  GetEmployeeData(): void {
    this.mouDocumentsService.GetEmployeeData().subscribe({
      next: response => {
        this.EmployeeData = response.item1.length > 0 ? response.item1 : [];
      },
      error: err => console.error(err)
    });
  }

  changeCategory(event: any) {
    this.SelectedMouCategory = event ? event['CategoryName'] : null;
    this.hasCategoryError = !event;
  }

  toggleEndDate(): void {
    if (this.isIndefiniteMou) {
      this.MouEndDate = '';
      this.moustatus = 'Active';
    } else {
      this.updateMouStatus();
    }
  }

  updateMouStatus(): void {
    const today = new Date();
    const startDate = this.MouStartDate ? new Date(this.MouStartDate) : null;
    const endDate = this.MouEndDate ? new Date(this.MouEndDate) : null;

    if (this.isIndefiniteMou) {
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
    this.AssignedToUidName = employee.employeeName;
    this.employeeControl.setValue(`${employee.employeeName} (${employee.employeeCode})`);
    this.filteredEmployeesData = [];
    this.showSuggestions = false;
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

  hideSuggestions() {
    setTimeout(() => this.showSuggestions = false, 200);
  }

  checkUIDValidity(): void {
    this.uploadEnabled = this.AssignedToUid !== '';
  }

  changeResponsiblePlanned(event: any) {
    this.selectedDivisions = [];
    if (event) {
      for (let i = 0; i < event.length; i++) {
        this.selectedDivisions.push(event[i].id);
      }
    }
    this.hasSelectionError = this.selectedDivisions.length === 0;
  }

  getDivisionNameById(id: number): string {
    const idStr = id.toString();
    let division = this.allSchoolDivisions.find(school => school.id === +idStr);
    return division ? division.schoolDivision : `ID ${idStr} not found`;
  }

  onFileSelected(event: any): void {
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;
    
    if (file && file.size > 3148576) {
      swal.fire({
        title: 'File size exceeds 3MB. Please upload a smaller file.',
        text: 'Invalid File size',
        icon: 'warning'
      });
      target.value = '';
      return;
    }

    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (file && !fileNameRegex.test(file.name)) {
      const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const modifiedFile = new File([file], validFileName, { type: file.type });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(modifiedFile);
      target.files = dataTransfer.files;

      this.fileData = modifiedFile;
      this.fileStatus = true;

      reader.readAsDataURL(modifiedFile);
      reader.onload = () => {
        const ssss = reader.result as string;
        const ssssArray = ssss.split(',');
        this.FileData = ssssArray[1];
        this.fileName = validFileName;
      };
      this.uploadEnabled = true;
      return;
    }

    this.fileData = file;
    this.fileStatus = true;
    if (file) {
      reader.readAsDataURL(file);
      reader.onload = () => {
        const ssss = reader.result as string;
        const ssssArray = ssss.split(',');
        this.FileData = ssssArray[1];
        this.fileName = file.name;
        this.SchoolInvolved = this.selectedDivisions.join(',');

        if (this.SOPCName?.length < 5 || this.SOPCEmail?.length < 5 || this.SOPCNumber?.length < 10 || this.MouPartner?.length < 5 || this.selectedDivisions.length < 1) {
          swal.fire({
            title: 'Invalid Data !',
            text: ' Required Partner Name, SOPC Name , EMail as well as SOPC Number',
            icon: 'warning'
          }).then(() => {
            // Reset files
            target.value = '';
            this.fileData = null;
            this.fileStatus = false;
            this.FileData = '';
            this.fileName = '';
          });
        } else {
          this.uploadEnabled = true;
        }
      };
    }
  }

  UploadDocument() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const arrayUniqueByKey = [...new Set(this.selectedDivisions)];
    this.SchoolInvolved = arrayUniqueByKey.join(',');
    
    const formData = new FormData();
    formData.append('UID', this.employeeCode);
    formData.append('MouCategory', this.SelectedMouCategory);
    formData.append('MouTitle', this.MouPartner);
    formData.append('MouPartnerName', this.MouPartner);
    formData.append('FacultyName', this.employeeName);
    formData.append('MouStartDate', this.MouStartDate);
    formData.append('MouEndDate', this.MouEndDate.length > 0 ? this.MouEndDate : 'null');
    formData.append('MouStatus', this.moustatus);
    formData.append('FilePath', this.fileName);
    formData.append('File', this.FileData);
    formData.append('CreatedBy', this.employeeCode);
    formData.append('SchoolDivisionInvolved', this.SchoolInvolved);
    formData.append('SPOCName', this.SOPCName);
    formData.append('SPOCEmail', this.SOPCEmail);
    formData.append('SPOCContact', this.SOPCNumber);
    formData.append('LPUSpocName', this.AssignedToUidName);
    formData.append('LPUSpocUID', this.AssignedToUid);
    formData.append('LPUSpocEmail', this.LPUSpocEmail);

    this.mouDocumentsService.MouDocumentUpload(formData).subscribe({
      next: (data: any) => {
        this.isSubmitting = false;
        const result = data.item1[0]['msg'];
        if (result === 'ok') {
          swal.fire({
            title: 'Uploaded Successfully!',
            icon: 'success'
          }).then(() => {
            this.uploadSuccess.emit();
            this.clearFields();
          });
        } else {
          swal.fire({
            title: 'Error Occured, Try Again Later',
            icon: 'error'
          });
        }
      },
      error: (error: any) => {
        this.isSubmitting = false;
        swal.fire({
          title: 'Error',
          text: 'Failed to Upload.',
          icon: 'error'
        });
      }
    });
  }

  clearFields(): void {
    this.SOPCEmail = this.SOPCName = this.SOPCNumber = this.MouPartner = '';
    this.MouStartDate = '';
    this.MouEndDate = '';
    this.isIndefiniteMou = false;
    this.moustatus = 'Expired';
    this.ResponsiblePerson = '';
    this.employeeControl.setValue('');
    this.AssignedToUid = '';
    this.AssignedToUidName = '';
    this.LPUSpocEmail = '';
    this.selectedSchoolDivisions = [];
    this.selectedDivisions = [];
    this.hasSelectionError = true;
    this.fileData = null;
    this.fileStatus = false;
    this.FileData = '';
    this.fileName = '';
    this.uploadEnabled = false;
    if (this.myForm) {
      this.myForm.resetForm();
    }
  }
}

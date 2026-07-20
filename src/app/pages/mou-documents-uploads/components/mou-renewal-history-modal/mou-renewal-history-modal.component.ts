import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MouServices } from '../../../../services/mou-services';
import swal from 'sweetalert2';

interface SchoolDivision {
  id: number;
  schoolDivision: string;
}

@Component({
  selector: 'app-mou-renewal-history-modal',
  templateUrl: './mou-renewal-history-modal.component.html',
  standalone: true,
  imports: [CommonModule, NgxDatatableModule]
})
export class MouRenewalHistoryModalComponent implements OnInit {
  @Input() mouId: any;
  @Input() newMouid: any;
  @Input() allSchoolDivisions: SchoolDivision[] = [];

  renewedMouDocumentDetails: any[] = [];
  loadingIndicator: boolean = false;
  columns: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private mouDocumentsService: MouServices,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.mouId) {
      this.getRenewedMouDetails(this.mouId);
    }
  }

  getRenewedMouDetails(mouId: any): void {
    this.loadingIndicator = true;
    this.mouDocumentsService.GetRenewedMouDetails(mouId).subscribe({
      next: (response) => {
        this.renewedMouDocumentDetails = response && response.item1 && response.item1.length > 0 ? response.item1 : [];
        this.loadingIndicator = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingIndicator = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDivisionNameById(id: any): string {
    const idStr = String(id).trim();
    const division = this.allSchoolDivisions.find(school => String(school.id) === idStr);
    return division ? division.schoolDivision : `ID ${idStr}`;
  }

  onDownloadFile(remoteUrl: string): void {
    swal.fire({ title: 'Downloading...', didOpen: () => { swal.showLoading(null); } });
    this.mouDocumentsService.downloadMOUFile(remoteUrl).subscribe({
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
          const errorMsg = JSON.parse(await err.error.text());
          swal.fire('Error', errorMsg.message || 'Download failed', 'error');
        } else {
          swal.fire('Error', 'Could not connect to the server', 'error');
        }
      }
    });
  }
}

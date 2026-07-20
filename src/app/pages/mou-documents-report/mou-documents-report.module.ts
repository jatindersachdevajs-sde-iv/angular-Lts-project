// src/app/pages/mou-documents-report/mou-documents-report.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';

import { MouReportComponent } from './components/mou-report/mou-report.component';

const routes: Routes = [
  { path: '', component: MouReportComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MouReportComponent,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    NgxDatatableModule,
    NgSelectModule
  ]
})
export class MouDocumentsReportModule { }
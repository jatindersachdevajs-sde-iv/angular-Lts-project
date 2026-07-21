import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule, Routes } from '@angular/router';

import { MouActivityActionPlanComponent } from './mou-activity-action-plan.component';
import { TopScrollSyncDirective } from '../mou-documents-report/top-scroll-sync.directive';

const routes: Routes = [
  {
    path: '',
    component: MouActivityActionPlanComponent
  }
];

@NgModule({
  declarations: [
    // Standalone components cannot be declared, they must be imported
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    NgSelectModule,
    RouterModule.forChild(routes),
    MouActivityActionPlanComponent // Import the standalone component here
  ]
})
export class MouActivityActionPlanModule { }

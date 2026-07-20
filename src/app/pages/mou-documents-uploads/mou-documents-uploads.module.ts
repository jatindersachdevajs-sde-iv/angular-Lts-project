import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MouDocumentsUploadsComponent } from './mou-documents-uploads.component';

const routes: Routes = [
  {
    path: '',
    component: MouDocumentsUploadsComponent, 
  }
];

@NgModule({
  imports: [
    MouDocumentsUploadsComponent,
    RouterModule.forChild(routes)
  ],
  exports: [MouDocumentsUploadsComponent]
})
export class MouDocumentsUploadsModule { }
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MouMenuComponent } from './mou-menu.component';

@NgModule({
  declarations: [
    MouMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    MouMenuComponent
  ]
})
export class MouMenuModule { }
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MouDocumentsUploadsComponent } from './mou-documents-uploads.component';



describe('MouDocumentsUploadsComponent', () => {
  let component: MouDocumentsUploadsComponent;
  let fixture: ComponentFixture<MouDocumentsUploadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MouDocumentsUploadsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MouDocumentsUploadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

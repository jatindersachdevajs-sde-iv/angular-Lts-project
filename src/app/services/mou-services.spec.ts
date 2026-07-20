import { TestBed } from '@angular/core/testing';

import { MouServices } from './mou-services';

describe('MouServices', () => {
  let service: MouServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MouServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

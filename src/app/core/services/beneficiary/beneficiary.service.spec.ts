import { TestBed } from '@angular/core/testing';

import { BeneficiaryService } from './beneficiary.service';

describe('BeneficiaryService', () => {
  let service: BeneficiaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BeneficiaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { ResolverAlimento } from './resolver-alimento';

describe('ResolverAlimento', () => {
  let service: ResolverAlimento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResolverAlimento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

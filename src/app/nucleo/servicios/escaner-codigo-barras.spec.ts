import { TestBed } from '@angular/core/testing';
import { EscanearCodigoBarras } from './escaner-codigo-barras';

describe('EscanerCodigoBarras', () => {
  let service: EscanearCodigoBarras;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EscanearCodigoBarras);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

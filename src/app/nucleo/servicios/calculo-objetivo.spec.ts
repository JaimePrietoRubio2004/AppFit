import { TestBed } from '@angular/core/testing';
import { CalculoObjetivo } from './calculo-objetivo';

describe('CalculoObjetivo', () => {
  let service: CalculoObjetivo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculoObjetivo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

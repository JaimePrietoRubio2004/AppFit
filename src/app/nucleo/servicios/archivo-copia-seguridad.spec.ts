import { TestBed } from '@angular/core/testing';
import { ArchivoCopiaSeguridadTs } from './archivo-copia-seguridad.js';

describe('ArchivoCopiaSeguridadTs', () => {
  let service: ArchivoCopiaSeguridadTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArchivoCopiaSeguridadTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

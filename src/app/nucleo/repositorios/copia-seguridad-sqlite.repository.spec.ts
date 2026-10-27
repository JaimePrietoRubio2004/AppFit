import { TestBed } from '@angular/core/testing';
import { CopiaSeguridadSqliteRepository } from './copia-seguridad-sqlite.repository';

describe('CopiaSeguridadSqliteRepository', () => {
  let service: CopiaSeguridadSqliteRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CopiaSeguridadSqliteRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

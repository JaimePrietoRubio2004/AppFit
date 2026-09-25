import { TestBed } from '@angular/core/testing';
import { RegistroPesoSqliteRepository } from './registro-peso-sqlite.repository';

describe('RegistroPesoSqliteRepository', () => {
  let service: RegistroPesoSqliteRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistroPesoSqliteRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

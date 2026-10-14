import { TestBed } from '@angular/core/testing';
import { PerfilAlimentoSqliteRepository } from './perfil-alimento-sqlite.repository';

describe('PerfilAlimentoSqliteRepository', () => {
  let service: PerfilAlimentoSqliteRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerfilAlimentoSqliteRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

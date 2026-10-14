import { TestBed } from '@angular/core/testing';
import { ObjetivoPerfil } from './objetivo-perfil';

describe('ObjetivoPerfil', () => {
  let service: ObjetivoPerfil;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjetivoPerfil);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

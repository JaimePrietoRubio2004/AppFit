import { TestBed } from '@angular/core/testing';
import { PerfilActual } from './perfil-actual';

describe('PerfilActual', () => {
  let service: PerfilActual;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerfilActual);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { CatalogoSemilla } from './catalogo-semilla';

describe('CatalogoSemilla', () => {
  let service: CatalogoSemilla;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogoSemilla);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

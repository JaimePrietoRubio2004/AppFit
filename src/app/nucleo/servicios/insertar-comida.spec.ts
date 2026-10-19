import { TestBed } from '@angular/core/testing';
import { InsertarComida } from './insertar-comida';

describe('InsertarComida', () => {
  let service: InsertarComida;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InsertarComida);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

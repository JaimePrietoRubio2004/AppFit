import { TestBed } from '@angular/core/testing';
import { LeerTablaNutricional } from './leer-tabla-nutricional';

describe('LeerTablaNutricional', () => {
  let service: LeerTablaNutricional;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeerTablaNutricional);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

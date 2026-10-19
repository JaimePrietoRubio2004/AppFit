import { TestBed } from '@angular/core/testing';
import { PlantillaComidaSqliteRepository } from './plantilla-comida-sqlite.repository';

describe('PlantillaComidaSqliteRepository', () => {
  let service: PlantillaComidaSqliteRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlantillaComidaSqliteRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

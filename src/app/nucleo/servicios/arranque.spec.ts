import { TestBed } from '@angular/core/testing';
import { Arranque } from './arranque';

describe('Arranque', () => {
  let service: Arranque;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Arranque);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

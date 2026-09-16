import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnadirAlimentoComponent } from './anadir-alimento.component';

describe('AnadirAlimentoComponent', () => {
  let component: AnadirAlimentoComponent;
  let fixture: ComponentFixture<AnadirAlimentoComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnadirAlimentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

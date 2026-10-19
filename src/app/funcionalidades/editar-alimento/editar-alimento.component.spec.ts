import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarAlimentoComponent } from './editar-alimento.component';

describe('EditarAlimentoComponent', () => {
  let component: EditarAlimentoComponent;
  let fixture: ComponentFixture<EditarAlimentoComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarAlimentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionPerfilComponent } from './seleccion-perfil.component';

describe('SeleccionPerfilComponent', () => {
  let component: SeleccionPerfilComponent;
  let fixture: ComponentFixture<SeleccionPerfilComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionPerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

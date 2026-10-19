import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsertarComidaComponent } from './insertar-comida.component';

describe('InsertarComidaComponent', () => {
  let component: InsertarComidaComponent;
  let fixture: ComponentFixture<InsertarComidaComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InsertarComidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

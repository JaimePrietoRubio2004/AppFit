import { Service } from '@angular/core';
import {
  NivelActividad,
  ObjetivoCorporal,
  Sexo,
} from '../modelos/perfil.model';

const FACTOR_ACTIVIDAD: Record<NivelActividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muy_alto: 1.9,
};

const KCAL_POR_KG_GRASA = 7700;
const DEFICIT_MAXIMO = 0.25;
const SUELO_KCAL_HOMBRE = 1500;
const SUELO_KCAL_MUJER = 1200;

const PROTEINA_G_KG: Record<ObjetivoCorporal, number> = {
  ganar_masa: 2.0,
  perder_grasa: 2.2,
  recomposicion: 2.4,
};
const GRASA_G_KG: Record<ObjetivoCorporal, number> = {
  ganar_masa: 0.9,
  perder_grasa: 0.8,
  recomposicion: 0.8,
};

export interface DatosParaCalculo {
  sexo: Sexo;
  fechaNacimiento: string;
  alturaCm: number;
  pesoKg: number;
  pesoObjetivoKg: number | null;
  nivelActividad: NivelActividad;
  objetivo: ObjetivoCorporal;
  ritmoSemanalKg: number;
}

export interface ObjetivoCalculado {
  metabolismoBasal: number;
  gastoTotal: number;
  kcalObjetivo: number;
  proteinaG: number;
  grasaG: number;
  carbohidratoG: number;
  semanasEstimadas: number | null;
  limiteAplicado:
    'ninguno' | 'deficit_maximo' | 'suelo_absoluto' | 'metabolismo_basal';
}

export type ResultadoCalculadoObjetivo =
  | { calculado: true; objetivo: ObjetivoCalculado }
  | { calculado: false; motivo: 'imc_bajo_para_perder_grasa' };

function calcularEdad(fechaNacimiento: string): number {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumplida =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() < nacimiento.getDate());
  if (aunNoCumplida) edad--;
  return edad;
}

function calcularImc(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

function calcularSemanasEstimadas(
  pesoActual: number,
  pesoObjetivo: number | null,
  ritmoSemanalKg: number,
): number | null {
  if (pesoObjetivo === null || ritmoSemanalKg === 0) {
    return null;
  }
  return Math.abs(pesoActual - pesoObjetivo) / Math.abs(ritmoSemanalKg);
}

@Service()
export class CalculoObjetivo {
  calcular(datos: DatosParaCalculo): ResultadoCalculadoObjetivo {
    const imcRelevante =
      datos.pesoObjetivoKg !== null
        ? calcularImc(datos.pesoObjetivoKg, datos.alturaCm)
        : calcularImc(datos.pesoKg, datos.alturaCm);
    if (datos.objetivo === 'perder_grasa' && imcRelevante < 18.5) {
      return { calculado: false, motivo: 'imc_bajo_para_perder_grasa' };
    }

    const edad = calcularEdad(datos.fechaNacimiento);
    const ajusteSexo = datos.sexo === 'hombre' ? 5 : -161;
    const metabolismoBasal =
      10 * datos.pesoKg + 6.25 * datos.alturaCm - 5 * edad + ajusteSexo;

    const gastoTotal =
      metabolismoBasal * FACTOR_ACTIVIDAD[datos.nivelActividad];

    const { kcalObjetivo, limiteAplicado } = this.aplicarObjetivoYLimites(
      datos,
      metabolismoBasal,
      gastoTotal,
    );

    const proteinaG = PROTEINA_G_KG[datos.objetivo] * datos.pesoKg;
    const grasaG = GRASA_G_KG[datos.objetivo] * datos.pesoKg;
    const kcalRestantes = kcalObjetivo - proteinaG * 4 - grasaG * 9;
    const carbohidratoG = Math.max(0, kcalRestantes / 4);

    const semanasEstimadas =
      datos.objetivo === 'recomposicion'
        ? null
        : calcularSemanasEstimadas(
            datos.pesoKg,
            datos.pesoObjetivoKg,
            datos.ritmoSemanalKg,
          );

    return {
      calculado: true,
      objetivo: {
        metabolismoBasal,
        gastoTotal,
        kcalObjetivo,
        proteinaG,
        grasaG,
        carbohidratoG,
        semanasEstimadas,
        limiteAplicado,
      },
    };
  }

  private aplicarObjetivoYLimites(
    datos: DatosParaCalculo,
    metabolismoBasal: number,
    gastoTotal: number,
  ): {
    kcalObjetivo: number;
    limiteAplicado: ObjetivoCalculado['limiteAplicado'];
  } {
    if (datos.objetivo === 'recomposicion') {
      return { kcalObjetivo: gastoTotal, limiteAplicado: 'ninguno' };
    }

    const ajusteDiario = (datos.ritmoSemanalKg * KCAL_POR_KG_GRASA) / 7;

    if (datos.objetivo === 'ganar_masa') {
      return {
        kcalObjetivo: gastoTotal + ajusteDiario,
        limiteAplicado: 'ninguno',
      };
    }

    const sueloSexo =
      datos.sexo === 'hombre' ? SUELO_KCAL_HOMBRE : SUELO_KCAL_MUJER;
    const kcalConDeficitDeseado = gastoTotal - ajusteDiario;
    const kcalConDeficitMaximo = gastoTotal * (1 - DEFICIT_MAXIMO);

    let kcalObjetivo = Math.max(kcalConDeficitDeseado, kcalConDeficitMaximo);
    let limiteAplicado: ObjetivoCalculado['limiteAplicado'] =
      kcalObjetivo > kcalConDeficitDeseado ? 'deficit_maximo' : 'ninguno';

    if (kcalObjetivo < sueloSexo) {
      kcalObjetivo = sueloSexo;
      limiteAplicado = 'suelo_absoluto';
    }
    if (kcalObjetivo < metabolismoBasal) {
      kcalObjetivo = metabolismoBasal;
      limiteAplicado = 'metabolismo_basal';
    }

    return { kcalObjetivo, limiteAplicado };
  }
}

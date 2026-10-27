import { inject, Service } from '@angular/core';
import { REGISTRO_CONSUMO_REPOSITORY } from '../repositorios/registro-consumo.repository';
import { REGISTRO_PESO_REPOSITORY } from '../repositorios/registro-peso.repository';
import { sumarDias } from '../utilidades/fecha';

const VENTANA_DIAS = 7;

interface TotalesDias {
  kcal: number;
  proteinaG: number;
  grasaG: number;
  carbohidratoG: number;
  kcalEstimadas: number;
}

export interface PuntoSerie {
  fecha: string;
  kcal: number | null;
  proteinaG: number | null;
  grasaG: number | null;
  carbohidratoG: number | null;
  diasConDatos: number;
  pesoKg: number | null;
  pesosEnVentana: number;
  porcentajeEstimado: number | null;
}

function media(valores: number[]): number | null {
  if (valores.length === 0) {
    return null;
  }
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

@Service()
export class Estadisticas {
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );
  private readonly registroPesoRepository = inject(REGISTRO_PESO_REPOSITORY);

  async serie(
    perfilId: number,
    hasta: string,
    numDias: number,
  ): Promise<PuntoSerie[]> {
    const primerDia = sumarDias(hasta, -(numDias - 1));
    const desdeDatos = sumarDias(primerDia, -(VENTANA_DIAS - 1));

    const consumos = await this.registroConsumoRepository.obtenerRango(
      perfilId,
      desdeDatos,
      hasta,
    );
    const pesos = await this.registroPesoRepository.obtenerRango(
      perfilId,
      desdeDatos,
      hasta,
    );
    const totalesPorDia = new Map<string, TotalesDias>();
    for (const consumo of consumos) {
      const totales = totalesPorDia.get(consumo.fecha) ?? {
        kcal: 0,
        proteinaG: 0,
        grasaG: 0,
        carbohidratoG: 0,
        kcalEstimadas: 0,
      };
      totales.kcal += consumo.kcal;
      totales.kcalEstimadas += consumo.esEstimado ? consumo.kcal : 0;
      totales.grasaG += consumo.grasaG;
      totales.carbohidratoG += consumo.carboHidratoG;
      totales.proteinaG += consumo.proteinaG;
      totalesPorDia.set(consumo.fecha, totales);
    }
    const pesoPorDia = new Map(pesos.map((p) => [p.fecha, p.pesoKg]));
    const serie: PuntoSerie[] = [];
    for (let i = 0; i < numDias; i++) {
      const fecha = sumarDias(primerDia, i);
      const ventana = Array.from({ length: VENTANA_DIAS }, (_, j) =>
        sumarDias(fecha, -j),
      );
      const totalesVentana = ventana
        .map((dia) => totalesPorDia.get(dia))
        .filter((t): t is TotalesDias => t !== undefined);
      const pesosVentana = ventana
        .map((dia) => pesoPorDia.get(dia))
        .filter((p): p is number => p !== undefined);
      const kcalVentana = totalesVentana.reduce((s, t) => s + t.kcal, 0);
      const kcalEstimadasVentana = totalesVentana.reduce(
        (s, t) => s + t.kcalEstimadas,
        0,
      );
      serie.push({
        fecha,
        kcal: media(totalesVentana.map((t) => t.kcal)),
        proteinaG: media(totalesVentana.map((t) => t.proteinaG)),
        grasaG: media(totalesVentana.map((t) => t.grasaG)),
        carbohidratoG: media(totalesVentana.map((t) => t.carbohidratoG)),
        diasConDatos: totalesVentana.length,
        pesoKg: media(pesosVentana),
        pesosEnVentana: pesosVentana.length,
        porcentajeEstimado:
          kcalVentana > 0 ? (kcalEstimadasVentana / kcalVentana) * 100 : null,
      });
    }
    return serie;
  }
}

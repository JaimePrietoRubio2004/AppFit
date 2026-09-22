import { Service } from '@angular/core';
import type { NuevoAlimento } from '../repositorios/alimento.repository';

const URL_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const AGENTES_USUARIO = 'AppFit - App personal de nutricion - Version 1.0';

interface NutrientesOpenFoodFacts {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  'saturated-fat_100g'?: number;
  fiber_100g?: number;
  salt_100g?: number;
}

interface ProductoOpenFoodFacts {
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  nutriments?: NutrientesOpenFoodFacts;
  serving_size?: string;
}

interface RespuestaOpenFoodFacts {
  status: number;
  product?: ProductoOpenFoodFacts;
}

@Service()
export class OpenFoodFacts {
  async buscarPorCodigoDeBarras(
    codigoBarras: string,
  ): Promise<NuevoAlimento | null> {
    const respuesta = await fetch(`${URL_BASE}/${codigoBarras}.json`, {
      headers: { 'User-Agent': AGENTES_USUARIO },
    });
    if (!respuesta.ok) {
      return null;
    }
    const datos = (await respuesta.json()) as RespuestaOpenFoodFacts;
    if (datos.status !== 1 || !datos.product) {
      return null;
    }

    return this.aNuevoAlimento(codigoBarras, datos.product);
  }

  private aNuevoAlimento(
    codigoBarras: string,
    producto: ProductoOpenFoodFacts,
  ): NuevoAlimento | null {
    const nutrientes = producto.nutriments;
    const kcal100g = nutrientes?.['energy-kcal_100g'];
    const proteina100g = nutrientes?.proteins_100g;
    const grasa100g = nutrientes?.fat_100g;
    const carbohidrato100g = nutrientes?.carbohydrates_100g;
    const nombre = producto.product_name_es || producto.product_name;
    const sinDatosReales =
      kcal100g === undefined ||
      proteina100g === undefined ||
      grasa100g === undefined ||
      carbohidrato100g === undefined ||
      !nombre ||
      (kcal100g === 0 &&
        proteina100g === 0 &&
        grasa100g === 0 &&
        carbohidrato100g === 0);

    if (sinDatosReales) {
      return null;
    }
    return {
      codigoBarras,
      nombre,
      marca: producto.brands ?? null,
      kcal100g,
      proteina100g,
      grasa100g,
      carbohidrato100g,
      azucares100g: nutrientes?.sugars_100g ?? 0,
      saturadas100g: nutrientes?.['saturated-fat_100g'] ?? 0,
      fibra100g: nutrientes?.fiber_100g ?? 0,
      sal100g: nutrientes?.salt_100g ?? 0,
      nombreUnidad: null,
      gramosPorUnidad: null,
      unidadOrigen: 'openfoodfacts',
      tipoMedida: 'solido',
      kcalAlcohol100: null,
      esEstimado: false,
      origen: 'openfoodfacts',
      fechaCache: new Date().toISOString(),
    };
  }
}

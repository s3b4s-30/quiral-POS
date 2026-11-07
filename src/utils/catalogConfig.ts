import {
  AttributeDefinition,
  CatalogConfig,
  CategoryConfig,
  ProductCategory,
  TrashedCategoryEntry,
} from "../types/domain";

/**
 * Categorías base de fábrica que actúan como respaldo predeterminado.
 * Pueden quitarse de la barra activa y restaurarse con un solo toque desde la sección de Respaldo.
 */
export const FACTORY_BASE_CATEGORIES: ProductCategory[] = [
  "Cargadores y Cables",
  "Forros / Fundas",
  "Protección de Pantalla",
  "Audio",
  "Power Banks / Baterías portatiles",
  "Almacenamiento",
  "Celulares",
  "Perfumes",
  "Smartwatch y Wearables",
  "Soportes y Accesorios de Auto",
  "Streaming",
];

export const FALLBACK_ORPHAN_CATEGORY: ProductCategory = "General / Otros";

/**
 * Normaliza textos de categorías, marcas y atributos:
 * - Elimina espacios al inicio y final
 * - Colapsa múltiples espacios seguidos en uno solo
 * - Si el texto viene completamente en minúsculas y comienza por letra (no es prefijo técnico como iPhone o mAh),
 *   capitaliza la primera letra para mantener consistencia visual.
 */
export function normalizeCatalogText(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  // Preservar términos con mayúsculas intencionales (ej. iPhone, mAh, USB-C, 2TB, 140W)
  const hasUppercase = /[A-ZÁÉÍÓÚÑ]/.test(cleaned);
  if (!hasUppercase && /^[a-záéíóúñ]/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Compara dos textos de catálogo ignorando diferencias de mayúsculas/minúsculas y espacios dobles.
 */
export function isSameCatalogText(a: string, b: string): boolean {
  return (
    normalizeCatalogText(a).toLowerCase() ===
    normalizeCatalogText(b).toLowerCase()
  );
}

/**
 * Obtiene las opciones efectivas de un atributo para una categoría específica.
 * Arquitectura de Cascarones Globales e Instanciación Local:
 * - Si no se pasa categoryName: retorna los Presets Históricos maestros del Banco Global.
 * - Si se pasa categoryName: retorna las opciones aisladas de dicha categoría.
 *   Si la categoría aún no tiene opciones asignadas para ese atributo, retorna [] (instancia limpia vacía)
 *   evitando heredar o contaminar masivamente marcas o presets de otras categorías.
 */
export function getEffectiveAttributeOptions(
  config: CatalogConfig,
  categoryName?: string | null,
  attributeKey?: string
): string[] {
  if (!attributeKey || !config.attributes[attributeKey]) return [];
  const masterPresets = config.attributes[attributeKey].options ?? [];
  if (!categoryName) return masterPresets;

  const scopedCatKey = Object.keys(config.categoryAttributeValues || {}).find(
    (cat) => isSameCatalogText(cat, categoryName)
  );

  if (
    scopedCatKey &&
    config.categoryAttributeValues?.[scopedCatKey]?.[attributeKey] !== undefined
  ) {
    return config.categoryAttributeValues[scopedCatKey][attributeKey];
  }

  // Instanciación local vacía para atributos recién vinculados o categorías personalizadas
  return [];
}

/**
 * Retorna todos los Presets Históricos / Maestros disponibles en el Banco Global para un atributo.
 */
export function getAttributePresets(
  config: CatalogConfig,
  attributeKey: string
): string[] {
  return config.attributes[attributeKey]?.options ?? [];
}

/**
 * Infiere inteligentemente los bloques de atributos recomendados según el nombre de la categoría.
 */
export function inferAttributeKeysForCategory(categoryName: string): string[] {
  const lower = categoryName.trim().toLowerCase();

  if (/cargador|cable|cubo|adaptador/.test(lower)) {
    return [
      "chargerSubtypes",
      "brands",
      "powers",
      "cableFinishes",
      "cableLengths",
    ];
  }
  if (
    /vidrio|templado|mica|proteccion|protección|ceramica|cerámica|antiespia|antiespía/.test(
      lower
    )
  ) {
    return ["screenProtectorTypes", "caseModels"];
  }
  if (/forro|funda|case|estuche|protector/.test(lower)) {
    return ["caseMaterials", "caseModels"];
  }
  if (
    /audio|airpod|auricular|audifono|audífono|parlante|bocina|microfono|micrófono/.test(
      lower
    )
  ) {
    return ["audioModels", "connections"];
  }
  if (
    /bateria|batería|power\s*bank|portatil|portátiles|portatiles|magsafe/.test(
      lower
    )
  ) {
    return ["capacities", "ports"];
  }
  if (/ssd|disco|memoria|almacenamiento|pendrive|micro\s*sd|usb/.test(lower)) {
    return ["storageTypes", "storageCapacities", "brands"];
  }
  if (/reloj|smartwatch|watch|wearable|pulsera|band/.test(lower)) {
    return ["watchSizes", "watchBands", "colors", "brands"];
  }
  if (/soporte|auto|carro|vehiculo|vehículo|rejilla|chupa/.test(lower)) {
    return ["carMountTypes", "brands"];
  }
  if (/celular|telefono|teléfono|smartphone|tablet|ipad/.test(lower)) {
    return ["brands", "storageCapacities", "colors"];
  }
  if (/perfume|locion|loción|fragancia|aroma/.test(lower)) {
    return ["perfumeVolumes", "perfumeTypes"];
  }
  if (/streaming|cuenta|pantalla|suscripcion|suscripción|digital/.test(lower)) {
    return ["streamingPlatforms", "streamingDurations"];
  }

  return ["brands", "colors"];
}

export const DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  chargerSubtypes: {
    key: "chargerSubtypes",
    label: "Subtipo",
    options: [
      "Cubo",
      "Cable",
      "Cargador Completo",
      "Cargador Inalámbrico / MagSafe",
    ],
  },
  brands: {
    key: "brands",
    label: "Marca",
    options: [
      "iPhone",
      "1Hora",
      "Anker",
      "Belkin",
      "Samsung",
      "Ugreen",
      "Apple Original",
      "Xiaomi",
      "Motorola",
      "JBL",
      "Sony",
      "Baseus",
      "Huawei",
      "ZTE",
      "Kingston",
      "SanDisk",
      "Genérico Premium",
    ],
  },
  powers: {
    key: "powers",
    label: "Potencia (W)",
    options: ["20W", "25W", "30W", "35W", "45W", "60W", "65W"],
  },
  cableFinishes: {
    key: "cableFinishes",
    label: "Acabado del cable",
    options: ["Normal", "Trenzado"],
  },
  cableLengths: {
    key: "cableLengths",
    label: "Longitud del cable",
    options: ["1 Metro", "1.5 Metros", "2 Metros", "3 Metros"],
  },
  caseMaterials: {
    key: "caseMaterials",
    label: "Material",
    options: ["Silicona Líquida", "Transparente Anti-amarilleo", "Lujo"],
  },
  caseModels: {
    key: "caseModels",
    label: "Modelo Compatible",
    options: [
      "iPhone 11",
      "iPhone 12 / 12 Pro",
      "iPhone 12 Pro Max",
      "iPhone 13 / 14",
      "iPhone 13 Pro Max",
      "iPhone 14 Pro",
      "iPhone 14 Pro Max",
      "iPhone 15",
      "iPhone 15 Pro",
      "iPhone 15 Pro Max",
      "iPhone 16",
      "iPhone 16 Pro",
      "iPhone 16 Pro Max",
    ],
  },
  screenProtectorTypes: {
    key: "screenProtectorTypes",
    label: "Vidrios Templados",
    options: ["Cerámica", "Privacidad", "9D", "Antiespía"],
  },
  audioModels: {
    key: "audioModels",
    label: "Modelo",
    options: [
      "AirPods Serie 3",
      "AirPods Serie 4",
      "AirPods Pro 2da Generación",
      "AirPods Pro 3ra Generación",
      "AirPods Max",
      "EarPods Alámbricos",
    ],
  },
  connections: {
    key: "connections",
    label: "Tipo de Conexión",
    options: [
      "USB-C",
      "Lightning",
      "MagSafe",
      "Bluetooth 5.3",
      "USB-C a Lightning",
      "USB-C a USB-C",
      "USB-A a USB-C",
      "USB-A a Lightning",
      "Auxiliar 3.5mm",
    ],
  },
  capacities: {
    key: "capacities",
    label: "Capacidad (mAh)",
    options: [
      "5000mAh",
      "10000mAh",
      "15000mAh",
      "20000mAh",
      "25000mAh",
      "30000mAh",
      "50000mAh",
    ],
  },
  ports: {
    key: "ports",
    label: "Conexiones / Puertos",
    options: [
      "USB-C PD",
      "Lightning",
      "Dual USB-C + USB-Lightning",
      "MagSafe Inalámbrico",
    ],
  },
  storageTypes: {
    key: "storageTypes",
    label: "Formato de Memoria",
    options: ["MicroSD", "USB", "SSD Portátil", "Adaptador OTG"],
  },
  storageCapacities: {
    key: "storageCapacities",
    label: "Capacidad",
    options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB", "4TB"],
  },
  watchSizes: {
    key: "watchSizes",
    label: "Tamaño de caja",
    options: ["40mm", "44mm", "45mm", "49mm Ultra"],
  },
  watchBands: {
    key: "watchBands",
    label: "Tipo de Correa",
    options: ["Silicona", "Milanesa", "Cuero", "Océano"],
  },
  carMountTypes: {
    key: "carMountTypes",
    label: "Tipo de agarre",
    options: ["Rejilla", "Chupa", "MagSafe / Magnético"],
  },
  colors: {
    key: "colors",
    label: "Color / Acabado",
    options: [
      "Negro Espacial",
      "Blanco Estelar",
      "Titanio Natural",
      "Titanio Desierto",
      "Titanio Azul",
      "Plata",
      "Azul",
      "Rosa",
      "Verde Alpino",
      "Morado Oscuro",
      "Rojo",
      "Transparente",
    ],
  },
  perfumeVolumes: {
    key: "perfumeVolumes",
    label: "Presentación (ml)",
    options: [
      "30ml",
      "50ml",
      "75ml",
      "100ml",
      "120ml",
      "150ml",
      "200ml",
      "Decant 10ml",
    ],
  },
  perfumeTypes: {
    key: "perfumeTypes",
    label: "Concentración",
    options: [
      "Eau de Parfum (EDP)",
      "Eau de Toilette (EDT)",
      "Extrait de Parfum",
      "Parfum Intense",
      "Body Mist",
    ],
  },
  streamingPlatforms: {
    key: "streamingPlatforms",
    label: "Plataforma",
    options: [
      "Netflix 4K",
      "Spotify Premium",
      "Disney+ / Star+",
      "Max 4K",
      "YouTube Premium",
      "Amazon Prime Video",
      "Crunchyroll Mega Fan",
      "Apple TV+ / Music",
      "Canva Pro / ChatGPT",
    ],
  },
  streamingDurations: {
    key: "streamingDurations",
    label: "Vigencia",
    options: [
      "Perfil 1 Mes",
      "Cuenta Completa 1 Mes",
      "3 Meses",
      "6 Meses",
      "1 Año",
    ],
  },
};

export const DEFAULT_CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    name: "Cargadores y Cables",
    isSystemDefault: true,
    attributeKeys: ["chargerSubtypes", "brands", "powers", "cableFinishes"],
  },
  {
    name: "Forros / Fundas",
    isSystemDefault: true,
    attributeKeys: ["caseMaterials", "caseModels"],
  },
  {
    name: "Protección de Pantalla",
    isSystemDefault: true,
    attributeKeys: ["screenProtectorTypes", "caseModels"],
  },
  {
    name: "Audio",
    isSystemDefault: true,
    attributeKeys: ["audioModels", "connections"],
  },
  {
    name: "Power Banks / Baterías portatiles",
    isSystemDefault: true,
    attributeKeys: ["capacities", "ports"],
  },
  {
    name: "Almacenamiento",
    isSystemDefault: true,
    attributeKeys: ["storageTypes", "storageCapacities", "brands"],
  },
  {
    name: "Celulares",
    isSystemDefault: true,
    attributeKeys: ["brands", "storageCapacities", "colors"],
  },
  {
    name: "Perfumes",
    isSystemDefault: true,
    attributeKeys: ["perfumeVolumes", "perfumeTypes"],
  },
  {
    name: "Smartwatch y Wearables",
    isSystemDefault: true,
    attributeKeys: ["watchSizes", "watchBands", "colors", "brands"],
  },
  {
    name: "Soportes y Accesorios de Auto",
    isSystemDefault: true,
    attributeKeys: ["carMountTypes", "brands"],
  },
  {
    name: "Streaming",
    isSystemDefault: true,
    attributeKeys: ["streamingPlatforms", "streamingDurations"],
  },
];

export const DEFAULT_CATEGORY_ATTRIBUTE_VALUES: Record<
  string,
  Record<string, string[]>
> = {
  "Cargadores y Cables": {
    chargerSubtypes: [...DEFAULT_ATTRIBUTES.chargerSubtypes.options],
    brands: [
      "iPhone",
      "1Hora",
      "Anker",
      "Belkin",
      "Samsung",
      "Ugreen",
      "Apple Original",
      "Xiaomi",
      "Baseus",
      "Genérico Premium",
    ],
    powers: [...DEFAULT_ATTRIBUTES.powers.options],
    cableFinishes: [...DEFAULT_ATTRIBUTES.cableFinishes.options],
  },
  "Forros / Fundas": {
    caseMaterials: [...DEFAULT_ATTRIBUTES.caseMaterials.options],
    caseModels: [...DEFAULT_ATTRIBUTES.caseModels.options],
  },
  "Protección de Pantalla": {
    screenProtectorTypes: [...DEFAULT_ATTRIBUTES.screenProtectorTypes.options],
    caseModels: [...DEFAULT_ATTRIBUTES.caseModels.options],
  },
  Audio: {
    audioModels: [...DEFAULT_ATTRIBUTES.audioModels.options],
    connections: [
      "USB-C",
      "Lightning",
      "MagSafe",
      "Bluetooth 5.3",
      "Auxiliar 3.5mm",
    ],
  },
  "Power Banks / Baterías portatiles": {
    capacities: [...DEFAULT_ATTRIBUTES.capacities.options],
    ports: [...DEFAULT_ATTRIBUTES.ports.options],
  },
  Almacenamiento: {
    storageTypes: [...DEFAULT_ATTRIBUTES.storageTypes.options],
    storageCapacities: ["32GB", "64GB", "128GB", "256GB"],
    brands: ["Kingston", "SanDisk", "Samsung", "Xiaomi"],
  },
  Celulares: {
    brands: ["Samsung", "Xiaomi", "Motorola", "Huawei", "ZTE"],
    storageCapacities: ["64GB", "128GB", "256GB", "512GB"],
    colors: [
      "Negro Espacial",
      "Blanco Estelar",
      "Titanio Natural",
      "Azul",
      "Plata",
    ],
  },
  Perfumes: {
    perfumeVolumes: [...DEFAULT_ATTRIBUTES.perfumeVolumes.options],
    perfumeTypes: [...DEFAULT_ATTRIBUTES.perfumeTypes.options],
  },
  "Smartwatch y Wearables": {
    watchSizes: [...DEFAULT_ATTRIBUTES.watchSizes.options],
    watchBands: [...DEFAULT_ATTRIBUTES.watchBands.options],
    colors: [
      "Negro Espacial",
      "Blanco Estelar",
      "Titanio Natural",
      "Plata",
      "Rosa",
    ],
    brands: ["Apple Original", "Samsung", "Xiaomi", "Huawei"],
  },
  "Soportes y Accesorios de Auto": {
    carMountTypes: [...DEFAULT_ATTRIBUTES.carMountTypes.options],
    brands: ["Baseus", "Ugreen", "1Hora", "Anker", "Belkin"],
  },
  Streaming: {
    streamingPlatforms: [...DEFAULT_ATTRIBUTES.streamingPlatforms.options],
    streamingDurations: [...DEFAULT_ATTRIBUTES.streamingDurations.options],
  },
};

export const DEFAULT_CATALOG_CONFIG: CatalogConfig = {
  categoryOrder: [
    "Cargadores y Cables",
    "Forros / Fundas",
    "Protección de Pantalla",
    "Audio",
    "Power Banks / Baterías portatiles",
    "Almacenamiento",
    "Celulares",
    "Perfumes",
  ],
  categories: DEFAULT_CATEGORY_CONFIGS,
  attributes: DEFAULT_ATTRIBUTES,
  categoryAttributeValues: DEFAULT_CATEGORY_ATTRIBUTE_VALUES,
  trashedCategories: [],
};

/**
 * Fusiona de manera segura una configuración almacenada con la configuración base de fábrica.
 * Respeta las categorías predeterminadas que el usuario haya decidido quitar de la barra activa (`categoryOrder`)
 * o enviado a la papelera temporal (`trashedCategories`).
 */
export function mergeWithDefaultCatalogConfig(
  stored?: Partial<CatalogConfig> | null
): CatalogConfig {
  if (!stored || typeof stored !== "object") {
    return structuredCloneConfig(DEFAULT_CATALOG_CONFIG);
  }

  // 1. Atributos base del sistema actualizados según la selección del usuario
  const mergedAttributes: Record<string, AttributeDefinition> = {};
  for (const [k, def] of Object.entries(DEFAULT_ATTRIBUTES)) {
    mergedAttributes[k] = {
      key: def.key,
      label: def.label,
      options: [...def.options],
    };
  }

  // Si el usuario tenía atributos personalizados (custom_*) o agregó opciones adicionales, preservarlas
  if (stored.attributes && typeof stored.attributes === "object") {
    for (const [k, userAttr] of Object.entries(stored.attributes)) {
      if (
        userAttr &&
        typeof userAttr.key === "string" &&
        typeof userAttr.label === "string" &&
        Array.isArray(userAttr.options)
      ) {
        const cleanOptions: string[] = [];
        for (const opt of userAttr.options) {
          if (typeof opt === "string") {
            const norm = normalizeCatalogText(opt);
            if (
              norm &&
              !cleanOptions.some((existing) =>
                isSameCatalogText(existing, norm)
              )
            ) {
              cleanOptions.push(norm);
            }
          }
        }
        // Si es un atributo base de fábrica, garantizar también los nuevos presets universales
        if (DEFAULT_ATTRIBUTES[k]) {
          for (const defOpt of DEFAULT_ATTRIBUTES[k].options) {
            if (
              !cleanOptions.some((existing) =>
                isSameCatalogText(existing, defOpt)
              )
            ) {
              cleanOptions.push(defOpt);
            }
          }
        }
        if (cleanOptions.length > 0) {
          mergedAttributes[k] = {
            key: userAttr.key,
            label: userAttr.label,
            options: cleanOptions,
          };
        }
      }
    }
  }

  // 2. Papelera temporal de categorías descartadas
  const mergedTrashed: TrashedCategoryEntry[] = [];
  const trashedLowerNames = new Set<string>();
  if (Array.isArray(stored.trashedCategories)) {
    for (const entry of stored.trashedCategories) {
      if (entry && entry.category && typeof entry.category.name === "string") {
        const cleanName = normalizeCatalogText(entry.category.name);
        if (!cleanName || cleanName.toLowerCase() === "todos") continue;
        const lower = cleanName.toLowerCase();
        if (trashedLowerNames.has(lower)) continue;
        trashedLowerNames.add(lower);

        const clonedValues: Record<string, string[]> = {};
        if (
          entry.attributeValues &&
          typeof entry.attributeValues === "object"
        ) {
          for (const [ak, opts] of Object.entries(entry.attributeValues)) {
            if (Array.isArray(opts)) {
              clonedValues[ak] = opts.filter((o) => typeof o === "string");
            }
          }
        }

        mergedTrashed.push({
          category: {
            name: cleanName,
            isSystemDefault: Boolean(entry.category.isSystemDefault),
            attributeKeys: Array.isArray(entry.category.attributeKeys)
              ? [...entry.category.attributeKeys]
              : [],
          },
          attributeValues: clonedValues,
          wasInActiveOrder: Boolean(entry.wasInActiveOrder),
          trashedAt:
            typeof entry.trashedAt === "string"
              ? entry.trashedAt
              : new Date().toISOString(),
        });
      }
    }
  }

  // 3. Categorías fusionadas (garantizando que las definiciones base de fábrica existan como respaldo, salvo que estén en la papelera)
  const mergedCategories: CategoryConfig[] = [];
  const seenNames = new Set<string>();

  if (Array.isArray(stored.categories)) {
    for (const cat of stored.categories) {
      if (cat && typeof cat.name === "string") {
        const cleanName = normalizeCatalogText(cat.name);
        if (!cleanName || cleanName.toLowerCase() === "todos") continue;

        let finalCatName = cleanName;
        if (isSameCatalogText(cleanName, "Audio / AirPods")) {
          finalCatName = "Audio";
        } else if (isSameCatalogText(cleanName, "Power Banks / Baterías")) {
          finalCatName = "Power Banks / Baterías portatiles";
        }

        const lower = finalCatName.toLowerCase();
        if (seenNames.has(lower) || trashedLowerNames.has(lower)) continue;
        seenNames.add(lower);

        const defaultMatch = DEFAULT_CATEGORY_CONFIGS.find((d) =>
          isSameCatalogText(d.name, finalCatName)
        );

        mergedCategories.push({
          name: defaultMatch ? defaultMatch.name : finalCatName,
          isSystemDefault: Boolean(defaultMatch),
          attributeKeys:
            Array.isArray(cat.attributeKeys) && cat.attributeKeys.length > 0
              ? [...cat.attributeKeys]
              : (defaultMatch?.attributeKeys ??
                inferAttributeKeysForCategory(finalCatName)),
        });
      }
    }
  }

  for (const defCat of DEFAULT_CATEGORY_CONFIGS) {
    const lower = defCat.name.toLowerCase();
    if (!seenNames.has(lower) && !trashedLowerNames.has(lower)) {
      seenNames.add(lower);
      mergedCategories.push({
        name: defCat.name,
        isSystemDefault: true,
        attributeKeys: [...defCat.attributeKeys],
      });
    }
  }

  // 4. Orden activo de categorías
  const mergedOrder: ProductCategory[] = [];
  const seenOrder = new Set<string>();

  if (Array.isArray(stored.categoryOrder)) {
    for (const rawName of stored.categoryOrder) {
      if (typeof rawName !== "string") continue;
      let norm = normalizeCatalogText(rawName);
      if (isSameCatalogText(norm, "Audio / AirPods")) {
        norm = "Audio";
      } else if (isSameCatalogText(norm, "Power Banks / Baterías")) {
        norm = "Power Banks / Baterías portatiles";
      }

      const matchCat = mergedCategories.find((c) =>
        isSameCatalogText(c.name, norm)
      );
      const finalName = matchCat ? matchCat.name : norm;
      if (!finalName || finalName.toLowerCase() === "todos") continue;
      const lower = finalName.toLowerCase();
      if (!seenOrder.has(lower) && !trashedLowerNames.has(lower)) {
        seenOrder.add(lower);
        mergedOrder.push(finalName);
      }
    }
  } else {
    for (const catName of DEFAULT_CATALOG_CONFIG.categoryOrder) {
      const lower = catName.toLowerCase();
      if (!seenOrder.has(lower) && !trashedLowerNames.has(lower)) {
        seenOrder.add(lower);
        mergedOrder.push(catName);
      }
    }
  }

  // 5. Opciones de atributos aisladas por categoría (Scoping sin contaminación)
  const mergedCategoryValues: Record<string, Record<string, string[]>> = {};

  for (const [catName, attrMap] of Object.entries(
    DEFAULT_CATEGORY_ATTRIBUTE_VALUES
  )) {
    mergedCategoryValues[catName] = {};
    for (const [attrKey, opts] of Object.entries(attrMap)) {
      mergedCategoryValues[catName][attrKey] = [...opts];
    }
  }

  // Superponer valores almacenados por el usuario
  if (
    stored.categoryAttributeValues &&
    typeof stored.categoryAttributeValues === "object"
  ) {
    for (const [catName, attrMap] of Object.entries(
      stored.categoryAttributeValues
    )) {
      if (attrMap && typeof attrMap === "object") {
        const cleanCatName = normalizeCatalogText(catName);
        if (!cleanCatName) continue;
        if (!mergedCategoryValues[cleanCatName]) {
          mergedCategoryValues[cleanCatName] = {};
        }
        for (const [attrKey, opts] of Object.entries(attrMap)) {
          if (Array.isArray(opts)) {
            const cleanOpts: string[] = [];
            for (const opt of opts) {
              if (typeof opt === "string") {
                const norm = normalizeCatalogText(opt);
                if (
                  norm &&
                  !cleanOpts.some((e) => isSameCatalogText(e, norm))
                ) {
                  cleanOpts.push(norm);
                }
              }
            }
            mergedCategoryValues[cleanCatName][attrKey] = cleanOpts;
          }
        }
      }
    }
  }

  return {
    categoryOrder: mergedOrder,
    categories: mergedCategories,
    attributes: mergedAttributes,
    categoryAttributeValues: mergedCategoryValues,
    trashedCategories: mergedTrashed,
  };
}

export function structuredCloneConfig(config: CatalogConfig): CatalogConfig {
  const clonedCategoryValues: Record<string, Record<string, string[]>> = {};
  if (config.categoryAttributeValues) {
    for (const [catName, attrMap] of Object.entries(
      config.categoryAttributeValues
    )) {
      clonedCategoryValues[catName] = {};
      for (const [attrKey, opts] of Object.entries(attrMap)) {
        clonedCategoryValues[catName][attrKey] = [...opts];
      }
    }
  }

  const clonedTrashed: TrashedCategoryEntry[] = (
    config.trashedCategories || []
  ).map((t) => {
    const attrVals: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(t.attributeValues || {})) {
      attrVals[k] = [...v];
    }
    return {
      category: {
        name: t.category.name,
        isSystemDefault: t.category.isSystemDefault,
        attributeKeys: [...t.category.attributeKeys],
      },
      attributeValues: attrVals,
      wasInActiveOrder: t.wasInActiveOrder,
      trashedAt: t.trashedAt,
    };
  });

  return {
    categoryOrder: [...config.categoryOrder],
    categories: config.categories.map((c) => ({
      name: c.name,
      isSystemDefault: c.isSystemDefault,
      attributeKeys: [...c.attributeKeys],
    })),
    attributes: Object.fromEntries(
      Object.entries(config.attributes).map(([k, v]) => [
        k,
        { key: v.key, label: v.label, options: [...v.options] },
      ])
    ),
    categoryAttributeValues: clonedCategoryValues,
    trashedCategories: clonedTrashed,
  };
}

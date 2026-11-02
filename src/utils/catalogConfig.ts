import { AttributeDefinition, CatalogConfig, CategoryConfig, ProductCategory } from "../types/domain";

/**
 * Categorías base de fábrica que siempre actúan como respaldo inalterable.
 */
export const FACTORY_BASE_CATEGORIES: ProductCategory[] = [
  "Cargadores y Cables",
  "Forros / Fundas",
  "Audio / AirPods",
  "Power Banks / Baterías",
  "Celulares",
  "Perfumes",
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
    normalizeCatalogText(a).toLowerCase() === normalizeCatalogText(b).toLowerCase()
  );
}

/**
 * Infiere inteligentemente los bloques de atributos recomendados según el nombre de la categoría.
 */
export function inferAttributeKeysForCategory(categoryName: string): string[] {
  const lower = categoryName.trim().toLowerCase();

  if (/cargador|cable|cubo|adaptador/.test(lower)) {
    return ["chargerSubtypes", "brands", "powers", "cableFinishes"];
  }
  if (/forro|funda|case|estuche|protector/.test(lower)) {
    return ["caseMaterials", "caseModels"];
  }
  if (/audio|airpod|auricular|audifono|audífono|parlante|bocina/.test(lower)) {
    return ["audioModels", "connections"];
  }
  if (/bateria|batería|power\s*bank|portatil|portátil/.test(lower)) {
    return ["brands", "capacities", "ports"];
  }
  if (/ssd|disco|memoria|almacenamiento|pendrive|micro\s*sd/.test(lower)) {
    return ["brands", "storageCapacities", "connections"];
  }
  if (/reloj|smartwatch|watch|pulsera/.test(lower)) {
    return ["brands", "colors", "caseMaterials"];
  }
  if (/celular|telefono|teléfono|smartphone|tablet|ipad/.test(lower)) {
    return ["brands", "storageCapacities", "colors"];
  }
  if (/perfume|locion|loción|fragancia/.test(lower)) {
    return ["perfumeVolumes", "perfumeTypes"];
  }
  if (/streaming|cuenta|pantalla|suscripcion|suscripción/.test(lower)) {
    return ["streamingPlatforms", "streamingDurations"];
  }

  return ["brands", "colors"];
}

export const DEFAULT_ATTRIBUTES: Record<string, AttributeDefinition> = {
  chargerSubtypes: {
    key: "chargerSubtypes",
    label: "Subtipo",
    options: ["Cubo", "Cable", "Cargador Completo"],
  },
  brands: {
    key: "brands",
    label: "Marca",
    options: ["iPhone", "1Hora", "Anker", "Belkin", "Tipo C", "Samsung", "Ugreen"],
  },
  powers: {
    key: "powers",
    label: "Potencia (W)",
    options: ["20W", "25W", "30W", "35W", "45W", "60W", "100W", "140W"],
  },
  cableFinishes: {
    key: "cableFinishes",
    label: "Acabado del cable",
    options: ["Normal", "Trenzado"],
  },
  caseMaterials: {
    key: "caseMaterials",
    label: "Material",
    options: [
      "Silicona Líquida",
      "Transparente Anti-amarilleo",
      "Lujo / MagSafe",
      "Uso Rudo",
    ],
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
      "iPhone 15",
      "iPhone 15 Pro",
      "iPhone 15 Pro Max",
    ],
  },
  audioModels: {
    key: "audioModels",
    label: "Modelo",
    options: [
      "AirPods Serie 4",
      "AirPods Pro 2da Generación",
      "AirPods Pro 3ra Generación",
    ],
  },
  connections: {
    key: "connections",
    label: "Tipo de Conexión",
    options: ["USB-C", "Lightning", "MagSafe", "Bluetooth 5.3"],
  },
  capacities: {
    key: "capacities",
    label: "Capacidad (mAh)",
    options: ["5000mAh", "10000mAh", "20000mAh", "30000mAh"],
  },
  ports: {
    key: "ports",
    label: "Conexiones / Puertos",
    options: ["USB-C PD", "Dual USB-C + USB-A", "MagSafe Inalámbrico", "Cable Integrado"],
  },
  storageCapacities: {
    key: "storageCapacities",
    label: "Capacidad",
    options: ["128GB", "256GB", "512GB", "1TB", "2TB"],
  },
  colors: {
    key: "colors",
    label: "Color / Acabado",
    options: ["Negro Espacial", "Blanco Estelar", "Titanio Natural", "Plata", "Azul"],
  },
  perfumeVolumes: {
    key: "perfumeVolumes",
    label: "Presentación (ml)",
    options: ["50ml", "100ml", "120ml", "200ml"],
  },
  perfumeTypes: {
    key: "perfumeTypes",
    label: "Concentración",
    options: ["Eau de Parfum (EDP)", "Eau de Toilette (EDT)", "Extrait de Parfum"],
  },
  streamingPlatforms: {
    key: "streamingPlatforms",
    label: "Plataforma",
    options: ["Netflix 4K", "Spotify Premium", "Disney+ / Star+", "Max 4K", "YouTube Premium"],
  },
  streamingDurations: {
    key: "streamingDurations",
    label: "Vigencia",
    options: ["Perfil 1 Mes", "Cuenta Completa 1 Mes", "3 Meses", "1 Año"],
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
    name: "Audio / AirPods",
    isSystemDefault: true,
    attributeKeys: ["audioModels", "connections"],
  },
  {
    name: "Power Banks / Baterías",
    isSystemDefault: true,
    attributeKeys: ["brands", "capacities", "ports"],
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
    name: "Streaming",
    isSystemDefault: true,
    attributeKeys: ["streamingPlatforms", "streamingDurations"],
  },
];

export const DEFAULT_CATALOG_CONFIG: CatalogConfig = {
  categoryOrder: [
    "Cargadores y Cables",
    "Forros / Fundas",
    "Audio / AirPods",
    "Power Banks / Baterías",
    "Celulares",
    "Perfumes",
    "Streaming",
  ],
  categories: DEFAULT_CATEGORY_CONFIGS,
  attributes: DEFAULT_ATTRIBUTES,
};

/**
 * Fusiona de manera segura una configuración almacenada con la configuración base de fábrica.
 */
export function mergeWithDefaultCatalogConfig(
  stored?: Partial<CatalogConfig> | null
): CatalogConfig {
  if (!stored || typeof stored !== "object") {
    return structuredCloneConfig(DEFAULT_CATALOG_CONFIG);
  }

  // 1. Atributos fusionados
  const mergedAttributes: Record<string, AttributeDefinition> = {};
  for (const [k, def] of Object.entries(DEFAULT_ATTRIBUTES)) {
    mergedAttributes[k] = {
      key: def.key,
      label: def.label,
      options: [...def.options],
    };
  }

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
            if (norm && !cleanOptions.some((existing) => isSameCatalogText(existing, norm))) {
              cleanOptions.push(norm);
            }
          }
        }
        mergedAttributes[k] = {
          key: userAttr.key,
          label: userAttr.label,
          options: cleanOptions.length > 0 ? cleanOptions : mergedAttributes[k]?.options ?? [],
        };
      }
    }
  }

  // 2. Categorías fusionadas (garantizando que las base de fábrica existan siempre)
  const mergedCategories: CategoryConfig[] = [];
  const seenNames = new Set<string>();

  if (Array.isArray(stored.categories)) {
    for (const cat of stored.categories) {
      if (cat && typeof cat.name === "string") {
        const cleanName = normalizeCatalogText(cat.name);
        if (!cleanName || cleanName.toLowerCase() === "todos") continue;
        const lower = cleanName.toLowerCase();
        if (seenNames.has(lower)) continue;
        seenNames.add(lower);

        const defaultMatch = DEFAULT_CATEGORY_CONFIGS.find((d) =>
          isSameCatalogText(d.name, cleanName)
        );

        mergedCategories.push({
          name: defaultMatch ? defaultMatch.name : cleanName,
          isSystemDefault: Boolean(defaultMatch),
          attributeKeys:
            Array.isArray(cat.attributeKeys) && cat.attributeKeys.length > 0
              ? cat.attributeKeys
              : defaultMatch?.attributeKeys ?? inferAttributeKeysForCategory(cleanName),
        });
      }
    }
  }

  for (const defCat of DEFAULT_CATEGORY_CONFIGS) {
    const lower = defCat.name.toLowerCase();
    if (!seenNames.has(lower)) {
      seenNames.add(lower);
      mergedCategories.push({
        name: defCat.name,
        isSystemDefault: true,
        attributeKeys: [...defCat.attributeKeys],
      });
    }
  }

  // 3. Orden de categorías
  const mergedOrder: ProductCategory[] = [];
  const seenOrder = new Set<string>();

  if (Array.isArray(stored.categoryOrder)) {
    for (const rawName of stored.categoryOrder) {
      if (typeof rawName !== "string") continue;
      const matchCat = mergedCategories.find((c) => isSameCatalogText(c.name, rawName));
      const finalName = matchCat ? matchCat.name : normalizeCatalogText(rawName);
      if (!finalName || finalName.toLowerCase() === "todos") continue;
      const lower = finalName.toLowerCase();
      if (!seenOrder.has(lower)) {
        seenOrder.add(lower);
        mergedOrder.push(finalName);
      }
    }
  }

  for (const cat of mergedCategories) {
    const lower = cat.name.toLowerCase();
    if (!seenOrder.has(lower)) {
      seenOrder.add(lower);
      mergedOrder.push(cat.name);
    }
  }

  return {
    categoryOrder: mergedOrder,
    categories: mergedCategories,
    attributes: mergedAttributes,
  };
}

export function structuredCloneConfig(config: CatalogConfig): CatalogConfig {
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
  };
}

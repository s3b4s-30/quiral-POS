import { AttributeDefinition, CatalogConfig, CategoryConfig, ProductCategory } from "../types/domain";

/**
 * Categorías base de fábrica que actúan como respaldo predeterminado.
 * Pueden quitarse de la barra activa y restaurarse con un solo toque desde la sección de Respaldo.
 */
export const FACTORY_BASE_CATEGORIES: ProductCategory[] = [
  "Cargadores y Cables",
  "Forros / Fundas",
  "Audio",
  "Power Banks / Baterías portatiles",
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
    return ["chargerSubtypes", "brands", "powers", "cableFinishes", "cableLengths"];
  }
  if (/forro|funda|case|estuche|protector|vidrio|mica/.test(lower)) {
    return ["caseMaterials", "caseModels"];
  }
  if (/audio|airpod|auricular|audifono|audífono|parlante|bocina|microfono|micrófono/.test(lower)) {
    return ["audioModels", "connections"];
  }
  if (/bateria|batería|power\s*bank|portatil|portátiles|portatiles|magsafe/.test(lower)) {
    return ["capacities", "ports"];
  }
  if (/ssd|disco|memoria|almacenamiento|pendrive|micro\s*sd|usb/.test(lower)) {
    return ["brands", "storageCapacities", "connections"];
  }
  if (/reloj|smartwatch|watch|pulsera|band/.test(lower)) {
    return ["brands", "colors"];
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
      "Genérico Premium",
    ],
  },
  powers: {
    key: "powers",
    label: "Potencia (W)",
    options: [
      "20W",
      "25W",
      "30W",
      "35W",
      "45W",
      "60W",
      "65W",
    ],
  },
  cableFinishes: {
    key: "cableFinishes",
    label: "Acabado del cable",
    options: [
      "Normal",
      "Trenzado",
    ],
  },
  cableLengths: {
    key: "cableLengths",
    label: "Longitud del cable",
    options: [
      "1 Metro",
      "1.5 Metros",
      "2 Metros",
      "3 Metros",
    ],
  },
  caseMaterials: {
    key: "caseMaterials",
    label: "Material",
    options: [
      "Silicona Líquida",
      "Transparente Anti-amarilleo",
      "Lujo",
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
  storageCapacities: {
    key: "storageCapacities",
    label: "Capacidad",
    options: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB", "4TB"],
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
    options: ["30ml", "50ml", "75ml", "100ml", "120ml", "150ml", "200ml", "Decant 10ml"],
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
    options: ["Perfil 1 Mes", "Cuenta Completa 1 Mes", "3 Meses", "6 Meses", "1 Año"],
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
    "Audio",
    "Power Banks / Baterías portatiles",
    "Celulares",
    "Perfumes",
    "Streaming",
  ],
  categories: DEFAULT_CATEGORY_CONFIGS,
  attributes: DEFAULT_ATTRIBUTES,
};

/**
 * Fusiona de manera segura una configuración almacenada con la configuración base de fábrica.
 * Respeta las categorías predeterminadas que el usuario haya decidido quitar de la barra activa (`categoryOrder`),
 * conservando sus definiciones en `categories` para que puedan restaurarse desde Respaldo.
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
            if (norm && !cleanOptions.some((existing) => isSameCatalogText(existing, norm))) {
              cleanOptions.push(norm);
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

  // 2. Categorías fusionadas (garantizando que las definiciones base de fábrica existan como respaldo)
  const mergedCategories: CategoryConfig[] = [];
  const seenNames = new Set<string>();

  if (Array.isArray(stored.categories)) {
    for (const cat of stored.categories) {
      if (cat && typeof cat.name === "string") {
        const cleanName = normalizeCatalogText(cat.name);
        if (!cleanName || cleanName.toLowerCase() === "todos") continue;

        // Migrar nombres viejos si existían ("Audio / AirPods" -> "Audio", "Power Banks / Baterías" -> "Power Banks / Baterías portatiles")
        let finalCatName = cleanName;
        if (isSameCatalogText(cleanName, "Audio / AirPods")) {
          finalCatName = "Audio";
        } else if (isSameCatalogText(cleanName, "Power Banks / Baterías")) {
          finalCatName = "Power Banks / Baterías portatiles";
        }

        const lower = finalCatName.toLowerCase();
        if (seenNames.has(lower)) continue;
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
              : defaultMatch?.attributeKeys ?? inferAttributeKeysForCategory(finalCatName),
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

  // 3. Orden activo de categorías (respeta si el usuario eliminó categorías predeterminadas de la barra activa)
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

      const matchCat = mergedCategories.find((c) => isSameCatalogText(c.name, norm));
      const finalName = matchCat ? matchCat.name : norm;
      if (!finalName || finalName.toLowerCase() === "todos") continue;
      const lower = finalName.toLowerCase();
      if (!seenOrder.has(lower)) {
        seenOrder.add(lower);
        mergedOrder.push(finalName);
      }
    }
  } else {
    for (const cat of mergedCategories) {
      const lower = cat.name.toLowerCase();
      if (!seenOrder.has(lower)) {
        seenOrder.add(lower);
        mergedOrder.push(cat.name);
      }
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

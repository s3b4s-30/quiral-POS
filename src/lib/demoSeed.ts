import {
  Closure,
  ClosureTopReturned,
  ClosureTopSeller,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  Supplier,
} from "../types/domain";

export const DEMO_STORE_ID = "00000000-0000-0000-0000-000000000030";
export const DEMO_SEED_VERSION = "quiral_seed_v3_30days_2026";

/**
 * Limpia cualquier dato o catálogo previo de prueba almacenado en localStorage
 * cuando cambia la versión de la semilla de simulación de 30 días.
 */
export function ensureFreshDemoStorage(): void {
  try {
    const currentVersion = localStorage.getItem("quiral_seed_version");
    if (currentVersion === DEMO_SEED_VERSION) return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("quiral_demo_sales") ||
          key.startsWith("quiral_demo_products") ||
          key.startsWith("quiral_demo_closures") ||
          key.startsWith("quiral_catalog_config"))
      ) {
        keysToRemove.push(key);
      }
    }

    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }

    localStorage.setItem("quiral_seed_version", DEMO_SEED_VERSION);
  } catch {
    // Entorno restringido sin acceso a localStorage
  }
}

interface RawProductBlueprint {
  name: string;
  category: Product["category"];
  subtitle: string;
  price: number;
  cost: number;
  warrantyDays: number;
  stockA: number;
  stockB: number;
}

export function generateDemoSeed() {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  const suppliers: Supplier[] = [
    {
      id: "demo-sup-1",
      name: "Distribuidora Apple Miami",
      phone: "+57 310 555 0123",
      color: "#007AFF",
    },
    {
      id: "demo-sup-2",
      name: "Importadora Shenzhen Direct",
      phone: "+57 311 555 0246",
      color: "#AF52DE",
    },
    {
      id: "demo-sup-3",
      name: "Mayorista Audio & Cases Cartagena",
      phone: "+57 312 555 0369",
      color: "#28CD41",
    },
    {
      id: "demo-sup-4",
      name: "Anker & Ugreen Oficial Colombia",
      phone: "+57 314 555 0615",
      color: "#5AC8FA",
    },
    {
      id: "demo-sup-5",
      name: "Perfumería Árabe & Diseñador",
      phone: "+57 313 555 0492",
      color: "#FF9500",
    },
    {
      id: "demo-sup-6",
      name: "Proveedora Digital Streaming",
      phone: "+57 315 555 0738",
      color: "#FF3B30",
    },
  ];

  // Catálogo estructurado bajo el nuevo sistema modular de categorías y atributos en orden estricto
  const blueprints: RawProductBlueprint[] = [
    // 1. Cargadores y Cables (Orden: Subtipo -> Marca -> Potencia -> Acabado -> Longitud)
    {
      name: "Cubo iPhone 20W",
      category: "Cargadores y Cables",
      subtitle: "Cubo · iPhone",
      price: 85000,
      cost: 42000,
      warrantyDays: 30,
      stockA: 24,
      stockB: 10,
    },
    {
      name: "Cubo Anker 30W",
      category: "Cargadores y Cables",
      subtitle: "Cubo · Anker",
      price: 95000,
      cost: 48000,
      warrantyDays: 60,
      stockA: 18,
      stockB: 6,
    },
    {
      name: "Cubo Samsung 25W",
      category: "Cargadores y Cables",
      subtitle: "Cubo · Samsung",
      price: 78000,
      cost: 39000,
      warrantyDays: 30,
      stockA: 15,
      stockB: 5,
    },
    {
      name: "Cubo Ugreen 65W",
      category: "Cargadores y Cables",
      subtitle: "Cubo · Ugreen",
      price: 145000,
      cost: 82000,
      warrantyDays: 60,
      stockA: 10,
      stockB: 4,
    },
    {
      name: "Cable iPhone (Trenzado) 1 Metro",
      category: "Cargadores y Cables",
      subtitle: "Cable · iPhone · Trenzado",
      price: 45000,
      cost: 19000,
      warrantyDays: 15,
      stockA: 28,
      stockB: 12,
    },
    {
      name: "Cable Anker (Trenzado) 2 Metros",
      category: "Cargadores y Cables",
      subtitle: "Cable · Anker · Trenzado",
      price: 58000,
      cost: 27000,
      warrantyDays: 30,
      stockA: 16,
      stockB: 8,
    },
    {
      name: "Cargador Completo iPhone 20W (Normal)",
      category: "Cargadores y Cables",
      subtitle: "Cargador Completo · iPhone",
      price: 115000,
      cost: 56000,
      warrantyDays: 30,
      stockA: 20,
      stockB: 7,
    },
    {
      name: "Cargador Completo 1Hora 35W (Trenzado)",
      category: "Cargadores y Cables",
      subtitle: "Cargador Completo · 1Hora",
      price: 68000,
      cost: 32000,
      warrantyDays: 30,
      stockA: 14,
      stockB: 6,
    },
    {
      name: "Cargador Inalámbrico / MagSafe Apple Original 20W",
      category: "Cargadores y Cables",
      subtitle: "Cargador Inalámbrico / MagSafe · Apple Original",
      price: 165000,
      cost: 92000,
      warrantyDays: 60,
      stockA: 8,
      stockB: 3,
    },

    // 2. Forros / Fundas (Orden: Material -> Modelo Compatible)
    {
      name: "Forro Silicona Líquida (iPhone 15 Pro Max)",
      category: "Forros / Fundas",
      subtitle: "Forro · iPhone 15 Pro Max",
      price: 38000,
      cost: 14000,
      warrantyDays: 15,
      stockA: 22,
      stockB: 8,
    },
    {
      name: "Forro Transparente Anti-amarilleo (iPhone 15 Pro)",
      category: "Forros / Fundas",
      subtitle: "Forro · iPhone 15 Pro",
      price: 42000,
      cost: 16000,
      warrantyDays: 15,
      stockA: 18,
      stockB: 6,
    },
    {
      name: "Forro Lujo (iPhone 16 Pro Max)",
      category: "Forros / Fundas",
      subtitle: "Forro · iPhone 16 Pro Max",
      price: 55000,
      cost: 23000,
      warrantyDays: 15,
      stockA: 16,
      stockB: 5,
    },
    {
      name: "Forro Silicona Líquida (iPhone 13 / 14)",
      category: "Forros / Fundas",
      subtitle: "Forro · iPhone 13 / 14",
      price: 32000,
      cost: 12000,
      warrantyDays: 15,
      stockA: 25,
      stockB: 9,
    },
    {
      name: "Forro Lujo (iPhone 14 Pro Max)",
      category: "Forros / Fundas",
      subtitle: "Forro · iPhone 14 Pro Max",
      price: 48000,
      cost: 19000,
      warrantyDays: 15,
      stockA: 0,
      stockB: 0,
    },

    // 3. Audio (Orden: Modelo de Audio -> Conexión)
    {
      name: "AirPods Pro 2da Generación (USB-C)",
      category: "Audio",
      subtitle: "Audio · USB-C",
      price: 890000,
      cost: 640000,
      warrantyDays: 60,
      stockA: 9,
      stockB: 4,
    },
    {
      name: "AirPods Serie 4 (USB-C)",
      category: "Audio",
      subtitle: "Audio · USB-C",
      price: 680000,
      cost: 485000,
      warrantyDays: 60,
      stockA: 11,
      stockB: 4,
    },
    {
      name: "AirPods Serie 3 (Lightning)",
      category: "Audio",
      subtitle: "Audio · Lightning",
      price: 580000,
      cost: 410000,
      warrantyDays: 60,
      stockA: 7,
      stockB: 3,
    },
    {
      name: "AirPods Pro 3ra Generación (MagSafe)",
      category: "Audio",
      subtitle: "Audio · MagSafe",
      price: 980000,
      cost: 710000,
      warrantyDays: 60,
      stockA: 5,
      stockB: 2,
    },

    // 4. Power Banks / Baterías portatiles (Orden: Capacidad -> Puertos -> Marca -> Potencia)
    {
      name: "Power Bank 10000mAh (MagSafe Inalámbrico) Anker 20W",
      category: "Power Banks / Baterías portatiles",
      subtitle: "10000mAh · MagSafe Inalámbrico · Anker · 20W",
      price: 195000,
      cost: 115000,
      warrantyDays: 60,
      stockA: 12,
      stockB: 4,
    },
    {
      name: "Power Bank 20000mAh (Dual USB-C PD) Ugreen 45W",
      category: "Power Banks / Baterías portatiles",
      subtitle: "20000mAh · Dual USB-C PD · Ugreen · 45W",
      price: 240000,
      cost: 142000,
      warrantyDays: 60,
      stockA: 8,
      stockB: 3,
    },
    {
      name: "Power Bank 5000mAh (MagSafe Inalámbrico) 1Hora 20W",
      category: "Power Banks / Baterías portatiles",
      subtitle: "5000mAh · MagSafe Inalámbrico · 1Hora · 20W",
      price: 95000,
      cost: 52000,
      warrantyDays: 30,
      stockA: 14,
      stockB: 5,
    },

    // 5. Celulares (Orden: Almacenamiento -> Color / Acabado -> Marca)
    {
      name: "iPhone 16 Pro Max 256GB Titanio Natural",
      category: "Celulares",
      subtitle: "256GB · Titanio Natural · iPhone",
      price: 5450000,
      cost: 4680000,
      warrantyDays: 90,
      stockA: 3,
      stockB: 1,
    },
    {
      name: "iPhone 15 Pro Max 256GB Titanio Negro",
      category: "Celulares",
      subtitle: "256GB · Titanio Negro · iPhone",
      price: 4650000,
      cost: 3950000,
      warrantyDays: 90,
      stockA: 4,
      stockB: 2,
    },
    {
      name: "iPhone 15 128GB Azul",
      category: "Celulares",
      subtitle: "128GB · Azul · iPhone",
      price: 3290000,
      cost: 2760000,
      warrantyDays: 90,
      stockA: 5,
      stockB: 2,
    },
    {
      name: "iPhone 13 128GB Negro Medianoche",
      category: "Celulares",
      subtitle: "128GB · Negro Medianoche · iPhone",
      price: 2250000,
      cost: 1840000,
      warrantyDays: 90,
      stockA: 6,
      stockB: 2,
    },
    {
      name: "Samsung Galaxy S24 Ultra 256GB Titanio Negro",
      category: "Celulares",
      subtitle: "256GB · Titanio Negro · Samsung",
      price: 4490000,
      cost: 3750000,
      warrantyDays: 90,
      stockA: 2,
      stockB: 1,
    },

    // 6. Perfumes (Orden: Presentación (ml) -> Concentración)
    {
      name: "Sauvage Dior 100ml Eau de Parfum (EDP)",
      category: "Perfumes",
      subtitle: "100ml · Eau de Parfum (EDP)",
      price: 520000,
      cost: 340000,
      warrantyDays: 15,
      stockA: 6,
      stockB: 2,
    },
    {
      name: "Lattafa Khamrah 100ml Eau de Parfum (EDP)",
      category: "Perfumes",
      subtitle: "100ml · Eau de Parfum (EDP)",
      price: 185000,
      cost: 105000,
      warrantyDays: 15,
      stockA: 10,
      stockB: 4,
    },
    {
      name: "Bleu de Chanel 100ml Parfum",
      category: "Perfumes",
      subtitle: "100ml · Parfum",
      price: 610000,
      cost: 410000,
      warrantyDays: 15,
      stockA: 4,
      stockB: 2,
    },

    // 7. Streaming (Orden: Duración -> Modalidad)
    {
      name: "Netflix 4K Ultra HD 1 Mes (1 Pantalla / Perfil)",
      category: "Streaming",
      subtitle: "1 Mes · 1 Pantalla / Perfil",
      price: 22000,
      cost: 11000,
      warrantyDays: 30,
      stockA: 30,
      stockB: 15,
    },
    {
      name: "Spotify Premium 3 Meses (1 Pantalla / Perfil)",
      category: "Streaming",
      subtitle: "3 Meses · 1 Pantalla / Perfil",
      price: 42000,
      cost: 24000,
      warrantyDays: 90,
      stockA: 20,
      stockB: 10,
    },
    {
      name: "Disney+ Estándar 1 Mes (Cuenta Completa (4 Pantallas))",
      category: "Streaming",
      subtitle: "1 Mes · Cuenta Completa (4 Pantallas)",
      price: 35000,
      cost: 18000,
      warrantyDays: 30,
      stockA: 18,
      stockB: 7,
    },
  ];

  const createdBaseTime = new Date(now.getTime() - 32 * msPerDay).toISOString();

  const products: Product[] = blueprints.map((bp, index) => {
    const i = index + 1;
    return {
      id: `demo-prod-${i}`,
      name: bp.name,
      category: bp.category,
      subtitle: bp.subtitle,
      price: bp.price,
      warrantyDays: bp.warrantyDays,
      createdAt: createdBaseTime,
      batches: [
        {
          id: `demo-batch-${i}-a`,
          supplierId: suppliers[(i - 1) % suppliers.length].id,
          cost: bp.cost,
          stock: bp.stockA,
        },
        {
          id: `demo-batch-${i}-b`,
          supplierId: suppliers[i % suppliers.length].id,
          cost: Math.round(bp.cost * 1.04),
          stock: bp.stockB,
        },
      ],
    };
  });

  // =========================================================================
  // SIMULACIÓN DE 1 MES DE OPERACIONES (30 DÍAS DE VENTAS Y ARQUEOS)
  // =========================================================================
  const customerNames = [
    "Carlos Andrés Restrepo",
    "Valentina Gómez",
    "Sebastián Morales",
    "Camila Andrea Torres",
    "Mateo Rodríguez",
    "Daniela Ospina",
    "Alejandro Vargas",
    "Sofía Hernández",
    "Juan Pablo Mejía",
    "Mariana Castro",
    "Santiago Ríos",
    "Isabella Córdoba",
    "Nicolás Mendoza",
    "Gabriela Quintero",
    "Andrés Felipe Cano",
    "Laura Daniela Salazar",
    "Cliente General",
    "Felipe Palacio",
  ];

  const paymentMethods: PaymentMethod[] = [
    "Nequi",
    "Efectivo",
    "Bancolombia",
    "Tarjeta",
  ];

  // Plan determinista de 45 transacciones distribuidas a lo largo de los últimos 30 días
  const salePlans: Array<{
    daysAgo: number;
    hourOffset: number;
    customerIdx: number;
    paymentIdx: number;
    items: Array<{
      prodIdx: number;
      qty: number;
      warrantyClaimed?: boolean;
      warrantyNote?: string;
    }>;
    note?: string;
  }> = [
    { daysAgo: 29, hourOffset: 10, customerIdx: 0, paymentIdx: 0, items: [{ prodIdx: 0, qty: 2 }, { prodIdx: 4, qty: 1 }] },
    { daysAgo: 29, hourOffset: 16, customerIdx: 1, paymentIdx: 1, items: [{ prodIdx: 9, qty: 1 }, { prodIdx: 29, qty: 1 }] },
    { daysAgo: 28, hourOffset: 11, customerIdx: 2, paymentIdx: 2, items: [{ prodIdx: 14, qty: 1 }] },
    { daysAgo: 27, hourOffset: 14, customerIdx: 3, paymentIdx: 0, items: [{ prodIdx: 1, qty: 1 }, { prodIdx: 5, qty: 2 }] },
    { daysAgo: 26, hourOffset: 17, customerIdx: 4, paymentIdx: 1, items: [{ prodIdx: 18, qty: 1 }] },
    { daysAgo: 25, hourOffset: 12, customerIdx: 5, paymentIdx: 2, items: [{ prodIdx: 24, qty: 1 }, { prodIdx: 0, qty: 1 }, { prodIdx: 12, qty: 1 }], note: "Combo equipo + cargador 20W + forro" },
    { daysAgo: 24, hourOffset: 15, customerIdx: 6, paymentIdx: 0, items: [{ prodIdx: 6, qty: 2 }] },
    { daysAgo: 23, hourOffset: 18, customerIdx: 7, paymentIdx: 1, items: [{ prodIdx: 27, qty: 1 }, { prodIdx: 30, qty: 1 }] },
    { daysAgo: 22, hourOffset: 11, customerIdx: 8, paymentIdx: 3, items: [{ prodIdx: 15, qty: 1 }] },
    { daysAgo: 21, hourOffset: 13, customerIdx: 9, paymentIdx: 0, items: [{ prodIdx: 2, qty: 2 }, { prodIdx: 10, qty: 1 }] },
    { daysAgo: 21, hourOffset: 19, customerIdx: 10, paymentIdx: 1, items: [{ prodIdx: 29, qty: 3 }] },
    { daysAgo: 20, hourOffset: 14, customerIdx: 11, paymentIdx: 2, items: [{ prodIdx: 3, qty: 1 }, { prodIdx: 5, qty: 1 }] },
    { daysAgo: 19, hourOffset: 16, customerIdx: 12, paymentIdx: 0, items: [{ prodIdx: 20, qty: 1 }, { prodIdx: 4, qty: 2, warrantyClaimed: true, warrantyNote: "Conector con falso contacto, reemplazado en garantía" }] },
    { daysAgo: 18, hourOffset: 11, customerIdx: 13, paymentIdx: 1, items: [{ prodIdx: 11, qty: 2 }, { prodIdx: 0, qty: 1 }] },
    { daysAgo: 17, hourOffset: 15, customerIdx: 14, paymentIdx: 2, items: [{ prodIdx: 26, qty: 1 }] },
    { daysAgo: 16, hourOffset: 12, customerIdx: 15, paymentIdx: 3, items: [{ prodIdx: 23, qty: 1 }, { prodIdx: 9, qty: 1 }] },
    { daysAgo: 16, hourOffset: 17, customerIdx: 16, paymentIdx: 0, items: [{ prodIdx: 7, qty: 2 }, { prodIdx: 31, qty: 1 }] },

    // Quincena actual (últimos 15 días: forman el Ciclo Actual activo)
    { daysAgo: 14, hourOffset: 10, customerIdx: 0, paymentIdx: 1, items: [{ prodIdx: 0, qty: 3 }, { prodIdx: 9, qty: 2 }] },
    { daysAgo: 14, hourOffset: 16, customerIdx: 2, paymentIdx: 0, items: [{ prodIdx: 18, qty: 1 }, { prodIdx: 5, qty: 1 }] },
    { daysAgo: 13, hourOffset: 12, customerIdx: 4, paymentIdx: 2, items: [{ prodIdx: 14, qty: 1 }, { prodIdx: 11, qty: 1 }] },
    { daysAgo: 12, hourOffset: 15, customerIdx: 6, paymentIdx: 0, items: [{ prodIdx: 1, qty: 2 }, { prodIdx: 29, qty: 2 }] },
    { daysAgo: 11, hourOffset: 11, customerIdx: 8, paymentIdx: 1, items: [{ prodIdx: 6, qty: 2 }] },
    { daysAgo: 11, hourOffset: 18, customerIdx: 10, paymentIdx: 2, items: [{ prodIdx: 22, qty: 1 }, { prodIdx: 0, qty: 1 }], note: "Entrega inmediata en tienda" },
    { daysAgo: 10, hourOffset: 14, customerIdx: 12, paymentIdx: 0, items: [{ prodIdx: 8, qty: 1 }, { prodIdx: 10, qty: 2 }] },
    { daysAgo: 9, hourOffset: 16, customerIdx: 14, paymentIdx: 3, items: [{ prodIdx: 19, qty: 1 }] },
    { daysAgo: 8, hourOffset: 11, customerIdx: 1, paymentIdx: 0, items: [{ prodIdx: 4, qty: 3 }, { prodIdx: 12, qty: 2 }] },
    { daysAgo: 8, hourOffset: 17, customerIdx: 3, paymentIdx: 1, items: [{ prodIdx: 27, qty: 2 }] },
    { daysAgo: 7, hourOffset: 13, customerIdx: 5, paymentIdx: 2, items: [{ prodIdx: 15, qty: 1 }, { prodIdx: 2, qty: 1 }] },
    { daysAgo: 6, hourOffset: 15, customerIdx: 7, paymentIdx: 0, items: [{ prodIdx: 7, qty: 2, warrantyClaimed: true, warrantyNote: "Cambio directo por puerto USB-C flojo" }, { prodIdx: 30, qty: 1 }] },
    { daysAgo: 6, hourOffset: 19, customerIdx: 9, paymentIdx: 1, items: [{ prodIdx: 0, qty: 2 }, { prodIdx: 9, qty: 1 }] },
    { daysAgo: 5, hourOffset: 10, customerIdx: 11, paymentIdx: 2, items: [{ prodIdx: 21, qty: 1 }, { prodIdx: 11, qty: 1 }], note: "Cliente VIP - Pago por transferencia" },
    { daysAgo: 5, hourOffset: 16, customerIdx: 13, paymentIdx: 0, items: [{ prodIdx: 18, qty: 2 }] },
    { daysAgo: 4, hourOffset: 12, customerIdx: 15, paymentIdx: 1, items: [{ prodIdx: 3, qty: 1 }, { prodIdx: 5, qty: 2 }] },
    { daysAgo: 4, hourOffset: 18, customerIdx: 17, paymentIdx: 0, items: [{ prodIdx: 28, qty: 1 }] },
    { daysAgo: 3, hourOffset: 11, customerIdx: 0, paymentIdx: 2, items: [{ prodIdx: 6, qty: 3 }, { prodIdx: 29, qty: 2 }] },
    { daysAgo: 3, hourOffset: 15, customerIdx: 4, paymentIdx: 0, items: [{ prodIdx: 17, qty: 1 }] },
    { daysAgo: 2, hourOffset: 10, customerIdx: 6, paymentIdx: 1, items: [{ prodIdx: 0, qty: 2 }, { prodIdx: 4, qty: 2 }, { prodIdx: 10, qty: 1 }] },
    { daysAgo: 2, hourOffset: 17, customerIdx: 8, paymentIdx: 3, items: [{ prodIdx: 14, qty: 1 }, { prodIdx: 1, qty: 1 }] },
    { daysAgo: 1, hourOffset: 11, customerIdx: 10, paymentIdx: 0, items: [{ prodIdx: 20, qty: 2 }, { prodIdx: 12, qty: 2 }] },
    { daysAgo: 1, hourOffset: 16, customerIdx: 12, paymentIdx: 2, items: [{ prodIdx: 26, qty: 1 }, { prodIdx: 31, qty: 1 }] },
    { daysAgo: 0, hourOffset: 9, customerIdx: 14, paymentIdx: 0, items: [{ prodIdx: 0, qty: 2 }, { prodIdx: 9, qty: 1 }] },
    { daysAgo: 0, hourOffset: 11, customerIdx: 16, paymentIdx: 1, items: [{ prodIdx: 6, qty: 1 }, { prodIdx: 29, qty: 2 }] },
  ];

  const sales: Sale[] = salePlans.map((plan, idx) => {
    const saleNumber = idx + 1;
    const saleDate = new Date(
      now.getTime() -
        plan.daysAgo * msPerDay -
        (12 - (plan.hourOffset % 12)) * 60 * 60 * 1000
    );

    const saleItems: SaleItem[] = plan.items.map((it, itemIdx) => {
      const prod = products[it.prodIdx] || products[0];
      const batch = prod.batches[0];
      return {
        id: `sim-item-${saleNumber}-${itemIdx + 1}`,
        productId: prod.id,
        productName: prod.name,
        qty: it.qty,
        unitPrice: prod.price,
        unitCostSnapshot: batch.cost,
        batchId: batch.id,
        warrantyDays: prod.warrantyDays,
        warrantyClaimed: Boolean(it.warrantyClaimed),
        warrantyClaimNote: it.warrantyNote,
      };
    });

    const totalAmount = saleItems.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0
    );

    return {
      id: `sim-sale-${saleNumber}`,
      saleNumber,
      customerName: customerNames[plan.customerIdx % customerNames.length],
      paymentMethod: paymentMethods[plan.paymentIdx % paymentMethods.length],
      totalAmount,
      createdAt: saleDate.toISOString(),
      note: plan.note,
      items: saleItems,
    };
  });

  // Ordenar de más reciente a más antigua para el historial
  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Construir el cierre de la primera quincena (hace 15 días) para poblar Historial de Cierres y comparativas
  const cutoffDate = new Date(now.getTime() - 15 * msPerDay);
  const firstFortnightSales = sortedSales.filter(
    (s) => new Date(s.createdAt) <= cutoffDate
  );

  let fortnightTotalSold = 0;
  let fortnightCost = 0;
  let fortnightCash = 0;
  const topSellerMap = new Map<string, ClosureTopSeller>();
  const topReturnedMap = new Map<string, ClosureTopReturned>();

  for (const s of firstFortnightSales) {
    fortnightTotalSold += s.totalAmount;
    if (s.paymentMethod === "Efectivo") {
      fortnightCash += s.totalAmount;
    }
    for (const item of s.items) {
      const unitCost = item.unitCostSnapshot ?? 0;
      fortnightCost += item.qty * unitCost;

      const existingSeller = topSellerMap.get(item.productId) || {
        id: item.productId,
        name: item.productName,
        qty: 0,
        revenue: 0,
        profit: 0,
        tx: [],
      };
      existingSeller.qty += item.qty;
      existingSeller.revenue += item.qty * item.unitPrice;
      existingSeller.profit += item.qty * (item.unitPrice - unitCost);
      existingSeller.tx?.push({
        id: `${s.id}-${item.id}`,
        date: s.createdAt,
        customer: s.customerName,
        qty: item.qty,
        price: item.unitPrice,
      });
      topSellerMap.set(item.productId, existingSeller);

      if (item.warrantyClaimed) {
        const existingRet = topReturnedMap.get(item.productId) || {
          id: item.productId,
          name: item.productName,
          qty: 0,
          notes: [],
        };
        existingRet.qty += item.qty;
        if (item.warrantyClaimNote) {
          existingRet.notes?.push(item.warrantyClaimNote);
        }
        topReturnedMap.set(item.productId, existingRet);
      }
    }
  }

  const closures: Closure[] = [
    {
      id: "sim-cycle-quincena-1",
      periodLabel: "Corte Quincenal Anterior (Días 1–15)",
      closedAt: cutoffDate.toISOString(),
      startDate: new Date(now.getTime() - 30 * msPerDay).toISOString(),
      endDate: cutoffDate.toISOString(),
      totalSold: fortnightTotalSold,
      netProfit: fortnightTotalSold - fortnightCost,
      recoveredInvestment: fortnightCost,
      expectedCash: fortnightCash,
      realCashReported: fortnightCash,
      differenceNote: "Arqueo quincenal cuadrado sin diferencias en efectivo ni Nequi.",
      topSellers: Array.from(topSellerMap.values()).sort((a, b) => b.qty - a.qty),
      topReturned: Array.from(topReturnedMap.values()).sort((a, b) => b.qty - a.qty),
    },
  ];

  return {
    suppliers,
    products,
    sales: sortedSales,
    closures,
  };
}

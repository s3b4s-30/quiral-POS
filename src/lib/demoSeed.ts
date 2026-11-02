import { Closure, Product, Sale, Supplier } from "../types/domain";

export const DEMO_STORE_ID = "00000000-0000-0000-0000-000000000030";

export function generateDemoSeed() {
  const supplierNames = [
    "Distribuidora Apple Miami",
    "Importadora Shenzhen Direct",
    "Mayorista Audio & Cases Cartagena",
    "Perfumería Árabe & Diseñador",
    "Anker Oficial Colombia",
    "Proveedora Digital Streaming",
  ];

  const colors = ["#007AFF", "#AF52DE", "#28CD41", "#FF9500", "#5AC8FA", "#FF3B30"];

  const suppliers: Supplier[] = supplierNames.map((name, i) => ({
    id: `demo-sup-${i + 1}`,
    name,
    phone: `+57 3${10 + i} 555 ${String((i + 1) * 123).padStart(4, "0")}`,
    color: colors[i],
  }));

  const productNames = [
    "iPhone 15 Pro Max 256GB", "iPhone 15 Pro 128GB", "iPhone 14 Pro Max 256GB", "iPhone 14 128GB",
    "iPhone 13 128GB", "iPhone 12 64GB", "iPhone 11 64GB", "Samsung Galaxy S24 Ultra",
    "Cubo iPhone 20W Original", "Cubo Anker 30W GaN", "Cargador Doble USB-C 35W",
    "Cable USB-C a Lightning MFi 1m", "Cable USB-C Trenzado 60W 2m", "Batería MagSafe Apple", "Cargador Inalámbrico MagSafe 15W",
    "AirPods Pro 2da Gen USB-C", "AirPods 3ra Gen", "EarPods Lightning", "EarPods USB-C",
    "AirTag Individual", "Pack x4 AirTags", "Apple Pencil USB-C",
    "Vidrio Cerámico Privacidad iPhone 13/14/15/16 Pro Max", "Case Silicona MagSafe Con Logo iPhone 15",
    "Case Silicona MagSafe Con Logo iPhone 14", "Case Transparente MagSafe Anti-Amarilleo", "Protector de Lentes Cámara Zafiro",
    "Sauvage Dior 100ml EDP", "Bleu de Chanel 100ml", "Lattafa Khamrah 100ml", "Al Haramain Amber Oud", "YSL Y EDP 100ml",
    "Cuenta Netflix 4K (Perfil 1 Mes)", "Spotify Premium 3 Meses", "Disney+ Estándar"
  ];

  const products: Product[] = productNames.map((name, index) => {
    const i = index + 1;
    let category: Product["category"];
    let price: number;
    let cost: number;
    let subtitle: string;

    if (i <= 8) {
      category = "Celulares";
      price = 1800000 + i * 220000;
      cost = Math.round(price * 0.72);
      subtitle = "Equipo homologado libre";
    } else if (i <= 15) {
      category = "Cargadores y Cables";
      price = 45000 + (i - 8) * 12000;
      cost = Math.round(price * 0.48);
      subtitle = "Carga rápida certificada";
    } else if (i <= 22) {
      category = "Audio / AirPods";
      price = 65000 + (i - 15) * 55000;
      cost = Math.round(price * 0.55);
      subtitle = "Sonido de alta definición";
    } else if (i <= 27) {
      category = "Forros / Fundas";
      price = 25000 + (i - 22) * 8000;
      cost = Math.round(price * 0.4);
      subtitle = "Protección grado militar";
    } else if (i <= 32) {
      category = "Perfumes";
      price = 180000 + (i - 27) * 45000;
      cost = Math.round(price * 0.6);
      subtitle = "Fragancia original sellada";
    } else {
      category = "Streaming";
      price = 28000 + (i - 32) * 11000;
      cost = Math.round(price * 0.35);
      subtitle = "Activación inmediata";
    }

    const stockA = [6, 19, 27].includes(i) ? 0 : [4, 8, 22].includes(i) ? 2 : 16 + (i % 9);
    const stockB = [6, 19, 27].includes(i) ? 0 : 7 + (i % 6);

    return {
      id: `demo-prod-${i}`,
      name,
      category,
      subtitle,
      price,
      warrantyDays: i <= 8 ? 90 : i > 32 ? 30 : 60,
      createdAt: "2026-07-01T08:00:00Z",
      batches: [
        {
          id: `demo-batch-${i}-a`,
          supplierId: suppliers[((i - 1) % 6)].id,
          cost,
          stock: stockA,
        },
        {
          id: `demo-batch-${i}-b`,
          supplierId: suppliers[i % 6].id,
          cost: Math.round(cost * 1.05),
          stock: stockB,
        },
      ],
    };
  });

  // Sin ventas ni cierres semilla pre-generados para evitar duplicados o registros artificiales (1000+)
  const sales: Sale[] = [];
  const closures: Closure[] = [];

  return { suppliers, products, sales, closures };
}

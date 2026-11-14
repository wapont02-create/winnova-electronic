import ClientMenu from '@/components/ClientMenu';
import { Database } from '@sqlitecloud/drivers';

// La tienda consulta el inventario real cada vez que se solicita la página.
export const dynamic = 'force-dynamic';

interface ProductRow {
  id: number;
  name: string;
  description?: string | null;
  price_usd?: number | string | null;
  category?: string | null;
  image_url?: string | null;
}

async function getProducts(): Promise<ProductRow[]> {
  const connectionString =
    process.env.DATABASE_URL || process.env.SQLITECLOUD_CONNECTION_STRING;

  if (!connectionString) {
    console.error('Falta DATABASE_URL o SQLITECLOUD_CONNECTION_STRING en Vercel.');
    return [];
  }

  let db: Database | null = null;

  try {
    db = new Database(connectionString);
    const result: any = await db.sql(
      'SELECT id, name, description, price_usd, category, image_url FROM products;'
    );

    if (Array.isArray(result)) return result as ProductRow[];
    if (result && Array.isArray(result.rows)) return result.rows as ProductRow[];

    if (result && typeof result === 'object') {
      const arrayValue = Object.values(result).find((value) => Array.isArray(value));
      if (Array.isArray(arrayValue)) return arrayValue as ProductRow[];
    }

    return [];
  } catch (error) {
    console.error('Error al consultar los productos de SQLite Cloud:', error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();
  const categoriesMap: Record<string, Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
  }>> = {};

  for (const product of products) {
    if (!product?.name) continue;

    const category = product.category?.trim() || 'General';
    if (!categoriesMap[category]) categoriesMap[category] = [];

    categoriesMap[category].push({
      id: Number(product.id),
      name: String(product.name),
      description: product.description || '',
      price: Number(product.price_usd) || 0,
      image: product.image_url || '',
    });
  }

  const initialCategories = Object.entries(categoriesMap).map(([category, items]) => ({
    category,
    items,
  }));

  return (
    <main className="min-h-screen bg-[#F3F6FB] text-slate-900">
      <ClientMenu initialCategories={initialCategories} />
    </main>
  );
}

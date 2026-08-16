import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: 'Auriculares wireless',
      description: 'Cancelación de ruido, 30h de batería.',
      priceCents: 18990000,
      stock: 12,
      imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    },
    {
      name: 'Teclado mecánico',
      description: 'Switches táctiles, layout ES.',
      priceCents: 24990000,
      stock: 8,
      imageUrl: 'https://picsum.photos/seed/keyboard/600/600',
    },
    {
      name: 'Mouse ergonómico',
      description: 'Sensor 16K DPI, recargable.',
      priceCents: 12990000,
      stock: 20,
      imageUrl: 'https://picsum.photos/seed/mouse/600/600',
    },
    {
      name: 'Monitor 27"',
      description: 'IPS 144Hz, USB-C.',
      priceCents: 89990000,
      stock: 5,
      imageUrl: 'https://picsum.photos/seed/monitor/600/600',
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

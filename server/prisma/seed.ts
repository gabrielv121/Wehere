import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_EVENTS = [
  {
    title: 'Taylor Swift | The Eras Tour',
    category: 'concert',
    venue: { id: 'v1', name: 'Madison Square Garden', city: 'New York', state: 'NY' },
    date: '2025-03-15T19:00:00',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    minPrice: 189,
    maxPrice: 1200,
    featured: true,
    visible: true,
  },
  {
    title: 'Lakers vs Celtics',
    category: 'sports',
    venue: { id: 'v2', name: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA' },
    date: '2025-02-20T19:30:00',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    minPrice: 85,
    maxPrice: 450,
    featured: true,
    visible: true,
  },
  {
    title: 'Hamilton',
    category: 'theater',
    venue: { id: 'v3', name: 'Richard Rodgers Theatre', city: 'New York', state: 'NY' },
    date: '2025-04-02T20:00:00',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    minPrice: 129,
    maxPrice: 399,
    featured: true,
    visible: true,
  },
  {
    title: 'Dave Chappelle Live',
    category: 'comedy',
    venue: { id: 'v4', name: 'Comedy Cellar', city: 'New York', state: 'NY' },
    date: '2025-03-08T21:00:00',
    image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800',
    minPrice: 75,
    maxPrice: 250,
    visible: true,
  },
];

async function main() {
  const hash = await bcrypt.hash('password', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wehere.com' },
    update: {},
    create: {
      email: 'admin@wehere.com',
      passwordHash: hash,
      name: 'Admin',
      role: 'admin',
    },
  });
  console.log('Admin user:', admin.email);

  const count = await prisma.event.count();
  if (count === 0) {
    for (const e of DEFAULT_EVENTS) {
      await prisma.event.create({
        data: {
          title: e.title,
          category: e.category,
          venue: JSON.stringify(e.venue),
          date: e.date,
          image: e.image,
          minPrice: e.minPrice,
          maxPrice: e.maxPrice ?? null,
          featured: e.featured ?? false,
          visible: e.visible !== false,
        },
      });
    }
    console.log('Seeded', DEFAULT_EVENTS.length, 'events');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

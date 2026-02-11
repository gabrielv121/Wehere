import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MOCK_EVENTS = [
  { title: 'Taylor Swift | The Eras Tour', category: 'concert', venue: { id: 'v1', name: 'Madison Square Garden', city: 'New York', state: 'NY' }, date: '2025-03-15T19:00:00', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', minPrice: 189, maxPrice: 1200, featured: true },
  { title: 'Lakers vs Celtics', category: 'sports', venue: { id: 'v2', name: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA' }, date: '2025-02-20T19:30:00', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', minPrice: 85, maxPrice: 450, featured: true },
  { title: 'Hamilton', category: 'theater', venue: { id: 'v3', name: 'Richard Rodgers Theatre', city: 'New York', state: 'NY' }, date: '2025-04-02T20:00:00', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', minPrice: 129, maxPrice: 399, featured: true },
  { title: 'Dave Chappelle Live', category: 'comedy', venue: { id: 'v4', name: 'Comedy Cellar', city: 'New York', state: 'NY' }, date: '2025-03-08T21:00:00', image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800', minPrice: 75, maxPrice: 250 },
  { title: 'Nine Inch Nails', category: 'concert', venue: { id: 'v5', name: 'United Center', city: 'Chicago', state: 'IL' }, date: '2025-02-14T20:00:00', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', minPrice: 65, maxPrice: 185, featured: true },
  { title: 'Pacers at Nets', category: 'sports', venue: { id: 'v6', name: 'Barclays Center', city: 'Brooklyn', state: 'NY' }, date: '2025-02-11T19:30:00', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', minPrice: 45, maxPrice: 220, featured: true },
  { title: 'Brandi Carlile with The Head and the Heart', category: 'concert', venue: { id: 'v7', name: 'Red Rocks Amphitheatre', city: 'Morrison', state: 'CO' }, date: '2025-02-13T19:00:00', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800', minPrice: 89, maxPrice: 175 },
  { title: 'The Lion King', category: 'theater', venue: { id: 'v8', name: 'Minskoff Theatre', city: 'New York', state: 'NY' }, date: '2025-03-22T14:00:00', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', minPrice: 99, maxPrice: 299 },
  { title: 'Kevin Hart: Reality Check', category: 'comedy', venue: { id: 'v9', name: 'TD Garden', city: 'Boston', state: 'MA' }, date: '2025-04-05T19:00:00', image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800', minPrice: 69, maxPrice: 199 },
  { title: 'Disney on Ice', category: 'family', venue: { id: 'v10', name: 'Staples Center', city: 'Los Angeles', state: 'CA' }, date: '2025-03-01T12:00:00', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', minPrice: 35, maxPrice: 120 },
  { title: 'Beyoncé Renaissance Tour', category: 'concert', venue: { id: 'v11', name: 'Mercedes-Benz Stadium', city: 'Atlanta', state: 'GA' }, date: '2025-05-10T20:00:00', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', minPrice: 199, maxPrice: 850, featured: true },
  { title: 'Warriors vs Suns', category: 'sports', venue: { id: 'v12', name: 'Chase Center', city: 'San Francisco', state: 'CA' }, date: '2025-02-28T19:00:00', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', minPrice: 95, maxPrice: 380 },
  { title: 'Wicked', category: 'theater', venue: { id: 'v13', name: 'Gershwin Theatre', city: 'New York', state: 'NY' }, date: '2025-04-18T19:30:00', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', minPrice: 119, maxPrice: 349 },
  { title: 'John Mulaney', category: 'comedy', venue: { id: 'v14', name: 'Radio City Music Hall', city: 'New York', state: 'NY' }, date: '2025-03-29T20:00:00', image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800', minPrice: 79, maxPrice: 225 },
  { title: 'Sesame Street Live', category: 'family', venue: { id: 'v15', name: 'Wells Fargo Center', city: 'Philadelphia', state: 'PA' }, date: '2025-03-15T10:00:00', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', minPrice: 28, maxPrice: 75 },
  { title: 'Coldplay – Music of the Spheres', category: 'concert', venue: { id: 'v16', name: 'Soldier Field', city: 'Chicago', state: 'IL' }, date: '2025-06-07T19:30:00', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', minPrice: 125, maxPrice: 425 },
  { title: 'Rangers vs Islanders', category: 'sports', venue: { id: 'v17', name: 'Madison Square Garden', city: 'New York', state: 'NY' }, date: '2025-03-02T19:00:00', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', minPrice: 110, maxPrice: 350 },
  { title: 'MJ The Musical', category: 'theater', venue: { id: 'v18', name: 'Neil Simon Theatre', city: 'New York', state: 'NY' }, date: '2025-05-01T19:00:00', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', minPrice: 99, maxPrice: 279 },
  { title: 'Trevor Noah', category: 'comedy', venue: { id: 'v19', name: 'Microsoft Theater', city: 'Los Angeles', state: 'CA' }, date: '2025-04-12T20:00:00', image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800', minPrice: 65, maxPrice: 185 },
  { title: 'Bluey’s Big Play', category: 'family', venue: { id: 'v20', name: 'Hobby Center', city: 'Houston', state: 'TX' }, date: '2025-04-20T11:00:00', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', minPrice: 32, maxPrice: 68 },
  { title: 'Olivia Rodrigo – Guts World Tour', category: 'concert', venue: { id: 'v21', name: 'American Airlines Arena', city: 'Miami', state: 'FL' }, date: '2025-05-22T19:00:00', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', minPrice: 89, maxPrice: 299, featured: true },
  { title: 'Bills vs Chiefs', category: 'sports', venue: { id: 'v22', name: 'Highmark Stadium', city: 'Orchard Park', state: 'NY' }, date: '2025-09-15T20:15:00', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', minPrice: 145, maxPrice: 550 },
  { title: 'Moulin Rouge! The Musical', category: 'theater', venue: { id: 'v23', name: 'Al Hirschfeld Theatre', city: 'New York', state: 'NY' }, date: '2025-04-25T19:00:00', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', minPrice: 109, maxPrice: 329 },
  { title: 'Gabriel Iglesias', category: 'comedy', venue: { id: 'v24', name: 'Toyota Center', city: 'Houston', state: 'TX' }, date: '2025-05-08T19:30:00', image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800', minPrice: 55, maxPrice: 145 },
  { title: 'Paw Patrol Live', category: 'family', venue: { id: 'v25', name: 'Target Center', city: 'Minneapolis', state: 'MN' }, date: '2025-03-08T13:00:00', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', minPrice: 30, maxPrice: 65 },
  { title: 'Foo Fighters', category: 'concert', venue: { id: 'v26', name: 'Fenway Park', city: 'Boston', state: 'MA' }, date: '2025-07-04T19:00:00', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', minPrice: 95, maxPrice: 275 },
  { title: 'Bruins vs Maple Leafs', category: 'sports', venue: { id: 'v27', name: 'TD Garden', city: 'Boston', state: 'MA' }, date: '2025-03-20T19:00:00', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', minPrice: 88, maxPrice: 310 },
  { title: 'Harry Potter and the Cursed Child', category: 'theater', venue: { id: 'v28', name: 'Lyric Theatre', city: 'New York', state: 'NY' }, date: '2025-05-15T14:00:00', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', minPrice: 129, maxPrice: 399 },
  { title: 'Bill Burr', category: 'comedy', venue: { id: 'v29', name: 'Madison Square Garden', city: 'New York', state: 'NY' }, date: '2025-06-20T20:00:00', image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800', minPrice: 72, maxPrice: 195 },
  { title: 'Cirque du Soleil – O', category: 'family', venue: { id: 'v30', name: 'Bellagio Hotel', city: 'Las Vegas', state: 'NV' }, date: '2025-04-10T19:00:00', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', minPrice: 119, maxPrice: 289, featured: true },
];

async function main() {
  const hash = await bcrypt.hash('password', 10);
  const now = new Date();
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wehere.com' },
    update: { emailVerifiedAt: now },
    create: {
      email: 'admin@wehere.com',
      passwordHash: hash,
      name: 'Admin',
      role: 'admin',
      emailVerifiedAt: now,
    },
  });
  console.log('Admin user:', admin.email);

  const seller = await prisma.user.upsert({
    where: { email: 'seller@wehere.com' },
    update: { emailVerifiedAt: now },
    create: {
      email: 'seller@wehere.com',
      passwordHash: hash,
      name: 'Verified Resale',
      role: 'user',
      emailVerifiedAt: now,
    },
  });
  console.log('Seller user:', seller.email);

  await prisma.user.updateMany({
    where: { emailVerifiedAt: null },
    data: { emailVerifiedAt: now },
  });

  let eventCount = await prisma.event.count();
  if (eventCount === 0) {
    for (const e of MOCK_EVENTS) {
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
          visible: true,
        },
      });
    }
    console.log('Seeded', MOCK_EVENTS.length, 'events');
  }

  // Seed listings for Crypto Arena (Lakers vs Celtics) so the map has tickets to show
  const cryptoEvent = await prisma.event.findFirst({
    where: { title: 'Lakers vs Celtics' },
  });
  if (cryptoEvent && (await prisma.listing.count()) === 0) {
    const listings = [
      { section: 'Court', row: '1', quantity: 2, pricePerTicket: 395 },
      { section: 'Court', row: '2', quantity: 4, pricePerTicket: 425 },
      { section: '101', row: '5', quantity: 2, pricePerTicket: 285 },
      { section: '103', row: '10', quantity: 5, pricePerTicket: 220 },
      { section: '201', row: '5', quantity: 4, pricePerTicket: 85 },
      { section: '204', row: '8', quantity: 3, pricePerTicket: 95 },
    ];
    for (const l of listings) {
      await prisma.listing.create({
        data: {
          eventId: cryptoEvent.id,
          sellerId: seller.id,
          sellerName: seller.name,
          section: l.section,
          row: l.row,
          quantity: l.quantity,
          pricePerTicket: l.pricePerTicket,
          totalPrice: l.quantity * l.pricePerTicket,
          status: 'available',
        },
      });
    }
    console.log('Seeded', listings.length, 'listings for Crypto Arena');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

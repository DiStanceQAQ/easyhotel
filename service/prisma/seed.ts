/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const pick = <T>(list: T[], index: number) => list[index % list.length];

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const merchantPassword = await bcrypt.hash('merchant123', 10);

  const usersSeed = Array.from({ length: 10 }).map((_, index) => {
    const isMerchant = index < 5;
    return {
      username: isMerchant ? `merchant${index + 1}` : `admin${index - 4}`,
      password: isMerchant ? merchantPassword : adminPassword,
      role: isMerchant ? 'MERCHANT' : 'ADMIN',
      status: 1,
      last_login_at: new Date(),
    };
  });

  const users: Array<{ id: string; username: string; role: string }> = [];
  for (const user of usersSeed) {
    const saved = await prisma.users.upsert({
      where: { username: user.username },
      update: {
        role: user.role,
        status: user.status,
        last_login_at: user.last_login_at,
      },
      create: user,
      select: { id: true, username: true, role: true },
    });
    users.push(saved);
  }

  const merchants = users.filter((user) => user.role === 'MERCHANT');
  const admins = users.filter((user) => user.role === 'ADMIN');

  for (const [index, merchant] of merchants.entries()) {
    await prisma.merchant_profile.upsert({
      where: { user_id: merchant.id },
      update: {
        merchant_name: `易宿商旅 ${index + 1}`,
        contact_name: `联系人${index + 1}`,
        contact_phone: `1380000000${index + 1}`,
      },
      create: {
        user_id: merchant.id,
        merchant_name: `易宿商旅 ${index + 1}`,
        contact_name: `联系人${index + 1}`,
        contact_phone: `1380000000${index + 1}`,
      },
    });
  }

  const hotels: Array<{ id: string }> = [];
  for (let index = 0; index < 10; index += 1) {
    const merchant = pick(merchants, index);
    const admin = pick(admins, index);
    const nameCn = `示例酒店${index + 1}`;
    const nameEn = `Sample Hotel ${index + 1}`;

    let hotel = await prisma.hotels.findFirst({
      where: { merchant_id: merchant.id, name_cn: nameCn },
      select: { id: true },
    });

    if (!hotel) {
      hotel = await prisma.hotels.create({
        data: {
          merchant_id: merchant.id,
          name_cn: nameCn,
          name_en: nameEn,
          city: index % 2 === 0 ? '深圳' : '上海',
          address: `示例路 ${index + 1} 号`,
          lat: 22.533333,
          lng: 113.933333,
          star: (index % 5) + 1,
          opened_at: new Date('2018-06-01'),
          facilities: { wifi: true, parking: true, gym: index % 2 === 0 },
          description: `这是第 ${index + 1} 家示例酒店`,
          cover_image: `/static/hotel-${index + 1}.jpg`,
          min_price: 300 + index * 20,
          audit_status: 'APPROVED',
          publish_status: 'ONLINE',
          approved_by: admin.id,
          approved_at: new Date(),
        },
        select: { id: true },
      });
    }

    hotels.push(hotel);
  }

  const roomTypes: Array<{ id: bigint; hotel_id: string }> = [];
  for (let index = 0; index < hotels.length; index += 1) {
    const hotel = hotels[index];
    const existingRoom = await prisma.room_types.findFirst({
      where: { hotel_id: hotel.id },
      select: { id: true },
    });

    if (existingRoom) {
      roomTypes.push({ id: existingRoom.id, hotel_id: hotel.id });
      continue;
    }

    const room = await prisma.room_types.create({
      data: {
        hotel_id: hotel.id,
        name: `豪华房型 ${index + 1}`,
        base_price: 380 + index * 10,
        currency: 'CNY',
        max_guests: 2,
        breakfast: index % 2 === 0,
        refundable: true,
        area_m2: 26 + index,
        status: 1,
        cover_image: `/static/room-${index + 1}.jpg`,
      },
      select: { id: true, hotel_id: true },
    });
    roomTypes.push(room);
  }

  for (let index = 0; index < roomTypes.length; index += 1) {
    const roomType = roomTypes[index];
    const date = new Date(2026, 1, 3 + index);
    await prisma.room_price_calendar.upsert({
      where: {
        room_type_id_date: {
          room_type_id: roomType.id,
          date,
        },
      },
      update: {
        price: 400 + index * 12,
        stock: 8 + (index % 5),
      },
      create: {
        room_type_id: roomType.id,
        date,
        price: 400 + index * 12,
        stock: 8 + (index % 5),
      },
    });
  }

  for (let index = 0; index < hotels.length; index += 1) {
    const hotel = hotels[index];
    const existingImages = await prisma.hotel_images.count({
      where: { hotel_id: hotel.id },
    });
    if (existingImages === 0) {
      await prisma.hotel_images.create({
        data: {
          hotel_id: hotel.id,
          url: `/static/hotel-${index + 1}.jpg`,
          sort_order: 1,
        },
      });
    }
  }

  const tagNames = Array.from({ length: 10 }).map(
    (_, index) => `标签${index + 1}`,
  );
  const tags: Array<{ id: bigint; name: string }> = [];

  for (const name of tagNames) {
    const tag = await prisma.tags.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tags.push(tag);
  }

  for (let index = 0; index < 10; index += 1) {
    const hotel = pick(hotels, index);
    const tag = pick(tags, index);
    await prisma.hotel_tags.upsert({
      where: {
        hotel_id_tag_id: {
          hotel_id: hotel.id,
          tag_id: tag.id,
        },
      },
      update: {},
      create: {
        hotel_id: hotel.id,
        tag_id: tag.id,
      },
    });
  }

  for (let index = 0; index < hotels.length; index += 1) {
    const hotel = hotels[index];
    const existingBanner = await prisma.banners.count({
      where: { hotel_id: hotel.id },
    });
    if (existingBanner === 0) {
      await prisma.banners.create({
        data: {
          title: `精选推荐 ${index + 1}`,
          image_url: `/static/banner-${index + 1}.jpg`,
          hotel_id: hotel.id,
          start_at: new Date('2026-02-01T00:00:00+08:00'),
          end_at: new Date('2026-02-28T23:59:59+08:00'),
          is_active: true,
          sort_order: index + 1,
        },
      });
    }
  }

  for (let index = 0; index < hotels.length; index += 1) {
    const hotel = hotels[index];
    const operator = pick(admins, index);
    await prisma.hotel_audit_logs.create({
      data: {
        hotel_id: hotel.id,
        action: 'APPROVE',
        operator_id: operator.id,
        reason: '审核通过',
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

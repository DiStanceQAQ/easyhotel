/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const pick = <T>(list: T[], index: number) => list[index % list.length];

// 统一图片URL
const IMAGE_URL =
  'http://p0.ifengimg.com/a/2017_20/72bf9ed30d28d13_size48_w500_h333.jpg';

// 城市列表
const CITIES = [
  '北京',
  '上海',
  '深圳',
  '广州',
  '杭州',
  '成都',
  '西安',
  '南京',
  '武汉',
  '重庆',
];

// 酒店名称前缀
const HOTEL_PREFIXES = [
  '易宿精选',
  '易宿商务',
  '易宿度假',
  '易宿快捷',
  '易宿豪华',
];

// 房型名称列表
const ROOM_TYPES_NAMES = [
  '标准大床房',
  '豪华双床房',
  '商务套房',
  '家庭房',
  '行政套房',
];

async function main() {
  console.log('🌱 开始清理旧数据...');

  // 清理旧数据（顺序很重要，避免外键冲突）
  await prisma.hotel_audit_logs.deleteMany({});
  await prisma.banners.deleteMany({});
  await prisma.hotel_tags.deleteMany({});
  await prisma.room_price_calendar.deleteMany({});
  await prisma.room_types.deleteMany({});
  await prisma.hotel_images.deleteMany({});
  await prisma.hotels.deleteMany({});
  await prisma.merchant_profile.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.tags.deleteMany({});

  console.log('✅ 旧数据清理完成');

  // 创建用户（15个商户 + 15个管理员 = 30个用户）
  console.log('👤 创建用户账号...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const merchantPassword = await bcrypt.hash('merchant123', 10);
  const testAdminPassword = await bcrypt.hash('123456', 10);

  const users: Array<{ id: string; username: string; role: string }> = [];

  // 创建15个商户
  for (let i = 0; i < 15; i++) {
    const user = await prisma.users.create({
      data: {
        username: `merchant${i + 1}`,
        password: merchantPassword,
        role: 'MERCHANT',
        status: 1,
        last_login_at: new Date(),
      },
      select: { id: true, username: true, role: true },
    });
    users.push(user);
  }

  // 创建15个管理员
  for (let i = 0; i < 15; i++) {
    const user = await prisma.users.create({
      data: {
        username: `admin${i + 1}`,
        password: i === 0 ? testAdminPassword : adminPassword, // admin1 使用密码 123456，其他使用 admin123
        role: 'ADMIN',
        status: 1,
        last_login_at: new Date(),
      },
      select: { id: true, username: true, role: true },
    });
    users.push(user);
  }

  const merchants = users.filter((user) => user.role === 'MERCHANT');
  const admins = users.filter((user) => user.role === 'ADMIN');

  console.log(`✅ 创建了 ${merchants.length} 个商户和 ${admins.length} 个管理员`);

  // 创建商户资料
  console.log('🏢 创建商户资料...');
  for (const [index, merchant] of merchants.entries()) {
    await prisma.merchant_profile.create({
      data: {
        user_id: merchant.id,
        merchant_name: `易宿商旅集团 ${index + 1}`,
        contact_name: `商户联系人${index + 1}`,
        contact_phone: `138${String(index + 1).padStart(8, '0')}`,
      },
    });
  }
  console.log('✅ 商户资料创建完成');

  // 创建标签
  console.log('🏷️  创建标签...');
  const tagNames = [
    '亲子',
    '免费停车',
    '近地铁',
    '商务出行',
    '度假休闲',
    '温泉',
    '海景',
    '山景',
    '免费早餐',
    '健身房',
  ];
  const tags: Array<{ id: bigint; name: string }> = [];
  for (const name of tagNames) {
    const tag = await prisma.tags.create({
      data: { name },
    });
    tags.push(tag);
  }
  console.log(`✅ 创建了 ${tags.length} 个标签`);

  // 创建30家酒店（每个商户2家）
  console.log('🏨 创建30家酒店...');
  const hotels: Array<{ id: string; index: number }> = [];

  for (let i = 0; i < 30; i++) {
    const merchantIndex = Math.floor(i / 2); // 每个商户2家酒店
    const merchant = merchants[merchantIndex];
    const admin = pick(admins, i);
    const city = pick(CITIES, i);
    const prefix = pick(HOTEL_PREFIXES, i);
    const star = (i % 5) + 1; // 1-5星循环

    const hotel = await prisma.hotels.create({
      data: {
        merchant_id: merchant.id,
        name_cn: `${prefix}酒店(${city}${i % 2 === 0 ? '中心' : '南'}店)`,
        name_en: `EasyStay Hotel ${city} No.${i + 1}`,
        city: city,
        address: `${city}市示范区街道${i + 1}号`,
        lat: 22.5 + i * 0.01,
        lng: 113.9 + i * 0.01,
        star: star,
        opened_at: new Date(2015 + (i % 8), (i % 12), 1),
        facilities: {
          wifi: true,
          parking: i % 3 !== 0, // 大部分有停车场
          gym: i % 4 === 0, // 部分有健身房
          pool: i % 5 === 0, // 部分有泳池
          restaurant: i % 2 === 0, // 部分有餐厅
        },
        description: `${prefix}酒店(${city}店)位于${city}市中心，交通便利，周边商圈繁华。酒店拥有现代化的客房设施，为您提供舒适的住宿体验。无论是商务出差还是休闲旅游，都是您的理想选择。`,
        cover_image: IMAGE_URL,
        min_price: 200 + star * 50 + i * 10,
        audit_status: 'APPROVED',
        publish_status: i % 10 === 9 ? 'OFFLINE' : 'ONLINE', // 10%的酒店下线
        approved_by: admin.id,
        approved_at: new Date(),
      },
      select: { id: true },
    });

    hotels.push({ id: hotel.id, index: i });
  }
  console.log(`✅ 创建了 ${hotels.length} 家酒店`);

  // 为每家酒店创建图片（每家4张）
  console.log('📸 创建酒店图片...');
  let imageCount = 0;
  for (const hotel of hotels) {
    for (let imgIdx = 0; imgIdx < 4; imgIdx++) {
      await prisma.hotel_images.create({
        data: {
          hotel_id: hotel.id,
          url: IMAGE_URL,
          sort_order: imgIdx,
        },
      });
      imageCount++;
    }
  }
  console.log(`✅ 创建了 ${imageCount} 张酒店图片`);

  // 为每家酒店关联2个标签
  console.log('🔗 关联酒店标签...');
  let tagLinkCount = 0;
  for (const hotel of hotels) {
    const tag1 = pick(tags, hotel.index);
    const tag2 = pick(tags, hotel.index + 1);

    await prisma.hotel_tags.create({
      data: {
        hotel_id: hotel.id,
        tag_id: tag1.id,
      },
    });

    // 确保不重复关联
    if (tag1.id !== tag2.id) {
      await prisma.hotel_tags.create({
        data: {
          hotel_id: hotel.id,
          tag_id: tag2.id,
        },
      });
      tagLinkCount += 2;
    } else {
      tagLinkCount += 1;
    }
  }
  console.log(`✅ 创建了 ${tagLinkCount} 个酒店-标签关联`);

  // 为每家酒店创建3个房型
  console.log('🛏️  创建房型...');
  const roomTypes: Array<{ id: bigint; hotel_id: string; index: number }> = [];
  let roomCount = 0;

  for (const hotel of hotels) {
    for (let roomIdx = 0; roomIdx < 3; roomIdx++) {
      const roomName = pick(ROOM_TYPES_NAMES, roomIdx);
      const basePrice = 300 + hotel.index * 15 + roomIdx * 100;

      const room = await prisma.room_types.create({
        data: {
          hotel_id: hotel.id,
          name: roomName,
          base_price: basePrice,
          currency: 'CNY',
          max_guests: roomIdx === 3 ? 4 : 2, // 家庭房4人，其他2人
          breakfast: roomIdx % 2 === 0,
          refundable: roomIdx !== 4, // 行政套房不可退
          area_m2: 25 + roomIdx * 5,
          status: 1,
          cover_image: IMAGE_URL,
        },
        select: { id: true, hotel_id: true },
      });

      roomTypes.push({ id: room.id, hotel_id: hotel.id, index: roomCount });
      roomCount++;
    }
  }
  console.log(`✅ 创建了 ${roomCount} 个房型`);

  // 为每个房型创建未来7天的价格日历
  console.log('📅 创建价格日历...');
  let calendarCount = 0;
  const today = new Date(2026, 1, 4); // 2026-02-04

  for (const room of roomTypes) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // 周末价格上浮20%
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const priceMultiplier = isWeekend ? 1.2 : 1.0;
      const basePrice = 300 + room.index * 5;

      await prisma.room_price_calendar.create({
        data: {
          room_type_id: room.id,
          date: date,
          price: Math.round(basePrice * priceMultiplier),
          stock: 5 + (room.index % 10), // 库存5-14间
        },
      });
      calendarCount++;
    }
  }
  console.log(`✅ 创建了 ${calendarCount} 条价格日历记录`);

  // 为每家酒店创建1个banner
  console.log('🎨 创建Banner...');
  for (const hotel of hotels) {
    await prisma.banners.create({
      data: {
        title: `特惠推荐 - 酒店${hotel.index + 1}`,
        image_url: IMAGE_URL,
        hotel_id: hotel.id,
        start_at: new Date('2026-02-01T00:00:00+08:00'),
        end_at: new Date('2026-03-31T23:59:59+08:00'),
        is_active: hotel.index % 5 !== 4, // 80%的banner启用
        sort_order: hotel.index + 1,
      },
    });
  }
  console.log(`✅ 创建了 ${hotels.length} 个Banner`);

  // 为每家酒店创建审核日志
  console.log('📝 创建审核日志...');
  for (const hotel of hotels) {
    const operator = pick(admins, hotel.index);

    await prisma.hotel_audit_logs.create({
      data: {
        hotel_id: hotel.id,
        action: 'APPROVE',
        operator_id: operator.id,
        reason: '符合平台标准，审核通过',
      },
    });
  }
  console.log(`✅ 创建了 ${hotels.length} 条审核日志`);

  console.log('\n🎉 数据填充完成！');
  console.log('📊 数据统计：');
  console.log(`   - 用户：30个（15商户 + 15管理员）`);
  console.log(`   - 商户资料：15个`);
  console.log(`   - 酒店：30家`);
  console.log(`   - 酒店图片：120张（每家4张）`);
  console.log(`   - 标签：10个`);
  console.log(`   - 酒店-标签关联：${tagLinkCount}个`);
  console.log(`   - 房型：90个（每家3个）`);
  console.log(`   - 价格日历：630条（每个房型7天）`);
  console.log(`   - Banner：30个`);
  console.log(`   - 审核日志：30条`);
  console.log('\n💡 账号信息：');
  console.log(`   - 商户账号：merchant1~merchant15 / 密码：merchant123`);
  console.log(`   - 管理员账号：admin1~admin15 / 密码：admin123`);
  console.log(`   - 图片URL：${IMAGE_URL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

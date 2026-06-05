const { User, Category, Product, sequelize } = require('./models');
const logger = require('./utils/logger');

const categories = [
  { name: '数码电子', slug: 'digital', sort_order: 1 },
  { name: '服饰鞋包', slug: 'fashion', sort_order: 2 },
  { name: '美妆护肤', slug: 'beauty', sort_order: 3 },
  { name: '家居家装', slug: 'home', sort_order: 4 },
  { name: '食品生鲜', slug: 'food', sort_order: 5 }
];

const products = [
  {
    category_idx: 0,
    name: '无线蓝牙耳机 降噪版',
    slug: 'wireless-earphones',
    description: '主动降噪，30小时续航，Hi-Fi音质，舒适佩戴',
    price: 399,
    original_price: 599,
    stock: 100,
    image: '/images/products/wireless-earphones.jpg'
  },
  {
    category_idx: 0,
    name: '智能手表 Pro',
    slug: 'smartwatch-pro',
    description: '全天健康监测，50米防水，GPS定位，NFC支付',
    price: 1299,
    original_price: 1599,
    stock: 80,
    image: '/images/products/smartwatch-pro.jpg'
  },
  {
    category_idx: 0,
    name: '机械键盘 青轴',
    slug: 'mechanical-keyboard',
    description: 'Cherry青轴，RGB背光，全键无冲，人体工学设计',
    price: 499,
    original_price: 699,
    stock: 60,
    image: '/images/products/mechanical-keyboard.jpg'
  },
  {
    category_idx: 0,
    name: '便携充电宝 20000mAh',
    slug: 'power-bank',
    description: '双USB输出，22.5W快充，轻薄便携',
    price: 129,
    original_price: 199,
    stock: 200,
    image: '/images/products/power-bank.jpg'
  },
  {
    category_idx: 1,
    name: '纯棉简约T恤',
    slug: 'cotton-tshirt',
    description: '100%纯棉，透气舒适，多色可选',
    price: 89,
    original_price: 159,
    stock: 500,
    image: '/images/products/cotton-tshirt.jpg'
  },
  {
    category_idx: 1,
    name: '运动休闲鞋',
    slug: 'sports-shoes',
    description: '轻便透气，防滑耐磨，适合日常运动',
    price: 299,
    original_price: 459,
    stock: 120,
    image: '/images/products/sports-shoes.jpg'
  },
  {
    category_idx: 1,
    name: '真皮商务公文包',
    slug: 'leather-bag',
    description: '头层牛皮，大容量，商务休闲两用',
    price: 599,
    original_price: 899,
    stock: 50,
    image: '/images/products/leather-bag.jpg'
  },
  {
    category_idx: 2,
    name: '补水保湿面膜 10片装',
    slug: 'face-mask',
    description: '玻尿酸精华，深层补水，温和不刺激',
    price: 79,
    original_price: 129,
    stock: 300,
    image: '/images/products/face-mask.jpg'
  },
  {
    category_idx: 2,
    name: '滋润唇膏礼盒装',
    slug: 'lipstick-set',
    description: '6色可选，持久显色，滋润不拔干',
    price: 199,
    original_price: 299,
    stock: 150,
    image: '/images/products/lipstick-set.jpg'
  },
  {
    category_idx: 3,
    name: '北欧风落地灯',
    slug: 'floor-lamp',
    description: '简约设计，三档调光，护眼柔光',
    price: 259,
    original_price: 399,
    stock: 80,
    image: '/images/products/floor-lamp.jpg'
  },
  {
    category_idx: 3,
    name: '记忆棉午睡枕',
    slug: 'memory-pillow',
    description: '透气舒适，支撑颈部，办公室必备',
    price: 69,
    original_price: 99,
    stock: 400,
    image: '/images/products/memory-pillow.jpg'
  },
  {
    category_idx: 4,
    name: '有机燕麦片 1kg',
    slug: 'organic-oatmeal',
    description: '无添加，即食冲泡，营养早餐',
    price: 49,
    original_price: 79,
    stock: 500,
    image: '/images/products/organic-oatmeal.jpg'
  },
  {
    category_idx: 4,
    name: '进口坚果礼盒',
    slug: 'nut-gift-box',
    description: '混合坚果，每日一包，健康零食',
    price: 168,
    original_price: 238,
    stock: 200,
    image: '/images/products/nut-gift-box.jpg'
  }
];

async function run() {
  try {
    const catCount = await Category.count();
    if (catCount > 0) {
      logger.info('Seed already run, skipping');
      return;
    }

    const createdCats = await Category.bulkCreate(categories);

    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: '123456',
        nickname: '管理员'
      });
      logger.info('Admin user created');
    }

    const user = await User.findOne({ where: { username: 'user' } });
    if (!user) {
      await User.create({
        username: 'user',
        email: 'user@example.com',
        password: '123456',
        nickname: '测试用户'
      });
      logger.info('Test user created');
    }

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const cat = createdCats[p.category_idx];
      await Product.create({
        category_id: cat.id,
        name: p.name,
        slug: `${p.slug}-${i}`,
        description: p.description,
        price: p.price,
        original_price: p.original_price,
        stock: p.stock,
        image: p.image,
        status: 'active'
      });
    }
    logger.info('Seed completed');
  } catch (err) {
    logger.error('Seed failed:', err);
    throw err;
  }
}

module.exports = { run };

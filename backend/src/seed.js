const { User, Category, Brand, Product, FlashSale, sequelize } = require('./models');
const logger = require('./utils/logger');

const categories = [
  { name: '数码电子', slug: 'digital', sort_order: 1 },
  { name: '服饰鞋包', slug: 'fashion', sort_order: 2 },
  { name: '美妆护肤', slug: 'beauty', sort_order: 3 },
  { name: '家居家装', slug: 'home', sort_order: 4 },
  { name: '食品生鲜', slug: 'food', sort_order: 5 }
];

const brands = [
  {
    name: '声籁科技',
    slug: 'shenglai',
    description: '专注于音频技术研发，致力于为用户带来极致的听觉体验',
    story: '声籁科技成立于2010年，由一群热爱音乐的工程师创立。我们相信好的声音能够改变生活，十余年来持续投入研发，在降噪技术和音质调校方面积累了深厚的技术功底。',
    country: '中国',
    established_year: 2010,
    sort_order: 1
  },
  {
    name: '智芯',
    slug: 'zhixin',
    description: '智能穿戴设备领军品牌，让科技守护你的健康',
    story: '智芯品牌诞生于2015年，以"科技服务健康"为理念，推出了多款深受消费者喜爱的智能手表、手环等产品。我们的愿景是让每个人都能轻松管理自己的健康。',
    country: '中国',
    established_year: 2015,
    sort_order: 2
  },
  {
    name: '青轴工坊',
    slug: 'qingzhou',
    description: '机械键盘专家，为专业玩家打造极致输入体验',
    story: '青轴工坊是国内最早专注于机械键盘的品牌之一，与德国Cherry等知名厂商深度合作，坚持用料考究、做工精良，深受程序员和游戏玩家的喜爱。',
    country: '中国',
    established_year: 2012,
    sort_order: 3
  },
  {
    name: '劲量',
    slug: 'jinliang',
    description: '全球知名的电池和充电设备品牌',
    story: '劲量是拥有百年历史的国际品牌，在便携式能源领域拥有领先的技术优势。我们的充电宝产品以安全、高效、耐用著称，畅销全球100多个国家和地区。',
    country: '美国',
    established_year: 1905,
    sort_order: 4
  },
  {
    name: '优衣坊',
    slug: 'youyifang',
    description: '简约舒适的服饰品牌，让日常穿着更美好',
    story: '优衣坊倡导"舒适至上"的理念，精选优质面料，注重每一个细节。我们相信好的衣服不需要繁复的设计，而是让穿着的人感受到自在与自信。',
    country: '中国',
    established_year: 2008,
    sort_order: 5
  },
  {
    name: '飞跃',
    slug: 'feiyue',
    description: '国民运动鞋品牌，品质与潮流的完美结合',
    story: '飞跃品牌始于1958年，是中国最早的运动鞋品牌之一。近年来我们在传承经典的同时融入潮流设计，推出了多款网红爆款，成为国潮品牌的代表。',
    country: '中国',
    established_year: 1958,
    sort_order: 6
  },
  {
    name: '雅士',
    slug: 'yashi',
    description: '高端皮具品牌，传承匠人精神',
    story: '雅士品牌专注于皮具制造30余年，每一件产品都经过精心设计和手工打磨。我们坚持使用头层牛皮，为追求品质生活的人士打造值得传承的经典之作。',
    country: '意大利',
    established_year: 1990,
    sort_order: 7
  },
  {
    name: '润肌',
    slug: 'runji',
    description: '天然护肤品牌，让肌肤回归自然健康状态',
    story: '润肌相信真正的美丽来自健康的肌肤。我们甄选天然植物成分，摒弃多余添加，用科学配方让每一位使用者都能感受到肌肤的自然之美。',
    country: '中国',
    established_year: 2013,
    sort_order: 8
  },
  {
    name: '尚彩',
    slug: 'shangcai',
    description: '时尚彩妆品牌，展现你的独特魅力',
    story: '尚彩彩妆鼓励每个人勇敢展现自己的美。我们的产品色彩丰富、质地细腻，无论是日常妆容还是派对造型，都能让你轻松驾驭，绽放自信光彩。',
    country: '法国',
    established_year: 2005,
    sort_order: 9
  },
  {
    name: '北境',
    slug: 'beijing',
    description: '北欧风格家居品牌，打造温馨舒适的生活空间',
    story: '北境将北欧设计理念带入中国，简约而不简单的设计，注重功能性与美观性的统一。我们相信好的家居产品能够提升生活幸福感。',
    country: '瑞典',
    established_year: 2011,
    sort_order: 10
  },
  {
    name: '梦眠',
    slug: 'mengmian',
    description: '专业睡眠品牌，让每个人都能拥有好睡眠',
    story: '梦眠专注于睡眠健康领域，联合知名医学院开展研究，开发出一系列符合人体工学的睡眠产品。我们的使命是让每一个人都能享受到婴儿般的睡眠。',
    country: '中国',
    established_year: 2016,
    sort_order: 11
  },
  {
    name: '谷粒',
    slug: 'guli',
    description: '健康食品品牌，甄选全球优质食材',
    story: '谷粒坚持"从田间到餐桌"的理念，严选优质原料，不添加人工成分。我们希望为每个家庭提供健康、美味、放心的食品选择。',
    country: '中国',
    established_year: 2014,
    sort_order: 12
  }
];

const products = [
  {
    category_idx: 0,
    brand_idx: 0,
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
    brand_idx: 1,
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
    brand_idx: 2,
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
    brand_idx: 3,
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
    brand_idx: 4,
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
    brand_idx: 5,
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
    brand_idx: 6,
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
    brand_idx: 7,
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
    brand_idx: 8,
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
    brand_idx: 9,
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
    brand_idx: 10,
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
    brand_idx: 11,
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
    brand_idx: 11,
    name: '进口坚果礼盒',
    slug: 'nut-gift-box',
    description: '混合坚果，每日一包，健康零食',
    price: 168,
    original_price: 238,
    stock: 200,
    image: '/images/products/nut-gift-box.jpg'
  }
];

const flashSales = [
  { product_idx: 0, name: '限时特惠-无线蓝牙耳机', sale_price: 199, stock: 20, hours_offset: [0, 2] },
  { product_idx: 4, name: '限时特惠-纯棉T恤', sale_price: 39, stock: 50, hours_offset: [0, 3] },
  { product_idx: 9, name: '限时特惠-记忆棉午睡枕', sale_price: 29, stock: 30, hours_offset: [1, 4] },
  { product_idx: 11, name: '限时特惠-有机燕麦片', sale_price: 19, stock: 40, hours_offset: [2, 5] },
  { product_idx: 1, name: '即将开抢-智能手表Pro', sale_price: 799, stock: 15, hours_offset: [24, 26] },
  { product_idx: 5, name: '即将开抢-运动休闲鞋', sale_price: 149, stock: 25, hours_offset: [25, 27] }
];

async function run() {
  try {
    const catCount = await Category.count();
    const brandCount = await Brand.count();
    let createdCats;
    let createdBrands;
    let createdProducts;

    if (catCount > 0) {
      logger.info('Categories already exist');
      if (brandCount === 0) {
        logger.info('Seeding brands...');
        createdBrands = await Brand.bulkCreate(brands);
        const allProducts = await Product.findAll({ order: [['id', 'ASC']] });
        for (let i = 0; i < allProducts.length && i < products.length; i++) {
          const p = products[i];
          if (p.brand_idx !== undefined && createdBrands[p.brand_idx]) {
            await allProducts[i].update({ brand_id: createdBrands[p.brand_idx].id });
          }
        }
        logger.info('Brands seed completed and products associated');
      }
      createdProducts = await Product.findAll({ attributes: ['id', 'name'], order: [['id', 'ASC']] });
    } else {
      createdCats = await Category.bulkCreate(categories);
      createdBrands = await Brand.bulkCreate(brands);

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

      createdProducts = [];
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const cat = createdCats[p.category_idx];
        const brand = p.brand_idx !== undefined && createdBrands[p.brand_idx] ? createdBrands[p.brand_idx] : null;
        const product = await Product.create({
          category_id: cat.id,
          brand_id: brand ? brand.id : null,
          name: p.name,
          slug: `${p.slug}-${i}`,
          description: p.description,
          price: p.price,
          original_price: p.original_price,
          stock: p.stock,
          image: p.image,
          status: 'active'
        });
        createdProducts.push(product);
      }
      logger.info('Products seed completed');
    }

    const fsCount = await FlashSale.count();
    if (fsCount === 0 && createdProducts && createdProducts.length > 0) {
      const now = new Date();
      for (const fs of flashSales) {
        const product = createdProducts[fs.product_idx];
        if (product) {
          const startTime = new Date(now.getTime() + fs.hours_offset[0] * 60 * 60 * 1000);
          const endTime = new Date(now.getTime() + fs.hours_offset[1] * 60 * 60 * 1000);
          await FlashSale.create({
            product_id: product.id,
            name: fs.name,
            sale_price: fs.sale_price,
            original_stock: fs.stock,
            stock: fs.stock,
            start_time: startTime,
            end_time: endTime,
            status: 'active'
          });
        }
      }
      logger.info('Flash sales seed completed');
    }

    logger.info('Seed completed');
  } catch (err) {
    logger.error('Seed failed:', err);
    throw err;
  }
}

module.exports = { run };

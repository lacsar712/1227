const { User, Category, Brand, Product, FlashSale, PointsProduct, sequelize } = require('./models');
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
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20audio%20technology%20brand%20logo%20with%20sound%20wave%20and%20headphone%20elements%2C%20blue%20gradient%2C%20professional%20tech%20style&image_size=square_hd',
    description: '专注于音频技术研发，致力于为用户带来极致的听觉体验',
    story: '声籁科技成立于2010年，由一群热爱音乐的工程师创立。我们相信好的声音能够改变生活，十余年来持续投入研发，在降噪技术和音质调校方面积累了深厚的技术功底。',
    country: '中国',
    established_year: 2010,
    sort_order: 1
  },
  {
    name: '智芯',
    slug: 'zhixin',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20smart%20wearable%20brand%20logo%20with%20heartbeat%20and%20chip%20design%2C%20cyan%20blue%20gradient%2C%20health%20tech%20style&image_size=square_hd',
    description: '智能穿戴设备领军品牌，让科技守护你的健康',
    story: '智芯品牌诞生于2015年，以"科技服务健康"为理念，推出了多款深受消费者喜爱的智能手表、手环等产品。我们的愿景是让每个人都能轻松管理自己的健康。',
    country: '中国',
    established_year: 2015,
    sort_order: 2
  },
  {
    name: '青轴工坊',
    slug: 'qingzhou',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20mechanical%20keyboard%20brand%20logo%20with%20keyboard%20switch%20element%2C%20dark%20green%20and%20brass%20colors%2C%20craftsmanship%20style&image_size=square_hd',
    description: '机械键盘专家，为专业玩家打造极致输入体验',
    story: '青轴工坊是国内最早专注于机械键盘的品牌之一，与德国Cherry等知名厂商深度合作，坚持用料考究、做工精良，深受程序员和游戏玩家的喜爱。',
    country: '中国',
    established_year: 2012,
    sort_order: 3
  },
  {
    name: '劲量',
    slug: 'jinliang',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=energetic%20battery%20brand%20logo%20with%20lightning%20bolt%20and%20battery%20icon%2C%20red%20and%20yellow%20gradient%2C%20powerful%20bold%20style&image_size=square_hd',
    description: '全球知名的电池和充电设备品牌',
    story: '劲量是拥有百年历史的国际品牌，在便携式能源领域拥有领先的技术优势。我们的充电宝产品以安全、高效、耐用著称，畅销全球100多个国家和地区。',
    country: '美国',
    established_year: 1905,
    sort_order: 4
  },
  {
    name: '优衣坊',
    slug: 'youyifang',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20clothing%20brand%20logo%20with%20fabric%20texture%20and%20thread%20element%2C%20warm%20beige%20and%20white%2C%20comfortable%20casual%20style&image_size=square_hd',
    description: '简约舒适的服饰品牌，让日常穿着更美好',
    story: '优衣坊倡导"舒适至上"的理念，精选优质面料，注重每一个细节。我们相信好的衣服不需要繁复的设计，而是让穿着的人感受到自在与自信。',
    country: '中国',
    established_year: 2008,
    sort_order: 5
  },
  {
    name: '飞跃',
    slug: 'feiyue',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dynamic%20sports%20shoe%20brand%20logo%20with%20wing%20and%20sneaker%20silhouette%2C%20red%20white%20blue%20colors%2C%20energetic%20athletic%20style&image_size=square_hd',
    description: '国民运动鞋品牌，品质与潮流的完美结合',
    story: '飞跃品牌始于1958年，是中国最早的运动鞋品牌之一。近年来我们在传承经典的同时融入潮流设计，推出了多款网红爆款，成为国潮品牌的代表。',
    country: '中国',
    established_year: 1958,
    sort_order: 6
  },
  {
    name: '雅士',
    slug: 'yashi',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20leather%20goods%20brand%20logo%20with%20leather%20texture%20and%20stitching%20detail%2C%20rich%20brown%20and%20gold%20colors%2C%20elegant%20premium%20style&image_size=square_hd',
    description: '高端皮具品牌，传承匠人精神',
    story: '雅士品牌专注于皮具制造30余年，每一件产品都经过精心设计和手工打磨。我们坚持使用头层牛皮，为追求品质生活的人士打造值得传承的经典之作。',
    country: '意大利',
    established_year: 1990,
    sort_order: 7
  },
  {
    name: '润肌',
    slug: 'runji',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=natural%20skincare%20brand%20logo%20with%20water%20droplet%20and%20botanical%20leaf%20elements%2C%20fresh%20green%20and%20white%2C%20organic%20pure%20style&image_size=square_hd',
    description: '天然护肤品牌，让肌肤回归自然健康状态',
    story: '润肌相信真正的美丽来自健康的肌肤。我们甄选天然植物成分，摒弃多余添加，用科学配方让每一位使用者都能感受到肌肤的自然之美。',
    country: '中国',
    established_year: 2013,
    sort_order: 8
  },
  {
    name: '尚彩',
    slug: 'shangcai',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stylish%20cosmetics%20brand%20logo%20with%20lipstick%20and%20makeup%20palette%20elements%2C%20pink%20purple%20gradient%2C%20fashionable%20glamorous%20style&image_size=square_hd',
    description: '时尚彩妆品牌，展现你的独特魅力',
    story: '尚彩彩妆鼓励每个人勇敢展现自己的美。我们的产品色彩丰富、质地细腻，无论是日常妆容还是派对造型，都能让你轻松驾驭，绽放自信光彩。',
    country: '法国',
    established_year: 2005,
    sort_order: 9
  },
  {
    name: '北境',
    slug: 'beijing',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scandinavian%20home%20decor%20brand%20logo%20with%20geometric%20tree%20and%20minimal%20shapes%2C%20soft%20gray%20and%20muted%20blue%2C%20nordic%20simple%20style&image_size=square_hd',
    description: '北欧风格家居品牌，打造温馨舒适的生活空间',
    story: '北境将北欧设计理念带入中国，简约而不简单的设计，注重功能性与美观性的统一。我们相信好的家居产品能够提升生活幸福感。',
    country: '瑞典',
    established_year: 2011,
    sort_order: 10
  },
  {
    name: '梦眠',
    slug: 'mengmian',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=serene%20sleep%20brand%20logo%20with%20moon%20and%20cloud%20elements%2C%20soft%20purple%20and%20blue%20gradient%2C%20calm%20peaceful%20style&image_size=square_hd',
    description: '专业睡眠品牌，让每个人都能拥有好睡眠',
    story: '梦眠专注于睡眠健康领域，联合知名医学院开展研究，开发出一系列符合人体工学的睡眠产品。我们的使命是让每一个人都能享受到婴儿般的睡眠。',
    country: '中国',
    established_year: 2016,
    sort_order: 11
  },
  {
    name: '谷粒',
    slug: 'guli',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=healthy%20food%20brand%20logo%20with%20wheat%20grain%20and%20natural%20elements%2C%20warm%20golden%20yellow%20and%20green%2C%20organic%20wholesome%20style&image_size=square_hd',
    description: '健康食品品牌，甄选全球优质食材',
    story: '谷粒坚持"从田间到餐桌"的理念，严选优质原料，不添加人工成分。我们希望为每个家庭提供健康、美味、放心的食品选择。',
    country: '中国',
    established_year: 2014,
    sort_order: 12
  }
];

const products = [
  { category_idx: 0, brand_idx: 0, name: '无线蓝牙耳机 降噪版', slug: 'wireless-earphones', description: '主动降噪，30小时续航，Hi-Fi音质，舒适佩戴', price: 399, original_price: 599, stock: 100, image: '/images/products/wireless-earphones.jpg' },
  { category_idx: 0, brand_idx: 0, name: '入耳式有线耳机', slug: 'in-ear-wired', description: '高保真音质，线控带麦，三频均衡', price: 129, original_price: 199, stock: 200, image: '/images/products/in-ear-wired.jpg' },
  { category_idx: 0, brand_idx: 0, name: '头戴式监听耳机', slug: 'studio-headphones', description: '专业级监听，封闭式设计，录音棚品质', price: 899, original_price: 1299, stock: 50, image: '/images/products/studio-headphones.jpg' },
  { category_idx: 0, brand_idx: 0, name: '便携蓝牙音箱', slug: 'portable-speaker', description: 'IPX7防水，360度环绕声，20小时续航', price: 299, original_price: 459, stock: 150, image: '/images/products/portable-speaker.jpg' },
  { category_idx: 0, brand_idx: 0, name: '游戏耳机 7.1声道', slug: 'gaming-headset', description: '虚拟7.1声道，RGB灯效，可弯曲麦克风', price: 459, original_price: 699, stock: 80, image: '/images/products/gaming-headset.jpg' },
  { category_idx: 0, brand_idx: 0, name: '骨传导运动耳机', slug: 'bone-conduction', description: '开放式设计，安全舒适，8级防水', price: 599, original_price: 899, stock: 60, image: '/images/products/bone-conduction.jpg' },

  { category_idx: 0, brand_idx: 1, name: '智能手表 Pro', slug: 'smartwatch-pro', description: '全天健康监测，50米防水，GPS定位，NFC支付', price: 1299, original_price: 1599, stock: 80, image: '/images/products/smartwatch-pro.jpg' },
  { category_idx: 0, brand_idx: 1, name: '智能运动手环', slug: 'fitness-band', description: '心率监测，血氧检测，睡眠追踪，14天续航', price: 199, original_price: 299, stock: 300, image: '/images/products/fitness-band.jpg' },
  { category_idx: 0, brand_idx: 1, name: '智能体脂秤', slug: 'body-fat-scale', description: '精准测脂，18项身体数据，APP同步', price: 129, original_price: 199, stock: 200, image: '/images/products/body-fat-scale.jpg' },
  { category_idx: 0, brand_idx: 1, name: '智能戒指', slug: 'smart-ring', description: '钛合金材质，睡眠监测，运动追踪，5天续航', price: 1699, original_price: 2299, stock: 40, image: '/images/products/smart-ring.jpg' },
  { category_idx: 0, brand_idx: 1, name: '心电监测手环', slug: 'ecg-band', description: '医疗级ECG，房颤筛查，血压监测', price: 899, original_price: 1299, stock: 50, image: '/images/products/ecg-band.jpg' },
  { category_idx: 0, brand_idx: 1, name: 'GPS运动手表', slug: 'gps-running-watch', description: '双频GPS，100种运动模式，30天续航', price: 1999, original_price: 2599, stock: 40, image: '/images/products/gps-running-watch.jpg' },

  { category_idx: 0, brand_idx: 2, name: '机械键盘 青轴', slug: 'mechanical-keyboard', description: 'Cherry青轴，RGB背光，全键无冲，人体工学设计', price: 499, original_price: 699, stock: 60, image: '/images/products/mechanical-keyboard.jpg' },
  { category_idx: 0, brand_idx: 2, name: '机械键盘 红轴', slug: 'mechanical-red', description: 'Cherry红轴，线性手感，静音设计，办公游戏两用', price: 499, original_price: 699, stock: 60, image: '/images/products/mechanical-red.jpg' },
  { category_idx: 0, brand_idx: 2, name: '无线机械键盘', slug: 'wireless-mech', description: '蓝牙5.0+2.4G，三模切换，180天续航', price: 699, original_price: 999, stock: 50, image: '/images/products/wireless-mech.jpg' },
  { category_idx: 0, brand_idx: 2, name: '紧凑型机械键盘 68键', slug: 'compact-68', description: '68键配列，节省空间，佳达隆轴体', price: 399, original_price: 599, stock: 80, image: '/images/products/compact-68.jpg' },
  { category_idx: 0, brand_idx: 2, name: '电竞游戏鼠标', slug: 'gaming-mouse', description: '16000DPI，PMW3395传感器，超轻设计', price: 299, original_price: 459, stock: 100, image: '/images/products/gaming-mouse.jpg' },
  { category_idx: 0, brand_idx: 2, name: '客制化键帽套装', slug: 'custom-keycaps', description: 'PBT材质，热升华工艺，原厂高度', price: 199, original_price: 299, stock: 120, image: '/images/products/custom-keycaps.jpg' },

  { category_idx: 0, brand_idx: 3, name: '便携充电宝 20000mAh', slug: 'power-bank', description: '双USB输出，22.5W快充，轻薄便携', price: 129, original_price: 199, stock: 200, image: '/images/products/power-bank.jpg' },
  { category_idx: 0, brand_idx: 3, name: '磁吸无线充电宝', slug: 'magsafe-power', description: 'MagSafe磁吸，15W无线快充，10000mAh', price: 199, original_price: 299, stock: 150, image: '/images/products/magsafe-power.jpg' },
  { category_idx: 0, brand_idx: 3, name: 'GaN氮化镓充电器 65W', slug: 'gan-charger-65w', description: '65W大功率，三口输出，小巧便携', price: 149, original_price: 229, stock: 180, image: '/images/products/gan-charger-65w.jpg' },
  { category_idx: 0, brand_idx: 3, name: '100W快充数据线套装', slug: 'cable-set-100w', description: '100W快充，编织线材，1.5米+2米双条装', price: 79, original_price: 129, stock: 300, image: '/images/products/cable-set-100w.jpg' },
  { category_idx: 0, brand_idx: 3, name: '太阳能充电宝 30000mAh', slug: 'solar-powerbank', description: '太阳能充电，IP65防水，户外必备', price: 299, original_price: 459, stock: 80, image: '/images/products/solar-powerbank.jpg' },
  { category_idx: 0, brand_idx: 3, name: '车载无线充电器', slug: 'car-wireless-charger', description: '15W快充，红外感应，自动夹紧', price: 129, original_price: 199, stock: 120, image: '/images/products/car-wireless-charger.jpg' },

  { category_idx: 1, brand_idx: 4, name: '纯棉简约T恤', slug: 'cotton-tshirt', description: '100%纯棉，透气舒适，多色可选', price: 89, original_price: 159, stock: 500, image: '/images/products/cotton-tshirt.jpg' },
  { category_idx: 1, brand_idx: 4, name: '连帽卫衣 春秋款', slug: 'hoodie-spring', description: '纯棉毛圈，宽松版型，百搭款式', price: 199, original_price: 299, stock: 200, image: '/images/products/hoodie-spring.jpg' },
  { category_idx: 1, brand_idx: 4, name: '直筒牛仔裤', slug: 'straight-jeans', description: '经典直筒，水洗工艺，舒适弹力', price: 259, original_price: 399, stock: 150, image: '/images/products/straight-jeans.jpg' },
  { category_idx: 1, brand_idx: 4, name: '针织圆领毛衣', slug: 'knit-sweater', description: '羊毛混纺，柔软保暖，多色可选', price: 299, original_price: 459, stock: 100, image: '/images/products/knit-sweater.jpg' },
  { category_idx: 1, brand_idx: 4, name: '休闲短裤 夏季', slug: 'casual-shorts', description: '速干面料，松紧腰头，运动休闲两用', price: 129, original_price: 199, stock: 180, image: '/images/products/casual-shorts.jpg' },
  { category_idx: 1, brand_idx: 4, name: '法式优雅连衣裙', slug: 'french-dress', description: '雪纺面料，收腰设计，优雅通勤', price: 399, original_price: 599, stock: 80, image: '/images/products/french-dress.jpg' },

  { category_idx: 1, brand_idx: 5, name: '运动休闲鞋', slug: 'sports-shoes', description: '轻便透气，防滑耐磨，适合日常运动', price: 299, original_price: 459, stock: 120, image: '/images/products/sports-shoes.jpg' },
  { category_idx: 1, brand_idx: 5, name: '复古帆布鞋', slug: 'retro-canvas', description: '经典帆布，橡胶大底，国潮复古风', price: 199, original_price: 299, stock: 200, image: '/images/products/retro-canvas.jpg' },
  { category_idx: 1, brand_idx: 5, name: '专业跑步鞋', slug: 'running-shoes', description: '爆米花中底，回弹缓震，马拉松训练', price: 459, original_price: 699, stock: 80, image: '/images/products/running-shoes.jpg' },
  { category_idx: 1, brand_idx: 5, name: '高帮篮球鞋', slug: 'basketball-shoes', description: '高帮护踝，气垫缓震，实战利器', price: 599, original_price: 899, stock: 60, image: '/images/products/basketball-shoes.jpg' },
  { category_idx: 1, brand_idx: 5, name: '潮流老爹鞋', slug: 'chunky-sneakers', description: '厚底增高，复古设计，街拍达人必备', price: 359, original_price: 559, stock: 100, image: '/images/products/chunky-sneakers.jpg' },
  { category_idx: 1, brand_idx: 5, name: '专业滑板鞋', slug: 'skate-shoes', description: '耐磨橡胶底，翻毛皮材质，滑板运动专用', price: 329, original_price: 499, stock: 70, image: '/images/products/skate-shoes.jpg' },

  { category_idx: 1, brand_idx: 6, name: '真皮商务公文包', slug: 'leather-bag', description: '头层牛皮，大容量，商务休闲两用', price: 599, original_price: 899, stock: 50, image: '/images/products/leather-bag.jpg' },
  { category_idx: 1, brand_idx: 6, name: '短款真皮钱包', slug: 'leather-wallet', description: '头层牛皮，多卡位设计，商务男士首选', price: 199, original_price: 299, stock: 150, image: '/images/products/leather-wallet.jpg' },
  { category_idx: 1, brand_idx: 6, name: '真皮自动扣皮带', slug: 'leather-belt', description: '意大利进口牛皮，合金扣头，商务正装', price: 259, original_price: 399, stock: 120, image: '/images/products/leather-belt.jpg' },
  { category_idx: 1, brand_idx: 6, name: '真皮手拿包', slug: 'leather-clutch', description: '头层牛皮，信封设计，容量充足', price: 359, original_price: 559, stock: 80, image: '/images/products/leather-clutch.jpg' },
  { category_idx: 1, brand_idx: 6, name: '真皮双肩包', slug: 'leather-backpack', description: '复古做旧，大容量，商务旅行两用', price: 899, original_price: 1299, stock: 40, image: '/images/products/leather-backpack.jpg' },
  { category_idx: 1, brand_idx: 6, name: '真皮卡包', slug: 'leather-cardholder', description: '小巧轻薄，多卡位设计，防盗刷', price: 129, original_price: 199, stock: 200, image: '/images/products/leather-cardholder.jpg' },

  { category_idx: 2, brand_idx: 7, name: '补水保湿面膜 10片装', slug: 'face-mask', description: '玻尿酸精华，深层补水，温和不刺激', price: 79, original_price: 129, stock: 300, image: '/images/products/face-mask.jpg' },
  { category_idx: 2, brand_idx: 7, name: '烟酰胺美白精华', slug: 'niacinamide-serum', description: '5%烟酰胺，提亮肤色，淡化痘印', price: 199, original_price: 299, stock: 200, image: '/images/products/niacinamide-serum.jpg' },
  { category_idx: 2, brand_idx: 7, name: '神经酰胺修护面霜', slug: 'ceramide-cream', description: '神经酰胺成分，修护屏障，保湿锁水', price: 259, original_price: 399, stock: 150, image: '/images/products/ceramide-cream.jpg' },
  { category_idx: 2, brand_idx: 7, name: '氨基酸温和洗面奶', slug: 'amino-cleanser', description: '氨基酸配方，温和清洁，不紧绷', price: 89, original_price: 139, stock: 250, image: '/images/products/amino-cleanser.jpg' },
  { category_idx: 2, brand_idx: 7, name: '视黄醇抗老眼霜', slug: 'retinol-eye-cream', description: '视黄醇成分，淡化细纹，紧致眼周', price: 299, original_price: 459, stock: 100, image: '/images/products/retinol-eye-cream.jpg' },
  { category_idx: 2, brand_idx: 7, name: '物理防晒乳 SPF50+', slug: 'physical-sunscreen', description: '物理防晒，温和不刺激，敏感肌可用', price: 159, original_price: 239, stock: 180, image: '/images/products/physical-sunscreen.jpg' },

  { category_idx: 2, brand_idx: 8, name: '滋润唇膏礼盒装', slug: 'lipstick-set', description: '6色可选，持久显色，滋润不拔干', price: 199, original_price: 299, stock: 150, image: '/images/products/lipstick-set.jpg' },
  { category_idx: 2, brand_idx: 8, name: '持妆粉底液', slug: 'liquid-foundation', description: '24小时持妆，遮瑕力强，多色号可选', price: 259, original_price: 389, stock: 120, image: '/images/products/liquid-foundation.jpg' },
  { category_idx: 2, brand_idx: 8, name: '大地色眼影盘', slug: 'eyeshadow-palette', description: '16色大盘，哑光珠光搭配，新手友好', price: 199, original_price: 299, stock: 180, image: '/images/products/eyeshadow-palette.jpg' },
  { category_idx: 2, brand_idx: 8, name: '纤长卷翘睫毛膏', slug: 'mascara', description: '防水防汗，纤长卷翘，不晕染', price: 129, original_price: 189, stock: 200, image: '/images/products/mascara.jpg' },
  { category_idx: 2, brand_idx: 8, name: '元气腮红', slug: 'blush', description: '单色腮红，自然显色，提气色', price: 99, original_price: 149, stock: 220, image: '/images/products/blush.jpg' },
  { category_idx: 2, brand_idx: 8, name: '双头自动眉笔', slug: 'eyebrow-pencil', description: '三角笔芯，自然显色，持久不脱色', price: 69, original_price: 99, stock: 300, image: '/images/products/eyebrow-pencil.jpg' },

  { category_idx: 3, brand_idx: 9, name: '北欧风落地灯', slug: 'floor-lamp', description: '简约设计，三档调光，护眼柔光', price: 259, original_price: 399, stock: 80, image: '/images/products/floor-lamp.jpg' },
  { category_idx: 3, brand_idx: 9, name: '简约桌面台灯', slug: 'desk-lamp', description: 'LED光源，无极调光，USB充电', price: 129, original_price: 199, stock: 150, image: '/images/products/desk-lamp.jpg' },
  { category_idx: 3, brand_idx: 9, name: '北欧香薰蜡烛', slug: 'scented-candle', description: '大豆蜡，天然精油，多种香型', price: 89, original_price: 139, stock: 200, image: '/images/products/scented-candle.jpg' },
  { category_idx: 3, brand_idx: 9, name: '针织抱枕套', slug: 'knit-pillow', description: '纯棉针织，柔软舒适，多色可选', price: 69, original_price: 99, stock: 180, image: '/images/products/knit-pillow.jpg' },
  { category_idx: 3, brand_idx: 9, name: '陶瓷花瓶', slug: 'ceramic-vase', description: '手工陶瓷，哑光釉面，北欧简约', price: 159, original_price: 239, stock: 100, image: '/images/products/ceramic-vase.jpg' },
  { category_idx: 3, brand_idx: 9, name: '藤编收纳篮', slug: 'rattan-basket', description: '天然藤编，手工编织，收纳装饰两用', price: 99, original_price: 149, stock: 120, image: '/images/products/rattan-basket.jpg' },

  { category_idx: 3, brand_idx: 10, name: '记忆棉午睡枕', slug: 'memory-pillow', description: '透气舒适，支撑颈部，办公室必备', price: 69, original_price: 99, stock: 400, image: '/images/products/memory-pillow.jpg' },
  { category_idx: 3, brand_idx: 10, name: '天然乳胶枕头', slug: 'latex-pillow', description: '泰国进口乳胶，波浪造型，透气蜂窝', price: 299, original_price: 459, stock: 150, image: '/images/products/latex-pillow.jpg' },
  { category_idx: 3, brand_idx: 10, name: '真丝睡眠眼罩', slug: 'silk-eye-mask', description: '100%桑蚕丝，遮光透气，柔软亲肤', price: 99, original_price: 149, stock: 200, image: '/images/products/silk-eye-mask.jpg' },
  { category_idx: 3, brand_idx: 10, name: '记忆棉床垫 5cm', slug: 'memory-mattress', description: '慢回弹记忆棉，5cm厚度，舒适支撑', price: 599, original_price: 899, stock: 80, image: '/images/products/memory-mattress.jpg' },
  { category_idx: 3, brand_idx: 10, name: '纯棉睡衣套装', slug: 'cotton-pajamas', description: '精梳纯棉，宽松版型，舒适亲肤', price: 199, original_price: 299, stock: 180, image: '/images/products/cotton-pajamas.jpg' },
  { category_idx: 3, brand_idx: 10, name: '白噪音助眠仪', slug: 'sleep-machine', description: '10种自然音效，定时关机，助眠神器', price: 159, original_price: 239, stock: 100, image: '/images/products/sleep-machine.jpg' },

  { category_idx: 4, brand_idx: 11, name: '有机燕麦片 1kg', slug: 'organic-oatmeal', description: '无添加，即食冲泡，营养早餐', price: 49, original_price: 79, stock: 500, image: '/images/products/organic-oatmeal.jpg' },
  { category_idx: 4, brand_idx: 11, name: '进口坚果礼盒', slug: 'nut-gift-box', description: '混合坚果，每日一包，健康零食', price: 168, original_price: 238, stock: 200, image: '/images/products/nut-gift-box.jpg' },
  { category_idx: 4, brand_idx: 11, name: '70%黑巧克力', slug: 'dark-chocolate-70', description: '比利时进口，70%可可含量，纯可可脂', price: 89, original_price: 129, stock: 300, image: '/images/products/dark-chocolate-70.jpg' },
  { category_idx: 4, brand_idx: 11, name: '混合水果干', slug: 'dried-fruits-mix', description: '5种果干混合，无添加糖，自然甜', price: 59, original_price: 89, stock: 400, image: '/images/products/dried-fruits-mix.jpg' },
  { category_idx: 4, brand_idx: 11, name: '有机洋槐蜂蜜', slug: 'organic-honey', description: '秦岭洋槐蜜，纯天然，无添加', price: 129, original_price: 189, stock: 150, image: '/images/products/organic-honey.jpg' },
  { category_idx: 4, brand_idx: 11, name: '全麦吐司面包', slug: 'whole-wheat-bread', description: '100%全麦，无蔗糖，低脂健康', price: 39, original_price: 59, stock: 600, image: '/images/products/whole-wheat-bread.jpg' },
  { category_idx: 4, brand_idx: 11, name: '杂粮礼盒 6种', slug: 'grains-gift-box', description: '6种杂粮组合，真空包装，送礼佳品', price: 159, original_price: 229, stock: 180, image: '/images/products/grains-gift-box.jpg' },
  { category_idx: 4, brand_idx: 11, name: '冻干草莓脆', slug: 'freeze-dried-strawberry', description: 'FD冻干工艺，保留营养，酥脆可口', price: 49, original_price: 79, stock: 350, image: '/images/products/freeze-dried-strawberry.jpg' }
];

const flashSales = [
  { product_idx: 0, name: '限时特惠-无线蓝牙耳机', sale_price: 199, stock: 20, hours_offset: [0, 2] },
  { product_idx: 24, name: '限时特惠-纯棉T恤', sale_price: 39, stock: 50, hours_offset: [0, 3] },
  { product_idx: 60, name: '限时特惠-记忆棉午睡枕', sale_price: 29, stock: 30, hours_offset: [1, 4] },
  { product_idx: 66, name: '限时特惠-有机燕麦片', sale_price: 19, stock: 40, hours_offset: [2, 5] },
  { product_idx: 6, name: '即将开抢-智能手表Pro', sale_price: 799, stock: 15, hours_offset: [24, 26] },
  { product_idx: 30, name: '即将开抢-运动休闲鞋', sale_price: 149, stock: 25, hours_offset: [25, 27] },
  { product_idx: 12, name: '限时特惠-机械键盘', sale_price: 299, stock: 20, hours_offset: [0, 4] },
  { product_idx: 18, name: '限时特惠-充电宝', sale_price: 79, stock: 30, hours_offset: [1, 5] },
  { product_idx: 36, name: '即将开抢-真皮公文包', sale_price: 399, stock: 10, hours_offset: [48, 50] },
  { product_idx: 42, name: '限时特惠-补水面膜', sale_price: 49, stock: 50, hours_offset: [2, 6] }
];

const pointsProducts = [
  {
    name: '10元优惠券',
    description: '全场通用满100元可用，有效期30天',
    type: 'coupon',
    points_required: 100,
    original_value: 10,
    image: '/images/products/nut-gift-box.jpg',
    stock: 1000,
    sort_order: 1,
    discount_type: 'fixed',
    discount_value: 10,
    expiry_days: 30
  },
  {
    name: '20元优惠券',
    description: '全场通用满200元可用，有效期30天',
    type: 'coupon',
    points_required: 200,
    original_value: 20,
    image: '/images/products/organic-oatmeal.jpg',
    stock: 500,
    sort_order: 2,
    discount_type: 'fixed',
    discount_value: 20,
    expiry_days: 30
  },
  {
    name: '50元优惠券',
    description: '全场通用满500元可用，有效期30天',
    type: 'coupon',
    points_required: 500,
    original_value: 50,
    image: '/images/products/memory-pillow.jpg',
    stock: 200,
    sort_order: 3,
    discount_type: 'fixed',
    discount_value: 50,
    expiry_days: 30
  },
  {
    name: '9折优惠券',
    description: '全场通用无门槛，有效期30天',
    type: 'coupon',
    points_required: 800,
    original_value: 0,
    image: '/images/products/face-mask.jpg',
    stock: 300,
    sort_order: 4,
    discount_type: 'percentage',
    discount_value: 10,
    expiry_days: 30
  },
  {
    name: '会员月度VIP',
    description: '尊享会员专享价，专属客服，优先发货特权30天',
    type: 'virtual',
    points_required: 500,
    original_value: 30,
    image: '/images/products/smartwatch-pro.jpg',
    stock: 999,
    sort_order: 5,
    expiry_days: 30
  },
  {
    name: '免邮券',
    description: '全场免运费一次，有效期30天',
    type: 'virtual',
    points_required: 80,
    original_value: 15,
    image: '/images/products/sports-shoes.jpg',
    stock: 2000,
    sort_order: 6,
    expiry_days: 30
  },
  {
    name: '限量定制马克杯',
    description: '积分专享定制陶瓷马克杯',
    type: 'physical',
    points_required: 1000,
    original_value: 59,
    image: '/images/products/floor-lamp.jpg',
    stock: 100,
    sort_order: 7
  },
  {
    name: '品牌帆布袋',
    description: '环保帆布购物袋，时尚百搭',
    type: 'physical',
    points_required: 600,
    original_value: 39,
    image: '/images/products/cotton-tshirt.jpg',
    stock: 300,
    sort_order: 8
  }
];

async function run() {
  try {
    const catCount = await Category.count();
    const brandCount = await Brand.count();
    const productCount = await Product.count();
    let createdCats;
    let createdBrands;
    let createdProducts;

    if (catCount > 0) {
      logger.info('Categories already exist');

      if (brandCount === 0) {
        logger.info('Seeding brands...');
        createdBrands = await Brand.bulkCreate(brands);
        logger.info('Brands seed completed');
      } else {
        logger.info('Brands exist, updating logos...');
        const existingBrands = await Brand.findAll({ order: [['id', 'ASC']] });
        for (let i = 0; i < existingBrands.length && i < brands.length; i++) {
          if (!existingBrands[i].logo && brands[i].logo) {
            await existingBrands[i].update({ logo: brands[i].logo });
          }
        }
        createdBrands = existingBrands;
        logger.info('Brand logos updated');
      }

      const allProducts = await Product.findAll({ order: [['id', 'ASC']] });
      const allBrands = createdBrands || await Brand.findAll({ order: [['id', 'ASC']] });

      if (productCount < products.length) {
        logger.info(`Products count (${productCount}) less than expected (${products.length}), adding missing products...`);
        const allCategories = await Category.findAll({ order: [['id', 'ASC']] });

        for (let i = productCount; i < products.length; i++) {
          const p = products[i];
          const cat = allCategories[p.category_idx];
          const brand = p.brand_idx !== undefined && allBrands[p.brand_idx] ? allBrands[p.brand_idx] : null;
          await Product.create({
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
        }
        logger.info(`Added ${products.length - productCount} new products`);
      }

      logger.info('Updating product brand associations...');
      const updatedProducts = await Product.findAll({ order: [['id', 'ASC']] });
      for (let i = 0; i < updatedProducts.length && i < products.length; i++) {
        const p = products[i];
        if (p.brand_idx !== undefined && allBrands[p.brand_idx]) {
          const brandId = allBrands[p.brand_idx].id;
          if (updatedProducts[i].brand_id !== brandId) {
            await updatedProducts[i].update({ brand_id: brandId });
          }
        }
      }
      logger.info('Product brand associations updated');

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

    const ppCount = await PointsProduct.count();
    if (ppCount === 0) {
      await PointsProduct.bulkCreate(pointsProducts);
      logger.info('Points products seed completed');
    }

    logger.info('Seed completed');
  } catch (err) {
    logger.error('Seed failed:', err);
    throw err;
  }
}

module.exports = { run };

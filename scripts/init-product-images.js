/**
 * 根据 backend/src/seed.js 中的商品，下载与商品匹配的示例图到 frontend/public/images/products/
 * 使用 Unsplash 免费图库中与商品对应的图片（耳机、手表、键盘等），确保图文一致
 */
const fs = require('fs');
const path = require('path');

const SIZE = 600;
const OUT_DIR = path.join(__dirname, '..', 'frontend', 'public', 'images', 'products');

// 商品文件名 -> 与商品匹配的 Unsplash 图片 URL（均为 images.unsplash.com 免费图）
const PRODUCT_IMAGE_URLS = {
  'wireless-earphones.jpg':
    'https://images.unsplash.com/photo-1672925216556-c995d23aab2e?w=' + SIZE + '&q=80&fm=jpg', // 耳机
  'smartwatch-pro.jpg':
    'https://images.unsplash.com/photo-1553545204-4f7d339aa06a?w=' + SIZE + '&q=80&fm=jpg', // 智能手表
  'mechanical-keyboard.jpg':
    'https://images.unsplash.com/photo-1626958390898-162d3577f293?w=' + SIZE + '&q=80&fm=jpg', // 机械键盘
  'power-bank.jpg':
    'https://images.unsplash.com/photo-1566554738544-d962991c3fee?w=' + SIZE + '&q=80&fm=jpg', // 充电宝
  'cotton-tshirt.jpg':
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=' + SIZE + '&q=80&fm=jpg', // T恤
  'sports-shoes.jpg':
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=' + SIZE + '&q=80&fm=jpg', // 运动鞋
  'leather-bag.jpg':
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=' + SIZE + '&q=80&fm=jpg', // 皮包
  'face-mask.jpg':
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=' + SIZE + '&q=80&fm=jpg', // 面膜/护肤
  'lipstick-set.jpg':
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=' + SIZE + '&q=80&fm=jpg', // 唇膏
  'floor-lamp.jpg':
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=' + SIZE + '&q=80&fm=jpg', // 落地灯
  'memory-pillow.jpg':
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=' + SIZE + '&q=80&fm=jpg', // 枕头
  'organic-oatmeal.jpg':
    'https://picsum.photos/seed/oatmeal/' + SIZE + '/' + SIZE, // 燕麦（Unsplash 原图失效，用 Picsum 固定 seed）
  'nut-gift-box.jpg':
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=' + SIZE + '&q=80&fm=jpg'  // 坚果礼盒
};

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('目标目录:', OUT_DIR);
  console.log('使用与商品匹配的 Unsplash 图片\n');

  for (const [filename, url] of Object.entries(PRODUCT_IMAGE_URLS)) {
    const filepath = path.join(OUT_DIR, filename);
    try {
      const buf = await download(url);
      fs.writeFileSync(filepath, buf);
      console.log('OK', filename);
    } catch (e) {
      console.error('FAIL', filename, e.message);
    }
  }

  console.log('\n完成.');
}

main();

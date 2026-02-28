// src/lib/products.js

const IMG = {
  iphone17:
    "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FiPhone-17-Pro-Max-cosmic-orange-8534.jpg&w=3840&q=100",
  s25ultra:
    "https://smartteleworld.com.bd/wp-content/uploads/2025/03/samsung-galaxy-s25-ultra-titanium-silver632.jpeg",
  ipad:
    "https://maccity.com.bd/wp-content/uploads/2024/06/iPad-Air-13-inch-M2-Purple-MacCity-BD--1200x900.webp",
  xiaomiNote17ProMax:
    "https://i02.appmifile.com/304_operatorx_operatorx_uploadTiptapImage/25/09/2025/21ef35eac7a6b396c906c833ee109cbf.jpg",
  xiaomiNote17:
    "https://i02.appmifile.com/981_operatorx_operatorx_uploadTiptapImage/25/09/2025/1741045a8605c0bbd06012b45131cbab.jpg",
  iqoo15:
    "https://exstatic-in.iqoo.com/Oz84QB3Wo0uns8j1/in/1763378896554/a2988f0a64104e78de106346f6f456f6.png_w860-h860.webp",
  vivoX200t:
    "https://adminapi.applegadgetsbd.com/storage/media/large/vivo-X200-5G-White-8969.jpg",

  smartWatch1:
    "https://static-01.daraz.com.bd/p/5b4a59cfd23f021ad43270df4af5fdab.jpg",
  ticwatchE3:
    "https://motionview.com.bd/_next/image?url=https%3A%2F%2Fmotionview.s3.amazonaws.com%2Fimages%2Fproducts%2Fprofile%2F165051690172.ticwatch%20e3%20smart%20watch.webp&w=3840&q=75",
  kidsSmartWatch:
    "https://m.media-amazon.com/images/I/71T34y1QmiL._AC_SL1000__.jpg",
  oraimoWatch5:
    "https://media.gadgetandgear.com/upload/media/oraimo-watch-5-osw-805-pink.jpeg",

  aweiAt7: "https://gearybd.com/wp-content/uploads/2024/09/images.jpeg",
  moxomWl75:
    "https://my-live-01.slatic.net/p/ba83453d779bca98a7a1aa0ec4c5eb3c.jpg",
  airpodsPro:
    "https://img.drz.lazcdn.com/static/bd/p/e5b23c70b92d51ac06d54b59f4ebddf5.jpg_720x720q80.jpg",
};

export const productsSeed = [
  {
    id: "p1",
    title: "iPad Air 13-inch (M2) - Purple",
    category: "Tablets",
    brand: "Apple",
    priceBDT: 149990,
    oldPriceBDT: 159990,
    image: IMG.ipad,
    badges: { new: true },
  },
  {
    id: "p2",
    title: "iPhone 17 Pro Max (Cosmic Orange)",
    category: "Phones",
    brand: "Apple",
    priceBDT: 289990,
    oldPriceBDT: 309990,
    image: IMG.iphone17,
    badges: { new: true, trending: true },
  },
  {
    id: "p3",
    title: "Samsung Galaxy S25 Ultra (Titanium Silver)",
    category: "Phones",
    brand: "Samsung",
    priceBDT: 239990,
    oldPriceBDT: 259990,
    image: IMG.s25ultra,
    badges: { new: true, trending: true },
  },
  {
    id: "p4",
    title: "Xiaomi Note 17 Pro Max",
    category: "Phones",
    brand: "Xiaomi",
    priceBDT: 57990,
    oldPriceBDT: 62990,
    image: IMG.xiaomiNote17ProMax,
    badges: { new: true, trending: true },
  },
  {
    id: "p5",
    title: "Xiaomi Note 17",
    category: "Phones",
    brand: "Xiaomi",
    priceBDT: 37990,
    oldPriceBDT: 41990,
    image: IMG.xiaomiNote17,
    badges: { new: true, trending: true },
  },
  {
    id: "p6",
    title: "iQOO 15",
    category: "Phones",
    brand: "iQOO",
    priceBDT: 69990,
    oldPriceBDT: 75990,
    image: IMG.iqoo15,
    badges: { new: true, trending: true },
  },
  {
    id: "p7",
    title: "vivo X200t (White)",
    category: "Phones",
    brand: "vivo",
    priceBDT: 64990,
    oldPriceBDT: 69990,
    image: IMG.vivoX200t,
    badges: { new: true, trending: true },
  },
  {
    id: "p8",
    title: "TicWatch E3 Android Wear OS Smart Watch",
    category: "Smart Watches",
    brand: "Mobvoi",
    priceBDT: 18990,
    oldPriceBDT: 21990,
    image: IMG.ticwatchE3,
    badges: { new: true },
  },
  {
    id: "p9",
    title: "Oraimo Watch 5 Calling Smart Watch",
    category: "Smart Watches",
    brand: "Oraimo",
    priceBDT: 6990,
    oldPriceBDT: 7990,
    image: IMG.oraimoWatch5,
    badges: { new: true },
  },
  {
    id: "p10",
    title: "Kids Smart Watch (Girls/Boys)",
    category: "Smart Watches",
    brand: "Kids",
    priceBDT: 3990,
    oldPriceBDT: 4990,
    image: IMG.kidsSmartWatch,
    badges: { new: true },
  },
  {
    id: "p11",
    title: "Smart Watch (Bluetooth Calling)",
    category: "Smart Watches",
    brand: "Generic",
    priceBDT: 2990,
    oldPriceBDT: 3990,
    image: IMG.smartWatch1,
    badges: { new: true },
  },
  {
    id: "p12",
    title: "AirPods Pro",
    category: "Audio",
    brand: "Apple",
    priceBDT: 27990,
    oldPriceBDT: 31990,
    image: IMG.airpodsPro,
    badges: { new: true, trending: true },
  },
  {
    id: "p13",
    title: "Awei AT7 Bluetooth Headphones",
    category: "Audio",
    brand: "Awei",
    priceBDT: 1790,
    oldPriceBDT: 2490,
    image: IMG.aweiAt7,
    badges: { new: false },
  },
  {
    id: "p14",
    title: "MOXOM MX-WL75 Air Light Bluetooth V5.3 (45H)",
    category: "Audio",
    brand: "MOXOM",
    priceBDT: 2590,
    oldPriceBDT: 3490,
    image: IMG.moxomWl75,
    badges: { new: true },
  },
];

export function getAllProducts() {
  const cats = ["Phones", "Tablets", "Smart Watches", "Audio"];
  const brands = [
    "Apple",
    "Samsung",
    "Xiaomi",
    "iQOO",
    "vivo",
    "Mobvoi",
    "Oraimo",
    "Awei",
    "MOXOM",
    "Generic",
  ];

  const base = productsSeed.map((p, i) => ({
    ...p,
    brand: p.brand || brands[i % brands.length],
    inStock: p.inStock ?? true,
    oldPriceBDT:
      p.oldPriceBDT ?? (i % 2 === 0 ? (p.priceBDT || 0) + 1200 : undefined),
    badges: p.badges ?? { new: false },
  }));

  const target = Math.max(34, base.length);
  const out = [...base];
  let nextIdNum = base.length + 1;

  while (out.length < target) {
    const src = base[out.length % base.length];
    const bump = (out.length % 3) * 500;

    const newPrice = (src.priceBDT || 0) + bump;
    const oldPrice = newPrice + (nextIdNum % 2 === 0 ? 1200 : 800);

    out.push({
      ...src,
      id: `p${nextIdNum}`,
      title: `${src.title} (Edition ${nextIdNum})`,
      priceBDT: newPrice,
      oldPriceBDT: oldPrice,
      brand: brands[nextIdNum % brands.length],
      category: cats[nextIdNum % cats.length],
      inStock: nextIdNum % 7 !== 0,
      badges: { ...src.badges, new: nextIdNum % 5 === 0 },
    });

    nextIdNum += 1;
  }

  return out;
}
/**
 * Real dish photographs for the Products-page inventory showcase (ProductInventoryShowcase.tsx),
 * keyed by product ID.
 *
 * This is deliberately separate from src/data/dishes.ts, which drives the homepage's rotating
 * dish platter (RotatingDishSection.tsx / DishPlatter.tsx) and is hard-wired to exactly
 * DISH_SLICE_COUNT (6) entries for that platter's fixed-angle wedges. Adding more entries there
 * would silently break that unrelated homepage feature. The photos below reuse the exact same
 * image files already used in src/data/dishes.ts where the product overlaps (biryani, shahi
 * paneer, paneer, chole, sambar, chaat) plus the three newly supplied photos for Garam Masala,
 * Kitchen King and Pao Bhaji Masala -- every path points at a real file already in
 * public/images/dishes/, nothing invented.
 */

export type ProductDishPhoto = {
  src: string;
  alt: string;
  focus?: string;
  zoom?: number;
};

export const productDishPhotos: Partial<Record<string, ProductDishPhoto>> = {
  "biryani-masala": {
    src: "/images/dishes/Biryani.png",
    alt: "Chicken biryani with saffron rice",
    focus: "50% 50%",
  },
  "shahi-paneer-masala": {
    src: "/images/dishes/Shahi Paneer (2).png",
    alt: "Shahi paneer in a creamy tomato gravy",
    focus: "50% 50%",
    zoom: 1.2,
  },
  "paneer-masala": {
    src: "/images/dishes/Paneer.png",
    alt: "Paneer masala with rice in a black pan",
    focus: "50% 58%",
    zoom: 1.3,
  },
  "chole-masala": {
    src: "/images/dishes/Chole.png",
    alt: "Chole, chickpea curry garnished with coriander",
    focus: "50% 50%",
  },
  "sambar-masala": {
    src: "/images/dishes/Sambhar.png",
    alt: "Sambar with drumstick and vegetables",
    focus: "50% 50%",
  },
  "chaat-masala": {
    src: "/images/dishes/Fruit Chart.png",
    alt: "Fruit chaat with banana, mango and pomegranate",
    focus: "50% 50%",
    zoom: 1.12,
  },
  "garam-masala-powder": {
    src: "/images/dishes/Garam Masala.png",
    alt: "A spiced curry with basmati rice, onions and green chillies",
    focus: "50% 45%",
  },
  "kitchen-king": {
    src: "/images/dishes/Kitchen King.png",
    alt: "Boiled eggs in a rich Kitchen King masala gravy",
    focus: "50% 50%",
  },
  "pao-bhaji-masala": {
    src: "/images/dishes/Pau bhaji.png",
    alt: "Pav bhaji: buttered bread rolls with a mashed vegetable curry",
    focus: "50% 55%",
  },

  // ----------------------------------------------- Ground spices / Individual spices & seasonings
  // Raw-spice photos from public/images/dishes/spices/, shown on the right once a card is pinned
  // open (same mechanism as the dish photos above). Red Chilli Powder has no matching file in that
  // folder, so it keeps showing no right-side photo.
  "turmeric-powder": {
    src: "/images/dishes/spices/Turmeric.png",
    alt: "Turmeric powder",
    focus: "50% 50%",
  },
  "coriander-powder": {
    src: "/images/dishes/spices/Coriander.png",
    alt: "Coriander powder",
    focus: "50% 50%",
  },
  "pili-mirch-powder": {
    src: "/images/dishes/spices/Pilli mirch.png",
    alt: "Pili mirch (yellow chilli) powder",
    focus: "50% 50%",
  },
  "sonth-powder": {
    src: "/images/dishes/spices/Sonth.png",
    alt: "Sonth (dry ginger) powder",
    focus: "50% 50%",
  },
  "kashmiri-mirch": {
    src: "/images/dishes/spices/Kashmiri mirch.png",
    alt: "Kashmiri mirch (chilli) powder",
    focus: "50% 50%",
  },
  "hing-powder": {
    src: "/images/dishes/spices/Hing.png",
    alt: "Hing (asafoetida) powder",
    focus: "50% 50%",
  },
  jeera: {
    src: "/images/dishes/spices/Jeer.png",
    alt: "Jeera (cumin seeds)",
    focus: "50% 50%",
  },
  "kasuri-methi": {
    src: "/images/dishes/spices/kasuri methi.png",
    alt: "Kasuri methi (dried fenugreek leaves)",
    focus: "50% 50%",
  },
  "pink-salt": {
    src: "/images/dishes/spices/pink salt.png",
    alt: "Pink salt",
    focus: "50% 50%",
  },
};

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
};

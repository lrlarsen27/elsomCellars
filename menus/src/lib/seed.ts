import type { MenuStore } from "./schema";

/**
 * Starting content, used the first time the app runs.
 *
 * PLACEHOLDER COPY — generic tasting-room items, not Elsom Cellars' actual
 * offerings. It exists so the templates have something to render. The first
 * time someone edits and saves a menu, this is replaced entirely.
 */
export const SEED_MENUS: MenuStore = {
  food: {
    title: "Kitchen",
    subtitle: "Served in the tasting room",
    footer: "Please tell us about any allergies.",
    sections: [
      {
        id: "section-boards",
        title: "Boards",
        items: [
          {
            id: "item-cheese",
            name: "Cheese Board",
            description: "Three cheeses, honeycomb, marcona almonds",
            price: "24",
          },
          {
            id: "item-charcuterie",
            name: "Charcuterie Board",
            description: "Cured meats, cornichons, grain mustard",
            price: "26",
          },
          {
            id: "item-both",
            name: "The Full Board",
            description: "Cheese and charcuterie, for the table",
            price: "42",
          },
        ],
      },
      {
        id: "section-small-plates",
        title: "Small Plates",
        items: [
          {
            id: "item-olives",
            name: "Marinated Olives",
            description: "Citrus, chili, rosemary",
            price: "9",
          },
          {
            id: "item-bread",
            name: "Warm Bread & Butter",
            description: "Cultured butter, flaky salt",
            price: "8",
          },
          {
            id: "item-salad",
            name: "Seasonal Salad",
            description: "Ask about today's",
            price: "14",
          },
        ],
      },
      {
        id: "section-sweet",
        title: "Something Sweet",
        items: [
          {
            id: "item-chocolate",
            name: "Dark Chocolate Truffles",
            description: "Three per order",
            price: "10",
          },
        ],
      },
    ],
  },
  wine: {
    title: "Wine",
    subtitle: "By the glass, flight, and bottle",
    footer: "Bottles are available to take home. Ask your host.",
    sections: [
      {
        id: "section-flights",
        title: "Tasting Flights",
        items: [
          {
            id: "item-flight-white",
            name: "White Flight",
            description: "Three pours",
            price: "20",
          },
          {
            id: "item-flight-red",
            name: "Red Flight",
            description: "Three pours",
            price: "24",
          },
          {
            id: "item-flight-full",
            name: "Full Tasting",
            description: "Five pours, whites through reds",
            price: "35",
          },
        ],
      },
      {
        id: "section-white",
        title: "White",
        items: [
          {
            id: "item-chardonnay",
            name: "Chardonnay",
            description: "Glass / bottle",
            price: "14 / 48",
          },
          {
            id: "item-pinot-gris",
            name: "Pinot Gris",
            description: "Glass / bottle",
            price: "13 / 44",
          },
          {
            id: "item-riesling",
            name: "Riesling",
            description: "Glass / bottle",
            price: "13 / 44",
          },
        ],
      },
      {
        id: "section-red",
        title: "Red",
        items: [
          {
            id: "item-pinot-noir",
            name: "Pinot Noir",
            description: "Glass / bottle",
            price: "18 / 62",
          },
          {
            id: "item-syrah",
            name: "Syrah",
            description: "Glass / bottle",
            price: "16 / 56",
          },
          {
            id: "item-reserve",
            name: "Reserve Red",
            description: "Bottle only",
            price: "85",
          },
        ],
      },
      {
        id: "section-other",
        title: "Also Pouring",
        items: [
          {
            id: "item-rose",
            name: "Rosé",
            description: "Glass / bottle",
            price: "13 / 44",
          },
          {
            id: "item-na",
            name: "Sparkling Water & Soft Drinks",
            description: "Ask your host",
            price: "4",
          },
        ],
      },
    ],
  },
};

import type { MenuStore } from "./schema";

/**
 * Starting content, used the first time the app runs. Placeholder copy — it
 * gets replaced by whatever the real menus say once someone edits and saves.
 */
export const SEED_MENUS: MenuStore = {
  food: {
    title: "Dinner",
    subtitle: "Served nightly from five o'clock",
    footer: "Please tell your server about any allergies.",
    sections: [
      {
        id: "section-starters",
        title: "To Begin",
        items: [
          {
            id: "item-bread",
            name: "Sourdough & Cultured Butter",
            description: "Baked each morning, sea salt",
            price: "9",
          },
          {
            id: "item-oysters",
            name: "Oysters on Ice",
            description: "Mignonette, lemon",
            price: "24",
          },
          {
            id: "item-salad",
            name: "Little Gem Salad",
            description: "Anchovy, parmesan, black pepper",
            price: "16",
          },
        ],
      },
      {
        id: "section-mains",
        title: "Mains",
        items: [
          {
            id: "item-fish",
            name: "Whole Roasted Fish",
            description: "Fennel, olive, preserved lemon",
            price: "42",
          },
          {
            id: "item-steak",
            name: "Dry-Aged Ribeye",
            description: "Bone marrow butter, watercress",
            price: "58",
          },
          {
            id: "item-pasta",
            name: "Hand-Cut Tagliatelle",
            description: "Brown butter, sage, hazelnut",
            price: "29",
          },
        ],
      },
      {
        id: "section-desserts",
        title: "Dessert",
        items: [
          {
            id: "item-tart",
            name: "Lemon Tart",
            description: "Torched meringue",
            price: "13",
          },
          {
            id: "item-icecream",
            name: "Olive Oil Ice Cream",
            description: "Maldon salt, honey",
            price: "11",
          },
        ],
      },
    ],
  },
  drinks: {
    title: "Drinks",
    subtitle: "Bar closes at midnight",
    footer: "A 20% gratuity is added to parties of six or more.",
    sections: [
      {
        id: "section-cocktails",
        title: "Cocktails",
        items: [
          {
            id: "item-negroni",
            name: "House Negroni",
            description: "Gin, campari, sweet vermouth",
            price: "17",
          },
          {
            id: "item-daiquiri",
            name: "Daiquiri",
            description: "Rum, lime, cane sugar",
            price: "16",
          },
          {
            id: "item-martini",
            name: "Martini",
            description: "Gin or vodka, olive or twist",
            price: "18",
          },
        ],
      },
      {
        id: "section-wine",
        title: "Wine by the Glass",
        items: [
          {
            id: "item-white",
            name: "Chenin Blanc",
            description: "Loire Valley, France",
            price: "15",
          },
          {
            id: "item-red",
            name: "Gamay",
            description: "Beaujolais, France",
            price: "16",
          },
          {
            id: "item-sparkling",
            name: "Grower Champagne",
            description: "Côte des Bar, France",
            price: "22",
          },
        ],
      },
      {
        id: "section-zero",
        title: "Non-Alcoholic",
        items: [
          {
            id: "item-shrub",
            name: "Seasonal Shrub",
            description: "Ask your server",
            price: "9",
          },
          {
            id: "item-coffee",
            name: "Coffee",
            description: "Filter or espresso",
            price: "5",
          },
        ],
      },
    ],
  },
};

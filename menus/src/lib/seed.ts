import type { MenuStore } from "./schema";

/**
 * Starting content, transcribed verbatim from the Figma artboards
 * (ciJhmsPGUj0Gge5PKpBzhe, page "POR", nodes 22:977 and 22:1065).
 *
 * Used only the first time the app runs; the first save replaces it entirely.
 *
 * Transcribed as-is, including several things that look like mistakes in the
 * design. They are left alone on purpose — fixing menu copy is what this app is
 * for, and silently "correcting" the source would hide them:
 *
 *   - "Maple rosemary mixed NUTES" — likely meant to be NUTS.
 *   - Peach Cobbler repeats the Lemon Torta Caprese description word for word.
 *   - Fresh Fruit Pavlova is described as a warm brownie.
 *   - The note from Chef Dom is still lorem ipsum.
 *   - Cheese Plate appears on both sides at different prices ($8 and $22) with
 *     the same description.
 *
 * Block order matters: it's the only thing controlling which column each
 * section lands in. See `src/menus/templates/layout.ts`.
 */
export const SEED_MENUS: MenuStore = {
  food: {
    season: "Summer 2026",
    disclaimer:
      "*Consuming raw or undercooked meats, poultry, seafood, shellfish, or eggs may increase your risk of foodborne illness",
    serviceCharge:
      "An 18% service charge is added to all dine-in checks and retained by Elsom Cellars to support our service staff team.",
    blocks: [
      {
        kind: "section",
        id: "section-appetizers",
        title: "Appetizers",
        items: [
          {
            id: "item-popcorn",
            name: "Elsom white cheddar popcorn",
            tags: ["gf"],
            price: "$8",
            description:
              "Organic kettle-popped in coconut oil and tossed with a blend of white cheeses",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-dates",
            name: "Smoked blue cheese dates",
            tags: ["gf"],
            price: "$6",
            description:
              "Rogue blue cheese stuffed inside a pitted medjool date with candied walnuts & pomegranate molasses",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-nuts",
            name: "Maple rosemary mixed nutes",
            tags: ["gf", "v"],
            price: "$9",
            description: "Pecans, almonds, and pepitas",
            addOn: "",
            pairing: "",
          },
        ],
      },
      {
        kind: "section",
        id: "section-shareables",
        title: "Shareables",
        items: [
          {
            id: "item-seacuterie",
            name: "Sea'cuterie trio*",
            tags: [],
            price: "$35",
            description:
              "A rotating tinned fish board with roasted potatoes, tarragon mustard, and pepper jelly — Matiz mussels, Lummi Island salmon, and Fish Nook sardines in conserva",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-salmon-bites",
            name: "Crispy smoked salmon bites",
            tags: ["gf", "v+"],
            price: "$8",
            description:
              "Homemade crispy rice cakes topped with cold smoked salmon, avocado, fresh jalapeño, breakfast radish, pickled onion, and cilantro aioli",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-cheese-plate-front",
            name: "Cheese plate",
            tags: ["gf+"],
            price: "$8",
            description:
              "A selection of four seasonal cheeses meant to be paired with a suggested pour. Served with a cottage baguette, seasonal fruit, and condiments",
            addOn: "",
            pairing: "",
          },
        ],
      },
      {
        kind: "section",
        id: "section-salads",
        title: "Salads",
        items: [
          {
            id: "item-strawberry-goat",
            name: "Strawberry & goat cheese",
            tags: [],
            price: "$16",
            description:
              "Fresh arugula tossed in a light lemon vinaigrette layered with fresh strawberries, breakfast radish, and Lost Peacock chevre topped with rosemary croutons and balsamic glaze",
            addOn: "- add grilled chicken +$6",
            pairing: "",
          },
          {
            id: "item-peach-avocado",
            name: "Peach & avocado",
            tags: [],
            price: "$15",
            description:
              "Bitter greens tossed with a champagne vinaigrette topped with fresh peaches, sliced avocado, red onion, toasted almonds, and feta cheese",
            addOn: "- add grilled chicken +$6",
            pairing: "",
          },
        ],
      },
      {
        kind: "section",
        id: "section-sandwiches",
        title: "Sandwiches",
        items: [
          {
            id: "item-grilled-cheese",
            name: "Country grilled cheese",
            tags: ["gf+"],
            price: "$16",
            description:
              "Provolone, gouda, and Havarti with a spread of tomato butter. Served with a light arugula salad",
            addOn: "- sub onion jam",
            pairing: "Pairs with 2021 Syrah",
          },
          {
            id: "item-steak-sandwich",
            name: "Grilled steak sandwich*",
            tags: [],
            price: "$22",
            description:
              "Garlic aioli, arugula, caramelized onion jam, and roasted red peppers on Cottage Ciabatta bread.",
            addOn: "",
            pairing: "Pairs with 2021 Syrah",
          },
          {
            id: "item-falafel-burger",
            name: "Falafel burger",
            tags: ["v"],
            price: "$17",
            description:
              "A homemade falafel patty seared and topped with garlic tahini sauce, cucumber pickles, lettuce, sliced tomato, and raw onion on a Cottage Ciabatta.",
            addOn: "",
            pairing: "Pairs with 2024 Albarino or 2022 Cinsault",
          },
          {
            id: "item-banh-mi",
            name: "Chicken banh mi panini",
            tags: ["v+"],
            price: "$18",
            description:
              "Grilled chicken, daikon pickle, cucumber, cilantro aioli, cilantro, sliced jalapeño on a soft-pressed baguette",
            addOn: "- sub grilled tofu",
            pairing: "Pairs with 2022 Tempranillo",
          },
          {
            id: "item-cubano",
            name: "Cubano panini",
            tags: ["v+"],
            price: "$21",
            description:
              "Flyin' Taco's smoked pork shoulder served on Cuban bread pressed with smoky provolone, crispy prosciutto, house mojo verde, pickles, and dijonaise",
            addOn: "- sub jackfruit +$5",
            pairing: "Pairs with 2021 Syrah",
          },
        ],
      },
      {
        kind: "section",
        id: "section-plates",
        title: "Plates",
        items: [
          {
            id: "item-carbonara",
            name: "Mafaldine carbonara",
            tags: [],
            price: "$18",
            description:
              "A traditional carbonara sauce made with guanciale, pecorino, and egg yolks. Tossed with fresh mafaldine pasta",
            addOn: "- add 3 meatballs +$8",
            pairing: "Pairs with 2024 Albarino or 2022 Cinsault",
          },
          {
            id: "item-mac-cheese",
            name: "Fresh fusilli mac & cheese",
            tags: [],
            price: "$18",
            description:
              "Lagana fresh fusilli pasta, Gruyère, Grana, Fontina, Elsom Alberino, and golden garlic breadcrumbs",
            addOn: "",
            pairing: "Pairs with 2024 Albarino",
          },
          {
            id: "item-veggie-kebab",
            name: "Moroccan veggie kebab",
            tags: [],
            price: "$19",
            description:
              "Roasted harissa-dusted medley of summer squash, halloumi, peppers, onions, and cherry tomatoes. Served over a bed of labneh, spicy chermoula, and drizzled with pomegranate molasses",
            addOn: "- add sliced baguette +$2",
            pairing: "Pairs with 2024 Albarino",
          },
          {
            id: "item-meatballs",
            name: "Antonette's italian meatballs",
            tags: [],
            price: "$19",
            description:
              "Chef Dom's grandma's Italian meatball recipe using Carnation grass-fed ground beef combined with fresh herbs, garlic, and parmesan cheese. Served over hot homemade marinara sauce with a hunk of cottage bakery bread",
            addOn: "- add fresh pasta +$7",
            pairing: "Pairs with 2024 Albarino",
          },
          {
            id: "item-lamb-kofta",
            name: "Lamb kofta",
            tags: [],
            price: "$20",
            description:
              "Carnation grass-fed lamb tossed with warm spices over a swirl of labneh with sliced Persian cucumber salad, fresh mint, pistachio dukkah",
            addOn: "- add sliced baguette +$2",
            pairing: "Pairs with 2022 Syrah",
          },
        ],
      },
      {
        kind: "note",
        id: "note-chef",
        heading: "Note from Chef Dom",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
      },
      {
        kind: "section",
        id: "section-heirloom-beverages",
        title: "Heirloom beverages",
        items: [
          {
            id: "item-basil-hibiscus",
            name: "Basil hibiscus sparkler",
            tags: [],
            price: "$8",
            description:
              "Basil simple syrup mixed with hibiscus tea & fresh grapefruit juice | sparkling mineral water | fresh basil",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-raspberry-rose",
            name: "Raspberry rose seltzer",
            tags: [],
            price: "$9",
            description:
              "Raspberry puree mixed with rose water | Jalapeno simple syrup | cucumber wedge",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-violet-palmer",
            name: "Violet palmer lemonade",
            tags: [],
            price: "$10",
            description: "House lemon syrup | butterfly pea tea | lemon wheel",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-melon-shrub",
            name: "Summer melon shrub",
            tags: [],
            price: "$8",
            description:
              "Drinking vinegar fermented for 5 days and meant to sip | Thyme sprig",
            addOn: "",
            pairing: "",
          },
        ],
      },
      {
        kind: "section",
        id: "section-coffee-tea",
        title: "Coffee & Tea",
        items: [
          {
            id: "item-french-press",
            name: "French press coffee",
            tags: [],
            price: "$7",
            description: "Prizm medium Ethiopian roast coffee freshly ground. Decaf available",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-cold-brew",
            name: "Cold brew",
            tags: [],
            price: "$8",
            description:
              "Prizm light Ethiopian roast coffee, freshly ground and steeped overnight",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-hot-tea",
            name: "Artisanal hot tea",
            tags: [],
            price: "$7",
            description: "",
            addOn: "",
            pairing: "",
          },
          {
            // No price on the artboard — an informational block, not an order line.
            id: "item-milk-options",
            name: "Milk options",
            tags: [],
            price: "",
            description:
              "2%, Half & Half, Almond, or Oat\nVanilla simple syrup\nAdd collagen (vanilla or plain) +$2",
            addOn: "",
            pairing: "",
          },
        ],
      },
      {
        kind: "section",
        id: "section-desserts",
        title: "Desserts",
        items: [
          {
            id: "item-lemon-torta",
            name: "Lemon torta caprese",
            tags: ["gf", "df"],
            price: "$8",
            description:
              "Melt-in-your-mouth homemade almond cake infused with lemon zest and lemon simple syrup.",
            addOn: "- add a scoop of ice cream +$3",
            pairing: "",
          },
          {
            id: "item-peach-cobbler",
            name: "Peach cobbler",
            tags: ["gf", "df"],
            price: "$9",
            description:
              "Melt-in-your-mouth homemade almond cake infused with lemon zest and lemon simple syrup.",
            addOn: "- add a scoop of ice cream +$3",
            pairing: "",
          },
          {
            id: "item-pavlova",
            name: "Fresh fruit pavlova",
            tags: ["gf", "df"],
            price: "$9",
            description: "Warm Askatu brownie made with crispy edges and a fudgy center.",
            addOn: "- add a scoop of ice cream & house made chocolate sauce +$5",
            pairing: "",
          },
          {
            id: "item-sundae",
            name: "Ice cream sundae",
            tags: ["gf", "df"],
            price: "$11",
            description:
              "Three scoops of Frankie & Jo's brown sugar vanilla ice cream topped with our house red wine chocolate sauce and spiced nuts",
            addOn: "",
            pairing: "",
          },
          {
            id: "item-cheese-plate-back",
            name: "Cheese plate",
            tags: ["gf+"],
            price: "$22",
            description:
              "A selection of four seasonal cheeses meant to be paired with a suggested pour. Served with a cottage baguette, seasonal fruit, and condiments",
            addOn: "",
            pairing: "",
          },
        ],
      },
    ],
  },
};

import { Plant } from "@/lib/types";

export const PLANTS: Plant[] = [
  {
    id: "tomato",
    name: "Tomato",
    latinName: "Solanum lycopersicum",
    categories: ["vegetable", "annual"],
    zoneMin: 3,
    zoneMax: 10,
    sunNeeds: ["full_sun"],
    matureSpreadIn: 24,
    companionIds: ["basil", "marigold", "chive"],
    antagonisticIds: ["fennel"],
    sowMonths: [2, 3, 4],
    transplantMonths: [4, 5, 6],
    harvestMonths: [7, 8, 9, 10],
    notes: "Heavy feeder suited for nutrient-dense compost systems.",
    care: {
      watering: "Deep water 2-3 times per week.",
      feeding: "Compost tea every 2 weeks after flowering.",
      pruning: "Prune suckers for airflow and stronger fruit set."
    }
  },
  {
    id: "basil",
    name: "Genovese Basil",
    latinName: "Ocimum basilicum",
    categories: ["herb", "annual", "pollinator_support"],
    zoneMin: 4,
    zoneMax: 10,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 12,
    companionIds: ["tomato", "pepper", "marigold"],
    antagonisticIds: ["rue"],
    sowMonths: [3, 4, 5],
    transplantMonths: [4, 5, 6],
    harvestMonths: [6, 7, 8, 9],
    notes: "Excellent culinary herb and companion for nightshades.",
    care: {
      watering: "Keep evenly moist, especially in heat.",
      feeding: "Light compost side-dress monthly.",
      pruning: "Pinch tops weekly to delay flowering."
    }
  },
  {
    id: "kale",
    name: "Lacinato Kale",
    latinName: "Brassica oleracea var. palmifolia",
    categories: ["vegetable", "annual"],
    zoneMin: 3,
    zoneMax: 10,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 18,
    companionIds: ["calendula", "onion", "chive"],
    antagonisticIds: ["strawberry"],
    sowMonths: [2, 3, 8, 9],
    transplantMonths: [3, 4, 9],
    harvestMonths: [4, 5, 6, 9, 10, 11],
    notes: "Cold-tolerant, nutrient-dense staple for health-conscious gardens.",
    care: {
      watering: "1 inch weekly; mulch heavily.",
      feeding: "Nitrogen-rich compost every 3-4 weeks.",
      pruning: "Harvest lower leaves continuously."
    }
  },
  {
    id: "bean",
    name: "Pole Bean",
    latinName: "Phaseolus vulgaris",
    categories: ["vegetable", "annual", "nitrogen_fixer"],
    zoneMin: 3,
    zoneMax: 10,
    sunNeeds: ["full_sun"],
    matureSpreadIn: 18,
    companionIds: ["squash", "corn", "calendula"],
    antagonisticIds: ["onion", "garlic"],
    sowMonths: [4, 5, 6],
    transplantMonths: [],
    harvestMonths: [7, 8, 9],
    notes: "Improves soil nitrogen and supports regenerative bed cycles.",
    care: {
      watering: "Water at soil level 2 times weekly.",
      feeding: "Avoid excess nitrogen fertilizer.",
      pruning: "Guide vines up supports as they grow."
    }
  },
  {
    id: "squash",
    name: "Winter Squash",
    latinName: "Cucurbita maxima",
    categories: ["vegetable", "annual"],
    zoneMin: 3,
    zoneMax: 10,
    sunNeeds: ["full_sun"],
    matureSpreadIn: 48,
    companionIds: ["bean", "nasturtium", "corn"],
    antagonisticIds: ["potato"],
    sowMonths: [4, 5, 6],
    transplantMonths: [5, 6],
    harvestMonths: [8, 9, 10],
    notes: "Great calorie crop for homestead storage.",
    care: {
      watering: "Deep soak weekly; avoid wet foliage.",
      feeding: "Compost and potassium boost at fruit set.",
      pruning: "Trim excess vines to focus fruit maturity."
    }
  },
  {
    id: "comfrey",
    name: "Comfrey",
    latinName: "Symphytum officinale",
    categories: ["herb", "perennial", "pollinator_support"],
    zoneMin: 4,
    zoneMax: 9,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 30,
    companionIds: ["apple", "berry", "currant"],
    antagonisticIds: [],
    sowMonths: [3, 4],
    transplantMonths: [4, 5, 9],
    harvestMonths: [5, 6, 7, 8, 9],
    notes: "Dynamic accumulator useful for mulch and compost activator.",
    care: {
      watering: "Water weekly during establishment.",
      feeding: "Usually unnecessary in rich soils.",
      pruning: "Chop-and-drop 2-4 times per season."
    }
  },
  {
    id: "yarrow",
    name: "Yarrow",
    latinName: "Achillea millefolium",
    categories: ["flower", "perennial", "pollinator_support"],
    zoneMin: 3,
    zoneMax: 9,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 20,
    companionIds: ["tomato", "brassica", "herb_mix"],
    antagonisticIds: [],
    sowMonths: [2, 3, 4],
    transplantMonths: [4, 5],
    harvestMonths: [6, 7, 8, 9],
    notes: "Attracts predatory insects and improves resilience.",
    care: {
      watering: "Drought tolerant once established.",
      feeding: "Minimal feeding needed.",
      pruning: "Deadhead to extend bloom."
    }
  },
  {
    id: "marigold",
    name: "French Marigold",
    latinName: "Tagetes patula",
    categories: ["flower", "annual", "pollinator_support"],
    zoneMin: 2,
    zoneMax: 11,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 10,
    companionIds: ["tomato", "basil", "bean", "squash"],
    antagonisticIds: [],
    sowMonths: [3, 4, 5],
    transplantMonths: [4, 5, 6],
    harvestMonths: [6, 7, 8, 9, 10],
    notes: "Living pest-management edge plant.",
    care: {
      watering: "Water when top inch is dry.",
      feeding: "Light compost at planting.",
      pruning: "Deadhead often for extended flowers."
    }
  },
  {
    id: "nasturtium",
    name: "Nasturtium",
    latinName: "Tropaeolum majus",
    categories: ["flower", "annual", "pollinator_support"],
    zoneMin: 3,
    zoneMax: 10,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 20,
    companionIds: ["squash", "cucumber", "kale"],
    antagonisticIds: [],
    sowMonths: [4, 5, 6],
    transplantMonths: [5, 6],
    harvestMonths: [6, 7, 8, 9],
    notes: "Edible flowers/leaves and trap crop for aphids.",
    care: {
      watering: "Moderate; avoid overfeeding.",
      feeding: "Minimal feeding for best blooms.",
      pruning: "Trim trailing vines to manage spread."
    }
  },
  {
    id: "garlic",
    name: "Hardneck Garlic",
    latinName: "Allium sativum",
    categories: ["vegetable", "perennial"],
    zoneMin: 3,
    zoneMax: 8,
    sunNeeds: ["full_sun"],
    matureSpreadIn: 8,
    companionIds: ["kale", "beet", "lettuce"],
    antagonisticIds: ["bean", "pea"],
    sowMonths: [9, 10, 11],
    transplantMonths: [],
    harvestMonths: [6, 7],
    notes: "Essential medicinal and culinary staple crop.",
    care: {
      watering: "Consistent moisture until bulbing.",
      feeding: "Nitrogen in spring, then taper.",
      pruning: "Remove scapes for bulb sizing."
    }
  },
  {
    id: "chive",
    name: "Garlic Chives",
    latinName: "Allium tuberosum",
    categories: ["herb", "perennial", "pollinator_support"],
    zoneMin: 3,
    zoneMax: 9,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 12,
    companionIds: ["tomato", "kale", "carrot"],
    antagonisticIds: ["bean"],
    sowMonths: [3, 4],
    transplantMonths: [4, 5, 9],
    harvestMonths: [5, 6, 7, 8, 9],
    notes: "Perennial edge herb and pollinator attractor.",
    care: {
      watering: "Moderate watering; avoid soggy soil.",
      feeding: "Compost top-dress each spring.",
      pruning: "Cut leaves to 2 inches for regrowth."
    }
  },
  {
    id: "calendula",
    name: "Calendula",
    latinName: "Calendula officinalis",
    categories: ["flower", "annual", "pollinator_support"],
    zoneMin: 2,
    zoneMax: 10,
    sunNeeds: ["full_sun", "part_sun"],
    matureSpreadIn: 14,
    companionIds: ["kale", "bean", "tomato"],
    antagonisticIds: [],
    sowMonths: [2, 3, 4, 9],
    transplantMonths: [3, 4, 10],
    harvestMonths: [5, 6, 7, 8, 9, 10],
    notes: "Medicinal flower with strong pollinator value.",
    care: {
      watering: "Even moisture, reduced in cool periods.",
      feeding: "Low fertility is acceptable.",
      pruning: "Deadhead blooms for continuous flowering."
    }
  }
];

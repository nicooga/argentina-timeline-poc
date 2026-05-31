export type FeaturedTimeline = {
  slug: string;
  title: string;
  yearRange: string;
  description: string;
  category: string;
};

export const FEATURED_TIMELINES: FeaturedTimeline[] = [
  {
    slug: "historia-de-argentina",
    title: "Historia de Argentina",
    yearRange: "1810 – presente",
    description:
      "Independencia, organización del Estado, siglos XIX y XX hasta hoy.",
    category: "Historia regional",
  },
  {
    slug: "historia-del-peru",
    title: "Historia del Perú",
    yearRange: "1821 – presente",
    description:
      "De la independencia a la república contemporánea.",
    category: "Historia regional",
  },
  {
    slug: "historia-de-chile",
    title: "Historia de Chile",
    yearRange: "1810 – presente",
    description:
      "República, reformas, dictadura y transición democrática.",
    category: "Historia regional",
  },
  {
    slug: "historia-del-uruguay",
    title: "Historia del Uruguay",
    yearRange: "1825 – presente",
    description:
      "Independencia, batllismo y siglo XX uruguayo.",
    category: "Historia regional",
  },
  {
    slug: "historia-del-paraguay",
    title: "Historia del Paraguay",
    yearRange: "1811 – presente",
    description:
      "Emancipación, guerras, reconstrucción y modernidad.",
    category: "Historia regional",
  },
  {
    slug: "historia-del-ecuador",
    title: "Historia del Ecuador",
    yearRange: "1820 – presente",
    description:
      "De la Gran Colombia a la república ecuatoriana contemporánea.",
    category: "Historia regional",
  },
];

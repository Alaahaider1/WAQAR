export type Testimonial = {
  id: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
  product: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Isabelle M.",
    location: "Paris, France",
    avatar: "IM",
    rating: 5,
    text: "Rose Absolute is the most beautiful rose fragrance I have encountered in twenty years of collecting. It is complex without being heavy, feminine without being sweet. I wear it every day.",
    product: "Rose Absolute",
  },
  {
    id: "t2",
    name: "James K.",
    location: "London, UK",
    avatar: "JK",
    rating: 5,
    text: "Sacred Wood is extraordinary. The way it evolves on the skin over hours is something I have never experienced before. Frankincense, then cedar, then something almost leather-like. A truly adult fragrance.",
    product: "Sacred Wood",
  },
  {
    id: "t3",
    name: "Amara O.",
    location: "New York, USA",
    avatar: "AO",
    rating: 5,
    text: "The packaging alone is worth the price. But then you spray Golden Light and forget about everything else. Warm, golden, addictive. I have bought three bottles this year.",
    product: "Golden Light",
  },
  {
    id: "t4",
    name: "Soo-Yeon P.",
    location: "Seoul, South Korea",
    avatar: "SP",
    rating: 5,
    text: "Celestial Musk is unlike anything in my collection. It smells like clean skin — but elevated. Ethereal. I get so many compliments when I wear it. Truly a gem.",
    product: "Celestial Musk",
  },
  {
    id: "t5",
    name: "Marco R.",
    location: "Milan, Italy",
    avatar: "MR",
    rating: 5,
    text: "As someone who works in fashion, I am very particular about scent. WAQAR understands luxury in the truest sense — restraint, quality, and intention. Pure Amber is perfection.",
    product: "Pure Amber",
  },
  {
    id: "t6",
    name: "Elena V.",
    location: "Dubai, UAE",
    avatar: "EV",
    rating: 5,
    text: "I received the Signature Set as a gift and it opened my eyes to what perfumery can be. Each fragrance is a complete world. The gift set presentation is museum-worthy.",
    product: "Signature Set",
  },
];

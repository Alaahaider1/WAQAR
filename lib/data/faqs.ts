export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export const faqCategories = [
  { id: "all", label: "All Questions" },
  { id: "shipping", label: "Shipping & Delivery" },
  { id: "returns", label: "Returns & Exchanges" },
  { id: "products", label: "Our Products" },
  { id: "orders", label: "Orders & Payments" },
  { id: "care", label: "Fragrance Care" },
];

export const faqs: FAQ[] = [
  // Shipping
  {
    id: "s1",
    question: "How long does standard delivery take?",
    answer:
      "Standard delivery takes 3–5 business days within the continental US, and 5–10 business days for international orders. Express shipping (1–2 business days) is available at checkout for an additional charge.",
    category: "shipping",
  },
  {
    id: "s3",
    question: "How is my order packaged?",
    answer:
      "Every WAQAR order is shipped in our signature ivory gift box, hand-wrapped in gold tissue paper and sealed with our wax stamp. The outer shipping box is reinforced with custom inserts to protect your fragrance during transit. This packaging is suitable for gifting directly upon receipt.",
    category: "shipping",
  },
  // Returns
  {
    id: "r2",
    question: "How do I initiate a return?",
    answer:
      "To begin a return, contact our team at returns@maisonlumiere.com with your order number and reason for return. We will provide a prepaid return shipping label and instructions within 24 business hours. Refunds are processed within 5–7 business days of receiving the returned item.",
    category: "returns",
  },
  {
    id: "r3",
    question: "Can I exchange a fragrance I have received as a gift?",
    answer:
      "Yes. Gift recipients may exchange an unopened fragrance for store credit or a different product within 60 days of the original purchase date. Please contact us with the order number from the gift receipt or the name of the purchaser.",
    category: "returns",
  },
  {
    id: "r4",
    question: "What if my order arrives damaged?",
    answer:
      "In the rare event that your order arrives damaged, please photograph the damage and contact us within 48 hours of delivery at hello@maisonlumiere.com. We will arrange a replacement or full refund at no cost to you, including return shipping.",
    category: "returns",
  },
  // Products
  {
    id: "p1",
    question: "How long does a fragrance last on skin?",
    answer:
      "Our Eau de Toilette concentrations typically last 4–6 hours. Eau de Parfum formulations last 8–12 hours. Our Extrait de Parfum (Royal Oud) can last up to 24 hours. Longevity varies with skin type, humidity, and application — dry skin tends to absorb fragrance faster, so moisturising before application extends projection significantly.",
    category: "products",
  },
  {
    id: "p2",
    question: "Do you offer fragrance samples?",
    answer:
      "Yes. Our Discovery Set contains five 2ml vials from our core collection, allowing you to explore the range before committing to a full bottle. Individual sample vials are also available on request — contact us and our team will help identify the right fragrances for your preferences.",
    category: "products",
  },
  {
    id: "p3",
    question: "Are your fragrances suitable for sensitive skin?",
    answer:
      "Our fragrances are formulated to IFRA (International Fragrance Association) safety standards. However, as with any product containing natural oils and aromatic compounds, some individuals may experience sensitivity. We recommend testing on a small skin area before full application. Full ingredient lists are available on each product page.",
    category: "products",
  },
  {
    id: "p4",
    question: "Are WAQAR fragrances cruelty-free?",
    answer:
      "Yes, absolutely. We do not test on animals at any stage of production, and we do not work with suppliers who conduct animal testing. Several of our fragrances are also vegan — please check individual product pages for details. We are Leaping Bunny certified.",
    category: "products",
  },
  {
    id: "p5",
    question: "What percentage of natural ingredients do you use?",
    answer:
      "Over 95% of our ingredients are of natural origin, sourced from sustainable farms and ethical suppliers across 18 countries. The remaining percentage consists of safe synthetic molecules that either replicate natural materials that would be harmful to harvest at scale, or provide performance properties unavailable in nature.",
    category: "products",
  },
  {
    id: "p6",
    question: "Do your fragrances contain alcohol?",
    answer:
      "Yes. Like all fine French perfumery, our Eau de Parfum and Eau de Toilette formulations use cosmetic-grade alcohol (ethanol) as a carrier. This is the standard base for spray fragrances worldwide and allows for optimal diffusion and projection of the aromatic materials.",
    category: "products",
  },
  // Orders
  {
    id: "o1",
    question: "How do I track my order?",
    answer:
      "Once your order is confirmed, you will receive an email confirmation immediately. When your order is dispatched (typically within 1–2 business days), a second email with tracking information is sent. You can also log into your account at any time to view order status.",
    category: "orders",
  },
  {
    id: "o3",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Vodafon Cash, Etisalat Cash,We Cash, Insta pay ,...). All transactions are secured with 256-bit SSL encryption. We do not store card details — payments are processed through our certified payment partners.",
    category: "orders",
  },
  // Care
  {
    id: "c1",
    question: "How should I store my fragrance?",
    answer:
      "Store your fragrance in a cool, dark place away from direct sunlight, heat sources, and humidity. A drawer or cabinet away from windows is ideal. Avoid the bathroom, where temperature fluctuations and steam can degrade the aromatic compounds over time. Properly stored, most of our Eau de Parfum formulations will remain at their best for 3–5 years.",
    category: "care",
  },
  {
    id: "c2",
    question: "How do I apply fragrance correctly?",
    answer:
      "Apply it to pulse points—where body heat enhances the fragrance's diffusion. Avoid rubbing your wrists together after application, as this diminishes the top notes. For long-lasting wear, apply to hydrated skin, ideally using 5 to 12 sprays.",
    category: "care",
  },
  {
    id: "c3",
    question: "Can I layer fragrances?",
    answer:
      "The art of fragrance layering: To start, blend our light, refreshing scents with fragrances featuring warm base notes (such as pure amber and dark vanilla). Apply the lighter fragrance first, then apply the richer scent alongside it.",
    category: "care",
  },
];

export const getFAQsByCategory = (category: string): FAQ[] => {
  if (category === "all") return faqs;
  return faqs.filter((f) => f.category === category);
};

export const searchFAQs = (query: string): FAQ[] => {
  const q = query.toLowerCase();
  return faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q)
  );
};

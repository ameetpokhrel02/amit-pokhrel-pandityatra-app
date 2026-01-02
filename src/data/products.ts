export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  image: string;
  description?: string;
  recommended?: boolean;
}

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Puja Thali Set', price: 1200, category: 'Puja Items', image: 'basket-outline', description: 'Complete brass thali set for daily puja. Includes diya, bell, and containers.' },
  { id: '2', name: 'Ghee Lamp (Diya)', price: 450, category: 'Puja Items', image: 'flame-outline', description: 'Traditional brass diya for lighting during prayers.' },
  { id: '3', name: 'Veda Book', price: 800, category: 'Books', image: 'book-outline', description: 'Ancient vedic wisdom texts.' },
  { id: '4', name: 'Incense Sticks (Pack)', price: 150, category: 'Puja Items', image: 'leaf-outline', description: 'Natural fragrance incense sticks.' },
  { id: '5', name: 'Bratabandha Kit', price: 5000, category: 'Rituals', image: 'gift-outline', description: 'All essentials for Bratabandha ceremony including clothes and puja items.', recommended: true },
  { id: '6', name: 'Rudraksha Mala', price: 1500, category: 'Puja Items', image: 'radio-button-on-outline', description: 'Original 108 beads Rudraksha mala.' },
  { id: '7', name: 'Bhagavad Gita', price: 550, category: 'Gita', image: 'book-outline', description: 'The divine song of God. Hardcover edition.' },
  { id: '8', name: 'Srimad Bhagavatam', price: 2500, category: 'Bhagwat', image: 'library-outline', description: 'Complete set of Puranic texts.' },
  { id: '9', name: 'Ramayan', price: 1200, category: 'Ramayan', image: 'book-outline', description: 'The epic journey of Lord Rama.' },
  { id: '10', name: 'Havan Samagri', price: 300, category: 'Rituals', image: 'flame-outline', description: 'Mixed herbs for fire rituals.' },
];

export const CATEGORIES = ['All', 'Puja Items', 'Books', 'Rituals', 'Gita', 'Bhagwat', 'Ramayan'];

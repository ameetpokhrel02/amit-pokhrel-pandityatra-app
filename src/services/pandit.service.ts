import { Pandit, PanditFilter } from '@/types/pandit';

const MOCK_PANDITS: Pandit[] = [
  {
    id: '1',
    name: 'Pt. Ram Sharma',
    image: 'https://i.pravatar.cc/150?u=1',
    experience: 15,
    specialization: ['Griha Pravesh', 'Satyanarayan Puja', 'Rudri'],
    languages: ['Nepali', 'Sanskrit', 'Hindi'],
    rating: 4.9,
    reviewCount: 124,
    location: 'Kathmandu',
    price: 2500,
    isAvailable: true,
    isTopRated: true,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Pt. Krishna Bhattarai',
    image: 'https://i.pravatar.cc/150?u=2',
    experience: 8,
    specialization: ['Vivah', 'Bartabandha'],
    languages: ['Nepali', 'English'],
    rating: 4.7,
    reviewCount: 85,
    location: 'Lalitpur',
    price: 5000,
    isAvailable: false,
    isVerified: true,
  },
  {
    id: '3',
    name: 'Pt. Govinda Acharya',
    image: 'https://i.pravatar.cc/150?u=3',
    experience: 20,
    specialization: ['Vastu Shastra', 'Kundali'],
    languages: ['Nepali', 'Sanskrit'],
    rating: 4.8,
    reviewCount: 210,
    location: 'Bhaktapur',
    price: 1500,
    isAvailable: true,
    isTopRated: true,
  },
  {
    id: '4',
    name: 'Pt. Suresh Pandey',
    image: 'https://i.pravatar.cc/150?u=4',
    experience: 5,
    specialization: ['Daily Puja', 'Havan'],
    languages: ['Nepali'],
    rating: 4.5,
    reviewCount: 32,
    location: 'Kathmandu',
    price: 1000,
    isAvailable: true,
  },
  {
    id: '5',
    name: 'Pt. Mahesh Joshi',
    image: 'https://i.pravatar.cc/150?u=5',
    experience: 12,
    specialization: ['Shraddha', 'Pitri Puja'],
    languages: ['Nepali', 'Hindi'],
    rating: 4.6,
    reviewCount: 56,
    location: 'Pokhara',
    price: 3000,
    isAvailable: true,
  },
];

export const PanditService = {
  getPandits: async (filter?: PanditFilter): Promise<Pandit[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    let filtered = [...MOCK_PANDITS];

    if (filter) {
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.specialization.some((s) => s.toLowerCase().includes(query))
        );
      }
      if (filter.location) {
        filtered = filtered.filter((p) => p.location === filter.location);
      }
      if (filter.minRating) {
        filtered = filtered.filter((p) => p.rating >= filter.minRating!);
      }
      if (filter.availability === 'today') {
        filtered = filtered.filter((p) => p.isAvailable);
      }
      // Add more filters as needed
    }

    return filtered;
  },

  getPanditById: async (id: string): Promise<Pandit | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_PANDITS.find((p) => p.id === id);
  },
};

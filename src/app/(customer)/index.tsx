import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useCart } from '@/store/CartContext';
import { useUser } from '@/store/UserContext';
import { PRODUCTS } from '@/data/products';
import { MotiView, MotiText } from 'moti';
import { DailyPanchang } from '@/components/home/DailyPanchang';
import { DailyQuote } from '@/components/home/DailyQuote';
import { useTranslation } from 'react-i18next';

// Get a few products for the recommended section
const RECOMMENDED_PRODUCTS = PRODUCTS.slice(0, 5);

const POPULAR_PANDITS = [
  { id: '1', name: 'Pt. Sharma', location: 'Kathmandu', rating: 4.9 },
  { id: '2', name: 'Pt. Joshi', location: 'Lalitpur', rating: 4.8 },
  { id: '3', name: 'Pt. Bhatta', location: 'Bhaktapur', rating: 4.7 },
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { addToCart, updateQuantity, getItemCount } = useCart();
  const { user } = useUser();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(customer)/profile')}>
             {user?.photoUri ? (
               <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
             ) : (
               <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileInitials}>{user?.name?.[0]?.toUpperCase() || 'G'}</Text>
               </View>
             )}
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.greetingSection}
        >
          <Text style={styles.greetingTitle}>{t('welcome')}, {user?.name || 'Guest'}!</Text>
          <Text style={styles.greetingSubtitle}>{t('greetingSubtitle')}</Text>
        </MotiView>

        {/* Daily Panchang Widget */}
        <DailyPanchang />

        {/* Search Bar */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          style={styles.searchContainer}
        >
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput 
            placeholder={t('searchPlaceholder')} 
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </MotiView>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <CategoryItem index={0} icon="flame" label={t('categories.puja')} active onPress={() => router.push('/(customer)/pandits')} />
          <CategoryItem index={1} icon="basket" label={t('categories.samagri')} onPress={() => router.push('/(customer)/shop')} />
          <CategoryItem index={2} icon="people" label={t('categories.pandits')} onPress={() => router.push('/(customer)/pandits')} />
          <CategoryItem index={3} icon="planet" label={t('categories.kundali')} onPress={() => router.push('/(customer)/kundali')} />
        </ScrollView>

        {/* Daily Quote Widget */}
        <DailyQuote />

        {/* Recommended Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recommendedSamagri')}</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/shop')}>
            <Text style={styles.seeAllText}>{t('seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {RECOMMENDED_PRODUCTS.map((item) => {
            const quantity = getItemCount(item.id);
            
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.productCard}
                onPress={() => router.push(`/(customer)/shop/${item.id}`)}
              >
                <View style={styles.productImage}>
                  <Ionicons name={item.image as any} size={40} color={Colors.light.primary} />
                </View>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>NPR {item.price}</Text>
                  
                  {quantity > 0 ? (
                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={styles.qtyButton} 
                        onPress={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, quantity - 1);
                        }}
                      >
                        <Ionicons name="remove" size={12} color="#FFF" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{quantity}</Text>
                      <TouchableOpacity 
                        style={styles.qtyButton} 
                        onPress={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                      >
                        <Ionicons name="add" size={12} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                    >
                      <Ionicons name="add" size={16} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Popular Pandits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Most Popular Pandits</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/pandits')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {POPULAR_PANDITS.map((pandit) => (
            <TouchableOpacity key={pandit.id} style={styles.panditCard} onPress={() => router.push('/(customer)/pandits')}>
              <View style={styles.panditImage}>
                <Ionicons name="person" size={24} color="#666" />
              </View>
              <View style={styles.panditInfo}>
                <Text style={styles.panditName}>{pandit.name}</Text>
                <Text style={styles.panditLocation}>{pandit.location}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingValue}>{pandit.rating}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

function CategoryItem({ icon, label, active, onPress, index }: { icon: any, label: string, active?: boolean, onPress: () => void, index: number }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 15,
        delay: index * 100,
      }}
    >
      <TouchableOpacity style={[styles.categoryItem, active && styles.categoryItemActive]} onPress={onPress}>
        <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
          <Ionicons name={icon} size={24} color={active ? '#FFF' : '#666'} />
        </View>
        <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{label}</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileInitials: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryItemActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryLabelActive: {
    color: '#FFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  productCard: {
    backgroundColor: '#FFF',
    width: 160,
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    height: 100,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 2,
  },
  qtyButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  verticalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  panditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  panditImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  panditInfo: {
    flex: 1,
  },
  panditName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  panditLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

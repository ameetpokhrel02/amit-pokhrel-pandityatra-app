import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useCart } from '@/store/CartContext';
import { useUser } from '@/store/UserContext';
import { useTheme } from '@/store/ThemeContext';
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
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(customer)/profile')}>
             {user?.photoUri ? (
               <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
             ) : (
               <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
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
          <Text style={[styles.greetingTitle, { color: colors.text }]}>{t('welcome')}, {user?.name || 'Guest'}!</Text>
          <Text style={[styles.greetingSubtitle, { color: isDark ? '#AAA' : '#666' }]}>{t('greetingSubtitle')}</Text>
        </MotiView>

        {/* Daily Panchang Widget */}
        <DailyPanchang />

        {/* Search Bar */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}
        >
          <Ionicons name="search-outline" size={20} color={colors.placeholder} />
          <TextInput 
            placeholder={t('searchPlaceholder')} 
            style={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </MotiView>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <CategoryItem 
            index={0} 
            icon="flame" 
            label={t('categories.puja')} 
            active 
            onPress={() => router.push('/(customer)/pandits')} 
            colors={colors}
            isDark={isDark}
          />
          <CategoryItem 
            index={1} 
            icon="basket" 
            label={t('categories.samagri')} 
            onPress={() => router.push('/(customer)/shop')} 
            colors={colors}
            isDark={isDark}
          />
          <CategoryItem 
            index={2} 
            icon="people" 
            label={t('categories.pandits')} 
            onPress={() => router.push('/(customer)/pandits')} 
            colors={colors}
            isDark={isDark}
          />
          <CategoryItem 
            index={3} 
            icon="planet" 
            label={t('categories.kundali')} 
            onPress={() => router.push('/(customer)/kundali')} 
            colors={colors}
            isDark={isDark}
          />
        </ScrollView>

        {/* Daily Quote Widget */}
        <DailyQuote />

        {/* Recommended Products */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recommendedSamagri')}</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/shop')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {RECOMMENDED_PRODUCTS.map((item) => {
            const quantity = getItemCount(item.id);
            
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.productCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/(customer)/shop/${item.id}`)}
              >
                <View style={[styles.productImage, { backgroundColor: isDark ? '#333' : '#FFF8E1' }]}>
                  <Ionicons name={item.image as any} size={40} color={colors.primary} />
                </View>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.productFooter}>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>NPR {item.price}</Text>
                  
                  {quantity > 0 ? (
                    <View style={[styles.quantityControl, { backgroundColor: colors.primary }]}>
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
                      style={[styles.addButton, { backgroundColor: colors.primary }]}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Most Popular Pandits</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/pandits')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {POPULAR_PANDITS.map((pandit) => (
            <TouchableOpacity 
              key={pandit.id} 
              style={[styles.panditCard, { backgroundColor: colors.card }]} 
              onPress={() => router.push('/(customer)/pandits')}
            >
              <View style={[styles.panditImage, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                <Ionicons name="person" size={24} color={isDark ? '#AAA' : '#666'} />
              </View>
              <View style={styles.panditInfo}>
                <Text style={[styles.panditName, { color: colors.text }]}>{pandit.name}</Text>
                <Text style={[styles.panditLocation, { color: isDark ? '#AAA' : '#666' }]}>{pandit.location}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={[styles.ratingValue, { color: colors.text }]}>{pandit.rating}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

function CategoryItem({ 
  icon, 
  label, 
  active, 
  onPress, 
  index,
  colors,
  isDark
}: { 
  icon: any, 
  label: string, 
  active?: boolean, 
  onPress: () => void, 
  index: number,
  colors: any,
  isDark: boolean
}) {
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
      <TouchableOpacity 
        style={[
          styles.categoryItem, 
          { 
            backgroundColor: colors.card,
            borderColor: isDark ? '#333' : '#F0F0F0'
          },
          active && { 
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          }
        ]} 
        onPress={onPress}
      >
        <View style={[
          styles.categoryIcon, 
          { backgroundColor: isDark ? '#333' : '#F5F5F5' },
          active && styles.categoryIconActive
        ]}>
          <Ionicons name={icon} size={24} color={active ? '#FFF' : (isDark ? '#AAA' : '#666')} />
        </View>
        <Text style={[
          styles.categoryLabel, 
          { color: isDark ? '#AAA' : '#666' },
          active && styles.categoryLabelActive
        ]}>{label}</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 8,
    borderRadius: 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  productCard: {
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  panditLocation: {
    fontSize: 14,
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
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/store/CartContext';
import { PRODUCTS } from '@/data/products';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, updateQuantity, getItemCount } = useCart();
  
  const product = PRODUCTS.find(p => p.id === id);
  
  // Local state for quantity display, initialized with cart quantity or 1
  const cartQuantity = typeof id === 'string' ? getItemCount(id) : 0;
  const [quantity, setQuantity] = useState(cartQuantity > 0 ? cartQuantity : 1);

  // Update local quantity when cart quantity changes
  useEffect(() => {
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
    }
  }, [cartQuantity]);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      router.push('/(customer)/cart');
    }
  };

  const handleIncrement = () => {
    if (product) {
      addToCart(product);
    }
  };

  const handleDecrement = () => {
    if (typeof id === 'string') {
      updateQuantity(id, cartQuantity - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Ionicons name={product.image as any} size={120} color={Colors.light.primary} />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.category}>{product.category}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>4.8 (120)</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>NPR {product.price}</Text>
            
            {cartQuantity > 0 ? (
               <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.qtyButton} 
                  onPress={handleDecrement}
                >
                  <Ionicons name="remove" size={20} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{cartQuantity}</Text>
                <TouchableOpacity style={styles.qtyButton} onPress={handleIncrement}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
               <View style={styles.quantityControlDisabled}>
                  <Text style={styles.qtyTextDisabled}>1</Text>
               </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.sectionTitle}>Choice of Add On</Text>
          <View style={styles.addOnItem}>
            <View style={styles.addOnInfo}>
              <Ionicons name="leaf-outline" size={24} color="#666" />
              <Text style={styles.addOnName}>Extra Tulsi Leaves</Text>
            </View>
            <View style={styles.addOnPriceRow}>
              <Text style={styles.addOnPrice}>+ NPR 50</Text>
              <TouchableOpacity>
                <Ionicons name="radio-button-off" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.addOnItem}>
            <View style={styles.addOnInfo}>
              <Ionicons name="water-outline" size={24} color="#666" />
              <Text style={styles.addOnName}>Ganga Jal</Text>
            </View>
            <View style={styles.addOnPriceRow}>
              <Text style={styles.addOnPrice}>+ NPR 100</Text>
              <TouchableOpacity>
                <Ionicons name="radio-button-off" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {cartQuantity > 0 ? (
           <TouchableOpacity style={styles.viewCartButton} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart" size={20} color="#FFF" />
            <Text style={styles.addToCartText}>View Cart ({cartQuantity})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={20} color="#FFF" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  category: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#666',
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    padding: 4,
  },
  quantityControlDisabled: {
     flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    padding: 4,
    paddingHorizontal: 12,
    height: 40,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    backgroundColor: '#CCC',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  qtyTextDisabled: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    color: '#666',
    lineHeight: 22,
    fontSize: 14,
  },
  addOnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addOnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addOnName: {
    fontSize: 14,
    color: '#333',
  },
  addOnPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addOnPrice: {
    fontSize: 14,
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addToCartButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewCartButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

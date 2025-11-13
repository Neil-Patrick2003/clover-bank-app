
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider'; // Assuming the path is correct

/**
 * A visually appealing, gradient-style bank card component.
 * It uses simple styling and colors to simulate a premium look.
 */
export default function BankCard({ holderName = "JOHN C. DOE", lastFourDigits = "4321", expiry = "12/26", cardType = "Visa" }) {
  const t = useTheme();

  // Use a deep blue/teal for a classic premium card gradient look
  const cardColor = t.colors.primaryDark || '#0D47A1'; 
  const secondaryColor = t.colors.accent || '#1976D2'; 
  
  return (
    <View style={styles.cardContainer}>
      <View style={[styles.cardBase, { backgroundColor: cardColor }]}>
        
        {/* Mock Gradient Effect (Top Layer) */}
        <View style={[styles.gradientOverlay, { backgroundColor: secondaryColor, opacity: 0.25 }]} />
        
        <View style={styles.cardContent}>
          
          {/* Card Top Section (Logo and Chip) */}
          <View style={styles.headerRow}>
            <Text style={styles.cardLogo}>
              {/* Simulate Logo (Large Bold Text) */}
              SECURE
            </Text>
            <View style={styles.chip} />
          </View>
          
          {/* Card Number */}
          <Text style={styles.cardNumber}>
            **** **** **** {lastFourDigits}
          </Text>

          {/* Card Bottom Section (Holder Name and Expiry) */}
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.label}>Card Holder</Text>
              <Text style={styles.value}>{holderName}</Text>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Expires</Text>
              <Text style={styles.value}>{expiry}</Text>
            </View>
          </View>

          {/* Card Type (Visa/Mastercard) */}
          <View style={styles.typeLogoContainer}>
              <Text style={styles.typeLogo}>{cardType}</Text>
          </View>
          
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    aspectRatio: 1.586, // Standard credit card aspect ratio (85.6mm x 53.98mm)
    padding: 16,
    // Add strong shadow to make it pop out like a real card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  cardBase: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Position this layer diagonally to simulate a gradient sweep
    transform: [{ rotate: '-15deg' }, { translateX: -50 }],
  },
  cardContent: {
    padding: 25,
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 40,
    height: 30,
    borderRadius: 5,
    backgroundColor: '#FFD700', // Gold color for the chip
    borderWidth: 1,
    borderColor: '#E6C100',
  },
  cardLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeLogoContainer: {
    position: 'absolute',
    bottom: 25,
    right: 25,
  },
  typeLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  }
});
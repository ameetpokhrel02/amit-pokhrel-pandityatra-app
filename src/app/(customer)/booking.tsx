import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { LottieAnimation } from '@/components/ui/LottieAnimation';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { PanditService } from '@/services/pandit.service';
import { Pandit } from '@/types/pandit';

const STEPS = ['Service', 'Date & Time', 'Address', 'Review'];

export default function BookingScreen() {
  const { panditId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentStep, setCurrentStep] = useState(0);
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadPandit = async () => {
      if (typeof panditId === 'string') {
        const data = await PanditService.getPanditById(panditId);
        setPandit(data || null);
      }
    };
    loadPandit();
  }, [panditId]);

  const handleNext = () => {
    if (currentStep === 0 && !selectedService) {
      Alert.alert('Required', 'Please select a service');
      return;
    }
    if (currentStep === 1 && (!selectedDate || !selectedTime)) {
      Alert.alert('Required', 'Please select date and time');
      return;
    }
    if (currentStep === 2 && !address) {
      Alert.alert('Required', 'Please enter address');
      return;
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleBooking();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleBooking = () => {
    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <LottieAnimation
          source={require('@/assets/animations/success.json')} // Make sure this file exists or use a placeholder
          autoPlay
          loop={false}
          style={styles.lottie}
        />
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1000 }}
        >
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successMessage}>
            Your booking with {pandit?.name} for {selectedService} has been confirmed.
          </Text>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/(customer)')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Pandit</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((step, index) => (
          <View key={index} style={styles.stepWrapper}>
            <View style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
              index < currentStep && styles.stepCircleCompleted
            ]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Text style={[styles.stepNumber, index <= currentStep && styles.stepNumberActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.stepLabel, index <= currentStep && styles.stepLabelActive]}>
              {step}
            </Text>
            {index < STEPS.length - 1 && (
              <View style={[styles.stepLine, index < currentStep && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AnimatePresence exitBeforeEnter>
          {currentStep === 0 && (
            <MotiView 
              key="step0"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={styles.stepTitle}>Select Service</Text>
              <View style={styles.optionsContainer}>
                {pandit?.specialization.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.optionCard, selectedService === spec && styles.optionCardActive]}
                    onPress={() => setSelectedService(spec)}
                  >
                    <View style={[styles.radioCircle, selectedService === spec && styles.radioCircleActive]}>
                      {selectedService === spec && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.optionText, selectedService === spec && styles.optionTextActive]}>
                      {spec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>
          )}

          {currentStep === 1 && (
            <MotiView 
              key="step1"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={styles.stepTitle}>Select Date & Time</Text>
              
              <Text style={[styles.subLabel, { color: colors.text }]}>Select Date</Text>
              <View style={[styles.calendarContainer, { backgroundColor: colors.background, borderColor: colors.inputBorder }]}>
                <DateTimePicker
                  mode="single"
                  date={selectedDate}
                  onChange={(params) => setSelectedDate(dayjs(params.date))}
                  minDate={dayjs().startOf('day')}
                  // @ts-ignore
                  selectedItemColor={colors.primary}
                  headerTextStyle={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}
                  calendarTextStyle={{ color: colors.text }}
                  selectedTextStyle={{ color: '#FFF', fontWeight: 'bold' }}
                  weekDaysTextStyle={{ color: isDark ? '#999' : '#666' }}
                  todayContainerStyle={{ borderWidth: 1, borderColor: colors.primary }}
                  todayTextStyle={{ color: colors.primary }}
                  // @ts-ignore
                  headerButtonColor={colors.primary}
                />
              </View>

              <Text style={[styles.subLabel, { color: colors.text }]}>Time Slot</Text>
              <View style={styles.timeGrid}>
                {['Morning (6-9 AM)', 'Day (10-2 PM)', 'Evening (4-7 PM)'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeCard, 
                      { backgroundColor: colors.background, borderColor: colors.inputBorder },
                      selectedTime === time && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Ionicons 
                      name={time.includes('Morning') ? 'sunny-outline' : time.includes('Evening') ? 'moon-outline' : 'time-outline'} 
                      size={20} 
                      color={selectedTime === time ? '#FFF' : colors.text} 
                    />
                    <Text style={[
                      styles.timeText, 
                      { color: colors.text },
                      selectedTime === time && { color: '#FFF', fontWeight: '600' }
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>
          )}

          {currentStep === 2 && (
            <MotiView 
              key="step2"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={styles.stepTitle}>Location Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Street, Area, City"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Instructions (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 100 }]}
                  placeholder="Any specific requirements..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </MotiView>
          )}

          {currentStep === 3 && (
            <MotiView 
              key="step3"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={styles.stepTitle}>Review Booking</Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pandit</Text>
                  <Text style={styles.summaryValue}>{pandit?.name}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
                  <Text style={styles.summaryValue}>{selectedService}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date & Time</Text>
                  <Text style={styles.summaryValue}>
                    {dayjs(selectedDate).format('ddd, MMM D')} | {selectedTime}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>{address}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.totalPrice}>NPR {pandit?.price}</Text>
                </View>
              </View>

              <View style={styles.paymentNote}>
                <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                <Text style={styles.paymentNoteText}>
                  Payment will be collected after the service is completed.
                </Text>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === STEPS.length - 1 ? 'Confirm Booking' : 'Continue'}
          </Text>
          {currentStep < STEPS.length - 1 && (
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: Colors.light.primary,
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#F0F0F0',
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: '#4CAF50',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  optionCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: '#FFF8E1',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.light.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextActive: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  subLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 24,
  },
  dateCard: {
    width: 70,
    height: 90,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dateCardActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  dayTextActive: {
    color: '#FFF',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateTextActive: {
    color: '#FFF',
  },
  timeGrid: {
    gap: 12,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  timeCardActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  timeTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  paymentNote: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 40,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  homeButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

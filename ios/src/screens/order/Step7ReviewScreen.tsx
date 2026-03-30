import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { useOrder } from '../../context/OrderContext';
import { createOrder } from '../../lib/api';
import { COLORS, SPACING } from '../../theme';
import { OrderStackParamList } from '../../types';
import ProgressBar from '../../components/ProgressBar';
import StrawberrySVG from '../../components/StrawberrySVG';

type Nav = NativeStackNavigationProp<OrderStackParamList, 'Step7Review'>;

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

export default function Step7ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { order, resetOrder, setCustomerEmail } = useOrder();
  const insets = useSafeAreaInsets();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const total =
    order.variety_id && order.quantity
      ? (order.quantity * 5.5).toFixed(2) // placeholder until price comes from API
      : '—';

  const handlePlaceOrder = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Email required', 'Please enter a valid email address.');
      return;
    }

    if (
      !order.variety_id ||
      !order.location_id ||
      !order.time_slot_id ||
      !order.chocolateId ||
      !order.finishId
    ) {
      Alert.alert('Incomplete order', 'Please complete all steps before placing your order.');
      return;
    }

    setLoading(true);
    try {
      setCustomerEmail(email);

      const { order: createdOrder, client_secret } = await createOrder({
        variety_id: order.variety_id,
        location_id: order.location_id,
        time_slot_id: order.time_slot_id,
        chocolate: order.chocolateId,
        finish: order.finishId,
        quantity: order.quantity,
        is_gift: order.isGift,
        customer_email: email,
      });

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: client_secret,
        merchantDisplayName: 'Maison Fraise',
      });

      if (initError) {
        Alert.alert('Payment error', initError.message);
        setLoading(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment cancelled', presentError.message);
        setLoading(false);
        return;
      }

      Alert.alert(
        'Order placed.',
        `Your ${order.strawberryName ?? 'order'} will be ready for collection.`,
        [
          {
            text: 'Done',
            onPress: () => {
              resetOrder();
              navigation.navigate('Step1Strawberry');
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Something went wrong.', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <ProgressBar current={7} total={7} />
        <Text style={styles.stepLabel}>STEP 7 OF 7</Text>
        <Text style={styles.stepTitle}>Review</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.illustrationRow}>
          <StrawberrySVG size={54} />
        </View>

        <View style={styles.reviewCard}>
          <ReviewRow label="STRAWBERRY" value={order.strawberryName ?? '—'} />
          <View style={styles.divider} />
          <ReviewRow label="CHOCOLATE" value={order.chocolateName ?? '—'} />
          <View style={styles.divider} />
          <ReviewRow label="FINISH" value={order.finishName ?? '—'} />
          <View style={styles.divider} />
          <ReviewRow
            label="QUANTITY"
            value={order.quantity ? `${order.quantity}` : '—'}
          />
          <View style={styles.divider} />
          <ReviewRow label="COLLECTION" value={order.locationName ?? '—'} />
          <View style={styles.divider} />
          <ReviewRow
            label="WHEN"
            value={
              order.date && order.timeSlotTime
                ? `${order.date} at ${order.timeSlotTime}`
                : '—'
            }
          />
          {order.isGift && (
            <>
              <View style={styles.divider} />
              <ReviewRow label="GIFT" value="Handwritten note included" />
            </>
          )}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>CA${total}</Text>
        </View>

        <View style={styles.emailCard}>
          <Text style={styles.emailLabel}>EMAIL FOR RECEIPT</Text>
          <TextInput
            style={styles.emailInput}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.placeOrderText}>
            {loading ? 'Processing...' : 'Place Order  →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.forestGreen, paddingBottom: 22 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 6 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  stepLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 2,
  },
  stepTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontFamily: 'PlayfairDisplay_700Bold',
    padd
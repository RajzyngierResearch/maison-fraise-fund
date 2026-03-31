import React from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { usePanel } from '../context/PanelContext';
import HomePanel from './panels/HomePanel';
import AskPanel from './panels/AskPanel';
import VarietyPanel from './panels/VarietyPanel';
import ChocolatePanel from './panels/ChocolatePanel';
import FinishPanel from './panels/FinishPanel';
import QuantityPanel from './panels/QuantityPanel';
import WhenPanel from './panels/WhenPanel';
import ReviewPanel from './panels/ReviewPanel';
import ConfirmationPanel from './panels/ConfirmationPanel';
import NFCPanel from './panels/NFCPanel';
import VerifiedPanel from './panels/VerifiedPanel';
import StandingOrderPanel from './panels/StandingOrderPanel';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PANELS: Record<string, React.ComponentType<any>> = {
  home: HomePanel,
  ask: AskPanel,
  variety: VarietyPanel,
  chocolate: ChocolatePanel,
  finish: FinishPanel,
  quantity: QuantityPanel,
  when: WhenPanel,
  review: ReviewPanel,
  confirmation: ConfirmationPanel,
  nfc: NFCPanel,
  verified: VerifiedPanel,
  standingOrder: StandingOrderPanel,
};

export default function PanelNavigator() {
  const { stack, currentPanel, slideAnim } = usePanel();

  const prevPanel = stack.length >= 2 ? stack[stack.length - 2] : null;

  const currentTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH],
  });

  const prevTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.3, 0],
  });

  const CurrentComponent = PANELS[currentPanel] ?? HomePanel;
  const PrevComponent = prevPanel ? (PANELS[prevPanel] ?? HomePanel) : null;

  return (
    <View style={styles.container}>
      {/* Previous panel sits behind, absolutely positioned for parallax */}
      {PrevComponent && (
        <Animated.View style={[styles.prev, { transform: [{ translateX: prevTranslate }] }]}>
          <PrevComponent />
        </Animated.View>
      )}
      {/* Current panel fills the container with flex: 1 so TrueSheet gives it height */}
      <Animated.View style={[styles.current, { transform: [{ translateX: currentTranslate }] }]}>
        <CurrentComponent />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  current: {
    flex: 1,
  },
  prev: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { usePanel } from '../context/PanelContext';
import HomePanel from './panels/HomePanel';
import ChocolatePanel from './panels/ChocolatePanel';
import FinishPanel from './panels/FinishPanel';
import QuantityPanel from './panels/QuantityPanel';
import WhenPanel from './panels/WhenPanel';
import ReviewPanel from './panels/ReviewPanel';
import ConfirmationPanel from './panels/ConfirmationPanel';
import VerifiedPanel from './panels/VerifiedPanel';
import StandingOrderPanel from './panels/StandingOrderPanel';
import ProfilePanel from './panels/ProfilePanel';
import LocationPanel from './panels/LocationPanel';
import GiftNotePanel from './panels/GiftNotePanel';
import PartnerDetailPanel from './panels/PartnerDetailPanel';
import OrderHistoryPanel from './panels/OrderHistoryPanel';
import SearchPanel from './panels/SearchPanel';
import ReceiptPanel from './panels/ReceiptPanel';
import NFCPanel from './panels/NFCPanel';
import NfcTapPanel from './panels/NfcTapPanel';
import PopupDetailPanel from './panels/PopupDetailPanel';
import PopupRequestPanel from './panels/PopupRequestPanel';
import NominationPanel from './panels/NominationPanel';
import NominationHistoryPanel from './panels/NominationHistoryPanel';
import DjOfferPanel from './panels/DjOfferPanel';
import ContractOfferPanel from './panels/ContractOfferPanel';
import CampaignCommissionPanel from './panels/CampaignCommissionPanel';
import ActivityFeedPanel from './panels/ActivityFeedPanel';
import NotificationInboxPanel from './panels/NotificationInboxPanel';
import MemberDirectoryPanel from './panels/MemberDirectoryPanel';
import UserProfilePanel from './panels/UserProfilePanel';
import FollowingListPanel from './panels/FollowingListPanel';
import LookbookPanel from './panels/LookbookPanel';
import EditorialFeedPanel from './panels/EditorialFeedPanel';
import EditorialPiecePanel from './panels/EditorialPiecePanel';
import WritePiecePanel from './panels/WritePiecePanel';
import MembershipPanel from './panels/MembershipPanel';
import MyTokensPanel from './panels/MyTokensPanel';
import TokenDetailPanel from './panels/TokenDetailPanel';
import TokenOffersPanel from './panels/TokenOffersPanel';
import GreenhousesPanel from './panels/GreenhousesPanel';
import GreenhouseDetailPanel from './panels/GreenhouseDetailPanel';
import FundContributePanel from './panels/FundContributePanel';
import PatronagesPanel from './panels/PatronagesPanel';
import PatronageDetailPanel from './panels/PatronageDetailPanel';
import ChocolateLocationsPanel from './panels/ChocolateLocationsPanel';
import ChocolateLocationDetailPanel from './panels/ChocolateLocationDetailPanel';
import OperatorVarietiesPanel from './panels/OperatorVarietiesPanel';
import ContactsPanel from './panels/ContactsPanel';
import PortalConsentPanel from './panels/PortalConsentPanel';
import PortalOwnerPanel from './panels/PortalOwnerPanel';
import PortalSubscriberPanel from './panels/PortalSubscriberPanel';
import PortalUploadPanel from './panels/PortalUploadPanel';
import NfcWritePanel from './panels/NfcWritePanel';
import OfferComposerPanel from './panels/OfferComposerPanel';

const PANELS: Record<string, React.ComponentType<any>> = {
  home: HomePanel,
  profile: ProfilePanel,
  location: LocationPanel,
  'gift-note': GiftNotePanel,
  chocolate: ChocolatePanel,
  finish: FinishPanel,
  quantity: QuantityPanel,
  when: WhenPanel,
  review: ReviewPanel,
  confirmation: ConfirmationPanel,
  verified: VerifiedPanel,
  standingOrder: StandingOrderPanel,
  'partner-detail': PartnerDetailPanel,
  'order-history': OrderHistoryPanel,
  search: SearchPanel,
  receipt: ReceiptPanel,
  nfc: NFCPanel,
  'nfc-tap': NfcTapPanel,
  'popup-detail': PopupDetailPanel,
  'popup-request': PopupRequestPanel,
  nomination: NominationPanel,
  'nomination-history': NominationHistoryPanel,
  'dj-offer': DjOfferPanel,
  'contract-offer': ContractOfferPanel,
  'campaign-commission': CampaignCommissionPanel,
  'activity-feed': ActivityFeedPanel,
  'notification-inbox': NotificationInboxPanel,
  'member-directory': MemberDirectoryPanel,
  'user-profile': UserProfilePanel,
  'following-list': FollowingListPanel,
  lookbook: LookbookPanel,
  'editorial-feed': EditorialFeedPanel,
  'editorial-piece': EditorialPiecePanel,
  'write-piece': WritePiecePanel,
  membership: MembershipPanel,
  'my-tokens': MyTokensPanel,
  'token-detail': TokenDetailPanel,
  'token-offers': TokenOffersPanel,
  greenhouses: GreenhousesPanel,
  'greenhouse-detail': GreenhouseDetailPanel,
  'fund-contribute': FundContributePanel,
  patronages: PatronagesPanel,
  'patronage-detail': PatronageDetailPanel,
  'chocolate-locations': ChocolateLocationsPanel,
  'chocolate-location-detail': ChocolateLocationDetailPanel,
  'operator-varieties': OperatorVarietiesPanel,
  contacts: ContactsPanel,
  'portal-consent': PortalConsentPanel,
  'portal-owner': PortalOwnerPanel,
  'portal-subscriber': PortalSubscriberPanel,
  'portal-upload': PortalUploadPanel,
  'nfc-write': NfcWritePanel,
  'offer-composer': OfferComposerPanel,
};

// Panels that should always expand the sheet to full height
const FULL_HEIGHT_PANELS = new Set([
  'location', 'chocolate', 'finish', 'quantity', 'gift-note', 'when', 'review', 'confirmation', 'verified', 'standingOrder',
  'partner-detail', 'order-history', 'search', 'receipt',
  'nfc', 'nfc-tap', 'popup-detail', 'popup-request', 'nomination', 'nomination-history',
  'dj-offer', 'contract-offer', 'campaign-commission', 'activity-feed', 'notification-inbox',
  'member-directory', 'user-profile', 'following-list', 'lookbook', 'editorial-feed',
  'editorial-piece', 'write-piece', 'membership', 'my-tokens', 'token-detail', 'token-offers',
  'greenhouses', 'greenhouse-detail', 'fund-contribute', 'patronages', 'patronage-detail',
  'chocolate-locations', 'chocolate-location-detail', 'operator-varieties', 'contacts',
  'portal-consent', 'portal-owner', 'portal-subscriber', 'portal-upload',
  'nfc-write', 'offer-composer',
]);

// Panels that expand to medium height
const MEDIUM_HEIGHT_PANELS = new Set<string>();

export default function PanelNavigator() {
  const { currentPanel, slideAnim } = usePanel();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CurrentComponent = PANELS[currentPanel] ?? HomePanel;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (FULL_HEIGHT_PANELS.has(currentPanel)) {
      timerRef.current = setTimeout(() => TrueSheet.present('main-sheet', 2), 350);
    } else if (MEDIUM_HEIGHT_PANELS.has(currentPanel)) {
      timerRef.current = setTimeout(() => TrueSheet.present('main-sheet', 1), 350);
    } else if (currentPanel === 'home' && mountedRef.current) {
      timerRef.current = setTimeout(() => TrueSheet.present('main-sheet', 1), 350);
    }
    mountedRef.current = true;
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentPanel]);

  return (
    <Animated.View style={[styles.container, {
      transform: [{
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, SCREEN_WIDTH],
        }),
      }],
    }]}>
      <CurrentComponent />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
});

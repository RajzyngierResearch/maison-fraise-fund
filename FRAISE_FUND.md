# fraise.fund — Platform Archaeology Document
### Why this exists, what was cut, and how to rebuild it

---

## 1. Why This Fork Exists

The Maison Fraise codebase was forked on 2026-04-02 into two separate projects:

```
maison-fraise          →  the shipping build
                           Payment workflow only.
                           16 panels. Submit to TestFlight. Focus.

maison-fraise-fund     →  this repo — the full platform
                           51 panels. The social, cultural, and
                           economic layer built on top of the order.
```

The fork was a deliberate product decision, not a technical one. The payment workflow — browse locations, pick a variety, order, collect — is a complete, shippable product on its own. Everything else in this repo is the *reason* the brand exists at its logical conclusion: a membership platform, a token economy, a portrait culture, a greenhouse supply chain, a DJ talent pipeline, and a publishing layer. None of that ships until the core transaction is proven in market.

The fork preserves the full vision intact so it can be picked up without reconstruction from memory.

---

## 2. The Vision

```
STRAWBERRY
    │
    ├── Commerce (maison-fraise)
    │     Order → Collect → Receipt
    │
    └── Culture (fraise.fund)
          Member → Verify → Participate → Create → Invest
```

**The strawberry is the through line.** Every feature in this repo connects back to the act of ordering and collecting a box of strawberries — but extends it into a full economic and cultural ecosystem.

### The full domain arc:

| Domain | Purpose | Status |
|---|---|---|
| `fraise.maison` | Ordering app | Shipping |
| `fraise.fund` | Social + membership platform | This repo |
| `fraise.capital` | Hedge fund | Future |
| `fraise.partners` | Private equity | Future |
| `fraise.bar` | Spirits distillery | Future |

### Why these things connect:

The **order** generates a **token** (provenance record). Tokens accumulate to prove membership history. Verified members (those who collected in person via NFC) can access the full platform: nominate DJs, commission portrait campaigns, fund greenhouses, publish editorial, subscribe to creator portals. The token economy is the seed of the commercial software product. The NFC infrastructure is the seed of proprietary hardware. The popup DJ system is the seed of the distillery's event culture.

None of this is speculative decoration — it is the same system, extended.

---

## 3. Architecture Overview

### How panels are wired

Every screen in the app is a "panel" — a full-screen component rendered inside a bottom sheet navigator. Navigation is handled by `PanelContext` (a stack) and `PanelNavigator` (a registry mapping string IDs to components).

```
App.tsx
  └── PanelProvider (PanelContext.tsx)
        └── MapScreen (the map underneath)
              └── TrueSheet (the bottom sheet)
                    └── PanelNavigator
                          └── <CurrentPanel />
```

To navigate: `showPanel('panel-id')` pushes onto the stack.
To go back: `goBack()` pops the stack.
To jump directly: `jumpToPanel('panel-id')` resets the stack.

### The 51 panels by feature group

```
PAYMENT WORKFLOW (16 panels — live in maison-fraise)
─────────────────────────────────────────────────────
home → location → chocolate → finish → quantity
     → gift-note → when → review → confirmation
     → verified → standingOrder
profile → order-history → receipt
partner-detail → search

FUND PLATFORM (35 panels — this repo only)
─────────────────────────────────────────────────────
IDENTITY & SOCIAL
  profile ──────────────────────────────────────────┐
  ├── member-directory                               │
  ├── user-profile                                   │ Entry
  ├── following-list                                 │ point
  ├── contacts                                       │ for all
  ├── activity-feed                                  │ fund
  └── notification-inbox                             │ features

NFC & VERIFICATION
  confirmation → nfc → nfc-tap → [verified status]

POPUP CULTURE
  map markers ──► popup-detail
                  ├── nomination
                  │   └── nomination-history
                  ├── dj-offer
                  └── contract-offer

PORTRAIT & CAMPAIGNS
  partner-detail ──► lookbook
  campaign-commission (from partner-detail)

EDITORIAL
  profile ──► editorial-feed
              ├── editorial-piece
              └── write-piece

MEMBERSHIP & ECONOMY
  profile ──► membership
  profile ──► my-tokens
              ├── token-detail
              └── token-offers
  profile ──► greenhouses
              └── greenhouse-detail
                  └── fund-contribute
  profile ──► patronages
              └── patronage-detail

SUPPLY CHAIN
  profile ──► chocolate-locations
              └── chocolate-location-detail
  profile ──► operator-varieties

PORTAL (Creator / Subscriber Layer)
  receipt ──► portal-subscriber
  profile ──► portal-owner
              ├── portal-consent
              └── portal-upload

POPUP REQUESTS
  profile or map ──► popup-request
```

---

## 4. What Was Cut From Shared Files

When the main build was stripped, 7 shared files had sections removed. The destination panels are all intact in this repo — only the navigation triggers are missing. This section tells you exactly what to restore and where.

---

### 4.1 ProfilePanel.tsx
**File:** `ios/src/components/panels/ProfilePanel.tsx`

ProfilePanel is the primary entry point to every fund feature. The stripped version only shows: Apple Sign In, demo login, sign out, edit name, order history, standing orders, referral code, notification prefs (order_updates + marketing only), search.

**Restore these navigation items** in the authenticated section (after the user's name/email row):

```
SECTION: MEMBERSHIP
  ├── "Membership"           → showPanel('membership')
  └── "My Tokens"            → showPanel('my-tokens')

SECTION: CULTURE
  ├── "Popups"               → jumpToPanel + map filter, or popup-request
  ├── "Nominations"          → showPanel('nomination-history')
  ├── "Following"            → showPanel('following-list')
  └── "Contacts"             → showPanel('contacts')

SECTION: EDITORIAL
  └── "Editorial"            → showPanel('editorial-feed')

SECTION: ECONOMY
  ├── "Greenhouses"          → showPanel('greenhouses')
  └── "Patronages"           → showPanel('patronages')

SECTION: SUPPLY CHAIN
  ├── "Chocolate Locations"  → showPanel('chocolate-locations')
  └── "Operator Varieties"   → showPanel('operator-varieties')  [operator-only, gate by role]

SECTION: PORTAL
  └── "My Portal"            → showPanel('portal-owner')        [creator-only, gate by flag]

NOTIFICATION PREFS
  Restore full notifPrefs type:
  {
    order_updates: boolean;
    marketing: boolean;
    popup_rsvp: boolean;
    nomination: boolean;
    contract: boolean;
    new_follower: boolean;
    editorial_comment: boolean;
    token_offer: boolean;
  }
```

**API imports to restore in ProfilePanel:**
```typescript
import {
  fetchMyMembership,
  fetchMyTokens,
  fetchMyNominations,
  fetchFollowingList,
  // ... (all present in api.ts, nothing was deleted there)
} from '../../lib/api';
```

---

### 4.2 SearchPanel.tsx
**File:** `ios/src/components/panels/SearchPanel.tsx`

Stripped to varieties only. Restore users and popups search results.

**Restore:**
```typescript
// State
const [users, setUsers] = useState<any[]>([]);
const [popups, setPopups] = useState<any[]>([]);

// In handleSearch, update the .then():
.then(res => {
  setVarieties(res.varieties ?? []);
  setUsers(res.users ?? []);
  setPopups(res.popups ?? []);
})

// Handlers
const handleSelectUser = (user: any) => {
  setPanelData({ userId: user.id });
  showPanel('user-profile');
};

const handleSelectPopup = (popup: any) => {
  setActiveLocation({ ...popup, type: 'popup' });
  showPanel('popup-detail');
};

// Render — add after VARIETIES section:
// PEOPLE section (users.map → showPanel('user-profile'))
// POPUPS section (popups.map → showPanel('popup-detail'))
```

**usePanel destructuring** — restore `showPanel`, `setPanelData`, `setActiveLocation`.

---

### 4.3 ConfirmationPanel.tsx
**File:** `ios/src/components/panels/ConfirmationPanel.tsx`

The NFC tap card was shown after a successful order when `order.nfc_token` was set. This is the bridge between the payment workflow and verified membership status.

**Restore** (insert after the order ID/total card, before the standing order button):
```tsx
{order.nfc_token && (
  <View style={[styles.nfcCard, { backgroundColor: c.card, borderColor: c.border }]}>
    <Text style={[styles.nfcTitle, { color: c.text }]}>Tap to verify your collection</Text>
    <Text style={[styles.nfcBody, { color: c.muted }]}>
      Hold your phone to the NFC chip at the pickup point to confirm
      you collected in person and unlock member features.
    </Text>
    <TouchableOpacity
      style={[styles.nfcBtn, { backgroundColor: c.accent }]}
      onPress={() => showPanel('nfc')}
      activeOpacity={0.8}
    >
      <Text style={styles.nfcBtnText}>Tap now</Text>
    </TouchableOpacity>
  </View>
)}
```

The styles `nfcCard`, `nfcTitle`, `nfcBody`, `nfcBtn`, `nfcBtnText` are still present in the StyleSheet — they were not removed.

**usePanel destructuring** — restore `showPanel`.

---

### 4.4 StandingOrderPanel.tsx
**File:** `ios/src/components/panels/StandingOrderPanel.tsx`

The fund balance display was removed. This showed how much the user had in their Maison Fraise fund that could be applied to standing orders.

**Restore:**
```typescript
// State
const [fundBalanceCents, setFundBalanceCents] = useState<number | null>(null);

// In useEffect / loadData, restore fetchMyMembership:
import { fetchMyMembership } from '../../lib/api';

Promise.all([dbId, verified, fetchMyMembership()])
  .then(([dbId, verified, membership]) => {
    if (membership?.fund?.balance_cents != null) {
      setFundBalanceCents(membership.fund.balance_cents);
    }
    // ... rest of handler
  });

// Render — add fund balance display row near top of form
{fundBalanceCents != null && fundBalanceCents > 0 && (
  <Text>Fund balance: CA${(fundBalanceCents / 100).toFixed(2)}</Text>
)}
```

---

### 4.5 PartnerDetailPanel.tsx
**File:** `ios/src/components/panels/PartnerDetailPanel.tsx`

Three features were removed: upcoming popup display, placed history (who's been here), and lookbook navigation.

**API imports to restore:**
```typescript
import {
  fetchBusinessPortraits,
  fetchBusinessVisitCount,
  fetchBusinessPopupStats,   // ← restore
  fetchPlacedHistory,        // ← restore
  createTip,
} from '../../lib/api';
```

**usePanel destructuring** — restore `showPanel`, `setPanelData`, `setActiveLocation`.

**State to restore:**
```typescript
const [popupStats, setPopupStats] = useState<{
  next_popup: any | null;
  past_popup_count: number;
} | null>(null);
const [placedHistory, setPlacedHistory] = useState<any[]>([]);
```

**loadData** — restore to fetch 4 things:
```typescript
Promise.all([
  fetchBusinessPortraits(biz.id).catch(() => []),
  fetchBusinessVisitCount(biz.id).catch(() => null),
  fetchBusinessPopupStats(biz.id).catch(() => null),   // ← restore
  fetchPlacedHistory(biz.id).catch(() => []),           // ← restore
]).then(([p, v, s, h]) => {
  setPortraits(p as any[]);
  setVisitCount(v ? (v as any).visit_count : null);
  setPopupStats(s as any);       // ← restore
  setPlacedHistory(h as any[]);  // ← restore
});
```

**handleViewPopup function** — restore:
```typescript
const handleViewPopup = (popup: any) => {
  setActiveLocation({ ...popup, type: 'popup' });
  showPanel('popup-detail');
};
```

**handleOpenLookbook function** — restore:
```typescript
const handleOpenLookbook = (initialIndex = 0) => {
  setPanelData({ initialIndex });
  showPanel('lookbook');
};
```

**handleCommission** — restore the verified gate:
```typescript
const handleCommission = () => {
  if (!isVerified) {
    Alert.alert('Verified members only', 'Collect your first order in person to unlock campaign commissions.');
    return;
  }
  // ... rest
};
```

**Chips row** — restore past popup count chip:
```tsx
{pastPopupCount > 0 && (
  <Text style={[styles.chip, { color: c.muted, borderColor: c.border }]}>
    {pastPopupCount} {pastPopupCount === 1 ? 'popup' : 'popups'} hosted
  </Text>
)}
```

**Render** — restore upcoming popup card (before commission CTA), placed history section (after tip section), and "View all →" button in campaigns header.

**formatPopupDate helper** — restore:
```typescript
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatPopupDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
```

---

### 4.6 ReceiptPanel.tsx
**File:** `ios/src/components/panels/ReceiptPanel.tsx`

The portal subscriber button was removed from the "Served by" worker section. This allowed customers to request portal access from the worker who served them.

**Restore** (inside the worker section, after workerName):
```tsx
{worker.portal_opted_in && (
  <TouchableOpacity
    onPress={() => showPanel('portal-subscriber')}
    activeOpacity={0.7}
    style={styles.actionLine}
  >
    <Text style={[styles.actionText, { color: c.accent }]}>
      {'> request portal access_'}
    </Text>
  </TouchableOpacity>
)}
```

**usePanel destructuring** — restore `showPanel`.

---

### 4.7 MapScreen.tsx
**File:** `ios/src/screens/MapScreen.tsx`

Popup and audition map markers exist on the map but have no press handlers. The handlers were removed because they navigated to cut panels.

**Restore popup marker press handler:**
```typescript
const handlePopupMarkerPress = (popup: Business) => {
  setActiveLocation(popup);
  jumpToPanel('popup-detail');
};
```

**Restore audition marker press handler:**
```typescript
const handleUnverifiedPopupPress = () => {
  Alert.alert(
    'Members only',
    'Collect your first order in person to unlock popup access.',
  );
};
```

**Restore `isVerified` state:**
```typescript
const [isVerified, setIsVerified] = useState(false);
useEffect(() => {
  AsyncStorage.getItem('verified').then(v => setIsVerified(v === 'true'));
}, []);
```

**Wire up marker onPress:**
```tsx
// For regular popups:
onPress={() => isVerified ? handlePopupMarkerPress(b) : handleUnverifiedPopupPress()}

// For audition popups:
onPress={() => handleUnverifiedPopupPress()}
```

**Restore notification handlers in App.tsx:**
```typescript
// In the notification response listener, restore these pending screen cases:
case 'nfc': jumpToPanel('nfc'); break;
case 'popup': /* set activeLocation then */ jumpToPanel('popup-detail'); break;
case 'dj-offer': jumpToPanel('dj-offer'); break;
case 'nomination': jumpToPanel('nomination'); break;
case 'audition-result': jumpToPanel('popup-detail'); break;
case 'campaign-commission': jumpToPanel('campaign-commission'); break;
case 'contract-offer': jumpToPanel('contract-offer'); break;
case 'nomination-history': jumpToPanel('nomination-history'); break;
case 'notification-inbox': jumpToPanel('notification-inbox'); break;
case 'activity-feed': jumpToPanel('activity-feed'); break;
case 'popup-detail': jumpToPanel('popup-detail'); break;
```

---

## 5. All 35 Fund Panels — Purpose & Connections

### NFC & Verification

| Panel | File | Purpose |
|---|---|---|
| `nfc` | NFCPanel.tsx | Initiates NFC scan. Calls `POST /api/nfc/initiate`, then presents the NFC reader. Bridges to `nfc-tap`. |
| `nfc-tap` | NfcTapPanel.tsx | Confirms the NFC tap. Calls `POST /api/nfc/confirm`. On success, writes `verified=true` to AsyncStorage and navigates to `verified`. |

**Flow:** `confirmation` (when nfc_token present) → `nfc` → `nfc-tap` → `verified`

---

### Popup Culture

| Panel | File | Purpose |
|---|---|---|
| `popup-detail` | PopupDetailPanel.tsx | Full popup info: name, date, DJ, neighbourhood, entrance fee, RSVP count. RSVP button. Links to `nomination` if audition popup. |
| `popup-request` | PopupRequestPanel.tsx | Form for a venue/organizer to request hosting a popup. Calls `POST /api/popup-requests`. |
| `nomination` | NominationPanel.tsx | Nominate a member to DJ at an audition popup. Search members, submit nomination via `POST /api/popups/:id/nominations`. |
| `nomination-history` | NominationHistoryPanel.tsx | History of nominations given and received. Calls `/api/users/:id/nominations-given` and `/nominations-received`. |
| `dj-offer` | DjOfferPanel.tsx | Maison-sent offer to DJ at a popup. Accept or decline. |
| `contract-offer` | ContractOfferPanel.tsx | Formal contract offer for a DJ engagement. Sign or decline. Calls `/api/users/:id/contract-offer`. |

**Flow:**
```
map marker ──► popup-detail
                ├── [audition] ──► nomination ──► nomination-history
                └── [offer received] ──► dj-offer ──► contract-offer
```

---

### Portrait & Campaigns

| Panel | File | Purpose |
|---|---|---|
| `lookbook` | LookbookPanel.tsx | Full-screen portrait gallery. Receives `{ initialIndex }` via panelData. Sourced from business portraits. |
| `campaign-commission` | CampaignCommissionPanel.tsx | Verified members commission a portrait campaign at a venue. Payment flow via Stripe. Calls `POST /api/campaign-commissions/payment-intent`. |

**Flow:** `partner-detail` → `lookbook` (view all portraits) or `campaign-commission` (book a shoot)

---

### Social Layer

| Panel | File | Purpose |
|---|---|---|
| `activity-feed` | ActivityFeedPanel.tsx | Platform-wide activity stream. Orders, nominations, editorial posts, token trades. |
| `notification-inbox` | NotificationInboxPanel.tsx | In-app notifications list. Mirrors push notifications. |
| `member-directory` | MemberDirectoryPanel.tsx | Browse all members. Filter by verified, neighbourhood, etc. Taps navigate to `user-profile`. |
| `user-profile` | UserProfilePanel.tsx | Another member's profile. Receives `{ userId }` via panelData. Follow/unfollow. View their tokens, editorial. |
| `following-list` | FollowingListPanel.tsx | Who you follow and who follows you. |
| `contacts` | ContactsPanel.tsx | Your saved contacts within the platform. |

---

### Editorial

| Panel | File | Purpose |
|---|---|---|
| `editorial-feed` | EditorialFeedPanel.tsx | Browse member-written editorial pieces. |
| `editorial-piece` | EditorialPiecePanel.tsx | Read a single piece. Receives `{ pieceId }` via panelData. |
| `write-piece` | WritePiecePanel.tsx | Compose and publish a new editorial piece. Calls `POST /api/editorial`. |

**Flow:** `profile` → `editorial-feed` → `editorial-piece` or `write-piece`

---

### Membership & Token Economy

| Panel | File | Purpose |
|---|---|---|
| `membership` | MembershipPanel.tsx | Your membership tier, benefits, history. Fund balance display. Upgrade options. |
| `my-tokens` | MyTokensPanel.tsx | All provenance tokens earned from orders. Each token is a record of a harvest. |
| `token-detail` | TokenDetailPanel.tsx | Single token. Provenance ledger, season, greenhouse origin. Receives `{ tokenId }`. |
| `token-offers` | TokenOffersPanel.tsx | Buy/sell token offers from other members. Calls `/api/tokens` offer endpoints. |

**The token system:**
Every order can generate a provenance token. The token encodes: variety, season, greenhouse, and the order's position in the harvest. Tokens accumulate as a membership history. They can be traded. The visual is generated by `tokenAlgorithm.ts` — a deterministic generative graphic seeded by the token ID.

```
Order → token minted → appears in my-tokens
      → token-detail shows provenance ledger
      → token-offers allows secondary market
```

---

### Greenhouses & Agricultural Supply Chain

| Panel | File | Purpose |
|---|---|---|
| `greenhouses` | GreenhousesPanel.tsx | List of all Maison Fraise greenhouses. Each has a fund status. |
| `greenhouse-detail` | GreenhouseDetailPanel.tsx | Single greenhouse: location, crop, current patron, provenance history. |
| `fund-contribute` | FundContributePanel.tsx | Contribute funds to a specific greenhouse via Stripe. Calls `/api/greenhouses/:id/fund`. |

**Flow:** `profile` → `greenhouses` → `greenhouse-detail` → `fund-contribute`

---

### Patronages

| Panel | File | Purpose |
|---|---|---|
| `patronages` | PatronagesPanel.tsx | List of patronage opportunities — season sponsorships, harvest naming rights. |
| `patronage-detail` | PatronageDetailPanel.tsx | Single patronage. Claim it. Becomes the `season_patron` shown on receipts. Calls `/api/patronages/:id/claim`. |

When a patronage is claimed, the patron's handle appears on every receipt from that harvest — visible to all buyers that season.

---

### Supply Chain & Operations

| Panel | File | Purpose |
|---|---|---|
| `chocolate-locations` | ChocolateLocationsPanel.tsx | Where the chocolate coating is sourced. |
| `chocolate-location-detail` | ChocolateLocationDetailPanel.tsx | Single sourcing location detail. |
| `operator-varieties` | OperatorVarietiesPanel.tsx | Operator/admin view of all available varieties, stock levels. Gated by user role. |

---

### Portal (Creator / Subscriber Layer)

The portal is a private content layer. Workers at pickup locations can opt in as creators, upload content (photos, notes from a session), and members who collected from them can subscribe to access it.

| Panel | File | Purpose |
|---|---|---|
| `portal-consent` | PortalConsentPanel.tsx | Worker opts into the portal system. Consent flow. |
| `portal-owner` | PortalOwnerPanel.tsx | Creator view: manage uploads, see subscribers. |
| `portal-upload` | PortalUploadPanel.tsx | Upload a piece of content to the portal. |
| `portal-subscriber` | PortalSubscriberPanel.tsx | Subscriber view: request access to a worker's portal. Reached from `receipt` after collecting from that worker. |

**Entry points:**
- `receipt` → `portal-subscriber` (when `worker.portal_opted_in` is true)
- `profile` → `portal-owner` (for opted-in workers)

---

## 6. API Coverage

Every fund feature has a corresponding API route. Nothing was removed from `api/src/routes/`. The relevant routes:

```
/api/nfc/initiate          POST  — begin NFC session
/api/nfc/confirm           POST  — confirm tap, grant verified
/api/popups                GET   — all popups (map data)
/api/popups/:id            GET   — single popup detail
/api/popups/:id/nominations POST — submit nomination
/api/popups/:id/nominations/leaderboard GET
/api/popups/:id/nominations/status GET
/api/popup-requests        POST  — request to host popup
/api/campaign-commissions  POST  — commission portrait campaign
/api/campaign-commissions/payment-intent POST
/api/contracts             GET   — user contracts
/api/editorial             GET, POST
/api/editorial/:id         GET
/api/memberships           GET   — current membership
/api/tokens                GET   — user tokens
/api/tokens/:id            GET
/api/greenhouses           GET
/api/greenhouses/:id       GET
/api/greenhouses/:id/fund  POST
/api/patronages            GET
/api/patronages/:id        GET
/api/patronages/:id/claim  POST
/api/portal                GET, POST (owner)
/api/portal/upload         POST
/api/portal/subscribe      POST
/api/users/:id/nominations-given    GET
/api/users/:id/nominations-received GET
/api/users/:id/contract-offer       GET
/api/profiles/:id          GET   — other user's profile
/api/search                GET   — q= (varieties, users, popups)
```

---

## 7. Rebuild Sequence

When you're ready to build fraise.fund, tackle it in this order:

```
PHASE 1 — Reconnect navigation (hours, not days)
─────────────────────────────────────────────────
1. MapScreen.tsx        → restore popup/audition onPress handlers
2. ConfirmationPanel    → restore NFC card (order.nfc_token check)
3. ProfilePanel         → restore all fund navigation rows
4. SearchPanel          → restore users + popups results
5. ReceiptPanel         → restore portal-subscriber button
6. PartnerDetailPanel   → restore popup stats, placed history, lookbook
7. StandingOrderPanel   → restore fund balance
8. App.tsx              → restore notification deep links

PHASE 2 — NFC infrastructure
─────────────────────────────────────────────────
Add back to app.json:
  "com.apple.developer.nfc.readersession.formats": ["NDEF"]
  "NFCReaderUsageDescription": "..."
  "react-native-nfc-manager" plugin

Note: This was removed for the main build because Apple rejected it
under SDK 26 with Expo. May require a native module workaround or
a direct entitlement approach. Check Expo SDK release notes.

PHASE 3 — New features (build fresh)
─────────────────────────────────────────────────
The 35 panels are a solid skeleton. API routes exist.
Build features in dependency order:
  verified status → membership → tokens → greenhouses
  → patronages → popups → nominations → DJ pipeline
  → editorial → portal

PHASE 4 — Second app identity
─────────────────────────────────────────────────
- New bundle ID (com.maisonfraise.fund or similar)
- New app.json name/slug
- New EAS project
- Separate Apple App ID with its own capabilities
```

---

## 8. The ProvenanceTokenCard & PatronTokenCard

Two display components exist in `ios/src/components/` that were orphaned during the strip:

- `ProvenanceTokenCard.tsx` — renders a token's provenance ledger visually. Used in `token-detail`.
- `PatronTokenCard.tsx` — renders a patronage certificate. Used in `patronage-detail`.

These were deleted from the main build but are preserved here. Wire them back in when building `TokenDetailPanel` and `PatronageDetailPanel`.

---

## 9. Key Design Decisions to Preserve

**Verified status is the gate.** The NFC tap at collection is what separates a buyer from a member. Every social feature gates on `AsyncStorage.getItem('verified') === 'true'`. This is intentional — it ties digital membership to physical presence.

**The token is the receipt's second life.** An order receipt is ephemeral. A provenance token is permanent. The token system was designed so that collecting strawberries generates a record that compounds in meaning over seasons.

**Popups are auditions.** The popup DJ system was never just events — it is a talent pipeline. Nominations → audition → offer → contract is the full arc. The popup culture at partner venues becomes the training ground for the distillery's event program.

**The portal closes the loop between worker and collector.** The person who hands you the strawberries can have a portal. You collected from them, so you have a relationship. The portal formalizes that relationship into a content subscription.

**Everything is on-brand with the same panel system.** Do not rebuild fraise.fund as a separate React Native app with different navigation. The TrueSheet + PanelNavigator architecture should be preserved — it is what makes the experience feel like one coherent product, not two apps bolted together.

---

*Document written 2026-04-02. This repo is the archaeological record.*

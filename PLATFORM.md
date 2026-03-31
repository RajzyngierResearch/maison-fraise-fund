# The Maison Fraise Platform Document

---

## The Rule

No business can join the Maison Fraise network without a verified individual account behind it. The person comes before the business. Always.

---

## What the platform is

Maison Fraise is a verified local commerce network. It begins with a single product — chocolate-covered strawberries — and grows through the physical presence of real people. Every node in the network, whether a person, a business, a farm, or a supplier, was first a verified individual who opened a box, tapped their phone, and joined.

---

## The verification mechanic

Verification happens once, in person, through the product. A user places an order. They pick it up. They open the box. They tap their phone to the NFC chip inside the lid. Their anonymous user ID is linked to a confirmed purchase and a physical presence. That is the only path into the network.

No email. No phone number. No form. No alternative.

---

## The product

Chocolate-covered strawberries. Made to order. Picked up in person. The chocolate is always warm. The box becomes a coaster. The coaster remembers you.

---

## The network layers

**Layer 1 — The product**
Orders, standing orders, verified users, collection points.

**Layer 2 — The campaign**
Portraits taken at hair salons. Black and white. No product in the image. Credited Maison Fraise × [Salon Name] × [Partner]. Businesses enter the network only through a campaign. The campaign is the launch.

**Layer 3 — The map**
Every business launched through a campaign appears on the WHERE map. Every farm and supplier appears on the map. The full supply chain is visible. The map is the network made geographic.

**Layer 4 — The personal network**
Verified users who purchase a beacon box place a node at home. The personal layer of the WHERE map shows anonymous presence — other verified members who are also home. Mutual presence required. Neither party is visible unless both are home.

**Layer 5 — The supply chain**
The map becomes a transparency layer for food provenance. Every node in the chain — farm, processor, collection point, consumer — is verified by physical presence. Maison Fraise is the first participant. The platform is the infrastructure.

---

## The coaster

The box is designed to become a coaster. The NFC chip lives in the base. After verification, the coaster remains. Tap it to reorder. Tap it to migrate your account to a new device. The object has an ongoing relationship with the platform. People keep it.

---

## The beacon

A premium box tier includes a BLE beacon. Users place it at home. The home becomes an anonymous node. The personal network layer is only visible when the user is at home — detected by their own beacon. The layer disappears when they leave. Presence is mutual and voluntary.

---

## The campaign

Campaigns are portrait sessions held at hair salons. Always. Third businesses pay to be associated. Verified users sign up. Spots are limited. First come, first in. The portraits are black and white. The subject is never photographed with the product. The credit line is Maison Fraise × [Salon Name] × [Partner]. The business is launched onto the network when the portraits are published.

---

## The personal layer rules

- Only accessible when user's phone detects their own home beacon
- Other verified members only appear when their beacon also confirms they are home
- Mutual presence required — both parties must be home to be visible to each other
- Anonymous dots only — no names, no user IDs, no precise locations
- Approximate direction and distance only
- Purely observational in V4 — no interaction layer yet
- Opt-in only — users who did not purchase the beacon box never see this layer

---

## The supply chain rule

Every business on the platform — farm, supplier, collection point, campaign partner — began as a single verified user buying strawberries. The person comes before the business. Always.

---

## The micro-POS

The platform operates two payment rails alongside each other.

**Rail 1 — Stripe**
Pre-orders and standing orders placed through the app before pickup. Standard processing fees. This is the primary rail for the platform's core product.

**Rail 2 — Maison Fraise micro-POS**
Walk-up purchases at the counter for verified platform members only. Cash or card. Processed through the admin panel or a lightweight POS terminal. Fee is lower than Stripe — the business keeps more. Every transaction logged through the micro-POS feeds the member's legitimacy score. The micro-POS is supplementary — businesses keep their existing POS for general customers. Ours is only for verified members.

**The pitch to businesses:**
For your regular customers, keep using whatever you use. For verified Maison Fraise members, use our POS. You pay less per transaction. We log it to their network profile. They unlock higher tier offerings the more they transact with you.

**What the platform earns:**
- Stripe fees on pre-orders and standing orders
- Micro-POS transaction fees on verified member walk-up purchases across all network businesses
- At scale, the micro-POS becomes the primary revenue stream as the network grows

**The cash mechanic:**
The platform actively incentivises cash for walk-up purchases. This is a deliberate strategic decision, not an oversight.

When a verified member pays cash at the counter, the full amount stays between the customer and the business. Stripe gets nothing. The platform logs the transaction through the micro-POS at no fee. The member's legitimacy score builds. The business keeps everything.

The platform loses nothing on this transaction because it never expected to earn from it. The loss is the acquisition cost — cash walk-ups bring verified members in, build their standing, and eventually convert them to standing order subscribers on Stripe. That is where the revenue comes from.

The incentive is never advertised. The chocolatier says cash is preferred. Verified members learn over time that cash at the counter is the right move. It becomes known within the network without being a stated policy.

Pre-orders are always Stripe. Always prepaid. No cash option. The commitment mechanic requires upfront payment — strawberries are perishable, made to order, and dipped on confirmation of payment only.

Cash builds standing faster than card on walk-up purchases. This is an internal weighting, never communicated to members.

---

## The legitimacy score

A member's platform standing is calculated from behaviour, never shown as a number, never called a score. Things simply become available to verified members over time — offerings from businesses on the network that were not visible before. There is no locked door, no points counter, no explicit tier system. The platform recognises consistent presence without announcing that it is watching.

**What builds standing:**
- Verified status — the foundation
- Order frequency and consistency — regular intervals matter more than volume
- Standing order active — the strongest single signal of commitment
- Cash transactions logged at the counter — physical presence beyond pickup
- Campaign participation — signed up, attended, photographed
- Time as a verified member
- Coaster activity — reorders via NFC tap signal ongoing engagement
- Micro-POS transactions at partner businesses

**What standing unlocks:**
Businesses on the network set their own thresholds invisibly. A verified member browsing the WHERE map sees offerings they qualify for and nothing else. Higher standing unlocks access to offerings from businesses on the network — special configurations, reserved time slots, campaign priority, things that are never advertised and never explained. They simply appear.

---

## The pocket network

Filed for post-V5. A delay-tolerant mesh communication layer built on the verified user base. Messages travel through the city at the speed of human movement. BLE between verified devices. No cell network required. The packets travel in people's pockets.

---

## Version roadmap

**V1** — Orders, 7-step flow, iOS app, seed data. ✓ In Apple review.

**V2** — Live API, Stripe payments, NFC box verification, geofence notification at pickup points, standing orders pickup-only personal and gift, AI gift note generator, anonymous user IDs no personal data, verified profiles, admin panel, WHERE map and Campaign concept visible but empty.

**V3** — Campaign system live, portrait archive, business map populated, BLE beacons at business locations, digital invitations when verified users are near partner businesses, push notifications for campaigns, photographed badge, joint campaigns, box designed as coaster with NFC in base.

**V4** — Micro-POS, transaction history, automated campaign eligibility, personal beacon layer with mutual presence rule, personal map layer in WHERE, geographic gift routing for standing orders, Stripe Connect payouts, coaster reorder tap, farm and supplier pins on map, beacon management in admin.

**V5** — Multi-city, cross-merchant verified identity, salon network as verification hubs, third party API, interaction layer on personal network, supply chain transparency platform, global beacon infrastructure.

**Post-V5** — The Pocket Network.

---

*Maison Fraise — One thing. Done well.*

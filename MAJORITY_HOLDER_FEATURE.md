# Majority Holder Dashboard Feature

## Overview
This feature adds a wallet detection system that automatically detects when a user connects with a mainnet wallet (SP address) and offers them access to an exclusive majority holder dashboard.

## Features Implemented

### 1. Wallet Detection Popup
- **Location**: Home page (`src/app/components/ClientHomePage.js`)
- **Trigger**: When a user connects a wallet with an SP address (mainnet)
- **Behavior**: 
  - Shows a popup asking "Would you like to view the majority holder dashboard?"
  - Only shows once per session (stored in localStorage)
  - Provides "Yes, View Dashboard" and "No, Thanks" options

### 2. Majority Holder Dashboard
- **Location**: `/majority-holder-dashboard` (`src/app/majority-holder-dashboard/page.js`)
- **Features**:
  - Displays dummy MAS Sats balance (12.5 billion sats = 12.5 BTC)
  - Shows USD value ($750,000)
  - Displays holder ranking (#1)
  - Quick action buttons to trade MAS or return home
  - Responsive design with modern UI

### 3. Dummy Data
The dashboard currently displays:
- **MAS Sats Balance**: 1,250,000,000 sats
- **BTC Equivalent**: 12.5 BTC
- **USD Value**: $750,000
- **Holder Rank**: #1 (Top MAS Holder)

## Technical Implementation

### Wallet Detection Logic
```javascript
// Check if SP address is detected and show majority holder popup
if (savedAddress && savedAddress.startsWith('SP') && !localStorage.getItem('majorityHolderPopupShown')) {
  setShowMajorityHolderPopup(true);
  localStorage.setItem('majorityHolderPopupShown', 'true');
}
```

### Popup State Management
- Added `showMajorityHolderPopup` state to ClientHomePage
- Popup appears when SP address is detected
- Uses localStorage to prevent showing multiple times

### Dashboard Features
- Responsive grid layout for balance cards
- Gradient backgrounds and modern styling
- Quick action buttons with hover effects
- Disclaimer about dummy data

## User Flow
1. User visits home page
2. User connects mainnet wallet (SP address)
3. Popup appears: "Majority Holder Detected!"
4. User clicks "Yes, View Dashboard"
5. User is taken to `/majority-holder-dashboard`
6. Dashboard shows dummy balance data and holder information

## Future Enhancements
- Integrate real API calls for balance data
- Add more dashboard features (trading history, portfolio charts)
- Implement real holder ranking system
- Add notifications for balance changes
- Include transaction history

## Files Modified
- `src/app/components/ClientHomePage.js` - Added wallet detection and popup
- `src/app/majority-holder-dashboard/page.js` - Created new dashboard page

## Testing
To test the feature:
1. Connect a mainnet wallet (address starting with "SP")
2. The popup should appear automatically
3. Click "Yes, View Dashboard" to see the dashboard
4. The popup should not appear again in the same session

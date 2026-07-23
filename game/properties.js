// Indian Cities & States Board Configuration (40 tiles)
// Clockwise layout starting from START at index 0 (Top-Left corner)

export const GAME_CONFIG = {
    PASS_GO_REWARD: 200,       // Cash rewarded when passing START
    JAIL_BAIL_FINE: 50,        // Cash cost to pay bail
    TAX_GST_AMOUNT: 150,       // GST Tax amount
    TAX_WEALTH_AMOUNT: 200     // Wealth Tax amount
};

export const surpriseCards = [
    { text: '🎬 You won a Bollywood dance competition! Collect ₹200', amount: 200, action: 'add' },
    { text: '🛺 Scooter Thrible-riding fine! Pay traffic police ₹100', amount: -100, action: 'deduct' },
    { text: '🥟 Samosa party for your friends! Pay ₹50', amount: -50, action: 'deduct' },
    { text: '🌾 Bumper harvest on your Maharashtra farmland! Collect ₹150', amount: 150, action: 'add' },
    { text: '👮 Caught traveling without a ticket! Go straight to Jail.', amount: 0, action: 'go_to_jail' }
];

export const treasureCards = [
    { text: '💻 Silicon Valley Bangalore Dividend payout! Collect ₹100', amount: 100, action: 'add' },
    { text: '🏖️ Goa shack cancelation refund! Collect ₹120', amount: 120, action: 'add' },
    { text: '💎 Found a raw diamond in Surat! Collect ₹250', amount: 250, action: 'add' },
    { text: '🥭 Gifted a basket of Devgad Alphonso mangoes! Collect ₹50', amount: 50, action: 'add' },
    { text: '🎁 Received a family wedding cash gift! Collect ₹150', amount: 150, action: 'add' }
];

export const boardData = [
    // CORNER: TOP-LEFT (Index 0)
    { id: 0, type: 'special', name: 'START', description: 'Collect ₹200 on passing', icon: '🏁' },

    // TOP ROW (Indices 1-9)
    { id: 1, type: 'property', name: 'Vizag', state: 'Andhra Pradesh', color: '#8b5a2b', price: 300, baseRent: 28, housePrice: 200, icon: '🚢', houseIcon: '⛺', hotelIcon: '🛕' },
    { id: 2, type: 'special', name: 'Surprise', description: 'Draw a card', icon: '❓' },
    { id: 3, type: 'property', name: 'Vijayawada', state: 'Andhra Pradesh', color: '#8b5a2b', price: 320, baseRent: 30, housePrice: 200, icon: '🌉', houseIcon: '⛺', hotelIcon: '🛕' },
    { id: 4, type: 'special', name: 'Stock Market', description: 'Real-time Stock Betting', icon: '📈' },
    { id: 5, type: 'airport', name: 'Kempegowda AP', state: 'Airports', color: '#7f8c8d', price: 200, baseRent: 25, icon: '✈️' },
    { id: 6, type: 'property', name: 'Pune', state: 'Maharashtra', color: '#e74c3c', price: 100, baseRent: 8, housePrice: 50, icon: '🎓', houseIcon: '🏠', hotelIcon: '🏰' },
    { id: 7, type: 'special', name: 'GST Tax', description: 'Pay ₹150', icon: '💸' },
    { id: 8, type: 'property', name: 'Mumbai', state: 'Maharashtra', color: '#e74c3c', price: 120, baseRent: 10, housePrice: 50, icon: '🎬', houseIcon: '🏠', hotelIcon: '🏰' },
    { id: 9, type: 'property', name: 'Nagpur', state: 'Maharashtra', color: '#e74c3c', price: 140, baseRent: 12, housePrice: 100, icon: '🍊', houseIcon: '🏠', hotelIcon: '🏰' },

    // CORNER: TOP-RIGHT (Index 10)
    { id: 10, type: 'special', name: 'Jail', description: 'Just Visiting / In Prison', icon: '⛓️' },

    // RIGHT SIDE (Indices 11-19)
    { id: 11, type: 'property', name: 'Noida', state: 'Delhi', color: '#3498db', price: 140, baseRent: 12, housePrice: 100, icon: '🏭', houseIcon: '🏢', hotelIcon: '🏬' },
    { id: 12, type: 'utility', name: 'Power Grid', state: 'Utilities', color: '#8e44ad', price: 150, baseRent: 10, icon: '⚡' },
    { id: 13, type: 'property', name: 'New Delhi', state: 'Delhi', color: '#3498db', price: 160, baseRent: 14, housePrice: 100, icon: '🏛️', houseIcon: '🏢', hotelIcon: '🏬' },
    { id: 14, type: 'property', name: 'Gurugram', state: 'Delhi', color: '#3498db', price: 180, baseRent: 16, housePrice: 100, icon: '🏢', houseIcon: '🏢', hotelIcon: '🏬' },
    { id: 15, type: 'airport', name: 'Shivaji AP', state: 'Airports', color: '#7f8c8d', price: 200, baseRent: 25, icon: '✈️' },
    { id: 16, type: 'property', name: 'Surat', state: 'Gujarat', color: '#2ecc71', price: 180, baseRent: 16, housePrice: 100, icon: '💎', houseIcon: '🏡', hotelIcon: '🕌' },
    { id: 17, type: 'special', name: 'Treasure', description: 'Draw a card', icon: '🪙' },
    { id: 18, type: 'property', name: 'Ahmedabad', state: 'Gujarat', color: '#2ecc71', price: 200, baseRent: 18, housePrice: 100, icon: '🪁', houseIcon: '🏡', hotelIcon: '🕌' },
    { id: 19, type: 'property', name: 'Vadodara', state: 'Gujarat', color: '#2ecc71', price: 220, baseRent: 20, housePrice: 150, icon: '👑', houseIcon: '🏡', hotelIcon: '🕌' },

    // CORNER: BOTTOM-RIGHT (Index 20)
    { id: 20, type: 'special', name: 'Vacation', description: 'Free Rest Stop', icon: '🌴' },

    // BOTTOM ROW (Indices 21-29)
    { id: 21, type: 'property', name: 'Ooty', state: 'Tamil Nadu', color: '#e67e22', price: 220, baseRent: 20, housePrice: 150, icon: '🍃', houseIcon: '🏯', hotelIcon: '🛕' },
    { id: 22, type: 'property', name: 'Coimbatore', state: 'Tamil Nadu', color: '#e67e22', price: 240, baseRent: 22, housePrice: 150, icon: '⚙️', houseIcon: '🏯', hotelIcon: '🛕' },
    { id: 23, type: 'property', name: 'Chennai', state: 'Tamil Nadu', color: '#e67e22', price: 260, baseRent: 24, housePrice: 150, icon: '🍛', houseIcon: '🏯', hotelIcon: '🛕' },
    { id: 24, type: 'special', name: 'Stock Market', description: 'Real-time Stock Betting', icon: '📈' },
    { id: 25, type: 'airport', name: 'Indira Gandhi AP', state: 'Airports', color: '#7f8c8d', price: 200, baseRent: 25, icon: '✈️' },
    { id: 26, type: 'property', name: 'Kochi', state: 'Kerala', color: '#e24c9c', price: 280, baseRent: 26, housePrice: 150, icon: '🛳️', houseIcon: '🛶', hotelIcon: '🌴' },
    { id: 27, type: 'property', name: 'Trivandrum', state: 'Kerala', color: '#e24c9c', price: 300, baseRent: 28, housePrice: 200, icon: '🛕', houseIcon: '🛶', hotelIcon: '🌴' },
    { id: 28, type: 'utility', name: 'Jal Board', state: 'Utilities', color: '#8e44ad', price: 150, baseRent: 10, icon: '🚰' },
    { id: 29, type: 'property', name: 'Munnar', state: 'Kerala', color: '#e24c9c', price: 260, baseRent: 24, housePrice: 150, icon: '⛰️', houseIcon: '🛶', hotelIcon: '🌴' },

    // CORNER: BOTTOM-LEFT (Index 30)
    { id: 30, type: 'special', name: 'Go to Prison', description: 'Locked behind bars', icon: '👮' },

    // LEFT COLUMN (Indices 31-39)
    { id: 31, type: 'property', name: 'Mangaluru', state: 'Karnataka', color: '#f1c40f', price: 60, baseRent: 4, housePrice: 50, icon: '⚓', houseIcon: '🛖', hotelIcon: '🏛️' },
    { id: 32, type: 'property', name: 'Mysuru', state: 'Karnataka', color: '#f1c40f', price: 60, baseRent: 4, housePrice: 50, icon: '🪵', houseIcon: '🛖', hotelIcon: '🏛️' },
    { id: 33, type: 'special', name: 'Treasure', description: 'Draw a card', icon: '🪙' },
    { id: 34, type: 'property', name: 'Bengaluru', state: 'Karnataka', color: '#f1c40f', price: 80, baseRent: 6, housePrice: 50, icon: '💻', houseIcon: '🛖', hotelIcon: '🏛️' },
    { id: 35, type: 'special', name: 'Surprise', description: 'Draw a card', icon: '❓' },
    { id: 36, type: 'airport', name: 'Netaji Subhash AP', state: 'Airports', color: '#7f8c8d', price: 200, baseRent: 25, icon: '✈️' },
    { id: 37, type: 'property', name: 'Panaji', state: 'Goa', color: '#16a085', price: 350, baseRent: 35, housePrice: 200, icon: '⛪', houseIcon: '⛪', hotelIcon: '⛵' },
    { id: 38, type: 'special', name: 'Wealth Tax', description: 'Pay ₹200', icon: '💸' },
    { id: 39, type: 'property', name: 'Calangute', state: 'Goa', color: '#16a085', price: 400, baseRent: 50, housePrice: 200, icon: '🏖️', houseIcon: '⛪', hotelIcon: '⛵' }
];

// Helper to find properties in a state
export const getPropertiesByState = (stateName) => {
    return boardData.filter(tile => tile.state === stateName);
};
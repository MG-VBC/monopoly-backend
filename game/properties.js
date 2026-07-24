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
    { text: '🛺 Auto-rickshaw reckless driving fine! Pay traffic police ₹100', amount: -100, action: 'deduct' },
    { text: '🥟 Hosted samosa party for your colony! Pay ₹50', amount: -50, action: 'deduct' },
    { text: '🌾 Bumper harvest on your Maharashtra farmland! Collect ₹150', amount: 150, action: 'add' },
    { text: '👮 Caught traveling without a ticket! Go straight to Jail.', amount: 0, action: 'go_to_jail' },
    { text: '🏏 Won a gully cricket bet! Collect ₹75', amount: 75, action: 'add' },
    { text: '📱 Your viral social media post earned ad revenue! Collect ₹125', amount: 125, action: 'add' },
    { text: '🎪 Festival pandal decoration overrun! Pay ₹80', amount: -80, action: 'deduct' },
    { text: '🚌 KSRTC bus delayed — refund voucher! Collect ₹30', amount: 30, action: 'add' },
    { text: '📺 Your startup featured on Shark Tank India! Collect ₹300', amount: 300, action: 'add' },
    { text: '💧 Water tanker bill unpaid by tenant — you cover it. Pay ₹60', amount: -60, action: 'deduct' },
    { text: '🎰 Lost your bet at the local matka den! Pay ₹90', amount: -90, action: 'deduct' },
    { text: '🏅 Received government skill development incentive! Collect ₹100', amount: 100, action: 'add' },
    { text: '🌶️ Won the biryani cook-off championship! Collect ₹180', amount: 180, action: 'add' },
    { text: '🔧 Emergency home repair during monsoon! Pay ₹120', amount: -120, action: 'deduct' },
    { text: '🎤 Hosted a local Antakshari show. Collect entry fees ₹85', amount: 85, action: 'add' },
    { text: '🛵 Traffic challan riding without helmet ! Pay ₹50', amount: -50, action: 'deduct' },
    { text: '🪁 Uttarayan kite festival earnings! Collect ₹110', amount: 110, action: 'add' },
    { text: '🚨 Tax raid on your property! Pay unexpected dues ₹200', amount: -200, action: 'deduct' },
    { text: '🎊 Relative\'s wedding cash envelope! Collect ₹250', amount: 250, action: 'add' },
    { text: '🥵 Bigg Boss double eviction — housemates fine you for hogging the loo! Pay ₹70', amount: -70, action: 'deduct' },
    { text: '☕ You opened a chai tapri outside an IT park. Daily orders flood in! Collect ₹160', amount: 160, action: 'add' },
    { text: '💸 Found a ₹500 note inside your old jeans after the demonetisation scare. Collect ₹500', amount: 500, action: 'add' },
    { text: '🕴️ Ghost of your unpaid EMI haunts the bank. Extra penalty — Pay ₹130', amount: -130, action: 'deduct' },
    { text: '🐄 Your cow won Best Dairy Breed at the state fair! Collect ₹210', amount: 210, action: 'add' },
    { text: '🤚 Jugaad fix on the office AC saved everyone. Collect appreciation bonus ₹115', amount: 115, action: 'add' },
    { text: '💔 Your arranged marriage broke off — caterers demand cancellation fee. Pay ₹175', amount: -175, action: 'deduct' },
    { text: '📸 Reels of you doing garba went viral! Brand deal signed. Collect ₹220', amount: 220, action: 'add' },
    { text: '🔔 Neighbour blasted speakers at 2 AM. Court noise fine on you somehow. Pay ₹85', amount: -85, action: 'deduct' },
    { text: '🚗 Your Uber driver rated you 1 star. You lost Uber premium access. Pay rebooking fee ₹40', amount: -40, action: 'deduct' },
    { text: '🦸 Dressed as Chhota Bheem for nephew\'s birthday — kids loved it, parents paid! Collect ₹90', amount: 90, action: 'add' },
    { text: '🐮 Sacred temple cow ate your crop report. File replacement costs. Pay ₹55', amount: -55, action: 'deduct' },
    { text: '🕺 You accidentally joined a senior citizens\' flash mob in Lajpat Nagar. Video went viral! Collect ₹145', amount: 145, action: 'add' },
    { text: '💳 Your UPI app glitched and double-transferred. Bank reversal delayed. Pay ₹65', amount: -65, action: 'deduct' },
    { text: '🎲 Won the office Diwali tambola jackpot! Collect ₹320', amount: 320, action: 'add' },
    { text: '🛫 Airline lost your luggage en route to Chennai. Compensation cheque! Collect ₹135', amount: 135, action: 'add' },
    { text: '🧠 Your ChatGPT subscription was billed in USD. Conversion rate shock! Pay ₹95', amount: -95, action: 'deduct' },
    { text: '🕹️ You won a gaming tournament playing BGMI on your chachaji\'s old phone! Collect ₹190', amount: 190, action: 'add' },
    { text: '🏗️ Opened a cloud kitchen in your apartment. Municipal notice arrived. Pay fine ₹110', amount: -110, action: 'deduct' },
    { text: '👨‍💻 You gave freelance dev advice at a dhaba. Client paid in advance! Collect ₹250', amount: 250, action: 'add' },
];

export const treasureCards = [
    { text: '💻 Silicon Valley Bangalore dividend payout! Collect ₹100', amount: 100, action: 'add' },
    { text: '🏖️ Goa shack cancellation refund! Collect ₹120', amount: 120, action: 'add' },
    { text: '💎 Found a raw diamond in Surat! Collect ₹250', amount: 250, action: 'add' },
    { text: '🥭 Gifted a basket of Devgad Alphonso mangoes! Collect ₹50', amount: 50, action: 'add' },
    { text: '🎁 Received a family wedding cash gift! Collect ₹150', amount: 150, action: 'add' },
    { text: '🏦 Fixed deposit matured! Collect ₹200', amount: 200, action: 'add' },
    { text: '⛏️ Mineral rights discovered under your land! Collect ₹175', amount: 175, action: 'add' },
    { text: '🛕 Temple trust donation returned to community. Collect ₹90', amount: 90, action: 'add' },
    { text: '🚀 ISRO tech transfer royalty payment! Collect ₹140', amount: 140, action: 'add' },
    { text: '🌿 Ayurvedic herbal export contract signed! Collect ₹130', amount: 130, action: 'add' },
    { text: '📦 Amazon seller bonus for festive season! Collect ₹110', amount: 110, action: 'add' },
    { text: '🎬 Your indie film won a National Award! Collect ₹300', amount: 300, action: 'add' },
    { text: '🪙 Old coins sold at Chor Bazaar auction! Collect ₹160', amount: 160, action: 'add' },
    { text: '🏡 Property value appreciated! Collect appreciation premium ₹180', amount: 180, action: 'add' },
    { text: '🚜 Government farm loan waiver approved! Collect ₹220', amount: 220, action: 'add' },
    { text: '📸 Wedding photography gig in Udaipur! Collect ₹95', amount: 95, action: 'add' },
    { text: '🎓 Scholarship fund disbursement! Collect ₹125', amount: 125, action: 'add' },
    { text: '🧶 Handloom export subsidy from MSME! Collect ₹85', amount: 85, action: 'add' },
    { text: '🌊 Sea-facing plot rental income! Collect ₹145', amount: 145, action: 'add' },
    { text: '🛍️ GST refund on business purchases! Collect ₹75', amount: 75, action: 'add' },
    { text: '🏆 IPL fantasy cricket jackpot winner! Collect ₹350', amount: 350, action: 'add' },
    { text: '📲 Zepto delivered wrong order — full cashback + bonus! Collect ₹60', amount: 60, action: 'add' },
    { text: '📞 Jio recharge refund for network outage week! Collect ₹40', amount: 40, action: 'add' },
    { text: '👀 Your hidden cam prank on relatives went viral. YouTube monetised! Collect ₹195', amount: 195, action: 'add' },
    { text: '🏰 Ancestral haveli tourism listed on Airbnb. First booking income! Collect ₹260', amount: 260, action: 'add' },
    { text: '📊 NSE dividend from forgotten demat account found! Collect ₹235', amount: 235, action: 'add' },
    { text: '🍕 Cloud kitchen gets featured on Swiggy homepage. Surge orders! Collect ₹170', amount: 170, action: 'add' },
    { text: '🚲 Won a cycling rally around Cubbon Park. Prize money! Collect ₹105', amount: 105, action: 'add' },
    { text: '🤝 Brokered a property deal between neighbours. Commission paid! Collect ₹215', amount: 215, action: 'add' },
    { text: '🐴 Horse racing winning ticket at Mahalaxmi! Collect ₹280', amount: 280, action: 'add' },
    { text: '🌻 Organic terrace farm produce sold at premium. Collect ₹115', amount: 115, action: 'add' },
    { text: '💼 Consulting gig for a PSU company — single invoice. Collect ₹230', amount: 230, action: 'add' },
    { text: '🚈 Mumbai local first-class refund for cancelled train! Collect ₹45', amount: 45, action: 'add' },
    { text: '🧙‍♂️ Astrologer predicted your business would boom — it did! Lucky charm bonus. Collect ₹155', amount: 155, action: 'add' },
    { text: '🍭 Mithai shop sold out during Diwali! Extra profit. Collect ₹185', amount: 185, action: 'add' },
    { text: '🐠 Caught a massive rohu in the Brahmaputra — restaurant paid top rupee! Collect ₹80', amount: 80, action: 'add' },
    { text: '🧾 Stale naan? No — ancient recipe! Food historian paid big. Collect ₹205', amount: 205, action: 'add' },
    { text: '📰 Your letter to PM got published in Times of India. Clout monetised! Collect ₹135', amount: 135, action: 'add' },
    { text: '🥳 Birthday gifts from your extended family — every uncle chipped in! Collect ₹290', amount: 290, action: 'add' },
    { text: '🐘 Named a baby elephant at a wildlife sanctuary. Sponsorship money returned! Collect ₹165', amount: 165, action: 'add' },
];

export const boardData = [
    // CORNER: TOP-LEFT (Index 0)
    { id: 0, type: 'special', name: 'START', description: 'Collect ₹200 on passing', icon: '🏁' },

    // TOP ROW (Indices 1-9)
    { id: 1, type: 'property', name: 'Vizag', state: 'Andhra Pradesh', color: '#8b5a2b', price: 60, baseRent: 6, housePrice: 50, icon: '🚢', houseIcon: '⛺', hotelIcon: '🛕' },
    { id: 2, type: 'special', name: 'Surprise', description: 'Draw a card', icon: '❓' },
    { id: 3, type: 'property', name: 'Vijayawada', state: 'Andhra Pradesh', color: '#8b5a2b', price: 80, baseRent: 4, housePrice: 50, icon: '🌉', houseIcon: '⛺', hotelIcon: '🛕' },
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
    { id: 31, type: 'property', name: 'Mangaluru', state: 'Karnataka', color: '#f1c40f', price: 290, baseRent: 29, housePrice: 150, icon: '⚓', houseIcon: '🛖', hotelIcon: '🏛️' },
    { id: 32, type: 'property', name: 'Mysuru', state: 'Karnataka', color: '#f1c40f', price: 300, baseRent: 30, housePrice: 150, icon: '🪵', houseIcon: '🛖', hotelIcon: '🏛️' },
    { id: 33, type: 'special', name: 'Treasure', description: 'Draw a card', icon: '🪙' },
    { id: 34, type: 'property', name: 'Bengaluru', state: 'Karnataka', color: '#f1c40f', price: 320, baseRent: 32, housePrice: 150, icon: '💻', houseIcon: '🛖', hotelIcon: '🏛️' },
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
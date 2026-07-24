import { boardData, getPropertiesByState, GAME_CONFIG, AMENITY_CONFIG, surpriseCards, treasureCards } from './properties.js';

// Roll two dice and return their separate values and total
export const rollDice = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    return { d1, d2, total: d1 + d2 };
};

// Move player and credit PASS_GO_REWARD if they pass START
export const movePlayer = (currentPosition, diceValue, player) => {
    const newPosition = (currentPosition + diceValue) % boardData.length;
    if (newPosition < currentPosition) {
        // Passed START (GO)
        player.money += GAME_CONFIG.PASS_GO_REWARD;
        return { newPosition, passedGo: true };
    }
    return { newPosition, passedGo: false };
};

// Checks if a player owns all properties in a state
export const checkStateMonopoly = (playerId, stateName, gameStateRoom) => {
    const stateProperties = getPropertiesByState(stateName);
    if (stateProperties.length === 0) return false;

    return stateProperties.every(prop => {
        return gameStateRoom.ownedProperties[prop.id]?.owner === playerId;
    });
};

// Calculate rent based on monopoly status, houses, and mortgaged status
export const calculateRent = (propertyId, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    if (!propertyDef) return 0;

    const ownedProp = gameStateRoom.ownedProperties[propertyId];
    if (!ownedProp) return 0;

    // Mortgaged properties do not accumulate rent
    if (ownedProp.mortgaged) return 0;

    const ownerId = ownedProp.owner;
    // No rent collected while owner is in jail!
    const owner = gameStateRoom.players[ownerId];
    if (owner && owner.inJail) return 0;

    if (propertyDef.type === 'airport') {
        const ownedAirports = boardData.filter(tile => {
            return tile.type === 'airport' && gameStateRoom.ownedProperties[tile.id]?.owner === ownerId;
        }).length;
        const airportRents = [0, 25, 50, 100, 200];
        return airportRents[ownedAirports] || 25;
    }

    if (propertyDef.type === 'utility') {
        const ownedUtilities = boardData.filter(tile => {
            return tile.type === 'utility' && gameStateRoom.ownedProperties[tile.id]?.owner === ownerId;
        }).length;
        return ownedUtilities === 2 ? 75 : 25;
    }

    if (propertyDef.type === 'property') {
        const houses = ownedProp.houses || 0;
        let rent = propertyDef.baseRent;

        if (houses === 0) {
            // Double rent if player has monopoly of this state
            const ownsAll = checkStateMonopoly(ownerId, propertyDef.state, gameStateRoom);
            if (ownsAll) {
                rent *= 2;
            }
        } else {
            // Multipliers for houses: 1 house = 4x, 2 houses = 10x, 3 houses = 20x, 4 houses = 30x, 5 houses (hotel) = 40x
            const multipliers = [1, 4, 10, 20, 30, 40];
            const mult = multipliers[houses] || multipliers[multipliers.length - 1];
            rent = propertyDef.baseRent * mult;
        }

        // ⭐ VIP Bonus: +10% rent if the owner is currently VIP
        if (gameStateRoom.vipPlayerId === ownerId && (gameStateRoom.vipTurnsLeft || 0) > 0) {
            rent = Math.ceil(rent * 1.1);
        }

        // 🔌 Amenity Rent Bonuses
        if (ownedProp.amenities) {
            if (ownedProp.amenities.evCharging) rent += (AMENITY_CONFIG.evCharging?.rentBonus || 30);
            if (ownedProp.amenities.rooftopSolar) rent += (AMENITY_CONFIG.rooftopSolar?.rentBonus || 40);
            if (ownedProp.amenities.cellTower) rent += (AMENITY_CONFIG.cellTower?.rentBonus || 50);
        }

        return rent;
    }

    return 0;
};

// Handle consequences of landing on a tile
export const handlePlayerLanding = (playerId, position, gameStateRoom) => {
    const tile = boardData[position];
    if (!tile) return { action: 'none', message: 'Unknown tile' };

    const player = gameStateRoom.players[playerId];

    if (tile.type === 'special') {
        if (tile.name === 'START') {
            return { action: 'start', message: `Landed directly on START! Collected \u20b9${GAME_CONFIG.PASS_GO_REWARD}` };
        }
        if (tile.name === 'Go to Prison') {
            player.position = 10; // Move to Jail tile (index 10)
            player.inJail = true;
            player.jailTurns = 0;
            player.jailVisits = (player.jailVisits || 0) + 1;
            return { action: 'jail', message: 'Caught by police! Sent straight to Jail!' };
        }
        if (tile.name === 'GST Tax') {
            const hasSolar = Object.values(gameStateRoom.ownedProperties || {}).some(p => p.owner === playerId && p.amenities?.rooftopSolar);
            const baseTax = GAME_CONFIG.TAX_GST_AMOUNT;
            const taxAmount = hasSolar ? Math.floor(baseTax * 0.5) : baseTax;
            player.money -= taxAmount;
            gameStateRoom.vacationJackpot = (gameStateRoom.vacationJackpot || 0) + taxAmount;
            return { 
                action: 'tax', 
                amount: taxAmount, 
                message: hasSolar 
                    ? `☀️ Solar Green Credit! GST Tax reduced to ₹${taxAmount} (Vacation Pool: ₹${gameStateRoom.vacationJackpot})`
                    : `Paid GST Tax of ₹${taxAmount} (Accumulated in Vacation Pool: ₹${gameStateRoom.vacationJackpot})` 
            };
        }
        if (tile.name === 'Wealth Tax') {
            const hasSolar = Object.values(gameStateRoom.ownedProperties || {}).some(p => p.owner === playerId && p.amenities?.rooftopSolar);
            const baseTax = GAME_CONFIG.TAX_WEALTH_AMOUNT;
            const taxAmount = hasSolar ? Math.floor(baseTax * 0.5) : baseTax;
            player.money -= taxAmount;
            gameStateRoom.vacationJackpot = (gameStateRoom.vacationJackpot || 0) + taxAmount;
            return { 
                action: 'tax', 
                amount: taxAmount, 
                message: hasSolar 
                    ? `☀️ Solar Green Credit! Wealth Tax reduced to ₹${taxAmount} (Vacation Pool: ₹${gameStateRoom.vacationJackpot})`
                    : `Paid Wealth Tax of ₹${taxAmount} (Accumulated in Vacation Pool: ₹${gameStateRoom.vacationJackpot})` 
            };
        }
        if (tile.name === 'Jail') {
            return { action: 'jail_visit', message: player.inJail ? 'Locked in Jail' : 'Just visiting Jail' };
        }
        if (tile.name === 'Vacation') {
            const jackpot = gameStateRoom.vacationJackpot || 0;
            player.money += jackpot;
            gameStateRoom.vacationJackpot = 0;
            player.skipNextTurn = true;
            return { 
                action: 'vacation_jackpot', 
                amount: jackpot, 
                message: jackpot > 0
                    ? `🌴 ${player.name} landed on Vacation! Collected tax jackpot of ₹${jackpot} (Balance: ₹${player.money}). Will skip next round!`
                    : `🌴 ${player.name} landed on Vacation. No jackpot yet — taking a break! Will skip next round.`
            };
        }
        if (tile.name === 'Surprise' || tile.name === 'Treasure') {
            // Cards will be drawn in server.js to trigger card popups
            return { action: 'draw_card', type: tile.name };
        }
        if (tile.name === 'Stock Market') {
            return { action: 'stock_market', message: 'Landed on the Stock Market!' };
        }
        return { action: 'special', message: `Landed on ${tile.name}` };
    }

    // Handles airport, utility, and standard property tiles
    const ownedProp = gameStateRoom.ownedProperties[tile.id];
    if (!ownedProp) {
        // Available for purchase
        return { action: 'buy_opportunity', price: tile.price, message: `🏡 ${tile.name} is unowned — available to buy for ₹${tile.price}` };
    } else if (ownedProp.owner !== playerId) {
        if (ownedProp.mortgaged) {
            return { action: 'mortgaged_no_rent', message: `🏳️ ${player.name} landed on ${tile.name} (mortgaged, no rent paid!)` };
        }

        // Deduct rent
        const rent = calculateRent(tile.id, gameStateRoom);
        const ownerId = ownedProp.owner;
        const owner = gameStateRoom.players[ownerId];

        const rentPaid = rent;
        player.money -= rentPaid;
        if (owner) {
            owner.money += rentPaid;
            owner.rentCollected = (owner.rentCollected || 0) + rentPaid;
        }

        return {
            action: 'rent_paid',
            rent: rentPaid,
            ownerId,
            message: `💸 ${player.name} paid ₹${rentPaid} rent to ${owner ? owner.name : 'Owner'} for ${tile.name}. (Balance: ₹${player.money})`
        };
    } else {
        return { action: 'own_property', message: `📍 ${player.name} landed on their own property: ${tile.name}` };
    }
};

// Surprise and Treasure Deck Card Drawer
export const drawCard = (playerId, roomState, cardType) => {
    const deck = cardType === 'Treasure' ? treasureCards : surpriseCards;
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomIndex];
    const player = roomState.players[playerId];

    if (card.action === 'add') {
        player.money += card.amount;
    } else if (card.action === 'deduct') {
        player.money += card.amount; // card.amount is negative
    } else if (card.action === 'go_to_jail') {
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        player.jailVisits = (player.jailVisits || 0) + 1;
    }

    return card;
};

// Build house logic
export const buildHouse = (playerId, propertyId, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    const player = gameStateRoom.players[playerId];

    if (!propertyDef || propertyDef.type !== 'property') return { success: false, message: 'Not a buildable property' };
    if (!player) return { success: false, message: 'Player not found' };

    // 1. Check ownership
    const ownedProp = gameStateRoom.ownedProperties[propertyId];
    if (!ownedProp || ownedProp.owner !== playerId) {
        return { success: false, message: 'You do not own this property' };
    }

    // 2. Check monopoly
    if (!checkStateMonopoly(playerId, propertyDef.state, gameStateRoom)) {
        return { success: false, message: `You must own all properties in ${propertyDef.state} to build houses` };
    }

    // Check if any property in the state is mortgaged
    const stateProperties = getPropertiesByState(propertyDef.state);
    const anyMortgaged = stateProperties.some(prop => {
        return gameStateRoom.ownedProperties[prop.id]?.mortgaged === true;
    });
    if (anyMortgaged) {
        return { success: false, message: 'Cannot build upgrades while any property in the state is mortgaged!' };
    }

    // 3. Check mortgage status
    if (ownedProp.mortgaged) {
        return { success: false, message: 'Cannot build on a mortgaged property!' };
    }

    // 4. Check house limits (max 5 houses/hotel)
    const currentHouses = ownedProp.houses || 0;
    if (currentHouses >= 5) {
        return { success: false, message: 'Maximum upgrades (hotel) reached' };
    }

    // 5. Check money
    if (player.money < propertyDef.housePrice) {
        return { success: false, message: `Insufficient funds. House price is ₹${propertyDef.housePrice}` };
    }

    // Deduct and increment
    player.money -= propertyDef.housePrice;
    ownedProp.houses = currentHouses + 1;

    return {
        success: true,
        houses: ownedProp.houses,
        message: `Upgraded ${propertyDef.name} for ₹${propertyDef.housePrice} (Houses: ${ownedProp.houses})`
    };
};

// Buy unique property amenity (EV Charging, Rooftop Solar, 5G Cell Tower)
export const buyAmenity = (playerId, propertyId, amenityType, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    const player = gameStateRoom.players[playerId];
    const ownedProp = gameStateRoom.ownedProperties[propertyId];

    if (!propertyDef || propertyDef.type !== 'property') {
        return { success: false, message: 'Not a valid property tile' };
    }
    if (!player) return { success: false, message: 'Player not found' };
    if (!ownedProp || ownedProp.owner !== playerId) {
        return { success: false, message: 'You do not own this property' };
    }
    if (ownedProp.mortgaged) {
        return { success: false, message: 'Cannot upgrade mortgaged property!' };
    }

    const config = AMENITY_CONFIG[amenityType];
    if (!config) return { success: false, message: 'Invalid amenity type' };

    if (!ownedProp.amenities) {
        ownedProp.amenities = {};
    }
    if (ownedProp.amenities[amenityType]) {
        return { success: false, message: `${config.name} is already installed on ${propertyDef.name}!` };
    }

    if (player.money < config.price) {
        return { success: false, message: `Insufficient funds. ${config.name} costs ₹${config.price}` };
    }

    player.money -= config.price;
    ownedProp.amenities[amenityType] = true;

    return {
        success: true,
        amenityType,
        name: config.name,
        icon: config.icon,
        message: `Installed ${config.icon} ${config.name} on ${propertyDef.name} for ₹${config.price}!`
    };
};

// Sell property logic (50% value of property + 50% value of houses)
export const sellProperty = (playerId, propertyId, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    const player = gameStateRoom.players[playerId];
    const ownedProp = gameStateRoom.ownedProperties[propertyId];

    if (!propertyDef || !player || !ownedProp || ownedProp.owner !== playerId) {
        return { success: false, message: 'Invalid sell operation' };
    }

    const currentHouses = ownedProp.houses || 0;
    const sellValue = Math.floor(propertyDef.price / 2) + Math.floor((currentHouses * propertyDef.housePrice) / 2);

    // Refund and remove property
    player.money += sellValue;
    delete gameStateRoom.ownedProperties[propertyId];

    return {
        success: true,
        sellValue,
        message: `Sold ${propertyDef.name} back to the bank for ₹${sellValue}.`
    };
};

// Sell house/upgrade logic (yielding 50% refund of the house price)
export const sellHouse = (playerId, propertyId, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    const player = gameStateRoom.players[playerId];
    const ownedProp = gameStateRoom.ownedProperties[propertyId];

    if (!propertyDef || !player || !ownedProp || ownedProp.owner !== playerId) {
        return { success: false, message: 'Invalid sell house operation' };
    }

    const currentHouses = ownedProp.houses || 0;
    if (currentHouses <= 0) {
        return { success: false, message: 'No houses to sell on this property' };
    }

    const refund = Math.floor(propertyDef.housePrice / 2);
    player.money += refund;
    ownedProp.houses = currentHouses - 1;

    return {
        success: true,
        refund,
        houses: ownedProp.houses,
        message: `Sold 1 house/upgrade on ${propertyDef.name} for ₹${refund}. (Remaining: ${ownedProp.houses})`
    };
};

// Mortgage property logic (Refunding 50% cash to owner)
export const mortgageProperty = (playerId, propertyId, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    const player = gameStateRoom.players[playerId];
    const ownedProp = gameStateRoom.ownedProperties[propertyId];

    if (!propertyDef || !player || !ownedProp || ownedProp.owner !== playerId) {
        return { success: false, message: 'Invalid mortgage operation' };
    }

    if (ownedProp.mortgaged) {
        return { success: false, message: 'Property is already mortgaged!' };
    }

    if (ownedProp.houses > 0) {
        return { success: false, message: 'Must sell all houses before mortgaging property!' };
    }

    const mortgageValue = Math.floor(propertyDef.price / 2);
    player.money += mortgageValue;
    ownedProp.mortgaged = true;

    return {
        success: true,
        mortgageValue,
        message: `Mortgaged ${propertyDef.name} for ₹${mortgageValue}.`
    };
};

// Unmortgage property logic (Deducting 60% cash from owner)
export const unmortgageProperty = (playerId, propertyId, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    const player = gameStateRoom.players[playerId];
    const ownedProp = gameStateRoom.ownedProperties[propertyId];

    if (!propertyDef || !player || !ownedProp || ownedProp.owner !== playerId) {
        return { success: false, message: 'Invalid unmortgage operation' };
    }

    if (!ownedProp.mortgaged) {
        return { success: false, message: 'Property is not mortgaged!' };
    }

    const unmortgageCost = Math.floor((propertyDef.price / 2) * 1.2); // 50% principal + 10% interest = 60% original price
    if (player.money < unmortgageCost) {
        return { success: false, message: `Insufficient funds! Need ₹${unmortgageCost} to unmortgage.` };
    }

    player.money -= unmortgageCost;
    ownedProp.mortgaged = false;

    return {
        success: true,
        unmortgageCost,
        message: `Unmortgaged ${propertyDef.name} for ₹${unmortgageCost}.`
    };
};

// Trade executant helper
export const executeTrade = (playerAId, playerBId, tradeOffer, gameStateRoom) => {
    const playerA = gameStateRoom.players[playerAId];
    const playerB = gameStateRoom.players[playerBId];
    if (!playerA || !playerB) return { success: false, message: "Players not found" };

    // Check cash limits
    if (playerA.money < tradeOffer.offerCash) {
        return { success: false, message: `${playerA.name} has insufficient cash.` };
    }
    if (playerB.money < tradeOffer.requestCash) {
        return { success: false, message: `${playerB.name} has insufficient cash.` };
    }

    // Verify offered property ownerships and state group houses
    for (const propId of tradeOffer.offerProperties) {
        const owned = gameStateRoom.ownedProperties[propId];
        if (!owned || owned.owner !== playerAId) {
            return { success: false, message: `${playerA.name} does not own the offered property ${boardData[propId]?.name || propId}.` };
        }
        const tile = boardData[propId];
        if (tile && tile.state) {
            const stateProperties = getPropertiesByState(tile.state);
            const hasHousesInState = stateProperties.some(p => (gameStateRoom.ownedProperties[p.id]?.houses || 0) > 0);
            if (hasHousesInState) {
                return { success: false, message: `Cannot trade ${tile.name}! Must sell all houses in ${tile.state} first.` };
            }
        }
    }

    // Verify requested property ownerships and state group houses
    for (const propId of tradeOffer.requestProperties) {
        const owned = gameStateRoom.ownedProperties[propId];
        if (!owned || owned.owner !== playerBId) {
            return { success: false, message: `${playerB.name} does not own the requested property ${boardData[propId]?.name || propId}.` };
        }
        const tile = boardData[propId];
        if (tile && tile.state) {
            const stateProperties = getPropertiesByState(tile.state);
            const hasHousesInState = stateProperties.some(p => (gameStateRoom.ownedProperties[p.id]?.houses || 0) > 0);
            if (hasHousesInState) {
                return { success: false, message: `Cannot trade ${tile.name}! Must sell all houses in ${tile.state} first.` };
            }
        }
    }

    // Cash transfers
    playerA.money -= tradeOffer.offerCash;
    playerB.money += tradeOffer.offerCash;
    playerB.money -= tradeOffer.requestCash;
    playerA.money += tradeOffer.requestCash;

    // Property swaps
    for (const propId of tradeOffer.offerProperties) {
        gameStateRoom.ownedProperties[propId].owner = playerBId;
    }
    for (const propId of tradeOffer.requestProperties) {
        gameStateRoom.ownedProperties[propId].owner = playerAId;
    }

    return { success: true, message: "Swap executed!" };
};

// ============================================================
// 💳 BANK LOAN SYSTEM
// ============================================================
export const MAX_LOAN_AMOUNT = 500;    // Maximum amount allowed per loan
export const MAX_LOANS = 2;            // Max concurrent loans
export const LOAN_INTEREST_PER_TURN = 50; // Interest charged each turn

// Take a bank loan: credit manual amount (1 to MAX_LOAN_AMOUNT), register loan record
export const takeLoan = (playerId, requestedAmount, gameStateRoom) => {
    const player = gameStateRoom.players[playerId];
    if (!player) return { success: false, message: 'Player not found' };

    const amount = parseInt(requestedAmount);
    if (isNaN(amount) || amount <= 0 || amount > MAX_LOAN_AMOUNT) {
        return { success: false, message: `Loan amount must be between ₹1 and ₹${MAX_LOAN_AMOUNT}.` };
    }

    if (!player.loans) player.loans = [];
    const activeLoans = player.loans.filter(l => !l.repaid);

    if (activeLoans.length >= MAX_LOANS) {
        return { success: false, message: `You already have ${MAX_LOANS} active loans. Repay one before taking another.` };
    }

    player.loans.push({ amount, interestAccrued: 0, repaid: false });
    player.money += amount;

    const totalOwed = activeLoans.reduce((s, l) => s + l.amount + l.interestAccrued, 0) + amount;
    return {
        success: true,
        amount,
        message: `Borrowed ₹${amount} from the bank. Total active debt: ₹${totalOwed}. Interest: ₹${LOAN_INTEREST_PER_TURN}/turn.`
    };
};

// Repay the oldest active loan: deduct principal amount
export const repayLoan = (playerId, gameStateRoom) => {
    const player = gameStateRoom.players[playerId];
    if (!player) return { success: false, message: 'Player not found' };
    if (!player.loans || player.loans.length === 0) return { success: false, message: 'You have no loans to repay.' };

    const loanIdx = player.loans.findIndex(l => !l.repaid);
    if (loanIdx === -1) return { success: false, message: 'You have no active loans.' };

    const loan = player.loans[loanIdx];
    const repayAmount = loan.amount; // Principal only (interest was paid per turn)

    if (player.money < repayAmount) {
        return { success: false, message: `Insufficient funds. You need ₹${repayAmount} to repay this loan principal.` };
    }

    player.money -= repayAmount;
    loan.repaid = true;

    return {
        success: true,
        repayAmount,
        message: `Repaid loan principal of ₹${repayAmount} to the bank. Interest charges stopped.`
    };
};

// Charge interest on all active loans for a player (called each turn end)
export const chargeInterestOnLoans = (playerId, gameStateRoom) => {
    const player = gameStateRoom.players[playerId];
    if (!player || !player.loans) return 0;

    const activeLoans = player.loans.filter(l => !l.repaid);
    if (activeLoans.length === 0) return 0;

    let totalInterest = 0;
    activeLoans.forEach(loan => {
        loan.interestAccrued = (loan.interestAccrued || 0) + LOAN_INTEREST_PER_TURN;
        totalInterest += LOAN_INTEREST_PER_TURN;
    });

    player.money -= totalInterest;
    return totalInterest;
};
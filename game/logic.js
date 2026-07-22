import { boardData, getPropertiesByState } from './properties.js';

export const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
};

export const movePlayer = (currentPosition, diceValue) => {
    return (currentPosition + diceValue) % boardData.length; // Wraps around the board dynamically
};

// Checks if a player owns all cities in a state
export const checkStateMonopoly = (playerId, stateName, gameStateRoom) => {
    const stateProperties = getPropertiesByState(stateName);

    // Check if every property in this state belongs to the player
    const ownsAll = stateProperties.every(prop => {
        return gameStateRoom.ownedProperties[prop.id]?.owner === playerId;
    });

    return ownsAll;
};

// Logic to build a house
export const buildHouse = (playerId, propertyId, gameStateRoom) => {
    const propertyDef = boardData[propertyId];
    const player = gameStateRoom.players[playerId];

    if (!propertyDef || propertyDef.type !== 'property') return false;

    // 1. Check if they own the property
    if (gameStateRoom.ownedProperties[propertyId]?.owner !== playerId) return false;

    // 2. Check if they own the whole state
    if (!checkStateMonopoly(playerId, propertyDef.state, gameStateRoom)) return false;

    // 3. Check if they have enough money
    if (player.money < propertyDef.housePrice) return false;

    // Deduct money and add house
    player.money -= propertyDef.housePrice;
    gameStateRoom.ownedProperties[propertyId].houses = (gameStateRoom.ownedProperties[propertyId].houses || 0) + 1;

    return true;
};
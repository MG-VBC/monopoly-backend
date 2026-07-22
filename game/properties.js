// YOU (The Developer) control all prices here. 
// Group cities by 'state' to manage monopolies.

export const boardData = [
    { id: 0, type: 'special', name: 'GO', description: 'Collect ₹200' },

    // KARNATAKA STATE GROUP
    { id: 1, type: 'property', name: 'Mysuru', state: 'Karnataka', color: '#f1c40f', price: 100, baseRent: 10, housePrice: 50 },
    { id: 2, type: 'property', name: 'Mangaluru', state: 'Karnataka', color: '#f1c40f', price: 120, baseRent: 12, housePrice: 50 },
    { id: 3, type: 'property', name: 'Bengaluru', state: 'Karnataka', color: '#f1c40f', price: 150, baseRent: 15, housePrice: 50 },

    // MAHARASHTRA STATE GROUP
    { id: 4, type: 'property', name: 'Pune', state: 'Maharashtra', color: '#e74c3c', price: 200, baseRent: 20, housePrice: 100 },
    { id: 5, type: 'property', name: 'Mumbai', state: 'Maharashtra', color: '#e74c3c', price: 250, baseRent: 25, housePrice: 100 },

    // You will add up to 40 tiles here...
];

// Helper function to get all properties in a specific state
export const getPropertiesByState = (stateName) => {
    return boardData.filter(tile => tile.state === stateName);
};
export const CONFIG = {
    // Level Generation
    LEVEL: {
        ROOM_COUNT: 10,
        TILE_SIZE: 40,
        MIN_ROOM_SIZE: 7,
        MAX_ROOM_SIZE: 14,
        PADDING: 1
    },

    // Player Stats
    PLAYER: {
        HP: 10,
        SPEED: 200,
        DASH_SPEED: 600,
        DASH_DURATION: 0.2,
        DASH_COOLDOWN: 1.0,
        IFRAME_DURATION: 1.0,
        INTERACTION_RADIUS: 40
    },

    // Weapons
    WEAPONS: {
        PISTOL: {
            damage: 2,
            fireRate: 0.4,
            speed: 600,
            spread: 0.05,
            color: '#ffaa00'
        },
        SHOTGUN: {
            damage: 1, // Per pellet
            fireRate: 0.8,
            speed: 550,
            spread: 0.3, // Cone
            count: 5,
            color: '#ff8800'
        },
        HEAVY_SHOTGUN: {
            damage: 2,
            fireRate: 1.2,
            speed: 500,
            spread: 0.4,
            count: 8,
            color: '#ff4400'
        },
        MELEE: { // Unarmed
            damage: 1,
            fireRate: 1.0,
            speed: 200,
            range: 0.15, // Lifetime
            color: '#ddd'
        }
    },

    // Enemies
    ENEMIES: {
        WALKER: {
            hp: 3,
            speed: 100, // Balanced
            dropValue: 10,
            color: '#dd0000'
        },
        SHOOTER: {
            hp: 3,
            speed: 80,
            dropValue: 15,
            fireRate: 2.0,
            color: '#880000'
        },
        SMART: {
            hp: 5,
            speed: 110,
            dropValue: 20,
            color: '#cc00cc'
        },
        STEALTH: {
            hp: 3,
            speed: 40, // Stalk
            runSpeed: 180, // Ambush
            dropValue: 20,
            color: '#444444' // Base
        },
        RAPID: {
            hp: 4,
            speed: 90,
            dropValue: 30,
            color: '#ff8800'
        },
        SHOTGUN: {
            hp: 6,
            speed: 70,
            dropValue: 30,
            color: '#550000'
        },
        HEAVY: {
            hp: 12,
            speed: 50,
            dropValue: 50,
            color: '#330000'
        }
    },

    // Loot
    DROPS: {
        COIN_VALUE: 10,
        HEALTH_PACK_VALUE: 2,
        CHANCE_HEALTH: 0.2,
        CHANCE_WEAPON: 0.2
    }
};

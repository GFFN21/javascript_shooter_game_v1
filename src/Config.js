export const CONFIG = {
    // Level Generation
    LEVEL: {
        ROOM_COUNT: 10,
        TILE_SIZE: 40,
        MIN_ROOM_SIZE: 7,
        MAX_ROOM_SIZE: 14,
        PADDING: 1
    },

    ROOM_TYPES: {
        SPAWN: 'spawn',
        COMBAT: 'combat',
        ELITE: 'elite',
        LOOT: 'loot',
        ALTAR: 'altar',
        BOSS: 'boss'
    },

    SPATIAL_HASH: {
        CELL_SIZE: 80 // 2x Tile Size
    },

    // Collision Types
    COLLISION_TYPES: {
        NONE: 'none',
        PLAYER: 'player',
        ENEMY: 'enemy',
        ITEM: 'item',
        PROJECTILE: 'projectile',
        PORTAL: 'portal',
        WALL: 'wall'
    },

    // Player Stats
    PLAYER: {
        HP: 3,
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
            cooldown: 0.4,
            bulletSpeed: 600,
            spread: 0.05,
            count: 1,
            knockback: 200,
            color: '#ffaa00'
        },
        SHOTGUN: {
            damage: 1, // Per pellet
            cooldown: 0.8,
            bulletSpeed: 550,
            spread: 0.3, // Cone
            count: 5,
            knockback: 200,
            color: '#ff8800'
        },
        HEAVY_SHOTGUN: {
            damage: 2,
            cooldown: 1.2,
            bulletSpeed: 500,
            spread: 0.4,
            count: 8,
            knockback: 300,
            color: '#ff4400'
        },
        MELEE: { // Unarmed
            damage: 1,
            cooldown: 1.0,
            bulletSpeed: 200,
            life: 0.15, // Lifetime
            count: 1,
            knockback: 600,
            isMelee: true,
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
    },

    // Persistent Stats (Permanent Upgrades)
    STAT_UPGRADES: {
        SPEED_BOOST_1: {
            id: 'speed_boost_1',
            name: 'Agility I',
            description: '+10% Movement Speed',
            cost: 100,
            category: 'mobility',
            oneTime: true,
            effect: { type: 'multiplier', stat: 'speed', value: 1.10 }
        },
        HEALTH_BOOST_1: {
            id: 'health_boost_1',
            name: 'Vitality I',
            description: '+1 Max HP (Permanent)',
            cost: 150,
            category: 'health',
            oneTime: true,
            effect: { type: 'add', stat: 'maxHp', value: 1 }
        },
        RICOCHET: {
            id: 'ricochet',
            name: 'Ricochet',
            description: 'Bullets bounce once off walls',
            cost: 300,
            category: 'attack',
            oneTime: true,
            effect: { type: 'add', stat: 'bulletBounces', value: 1 }
        },
        SPEED_BOOST_2: {
            id: 'speed_boost_2',
            name: 'Agility II',
            description: '+15% Movement Speed',
            cost: 250,
            category: 'mobility',
            oneTime: true,
            effect: { type: 'multiplier', stat: 'speed', value: 1.15 }
        },
        HEALTH_BOOST_2: {
            id: 'health_boost_2',
            name: 'Vitality II',
            description: '+2 Max HP (Permanent)',
            cost: 400,
            category: 'health',
            oneTime: true,
            effect: { type: 'add', stat: 'maxHp', value: 2 }
        },
        DASH_SPEED_1: {
            id: 'dash_speed_1',
            name: 'Agility III',
            description: '+25% Dash Speed',
            cost: 200,
            category: 'dash',
            oneTime: true,
            effect: { type: 'multiplier', stat: 'dashSpeed', value: 1.25 }
        },
        DASH_DURATION_1: {
            id: 'dash_duration_1',
            name: 'Agility IV',
            description: '+25% Dash Duration',
            cost: 200,
            category: 'dash',
            oneTime: true,
            effect: { type: 'multiplier', stat: 'dashDuration', value: 1.25 }
        },
        DASH_COOLDOWN_1: {
            id: 'dash_cooldown_1',
            name: 'Agility V',
            description: '-20% Dash Cooldown',
            cost: 200,
            category: 'dash',
            oneTime: true,
            effect: { type: 'multiplier', stat: 'dashCooldown', value: 0.8 }
        }
    },

    // Unlockable Skills (Abilities/Powerups)
    SKILLS: {
        RICOCHET_BULLETS: {
            id: 'ricochet_bullets',
            name: 'Ricochet Bullets',
            description: 'Bullets bounce once off walls',
            cost: 300,
            oneTime: true,
            effect: { type: 'add', stat: 'bulletBounces', value: 1 }
        },
        DASH_SHOCKWAVE: {
            id: 'dash_shockwave',
            name: 'Dash Shockwave',
            description: 'Dash creates a damaging shockwave',
            cost: 250,
            oneTime: true,
            effect: { type: 'flag', stat: 'dashShockwave', value: true }
        },
        HEALTH_PACK_CARRIER: {
            id: 'health_pack_carrier',
            name: 'Health Pack Carrier',
            description: 'Carry 1 health pack for emergency use',
            cost: 200,
            oneTime: true,
            effect: { type: 'flag', stat: 'canCarryHealth', value: true }
        },
        RICOCHET_II: {
            id: 'ricochet_ii',
            name: 'Ricochet Bullets II',
            description: 'Bullets bounce twice on walls',
            cost: 100,
            oneTime: true,
            effect: { type: 'add', stat: 'bulletBounces', value: 2 }
        },
        EXPLOSIVE_I: {
            id: 'explosive_i',
            name: 'Explosive Bullets I',
            description: 'Bullets explode on impact',
            cost: 80,
            oneTime: true,
            effect: { type: 'flag', stat: 'isExplosive', value: true }
        },
        ORBITAL_I: {
            id: 'orbital_i',
            name: 'Orbital Bullet I',
            description: 'Every 10th bullet orbits you',
            cost: 100,
            oneTime: true,
            effect: { type: 'flag', stat: 'canOrbit', value: true }
        }
    }
};

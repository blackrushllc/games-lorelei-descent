import { COMBAT_CONFIG } from '../config/combatConfig.js';

/**
 * Handles deterministic damage calculations and attack processing.
 */
export default class CombatSystem {
    /**
     * Processes an attack on a target.
     * @param {Object} attack - Attack data { type, damage, armorBreaking, direction, knockback }
     * @param {Object} target - The entity being attacked
     * @returns {string} Result of the attack
     */
    static processAttack(attack, target) {
        const { results } = COMBAT_CONFIG;

        // 1. Safety checks
        if (!target || target.isDestroyed) return results.NO_DAMAGE;
        
        // Handle invulnerability for player
        if (target.isInvulnerable && target.isInvulnerable()) {
            return results.NO_DAMAGE;
        }

        // Damage safety: ensure it's a number
        const damage = typeof attack.damage === 'number' ? attack.damage : 0;
        if (typeof attack.damage !== 'number') {
            console.warn(`[COMBAT] Attack damage is not a number:`, attack);
        }

        // Diagnostic data
        const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1');
        const initialArmor = target.armor || 0;
        
        // Ensure shield/health are numbers
        if (isPlayerTarget(target)) {
            if (typeof target.shield !== 'number' || isNaN(target.shield)) target.shield = 100;
        } else {
            if (typeof target.health !== 'number' || isNaN(target.health)) target.health = 1;
        }
        
        const initialHealth = isPlayerTarget(target) ? target.shield : target.health;

        // 2. Armor Logic (For Robots)
        let result = results.NO_DAMAGE;
        if (target.armor > 0) {
            if (attack.armorBreaking) {
                target.armor = Math.max(0, target.armor - 1);
                result = target.armor === 0 ? results.ARMOR_BROKEN : results.ARMOR_HIT;
            } else {
                // Non-armor-breaking attacks (like Energy Bolts) just spark
                result = results.ARMOR_HIT;
            }
        } else {
            // 3. Health/Shield Logic
            if (isPlayerTarget(target)) {
                target.shield = Math.max(0, target.shield - damage);
                result = target.shield <= 0 ? results.TARGET_DESTROYED : results.HEALTH_DAMAGED;
            } else {
                target.health = Math.max(0, target.health - damage);
                result = target.health <= 0 ? results.TARGET_DESTROYED : results.HEALTH_DAMAGED;
            }
        }

        if (isDebug) {
            const targetType = isPlayerTarget(target) ? 'PLAYER' : (target.type || 'UNKNOWN');
            const finalArmor = target.armor || 0;
            const finalHealth = isPlayerTarget(target) ? (target.shield || 0) : (target.health || 0);
            
            console.log(`[COMBAT] Attack: ${attack.type} -> ${targetType}`);
            console.log(`[COMBAT] Damage: ${damage}, Armor: ${initialArmor}->${finalArmor}, Health/Shield: ${initialHealth}->${finalHealth}`);
            console.log(`[COMBAT] Result: ${result}`);
        }

        return result;
    }

    /**
     * Calculates the score for a specific combat result.
     * @param {string} result 
     * @param {Object} robotConfig 
     * @returns {number}
     */
    static getScoreForResult(result, robotConfig) {
        const { results } = COMBAT_CONFIG;
        if (result === results.TARGET_DESTROYED) {
            return robotConfig.score || 0;
        }
        if (result === results.ARMOR_BROKEN) {
            return robotConfig.armorScore || 0;
        }
        return 0;
    }
}

/**
 * Robust check to see if the target is the player.
 * @param {Object} target 
 * @returns {boolean}
 */
function isPlayerTarget(target) {
    if (!target) return false;
    return target.constructor.name === 'Blackrush' || (target.scene && target === target.scene.player);
}

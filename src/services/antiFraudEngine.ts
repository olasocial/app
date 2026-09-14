import { RiskLevel, FraudEvent } from '../types';

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxLimit: number;
}

export class AntiFraudEngine {
  // Configurable limits
  static LIMITS = {
    MAX_TASKS_PER_HOUR: 15,
    MAX_TASKS_PER_DAY: 60,
    MAX_SAME_CREATOR_PER_DAY: 2,
    MAX_SAME_PLATFORM_PER_DAY: 25
  };

  /**
   * Evaluates circular exchange (A -> B and B -> A collusion)
   */
  static detectCircularExchange(
    userId: string,
    targetCreatorId: string,
    recentHistory: Array<{ giver_id: string; receiver_id: string }>
  ): { isCollusion: boolean; riskLevel: RiskLevel; count: number } {
    if (userId === targetCreatorId) {
      return { isCollusion: true, riskLevel: RiskLevel.CRITICAL, count: 99 };
    }

    // Check how many times target has given to user
    const reverseInteractions = recentHistory.filter(
      (h) => h.giver_id === targetCreatorId && h.receiver_id === userId
    ).length;

    // Check how many times user has given to target
    const directInteractions = recentHistory.filter(
      (h) => h.giver_id === userId && h.receiver_id === targetCreatorId
    ).length;

    if (reverseInteractions >= 4 && directInteractions >= 4) {
      return { isCollusion: true, riskLevel: RiskLevel.HIGH, count: reverseInteractions + directInteractions };
    }

    if (reverseInteractions >= 2 && directInteractions >= 2) {
      return { isCollusion: false, riskLevel: RiskLevel.MEDIUM, count: reverseInteractions + directInteractions };
    }

    return { isCollusion: false, riskLevel: RiskLevel.LOW, count: reverseInteractions + directInteractions };
  }

  /**
   * Rate Limit verification
   */
  static checkRateLimit(
    userId: string,
    platform: string,
    targetCreatorId: string,
    userRecentTasks: Array<{ user_id: string; platform: string; creator_id: string; created_at: string }>
  ): RateLimitCheck {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const tasksLastHour = userRecentTasks.filter(
      (t) => t.user_id === userId && new Date(t.created_at).getTime() > oneHourAgo
    );
    if (tasksLastHour.length >= this.LIMITS.MAX_TASKS_PER_HOUR) {
      return {
        allowed: false,
        reason: `Límite horario alcanzado (${this.LIMITS.MAX_TASKS_PER_HOUR} acciones/hora). Respira un momento por el bienestar de la comunidad.`,
        currentCount: tasksLastHour.length,
        maxLimit: this.LIMITS.MAX_TASKS_PER_HOUR
      };
    }

    const tasksLastDay = userRecentTasks.filter(
      (t) => t.user_id === userId && new Date(t.created_at).getTime() > oneDayAgo
    );
    if (tasksLastDay.length >= this.LIMITS.MAX_TASKS_PER_DAY) {
      return {
        allowed: false,
        reason: `Límite diario alcanzado (${this.LIMITS.MAX_TASKS_PER_DAY} acciones/día).`,
        currentCount: tasksLastDay.length,
        maxLimit: this.LIMITS.MAX_TASKS_PER_DAY
      };
    }

    const sameCreatorTasks = tasksLastDay.filter((t) => t.creator_id === targetCreatorId);
    if (sameCreatorTasks.length >= this.LIMITS.MAX_SAME_CREATOR_PER_DAY) {
      return {
        allowed: false,
        reason: `Ya apoyaste a este creador recientemente hoy. Descubre otros talentos de la comunidad.`,
        currentCount: sameCreatorTasks.length,
        maxLimit: this.LIMITS.MAX_SAME_CREATOR_PER_DAY
      };
    }

    return {
      allowed: true,
      currentCount: tasksLastHour.length,
      maxLimit: this.LIMITS.MAX_TASKS_PER_HOUR
    };
  }

  /**
   * Reputation Score Calculation (0 to 100)
   */
  static calculateReputation(params: {
    hugsDone: number;
    hugsVerified: number;
    starsCount: number;
    warningsCount: number;
    accountAgeDays: number;
  }): number {
    const { hugsDone, hugsVerified, starsCount, warningsCount, accountAgeDays } = params;
    if (hugsDone === 0) return 70;

    const validationRatio = hugsDone > 0 ? hugsVerified / hugsDone : 1;
    const avgStars = hugsVerified > 0 ? Math.min(5, starsCount / hugsVerified) : 4.5;

    let score = (validationRatio * 50) + (avgStars * 8) + Math.min(10, accountAgeDays * 0.2);

    // Penalties
    score -= warningsCount * 15;

    return Math.max(10, Math.min(100, Math.round(score)));
  }
}

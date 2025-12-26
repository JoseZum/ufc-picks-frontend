// Victory method types for UFC fights
export type VictoryMethod = "DEC" | "KO/TKO" | "SUB"

// Base Pick type with fighter, method, and optional round
export type Pick = {
  fighter: "red" | "blue"
  method: VictoryMethod
  round?: 1 | 2 | 3 | 4 | 5  // Optional, only if method !== "DEC"
}

// Pick with actual result data (for displaying completed picks)
export type PickWithResult = Pick & {
  actualWinner?: "red" | "blue"
  actualMethod?: VictoryMethod
  actualRound?: 1 | 2 | 3 | 4 | 5
  points?: 0 | 1 | 2 | 3
}

// Score breakdown for a pick
export type PickScore = {
  points: 0 | 1 | 2 | 3
  breakdown: {
    fighterCorrect: boolean
    methodCorrect: boolean
    roundCorrect: boolean
  }
}

/**
 * Calculate points for a pick based on the actual result
 *
 * Scoring rules:
 * - Wrong fighter: 0 points
 * - Correct fighter only: 1 point
 * - Correct fighter + method: 2 points
 * - Correct fighter + method + round (non-DEC only): 3 points
 * - DEC picks: maximum 2 points (no round bonus)
 *
 * IMPORTANT: No points awarded for correct method/round if fighter is wrong
 */
export function calculatePickScore(
  pick: Pick,
  result: {
    winner: "red" | "blue"
    method: VictoryMethod
    round?: 1 | 2 | 3 | 4 | 5
  }
): PickScore {
  const fighterCorrect = pick.fighter === result.winner
  const methodCorrect = pick.method === result.method
  const roundCorrect = pick.round !== undefined && pick.round === result.round

  let points: 0 | 1 | 2 | 3 = 0

  if (!fighterCorrect) {
    // Did not predict correct winner = 0 points
    points = 0
  } else if (pick.method === "DEC") {
    // DEC picks: maximum 2 points (fighter + method)
    points = methodCorrect ? 2 : 1
  } else {
    // KO/TKO or SUB picks: can get up to 3 points
    if (methodCorrect && roundCorrect) {
      points = 3 // Fighter + method + round
    } else if (methodCorrect) {
      points = 2 // Fighter + method
    } else {
      points = 1 // Fighter only
    }
  }

  return {
    points,
    breakdown: { fighterCorrect, methodCorrect, roundCorrect }
  }
}

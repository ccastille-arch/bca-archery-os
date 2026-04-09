// Arrow Ballistics Engine
// Calculates trajectory, kinetic energy, momentum, wind drift

const GRAVITY = 32.174; // ft/s²
const GRAINS_TO_LBS = 7000;

export interface BallisticsInput {
  arrowSpeedFps: number;       // arrow speed in feet per second
  totalWeightGrains: number;   // total arrow weight in grains
  focPercent: number;          // front of center %
  dragCoefficient?: number;    // Cd, default 2.0 for arrows
  arrowDiameterInches?: number; // shaft diameter, default 0.246
}

export interface BallisticsAtDistance {
  distance: number;            // yards
  dropInches: number;          // arrow drop from bore line
  flightTimeMs: number;        // time of flight in milliseconds
  velocityFps: number;         // remaining velocity
  kineticEnergy: number;       // foot-pounds
  momentum: number;            // slug-ft/s (grain*fps / 225218)
  windDriftInches: number;     // drift for 10mph crosswind
}

export interface BallisticsResult {
  input: BallisticsInput;
  launchKE: number;
  launchMomentum: number;
  table: BallisticsAtDistance[];
  elkMinKE: number;            // 65 ft-lbs recommended
  deerMinKE: number;           // 40 ft-lbs recommended
  turkeyMinKE: number;         // 25 ft-lbs recommended
  maxEffectiveElk: number;     // max yards for elk KE
  maxEffectiveDeer: number;
  maxEffectiveTurkey: number;
}

export function calculateBallistics(input: BallisticsInput): BallisticsResult {
  const { arrowSpeedFps, totalWeightGrains, focPercent } = input;
  const Cd = input.dragCoefficient || 2.0;
  const diameter = input.arrowDiameterInches || 0.246;

  const weightLbs = totalWeightGrains / GRAINS_TO_LBS;
  const launchKE = (totalWeightGrains * arrowSpeedFps * arrowSpeedFps) / 450240;
  const launchMomentum = (totalWeightGrains * arrowSpeedFps) / 225218;

  // Cross-sectional area in ft²
  const radiusFt = (diameter / 2) / 12;
  const area = Math.PI * radiusFt * radiusFt;

  // Air density at sea level (slugs/ft³)
  const rho = 0.00238;

  // Drag deceleration factor: (rho * Cd * A) / (2 * mass)
  const dragFactor = (rho * Cd * area) / (2 * weightLbs / GRAVITY);

  const table: BallisticsAtDistance[] = [];
  const dt = 0.001; // time step in seconds

  let vx = arrowSpeedFps;
  let vy = 0; // initially horizontal
  let x = 0;  // horizontal distance in feet
  let y = 0;  // vertical (drop)
  let t = 0;

  // Wind drift: 10mph = 14.67 fps crosswind
  const windSpeed = 14.67;
  let windDrift = 0;

  const targetDistances = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  let nextTargetIdx = 0;

  while (nextTargetIdx < targetDistances.length && t < 2.0) {
    // Drag on horizontal velocity
    const drag = dragFactor * vx * vx;
    vx -= drag * dt;

    // Gravity
    vy -= GRAVITY * dt;

    // Position update
    x += vx * dt;
    y += vy * dt;
    t += dt;

    // Wind drift accumulation (simplified: wind pushes arrow sideways)
    const windDrag = dragFactor * windSpeed * windSpeed;
    windDrift += windDrag * dt * dt * 0.5 * 12; // convert to inches roughly

    // Check if we've reached the next target distance (in yards)
    const xYards = x / 3;
    if (xYards >= targetDistances[nextTargetIdx]) {
      const dist = targetDistances[nextTargetIdx];
      const currentKE = (totalWeightGrains * vx * vx) / 450240;
      const currentMomentum = (totalWeightGrains * vx) / 225218;

      table.push({
        distance: dist,
        dropInches: Math.abs(y * 12),
        flightTimeMs: Math.round(t * 1000),
        velocityFps: Math.round(vx),
        kineticEnergy: Math.round(currentKE * 10) / 10,
        momentum: Math.round(currentMomentum * 1000) / 1000,
        windDriftInches: Math.round(windDrift * 10) / 10,
      });
      nextTargetIdx++;
    }
  }

  // Find max effective ranges
  const findMaxRange = (minKE: number) => {
    for (let i = table.length - 1; i >= 0; i--) {
      if (table[i].kineticEnergy >= minKE) return table[i].distance;
    }
    return 0;
  };

  return {
    input,
    launchKE: Math.round(launchKE * 10) / 10,
    launchMomentum: Math.round(launchMomentum * 1000) / 1000,
    table,
    elkMinKE: 65,
    deerMinKE: 40,
    turkeyMinKE: 25,
    maxEffectiveElk: findMaxRange(65),
    maxEffectiveDeer: findMaxRange(40),
    maxEffectiveTurkey: findMaxRange(25),
  };
}

// Group analysis
export interface ArrowImpact {
  x: number;  // -1 to 1 (center = 0)
  y: number;  // -1 to 1 (center = 0)
  arrowNum: number;
  score?: number;
}

export interface GroupAnalysis {
  groupSizeInches: number;
  centerX: number;
  centerY: number;
  centerDirection: string;    // "high-left", "center", etc.
  centerOffsetInches: number;
  consistency: number;        // 0-100 (100 = perfect group)
  tightestPair: number;       // inches
  widestShot: number;         // inches from center
  fatigueScore: number;       // negative = getting worse, positive = improving
  impacts: ArrowImpact[];
}

export function analyzeGroup(impacts: ArrowImpact[], targetRadiusInches: number): GroupAnalysis {
  if (impacts.length === 0) {
    return {
      groupSizeInches: 0, centerX: 0, centerY: 0, centerDirection: 'center',
      centerOffsetInches: 0, consistency: 100, tightestPair: 0, widestShot: 0,
      fatigueScore: 0, impacts: [],
    };
  }

  // Calculate center of group
  const centerX = impacts.reduce((s, i) => s + i.x, 0) / impacts.length;
  const centerY = impacts.reduce((s, i) => s + i.y, 0) / impacts.length;

  // Convert to inches
  const toInches = (v: number) => v * targetRadiusInches;

  // Group size: max distance between any two impacts
  let maxDist = 0;
  let minDist = Infinity;
  for (let i = 0; i < impacts.length; i++) {
    for (let j = i + 1; j < impacts.length; j++) {
      const dx = impacts[i].x - impacts[j].x;
      const dy = impacts[i].y - impacts[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      maxDist = Math.max(maxDist, dist);
      minDist = Math.min(minDist, dist);
    }
  }

  // Distance of each impact from group center
  const distances = impacts.map((imp) => {
    const dx = imp.x - centerX;
    const dy = imp.y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  });

  const avgDist = distances.reduce((s, d) => s + d, 0) / distances.length;
  const widestShot = Math.max(...distances);

  // Consistency: 100 = all arrows in same hole, 0 = scattered
  const consistency = Math.max(0, Math.round(100 - (avgDist * targetRadiusInches * 10)));

  // Center direction
  const cx = centerX;
  const cy = centerY;
  let direction = 'center';
  if (Math.abs(cx) > 0.05 || Math.abs(cy) > 0.05) {
    const vertical = cy > 0.05 ? 'high' : cy < -0.05 ? 'low' : '';
    const horizontal = cx > 0.05 ? 'right' : cx < -0.05 ? 'left' : '';
    direction = `${vertical}${vertical && horizontal ? '-' : ''}${horizontal}` || 'center';
  }

  // Fatigue: compare first half vs second half group sizes
  let fatigueScore = 0;
  if (impacts.length >= 4) {
    const half = Math.floor(impacts.length / 2);
    const firstHalf = impacts.slice(0, half);
    const secondHalf = impacts.slice(half);

    const avgDistFirst = firstHalf.reduce((s, imp) => {
      const dx = imp.x - centerX;
      const dy = imp.y - centerY;
      return s + Math.sqrt(dx * dx + dy * dy);
    }, 0) / firstHalf.length;

    const avgDistSecond = secondHalf.reduce((s, imp) => {
      const dx = imp.x - centerX;
      const dy = imp.y - centerY;
      return s + Math.sqrt(dx * dx + dy * dy);
    }, 0) / secondHalf.length;

    fatigueScore = Math.round((avgDistFirst - avgDistSecond) * 100);
  }

  return {
    groupSizeInches: Math.round(toInches(maxDist) * 10) / 10,
    centerX,
    centerY,
    centerDirection: direction,
    centerOffsetInches: Math.round(toInches(Math.sqrt(cx * cx + cy * cy)) * 10) / 10,
    consistency,
    tightestPair: Math.round(toInches(minDist === Infinity ? 0 : minDist) * 10) / 10,
    widestShot: Math.round(toInches(widestShot) * 10) / 10,
    fatigueScore,
    impacts,
  };
}

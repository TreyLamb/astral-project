import { useState, useEffect, useRef } from 'react';
import './GameCornerSlots.css';

// Exact symbol data from OG: each wheel has 19 symbols
// Indexed by symbol name to its payout and tier
const SYMBOL_DATA = {
  7: { payout: 300, name: '7' },
  BAR: { payout: 100, name: 'BAR' },
  CHERRY: { payout: 8, name: 'CHERRY' },
  MOUSE: { payout: 15, name: 'MOUSE' },
  FISH: { payout: 15, name: 'FISH' },
  BIRD: { payout: 15, name: 'BIRD' },
};

// Exact wheel data from OG: slot_machine_wheels.asm
const WHEELS = [
  ['7', 'MOUSE', 'FISH', 'BAR', 'CHERRY', '7', 'FISH', 'BIRD', 'BAR', 'CHERRY', '7', 'MOUSE', 'BIRD', 'BAR', 'CHERRY', '7', 'MOUSE', 'FISH'],
  ['7', 'FISH', 'CHERRY', 'BIRD', 'MOUSE', 'BAR', 'CHERRY', 'FISH', 'BIRD', 'CHERRY', 'BAR', 'FISH', 'BIRD', 'CHERRY', 'MOUSE', '7', 'FISH', 'CHERRY'],
  ['7', 'BIRD', 'FISH', 'CHERRY', 'MOUSE', 'BIRD', 'FISH', 'CHERRY', 'MOUSE', 'BIRD', 'FISH', 'CHERRY', 'MOUSE', 'BIRD', 'BAR', '7', 'BIRD', 'FISH'],
];

// RNG gate: determines if this spin allows wins
// Exact logic from OG: SlotMachine_SetFlags (lines 175-203)
// wSlotMachineSevenAndBarModeChance is set to 250 or 253
function getRngGate(rand) {
  // 1/256 chance: player can always win on reroll
  if (rand === 0) return 'reroll';
  // ~1% chance: can only win with 7 or BAR (rand > 250)
  if (rand > 250) return '7orbar';
  // ~16% chance: can win any symbol (210 < rand <= 250)
  if (rand > 210) return 'any';
  // ~82% chance: cannot win (rand <= 210)
  return 'no-win';
}

export default function GameCornerSlots({ playerCoins, onClose, onCoinsChange }) {
  const [coins, setCoins] = useState(playerCoins ?? 0);
  const [message, setMessage] = useState('');
  const [bet, setBet] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [wheelOffsets, setWheelOffsets] = useState([0, 0, 0]);
  const [result, setResult] = useState(null); // { matched, symbol, payout, win }
  const [winStreak, setWinStreak] = useState(0);

  const animFrameRef = useRef(null);
  const spinStartTimeRef = useRef(null);
  const stoppedWheelsRef = useRef([false, false, false]);

  // Get visible 3 symbols for a wheel at a given offset
  function getVisibleSymbols(wheelIdx, offset) {
    const wheel = WHEELS[wheelIdx];
    const size = wheel.length;
    const visibleIndices = [
      (offset) % size,
      (offset + 1) % size,
      (offset + 2) % size,
    ];
    return visibleIndices.map(i => wheel[i]);
  }

  // Check if player can afford this bet
  function canPlaySpinRound() {
    if (coins < bet) {
      setMessage('Not enough coins!');
      return false;
    }
    return true;
  }

  // Check for matches given wheel offsets
  function checkForMatches(offsets) {
    // Get the middle visible symbol from each wheel (the one in center)
    const wheel1Middle = WHEELS[0][(offsets[0] + 1) % WHEELS[0].length];
    const wheel2Middle = WHEELS[1][(offsets[1] + 1) % WHEELS[1].length];
    const wheel3Middle = WHEELS[2][(offsets[2] + 1) % WHEELS[2].length];

    // 1 coin bet: middle horizontal match only
    if (bet === 1) {
      if (wheel1Middle === wheel2Middle && wheel2Middle === wheel3Middle) {
        return { matched: true, symbol: wheel1Middle };
      }
    }
    // 2 coin bet: top, bottom, OR middle horizontal matches
    else if (bet === 2) {
      // Top row
      const wheel1Top = WHEELS[0][(offsets[0]) % WHEELS[0].length];
      const wheel2Top = WHEELS[1][(offsets[1]) % WHEELS[1].length];
      const wheel3Top = WHEELS[2][(offsets[2]) % WHEELS[2].length];
      if (wheel1Top === wheel2Top && wheel2Top === wheel3Top) {
        return { matched: true, symbol: wheel1Top };
      }
      // Bottom row
      const wheel1Bot = WHEELS[0][(offsets[0] + 2) % WHEELS[0].length];
      const wheel2Bot = WHEELS[1][(offsets[1] + 2) % WHEELS[1].length];
      const wheel3Bot = WHEELS[2][(offsets[2] + 2) % WHEELS[2].length];
      if (wheel1Bot === wheel2Bot && wheel2Bot === wheel3Bot) {
        return { matched: true, symbol: wheel1Bot };
      }
      // Middle (fall through)
    }
    // 3 coin bet: all matches (diagonals + horizontals)
    if (bet >= 2) {
      if (wheel1Middle === wheel2Middle && wheel2Middle === wheel3Middle) {
        return { matched: true, symbol: wheel1Middle };
      }
    }
    if (bet === 3) {
      // Diagonal: wheel1 bottom, wheel2 middle, wheel3 top
      const wheel1Bot = WHEELS[0][(offsets[0] + 2) % WHEELS[0].length];
      const wheel3Top = WHEELS[2][(offsets[2]) % WHEELS[2].length];
      if (wheel1Bot === wheel2Middle && wheel2Middle === wheel3Top) {
        return { matched: true, symbol: wheel1Bot };
      }
      // Diagonal: wheel1 top, wheel2 middle, wheel3 bottom
      const wheel1Top = WHEELS[0][(offsets[0]) % WHEELS[0].length];
      const wheel3Bot = WHEELS[2][(offsets[2] + 2) % WHEELS[2].length];
      if (wheel1Top === wheel2Middle && wheel2Middle === wheel3Bot) {
        return { matched: true, symbol: wheel1Top };
      }
    }

    return { matched: false, symbol: null };
  }

  // Simulate a spin: determine RNG gate + final offsets + whether player wins
  function simulateSpin(rngValue) {
    const gate = getRngGate(rngValue);

    // Generate final random offsets for each wheel (0-17, then randomize)
    const finalOffsets = [
      Math.floor(Math.random() * WHEELS[0].length),
      Math.floor(Math.random() * WHEELS[1].length),
      Math.floor(Math.random() * WHEELS[2].length),
    ];

    const matchResult = checkForMatches(finalOffsets);

    // If player cannot win (gate === 'no-win'), force no match
    if (gate === 'no-win' && matchResult.matched) {
      // Re-randomize until we get a no-match, or accept a forced mismatch
      // For simplicity, if matched and no-win, just force no match by changing an offset
      finalOffsets[2] = (finalOffsets[2] + 1) % WHEELS[2].length;
      return {
        offsets: finalOffsets,
        matched: false,
        symbol: null,
        payout: 0,
        win: false,
        gate,
      };
    }

    // If win is possible and we have a match, pay out; else no payout
    if (matchResult.matched && (gate === 'any' || gate === 'reroll' || (gate === '7orbar' && (matchResult.symbol === '7' || matchResult.symbol === 'BAR')))) {
      const payout = SYMBOL_DATA[matchResult.symbol]?.payout ?? 0;
      return {
        offsets: finalOffsets,
        matched: true,
        symbol: matchResult.symbol,
        payout,
        win: true,
        gate,
      };
    }

    return {
      offsets: finalOffsets,
      matched: matchResult.matched,
      symbol: matchResult.symbol,
      payout: 0,
      win: false,
      gate,
    };
  }

  // Spin animation loop
  useEffect(() => {
    if (!spinning) return;

    const spinDuration = 2000; // 2 seconds of spinning

    function animate() {
      const elapsed = Date.now() - spinStartTimeRef.current;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Wheel speeds decrease as they approach stop
      const speedCurve = (1 - progress * 0.9); // slow from 1.0 to 0.1

      setWheelOffsets(prev => [
        (prev[0] + 5 * speedCurve) % WHEELS[0].length,
        (prev[1] + 5 * speedCurve) % WHEELS[1].length,
        (prev[2] + 5 * speedCurve) % WHEELS[2].length,
      ]);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin complete: calculate result
        setSpinning(false);
        spinStartTimeRef.current = null;

        // Do RNG gate: roll 0-255
        const rngValue = Math.floor(Math.random() * 256);
        const spinResult = simulateSpin(rngValue);

        // Snap wheels to final positions
        setWheelOffsets(spinResult.offsets);
        setResult(spinResult);

        // Update coins and message
        if (spinResult.win) {
          setCoins(prev => {
            const newCoins = prev - bet + spinResult.payout;
            onCoinsChange?.(newCoins);
            return newCoins;
          });
          setMessage(`${spinResult.symbol} lined up! Won ${spinResult.payout} coins!`);
          setWinStreak(prev => prev + 1);
        } else {
          setCoins(prev => {
            const newCoins = prev - bet;
            onCoinsChange?.(newCoins);
            return newCoins;
          });
          setMessage('Not this time...');
          setWinStreak(0);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [spinning, bet]);

  function handleStartSpin() {
    if (!canPlaySpinRound()) return;

    setResult(null);
    setMessage('');
    setSpinning(true);
    spinStartTimeRef.current = Date.now();
    stoppedWheelsRef.current = [false, false, false];
  }

  function handlePlayAgain() {
    if (coins <= 0) {
      setMessage('Game Over: Out of coins.');
      return;
    }
    setResult(null);
    setMessage('');
  }

  function handleClose() {
    onCoinsChange?.(coins);
    onClose?.();
  }

  return (
    <div className="gc-slots-container">
      <div className="gc-slots-header">
        <div className="gc-slots-title">GAME CORNER</div>
        <div className="gc-slots-coin-display">
          <span className="gc-slots-label">CREDIT:</span>
          <span className="gc-slots-coins">{coins.toString().padStart(4, '0')}</span>
        </div>
      </div>

      <div className="gc-slots-machine">
        <div className="gc-slots-wheels">
          {wheelOffsets.map((offset, wheelIdx) => (
            <div key={wheelIdx} className="gc-slots-wheel">
              <div className="gc-slots-wheel-window">
                {getVisibleSymbols(wheelIdx, Math.floor(offset)).map((symbol, i) => (
                  <div key={i} className={`gc-slots-symbol ${i === 1 ? 'center' : ''}`}>
                    <div className="gc-slots-symbol-icon">{symbol}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="gc-slots-payout-display">
          <div className="gc-slots-label">PAYOUT:</div>
          <div className="gc-slots-payout-value">
            {result?.payout ? result.payout.toString().padStart(4, '0') : '0000'}
          </div>
        </div>
      </div>

      <div className="gc-slots-message">{message}</div>

      {winStreak > 0 && <div className="gc-slots-win-streak">Win Streak: {winStreak}</div>}

      <div className="gc-slots-controls">
        <div className="gc-slots-bet-selector">
          <label>BET:</label>
          <div className="gc-slots-bet-buttons">
            {[1, 2, 3].map(b => (
              <button
                key={b}
                onClick={() => setBet(b)}
                disabled={spinning}
                className={`gc-slots-bet-btn ${bet === b ? 'active' : ''}`}
              >
                ×{b}
              </button>
            ))}
          </div>
        </div>

        {!result && (
          <button
            onClick={handleStartSpin}
            disabled={spinning || coins < bet}
            className="gc-slots-spin-btn"
          >
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>
        )}

        {result && coins > 0 && (
          <button
            onClick={handlePlayAgain}
            className="gc-slots-again-btn"
          >
            ONE MORE GO
          </button>
        )}

        {coins <= 0 && (
          <div className="gc-slots-game-over">
            OUT OF COINS
          </div>
        )}
      </div>

      <button onClick={handleClose} className="gc-slots-close-btn">CLOSE</button>
    </div>
  );
}

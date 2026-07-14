Objective
To earn the most prestige points over a set number of rounds (typically 1 or 3) by building and completing valuable collections of Antiquities and Treasures.

Setup
Determine the Length: Choose whether you will play 1 round (quick game) or 3 rounds (standard game).

Deal: Shuffle the deck and deal 20 cards to each player as two separate face-down piles of 10 cards.

Hand and Cache: Each player chooses one pile of 10 to be their starting "Hand". The other pile remains face down on the table as their "Cache". You may not pick up or look at your Cache until you have completely played all the cards in your Hand.

Start: The player who last visited a museum goes first.

On Your Turn
You must take three actions in this exact order:

1. Draw
You must draw at the beginning of your turn. You have two options:

Option A: Draw 2 cards from the draw pile.

Option B: Pick up the entire discard pile.

Requirement: To do this, you must have already started at least one collection on the table. You must also have at least two cards in your hand that match the suit of the top card of the discard pile. You must use those two cards and the top card of the discard pile to immediately start a new collection before picking up the rest of the discard pile.

2. Play
You may play as many cards from your hand as you wish (or none at all).

Start a Collection: Play 3 or more matching cards to start a new collection in front of you.

Add to a Collection: Add cards to your own incomplete collections, or to your completed Mixed Collections. (You cannot add cards to completed Perfect or Standard collections).

Sabotage: You may play cards onto opponents' incomplete collections or completed Mixed Collections. For example, dropping a Treasure card onto an opponent's incomplete Antiquity set will ruin their chances of a Perfect Collection, instantly converting it into a lower-scoring Mixed Collection.

Character Cards: Play a Nigel Remington card to immediately draw 3 cards from the deck. Keep the Remington card off to the side of your collections.

3. Discard
End your turn by discarding one card face-up onto the discard pile.

Special: If you discard the Tess Wynter bounty hunter card, the entire discard pile is removed from the game for the rest of the round.

Collections
A collection becomes "completed" once it has 5 cards. Once completed, collapse the stack and place it off to the side to lock it in.

Perfect Collection: A set of 5 unique Treasure cards (no duplicates), OR 5 Antiquity cards of the same suit numbered exactly 1 through 5.

Standard Collection: A set of 5 Treasure cards (duplicates allowed), OR 5 Antiquity cards of the same suit (number duplicates allowed).

Mixed Collection: A set of 5 or more cards consisting of both Treasures and a single suit of Antiquities.

Ending the Round ("Going Out")
To end the round, a player must "go out" by meeting two conditions:

They must have at least 5 completed collections in front of them.

They must play the final card from their Cache (or discard it).

The player who goes out immediately receives a 500-point bonus. Every other player then gets one final turn to play as many cards as they can to empty their hands. Once everyone has taken their final turn, the round ends and scoring begins.

Scoring Breakdown for VSC AI Agent
To build your backend calculation math, the AI will need the exact point values to structure the logic. Give the agent this framework:

Point Values Data Structure
Card Base Values (Played on the table):

Antiquity Cards: +25 points

Treasure Cards: +50 points

Nigel Remington Cards: +100 points

Tess Wynter Cards: 0 points (Action card only)

Completed Collection Bonuses (Awarded in addition to base card values):

Perfect Treasure Collection: +1500 points

Perfect Antiquity Collection: +1000 points

Standard Collection: +500 points

Mixed Collection: +250 points

End of Round Modifiers:

Going Out Bonus: +500 points

Unplayed Cards Penalty: Any cards left in a player's Hand or Cache at the end of the round subtract their exact base value from the player's total score (e.g., holding a Treasure card is -50 points).

example of
src/utils/scoreEngine.ts

interface RoundInputs {
  perfectTreasures: number;      // +1500 each
  perfectAntiquities: number;    // +1000 each
  standardCollections: number;   // +500 each
  mixedCollections: number;      // +250 each
  individualAntiquities: number; // +25 each
  individualTreasures: number;   // +50 each
  remingtons: number;            // +100 each
  wentOut: boolean;              // +500 if true
  heldAntiquities: number;       // -25 each
  heldTreasures: number;         // -50 each
  heldRemingtons: number;        // -100 each
}



Calculation Formula$$\text{Score} = (PT \times 1500) + (PA \times 1000) + (SC \times 500) + (MC \times 250) + (A \times 25) + (T \times 50) + (R \times 100) + O - (HA \times 25) - (HT \times 50) - (HR \times 100)$$Where:$PT, PA, SC, MC$ = Collection counts$A, T, R$ = Played card counts$O$ = Going out bonus ($500$ or $0$)$HA, HT, HR$ = Hand/Cache penalty counts
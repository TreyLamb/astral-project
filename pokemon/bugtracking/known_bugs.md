# Known Bugs — Not Being Addressed Right Now

1. White background behind player sprite
2. Octopus/wrong player sprite (overworld walking animation)
3. Man in Pallet Town fishing (south middle) — NPC sprite wrong
4. Oak appears outside Red's house — should not be there in normal gameplay
5. Rock tiles are oversized
6. Signs show no text
7. Dialogue persists after walking away — should dismiss on movement
8. Flower tiles cannot be walked through sideways
9. Touching a cut-tree gives bad dialogue
10. Item placement is off on Route 2 and possibly other maps — recurring coordinate issue
11. Trainer battles not implemented (rival + gym battles) — med-high priority
12. Several Extra mode start positions put player in stuck/unreachable location
13. Items on the ground (pokeball pickups) give '...' — not obtainable — will block Mt. Moon — med priority
14. Elite Four: player stuck, cannot navigate room or test doorways — low priority
15. MUltiple VERSIONS OF oak in pallet town. 1. this shows that continuinty is problematic and that 2. ANY NPcs who have movement roles in the game are going to be duplicated later.
16. Sub-tile sprite/tile alignment still slightly off — items on tables, tile graphics a few px high. Root cause suspected: `camX` still has `+ TILE` offset while `camY` was fixed to not have it (asymmetry). To investigate: try `camX = px - GB_W/2` and re-add `-8` to sprite sx to compensate. Low-med priority.

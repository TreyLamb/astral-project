Updated instructions-website creation:
I want to pickup working on the PogoFilters project but i want to be able to see it visually a little better.

make a new page in astral project for this - it's already in astral project as code but there's no nav to it.

Make the css some polemonesque CSS.  I want to see a list of my existing pokemon filters. My existing pokemon labels.
On-hover i want the filters to show the string that the filter is. I don't if i CLICK, then i want the strong to 'open' up below the filter. I want to be able to edit it and it saves to firebase. I want a button on the side that when toggled on let's me make a change (add "!fire" to one filter, and it will automatically add it to hte end of the string for the others). 
I want another section that is basically a CTRL+F tool. I want to find "!fire" and i want it to show me in an organized way the Name of the Filter and a segement of the querie surrounding the search key i typed. like 15 characters before and after the search key.
I want a small notes section for both labels and filters, that minimizes and expands easily, a corner tab.
I want a way to add new labels and filters.

I want a visual way to see which labels exist in which filter. within the queries I want the labels to show as different colors. use a different color for every label.

I want a tool that let's me 'select a filter' and then let's me click the 'labels' that i want added to it, and have it add the label.

I want this for every one of the filters, to be able to add and takeaway lables just by clicking them. and it should work when i have the 'affect all' checkbox checked on.

Think through reasonably and logically if there's any other organization tools for this type of webpage that i may need.

This tool is only ever going to be seen by my eyes even though we're attaching it to firebase so i can use it on multiple machines.

I have these pokemon go filters that help me filter my pokebox index in POKEMON GO with simple 
"  filter -- > delete all. " combinations.

The filters are still fairly general even though some of them have MANY pokemon names listed in them. my pokebox has become too full to even use them because i'm starting to have to manually review too much.

The Goal:

Make enough filters that cover 99%-100% use cases to be able to automatically filter--> delete all unwanted pokemon, without ever having to MANUALLY review.

Many of my filters are based around saving pokemon to trade: Generally you can only trade 100 pokemon a day. So having more than like 200 saved, non unique, pokemon at a time is just a waste of space, because i'll never get rid of them (on average I never do my 100 trades per day so the remaining just cause clutter and annoyance. I need to set boundaries/limits to how many mons i want to save to trade that are speficially from recent catches or non unique sources. Legendaries, costume pokemon, shinies, etc: are all unique source examples.)
-- 8/9 i've gotten better at managing this restriction

If i had a label for 'mons to trade' it would likely replace my TTE label and a couple of other labels. I could keep it to around 200 pokemon at all times. I would have to manually delete things from that list to keep it at 200 though - or when it's at 200 i can change what my mass-filter-trash label is to include the pokemon that would go into 'mons to trade' and sift them out so it doesnt go over 200.
Ie: pikachu goes into 'mons to trade'. Mons to trade is at 200. 
i use a different filter that filters out pikachus below a cp threshold and only keep high cp pikachus. I will have to manually unlabel some 'mons to trade' pickachus and replace them with better ones, but still slightly better?

the main trash filter has a lot of pokemon filtered out of trash because of cheap-evolution costs after trade, or because i want candy from trading. I need to be more scrupulous with what pokemon are filtered out because that list has become too long.

I have 3 generic CP tiers of filters, like -1000 cp, -1800 cp, -2350 cp, or 'something' like that. for the reason i gave above, some are worth trading.

One thing i want to do is statistically determine a pokemon's level by it's CP.
In order to filter you HAVE to use CP, but what i truly care about is the pokemons LEVEL.
Ie: a 1500 CP tauros means nothing to me if it's only lvl 10. i should wait to catch a lvl 25 tauros which may be much higher CP. (example only).

- what i began with another ai agent was attempting to sort poke mon based on their tier
 Ie: bulbasaur - tier 1, ivysaur tier 2, venusaur tier 3, Because a bulba,ivy,venu all at lvl 10 have major different CP's, so if i filter out a 700 cp bulbasaur, it could be a 3500 cp venusaur (fake math)
- so when i set filters i need to make sure my CP limits address the pokemon at each tier not just the tier 1's or tier 3's.
- 
I have a few random scraps from that session saved to tiersForNow.md as a place holder doc. The information is mostly useless right now but i saved it anyways.

i need help figuring out a good filter method to meet my goal. as well as the above - figuring out a full list of what CP each pokemon is at a specific lvl so we can make filters for CP ranges.


Existing labels:
Remote-Trade: overlaps with many other labels. specifically to show pokemon i'm willing to trade. many of these are only saved for this purpose. I try to keep it minimal but it is literally for pokemon i don't want that someone else may.

TTA: Trade to alt. Something i dont care about that myy be good for an alt. Usually high level (high cp) .

Trash : a filter to put legendaries into for when pokemon has events that let me transfer them for more candy. I have to manually add pokemon to it. no filter will work for this because its sensitive.

Powerup: overlaps many things. no way to filter to add pokemon to it.

MegaEv:

Walk4candy:

Evolveme

Gym

Xxl

Lure or buddyEV

Potentialmega

Frust

Pureevolve

and a few others. None really else to help add to filters to help filter my boxes. so most of these are unrelated to the task at hand.


My existing filters:


Cheapevolves — 29 Pokémon : Convenient


-2750cp TRSH — 120 Pokémon : Convenient - Generally requires manual filtering after filtering to this level. I don't *think* there's any other way to handle these because they are HIGH CP so worth keeping or trading to another account.

TTE 3*4* — 20 Pokémon : Another similar TTE, not really necessary

<1000trash — 26 Pokémon : One of my most used filters, still not perfect, but this one would probably be the FIRST of any filter-delete i ever do, with other filters following.

I currently have 540 favorites.
Pokebox size of 3100.
I believe if my box ever gets down to around 1500-1800 then I will feel like my filters have done their job. But i think that's a long ways off.
A lot of pokemon i want to keep are not favorited.

Related files unmentioned so far:
Existingfilters.md 
My filters with the filter written out so there's context

pokemon_go_search_filters.md for reference



I am manually going through my poke box right now. 

I'm going to list the steps i'm taking to do a 'deeper' clean.

in no particular order:
sorting shadows: i'm using the Pureevolve for shadows/pures ive identified that i want to save to evolve. I need some other labels to identify other reasons why i would keep shadows. I'm not currently holding any for my lvl 73 quest to purify. 
at the moment i'm just using 'shadow' filter and going 1 by 1.

Notes for later from sorting:
I have a 100 shadow meganium and bunnelyby. Need to decide if i ever care about meganium, i dont care about bunnelby. should trash it. Need to see if either has any other use before doing so.

one major thing i need to do is go through things when i have time to check pokebattler. One of my major freeze points is i don't remember which pokemon are worth keeping because there's so many now and i don't know the most recent 50% of them.
- i need to see if pokebattler or another site has a list of things one mon is good at countering , without having to look legendary by legendary, &or scrape multiple legendaries at a time and check results. Else; create my own site for this.

--
Manual sorting:
CP ties to mon-type ties to rarity.
low cp accepted if higher tier
High cp accepted at any tier range.
mid cp accepted if mid-high tier.

"Most / 9outof10" filters should have ALL labels in them. 
Core rule: "If something is labeled, it's saved for a reason*
Caveat to the core rule: when filtering mons within a label. (obviously)

- Legendaries don't need to be in any filters - they can't even be mass transferred.
- If i save a pokemon by name, it needs to have a corresponding label that it will belong to. The names are only for quick filtering. In downtime i should do filters the opposite way, search by names, and set labels, instead of for quick trashing.
- 
chansey blissey litten wimpod

4* + Can evolve:
pick useless 4* that can evolve for the 4*  dex
Any other 4* should be useful or trashed.

144 - 4* stars - not sure what to do with them right now.
Some are raiders/gymers. not all.



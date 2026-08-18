Let's implement the tier 1 pets and foods for turtle pack:

Add tests for each pet and food to make sure their abilities work.

Duck:
base stats: 2/2
Ability:
lvl1: Sell => Give shop pets +1 health
lvl2: Sell => Give shop pets +1 health
lvl3: Sell => Give shop pets +1 health

Duck increases the default health of the pets in the current shop by 1. It only affects the pets currently in shop, so if you roll them away, new pets will have default health.

Beaver:
base stats: 3/2
Ability:
lvl1: Sell => Give two random friends +1 attack
lvl2: Sell => Give two random friends +1 attack
lvl3: Sell => Give two random friends +1 attack

Pretty self explanatory

Pigeon:
base stats: 3/2
Ability:
lvl1: Sell => Stock one free Bread Crubms
lvl2: Sell => Stock two free Bread Crubms
lvl3: Sell => Stock three free Bread Crubms

Bread crumbs is a token food. When you sell pigeon, it should add a free bread crumb to the shop. Bread crumb gives +1 attack only.

Otter:
base stats: 1/4
Ability:
lvl1: Buy => Give one random friend +1 health.
lvl2: Buy => Give one random friend +1 health.
lvl3: Buy => Give one random friend +1 health.

Pig:
base stats: 4/1
Ability:
lvl1: Sell => Gain +1 gold
lvl2: Sell => Gain +2 gold
lvl3: Sell => Gain +3 gold

Pig gives extra gold from selling. So a lvl 1 pig will give 2 gold instead of the default 1.

Ant:
base stats: 2/2
Ability:
lvl1: Faint => Give one random friend +1 attack and +1 health
lvl2: Faint => Give one random friend +2 attack and +2 health
lvl3: Faint => Give one random friend +3 attack and +3 health

Mosquito:
base stats: 2/2
Ability:
lvl1: Start of battle => Deal 1 damage to one random enemy
lvl2: Start of battle => Deal 1 damage to two random enemies
lvl3: Start of battle => Deal 1 damage to three random enemies

Fish:
base stats: 2/3
Ability:
lvl1: Level-up => Give two friends +1 attack and +1 health
lvl2: Level-up => Give two friends +2 attack and +2 health
lvl3: No ability

Cricket:
base stats: 1/3
Ability:
lvl1: Faint => Summon one 1/1 Zombie Cricket
lvl2: Faint => Summon one 2/2 Zombie Cricket
lvl3: Faint => Summon one 3/3 Zombie Cricket

Zombie cricket has no ability, it is just a token cricket summons when it faints.

Horse:
base stats: 2/1
Ability:
lvl1: Friend Summoned => Give it +1 attack until next turn
lvl2: Friend Summoned => Give it +2 attack until next turn
lvl3: Friend Summoned => Give it +3 attack until next turn

Friend summoned activates when a pet is summoned in shop (like from a buy) or when summoned by an ability. The attack horse gives lasts only until next turn, so in the next shop phase that buff will be gone.

Food:
Honey: Give one pet the Honey perk. Faint => Summon one 1/1 Bee.

Bee has no ability, it's just a token honey summons.

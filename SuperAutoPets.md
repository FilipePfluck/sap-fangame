## Introduction

Super Auto Pets is a game made by Team Wood Games available on Steam, Play store and App store.
In the game, you make your team composed of up to five pets to battle against the teams made by other players. 

## Packs
Packs are collections of Pets and Foods. There are currently six static packs, called Turtle Pack, Puppy Pack, Star Pack, Golden Pack, Unicorn Pack and Danger Pack. There is also the Weekly Pack which is randomly generated and changes weekly on sundays. Out of those, only Turtle Pack and Weekly Pack are free to play. The others require an in game purchase.
Packs have 10 pets on each Tier, ranging from Tier 1 to tier 6. They also have 2 tier 1 foods, and 3 foods on tiers 2 to 6, with the exception of Turlte pack, which has a 4th tier 6 food. 
Players can also create Customs packs, with a selection of pets and foods of their choice. The rules for custom pack creation will be explained in more detail later on.

## Pets
Pets are the creatures that fight in this game. They are usually animals. Pets have a name and a sprite. Each pet is assigned a tier, ranging from 1 to 6. Each pet has a base health and a base attack. This is how much health and attack they have by default. The Health and Attack values can be changed by various means during the game. Pets can also have an ability that can do multiple different things. Pets can have levels, ranging from 1 to 3. The pets ability usually changes according to the pet current level (usually increasing numerically, proportionally to the level). 

## Foods
Foods are buffs that can be bought and fed to pets. They usually improve the pet in some way, such as by incresing its attack or health. 
There is a special type of food called Perks. Once a pet gains a perk, it will have a special boon that lasts while the pet has the perk. If a pet that has a perk gains a new perk, the old perk is replaced. Examples of perks include Honey, which summons a Bee when the pet faints, or Melon, which blocks 20 damage, once.  

## Playing the Game
The game is played on a series of turns. Each turn starts with a shop phase followed by a battle phase. After the end of a battle, the next turn starts, until the game ends.

## The shop phase
Players start the shop phase with 10 gold by default. Gold can be spent to buy pets or foods or to roll the shop. Buying a pet or food costs 3 gold by default, and rolling costs 1 gold.
The board has five spaces, and it starts empty in the first turn. Players can buy pets and place them in a space of their choice. Players can also reorder the pets as they like. Players can sell pets to empty a space in the board. Doing so gives 1 gold back for each of the pet's levels, by default. 
The shop is divided between a pet shop and a food shop. The pet shop starts with three spaces at turn 1. A fourth space is unlocked at turn 5, and a fivth space is unlocked at turn 9. The food shop starts with one space and a second space is unlocked at turn 5.
The shop is filled with random selections from the pool of unlocked tiers. At turn 1, only the tier 1 is available. Subsequent tiers are unlocked at odd tiers, with the 2nd tier being unlocked at turn 3 and the 6th tier being unlocked at turn 11.
This means the shop will start at turn 1 with three random pets from the 10 pets in tier 1, and a random food from the foods in tier 1.
You can freeze a pet or food on the shop. Doing so will lock that pet or food in place, it will remain in the shop even if it is rerolled.
You can reroll the shop for 1 gold. Doing so will remove all unfrozen pets and foods from the shop, and fill it with newly randomly generated options. The shop also rolls for free at the start of each turn. 
Duplicates of a pet can be merged together. Doing so will keep the highest attack of them, the highest health of them, and increase attack and health by one. It will also increase the XP of the pet by 1. If one of the pets has a perk, the perk will be kept. But if both pets have a perk, only the perk of the pet being dragged into will be kept (pets can only have 1 perk at a time). Pets can also be bought directly into and merged into a copy of them in the board. 
A lvl 1 pet needs 2 XP to level up, and a lvl 2 pet needs 3 XP to level up. XP can be gained by merging duplicates or by buying the Chocolate food (it givse +1 XP). 
When a pet levels up in shop, two new pets from the next shop tier will be stocked in shop. They will be linked together, meaning only one of them can be bought. 
Once you have made all your choices during the shop phase, you can press the "End Turn" button. Then, the game will proceed to the battle phase.
// note to self: add an explanation about shop overflow

## The battle phase
On the battle phase your team faces the enemy team. From left to right you have your pets from 5th to 1st and the enemy pets from 1st to 5ft. Your first pet faces the enemy first pet. 
The first thing that happens is "before battle" abilities activating, followed by "start of battle" abilities. 
After before battle and start of battle abilities activate, pets will start attacking. Your first pet will attack the enemy first pet. When pets attack, they deal damage to the enemy pet equal to their attack, and subtract damage taken from their health. 
The attack might result in abilities activating, such as "after attack" or "hurt" abilities, for example. The next round of attack will only happen after all abilities are resolved.
After all other abilities are resolved, if any pet has been reduced to 0 health, it will Faint and be removed from the board. A pet cannot gain stats or perks while it has 0 health, and is skipped over by abilities. 
A pet fainting can also result in abilities activating, such as "faint" or "friend faints" abilities. Those usually wait until the pet is removed from the board to activate.
After the pet is removed from the board, pets behind it will walk forward to take its space.
Rounds of attacks happen until all pets from one side faint. If all pets from both sides faint, the battle ends in a draw, otherwise, the side with remaining pets wins. 

## Activating Abilities
Whenever two or more pets with the same ability trigger activate their abilities, they do so in attack order. Meaning the ability of the highest attack pet activates first. If attack is tied, the order is random. 
Abilities can do multiple things, such as:
- dealing damage: the pet throws a rock at the target, dealing damage. This does not count as an attack.
- giving stats: the pet gives stats to another pet
- removing stats: the pet removes stats from another pet. This does not count as damage.
- giving perks: the pet gives a perk to another pet
and much more

## Permanent vs Temporary
Usually things that happen during the shop phase are permanent. The board state from one shop phase carries over to the next shop phase.
Some abilities specify that they last "until next turn".
Things that happen during battle are temporary. They will not affect the next shop phase. Some abilities state that they are "permanent", in which case they will affect the next shop phase. 

## Game modes

### Arena
When playing arena, you are matched to a different team each turn. The teams are asynchronous copies of teams other players have made before. You are matched against a team of the same turn as yours. 
You have 5 lives on arena, and you regain a life at turn 3, if you have lost one. You lose a life when you lose a battle. You lose if you run out of lives. You win a trophy when you win a battle. You win when you gain 10 trophies. 

### Versus
When playing versus, you are matched on a lobby with one or more people. You will only be matched against teams made by those people during this versus match. You can change your team to respond to the plays made by your opponents.
The versus match ends when only one people have remaining lives. 
Winning or losing in versus changes your ELO.

## Creating a Custom Pack
You can select pets and foods from the pets and foods you have unlocked (including the free to play ones, plus any other from packs you have purchased)
Custom packs can be categorized as Standard or Wild. Standard pack have some restrictions, while anything goes in Wild. 
Some pets have "tags", such as "hurt" or "summons" or "disruption". If you have more then two pets from the same tag, your pack is considered Wild.
Some pets extremely powerful, so they have a "super tag". If you have more than 5 super tags, your pack is considered Wild. 
You can choose a name and an icon for your custom pack. 
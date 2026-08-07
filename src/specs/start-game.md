For the rules of the game, read SuperAutoPets.md

We will start with arena games, but only with turtle pack so far.

Let's start with a POST /arena/queue endpoint to start a game. This will create a Game and the first Game Turn. The game contains an id and a player id the game turn will reference the game id and have a turn number, number of lives (starts at 5), number of trophies (starts at 0). The response of this endpoint will return the initial board state (5 empty spaces, so an array of five nulls), the initial shop state (3 randomly generated tier 1 pets from the pack and 1 random tier 1 food)

While we don't have the pets abilities coded, let's just use Sloths for now. The sloth has default health of 1, default attack of 1 and has no ability. The only food will be an apple, which gives +1 attack and +1 health.
Create a file for the Sloth and a file for the Apple, containing their information. We will do this for each pet and food.
I will add their sprites to the public folder.

Once we have the /arena/queue endpoint, we can implement endpoints for the actions the player can take: buying a pet, buying a food, rolling, reordering a pet, merging a pet, selling a pet and ending the turn.

I want to be able to have replays, so we need to store each gamestate in the database. So after each play the player takes, we need to create a new boardstate containing all the information needed to recreate this game later on, including board state and shop state, and store that in the database, referencing which game this is and which turn.

When a player takes an action, the game will always reference the last gamestate of the last turn of a match, because that's the only one that can be played on.

For buying a pet, we will have the POST /game/:game-id/buy-pet. We will send the position on the shop the player is trying to buy and the position on the board the player is trying to place the pet on. The server will have to check if the player has enough gold remaining to buy the pet and if there is an empty space on the board. If not, throw an appropriate error. If the purchase is valid, subtract the gold from the current turn

For buying a food, we will have the POST /game/:game-id/buy-food. We will send the position on the shop the player is tyring to buy and the position on the board (it has to have a pet in that position) the player is trying to buy that food onto.

For rolling, we will have the POST /game/:game-id/roll. We will store freezes on the client, and send the freezes over to the server when the player rolls. We will send the positions that are frozen, and the server will know not to roll those pets/foods. Frozen pets and foods are moved to the first positions in the shop, and the remaining shop is rolled (substituted with new random pets/foods). The new shop will be sent on the response of this request.

For end turn, we will have the POST /game/:game-id/end. Once the player ends the turn, the server will save its current team on a pool, and look for a team on the same turn made by a different player to fight against. If it doesn't find any, it will face a "Ghost" team, which has random pets with random stats, but for now we can just make it face a team of three 1/1 Sloths. Once the server finds an opponent, it will calculate the battle. Once again, I want each step of the battle to be persisted so the player can watch it later. If the player wins, it will gain one trophy, if it loses, it will lose a life, if it draws, lifes or trophies will not change. On the return of this endpoint we will send the result of the match (win/draw/loss), and the battle id.

We will also have a GET /game/:game-id/watch/:battle-id. This will return all the gamestate information required by the client to reconstruct the battle.

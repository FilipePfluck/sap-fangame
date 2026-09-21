on Start-game.md I asked to "Once the player ends the turn, the server will save its current team on a pool, and look for a team on the same turn made by a different player to fight against. If it doesn't find any, it will face a "Ghost" team"
but the game was hardcoded to always fight ghosts. Fix this. It should look at the database for a team on the same turn made by a different player.

Display the name of the opponent on the battle screen, if it's a ghost display "Ghost" instead of the name.

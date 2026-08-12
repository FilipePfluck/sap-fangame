let's add endpoints for reordering and merging.

POST /game/:game-id/reorder
Send which position is selected and the target position over the body. If the new position is empty, simply move the pet to that position. If not, you will also need to move the pets to a new position to make space. If you are moving the pet to the left, you will need to move all the pets in between the positions to the right, if you are moving to the right, you should move them to the left.

POST /game/:game-id/merge
You can merge a pet by dragging one copy into another, or by directly purchasing a pet from the shop into a copy of it in the board. So we will need to abstract this function to call it both on this endpoint and on the buy endpoint.

For the merge, check if both pets are the same. Then, take the highest attack of them both, the highest health of them both, and add +1+1. Also increase the XP by 1. We will need to implement xp and levels on the pets, I think they are not implemented yet.

After you implemented those two endpoints, change the buy endpoint so that you can buy a copy of a pet directly on top of it and merge it. Also make it possible to buy into an occupied space, as long as there is one free space on the board. Buying on an occupied space should cause a reordering (push the pets into the available space until the target space is empty).

After making all the changes in the backend, let's implement them in the fronted. When you select a pet on the board, add two new buttons on the other spaces: a move button to move the pet to that space, and a merge button, that is displayed only if the pets are the same.

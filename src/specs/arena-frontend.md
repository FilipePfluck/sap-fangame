now implement the frontend. Let's add a "Play" button in the main screen that will either go to the battle if there's already one with active status, or create a new one.

During the shop phase, we will have 5 rounded squares, each representing a space in the board. Below that, we will have the pet shop on the left and the food shop on the right. Display the pets that are currently in shop. Right clicking on an item on shop will freeze it. Alternativelly, clicking it will select it. While selected, there will be a new button for freezing the pet/food. If you select the pet or food and then click on a space on the board, it will be bought.

below that, we will have a roll button on the left and an end turn button on the right.

Don't forget to display errors as an alert if they happen.

Once the player clicks on end turn, call the watch endpoint. Position the player pets on the left side, facing right, and the enemy pets on the right side, facing left. Add simple animations for moving, attacking and fainting. Once the battle ends, display the result, and a button to go back to shop and play the next turn.

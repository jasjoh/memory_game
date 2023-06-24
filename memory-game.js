"use strict";

/**
 * TO DO ITEMS
 * - Allow setting number of cards (P1)
 * - Allow for randomizing colors (P1)
 * - Allow for using images (P2)
 */

/**
 * APP DESCRIPTION: Memory Game
 * - Display 2 or more pairs of cards on the page
 * - Users can click cards to flip them over
 * - After two cards have been flipped, their opposite sides either:
 * -- a. match and remain visible OR
 * -- b. do not match and flip back to their original state
 * - When all the cards have been matched the game is over
 *
 * GENERAL APP FLOW
 * - upon page load
 * -- create all the cards (including their click handlers)
 * -- create any buttons
 * - upon clicking 'start' button, enable click handling
 * - upon clicking on a card
 * -- check if card is flipped already and if so, ignore click
 * -- check if flipping is allowed (temp cards flipped < 2)
 * -- if flipping is allowed:
 * --- if first temp card flipped (no other temp flipped)
 * ---- flip card
 * ---- track card as temp flipped card
 * --- if second card
 * ---- flip card
 * ---- check if it matches with other temp flipped card
 * ----- if they match
 * ------ move cards from temp flipped array to match flipped array
 * ------ // BONUS: Flash cards / show message to indicate match made
 * ----- if they don't match
 * ------ call setTimeout() function to flip cards back
 */

/**
 * VARIABLE DECLARATIONS
 */

const WAITING_PERIOD = 1000; // defines how long before cards in a failed match are flipped back

// the set of color pairs which will be used for the cards
// each color (value) should be represented exactly twice
// the total number of colors should be even
const COLORS_STARTING_LIST = [
  "red", "blue", "green", "orange", "purple", "yellow",
  "red", "blue", "green", "orange", "purple", "yellow"
];

// determine how many cards should be rendered in each row
const CARDS_PER_ROW = findCardsPerRow(COLORS_STARTING_LIST);

// our default card back (the card color shown when its not flipped)
const BG_COLOR = 'grey';

// these variables keep track of flipped cards
let cardsFlippedTemp = [];
let cardsFlippedMatch = [];

// these are for tracking IDs of timers in case we need to cancel them
let animationIntervalId;
let animationTimeoutId;

// these track game state
let isCheatModeEnabled = false;
let isGameStarted = false;

/**
 * INITIAL PAGE POPULATION
 */

// create a reference to the element used for rendering the score
// will be used by functions that need to read of update the score
let scoreElement = document.getElementById("score");
let highScoreElement = document.getElementById("highscore");

// setup an event listener for the keyboard combo to trigger cheatmode
document.addEventListener("keydown", cheatMode);

// setup an event listener for the start button
let startButton = document.getElementById("button-start");
startButton.addEventListener("click", startGame);

// shuffle our colors to use when populate the board
// DEPRECATED as part of deprecating the fillGameBoard function
// let colorsShuffled = shuffle(COLORS_STARTING_LIST);
let colorsShuffled = [];

// populate the page with the initial game board using the shuffled colors
// DEPRECATED in favor of having a start / restart button to set colors
// fillGameBoard(colorsShuffled);

// populate the page with the cards, but don't set their co.lor
fillGameBoardNew(COLORS_STARTING_LIST);

// read and populate the high score
setHighScore();

// AND NOW WE WAIT FOR THE USER TO INTERACT WITH THE PAGE

/**
 * PAGE POPULATION FUNCTIONS
 */

// Set the high score on page load or when a new one is achieved
function setHighScore(newScore) {
  // set highscore in local storage if a new one was achieved
  if (newScore) {localStorage.setItem("highscore", newScore);};
  // check if high score has ever been set
  if (localStorage.getItem("highscore") === null) {
    // it has not, so set it to 0
    localStorage.setItem("highscore", 0);
  }
  // fetch the high score from local storage
  let localHighScore = localStorage.getItem("highscore");
  // fetch the displayed high score string
  let displayedHighScoreArray = highScoreElement.innerText.split(" ");
  // update the displayed high score to be the local high score or new high score if provided
  displayedHighScoreArray[2] = localHighScore;
  highScoreElement.innerText = displayedHighScoreArray.join(" ");
}

// This function determines how many cards should be in each row of cards
// We want rows to be 5 cards or less with ideally as close to 5 cards per row
// We need to figure out how many cards per row by attempting to identify the largest divisor
// We can start at 5 and work our way down until the remainder is 0
// We divide the total cards by that number to determine # of rows
function findCardsPerRow(COLORS_STARTING_LIST) {
  if (COLORS_STARTING_LIST.length % 2 !== 0) {
    alert("Invalid Card Count - Must Be Even Number");
    return 0;
  }
  let numCards = COLORS_STARTING_LIST.length;
  // we start at i = 5 cards per row
  for (let i = 5; i >= 2; i--) {
    if (numCards % i === 0) {
      return i;
    }
  }
  alert("error finding rows");
  return 0;
}

// This function shuffles our initial list of color pairs
function shuffle(colors) {
  // This algorithm does a "perfect shuffle", where there won't be any
  // statistical bias in the shuffle (many naive attempts to shuffle end up not
  // be a fair shuffle). This is called the Fisher-Yates shuffle algorithm; if
  // you're interested, you can learn about it, but it's not important.
  for (let i = colors.length - 1; i > 0; i--) {
    // generate a random index between 0 and i
    let j = Math.floor(Math.random() * i);
    // swap item at i <-> item at j
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  return colors;
}

// This function is used to fill the game board with cards
// DEPRECATED: This function expects cards to be shuffled and sets their colors
// DEPRECATED: It is replaced by a separate card population and color etting
function fillGameBoard(colorsShuffled) {
  const gameBoard = document.getElementById("game");
  // iterate through all the colors and add them as cards
  for (let i = 0; i < colorsShuffled.length; i++) {
    // check if a new row is needed
    if (isRowNeeded()) {
      addRow(gameBoard);
    }
    addCard(colorsShuffled[i], i);
  }
}

// This function is use to fill the game board with cards
// It does NOT set each card's class color
// It is intended to be card on first page load only
function fillGameBoardNew(COLORS_STARTING_LIST) {
  const gameBoard = document.getElementById("game");
  // add a new card representing each color
  for (let i = 0; i < COLORS_STARTING_LIST.length; i++) {
    // check if a new row is needed
    if (isRowNeeded()) {
      addRow(gameBoard);
    }
    addCardNew(i);
  }
}

// This is a helper function used by fillGameBoard()
// It returns true if a new row is needed for any additional cards to-be-added
function isRowNeeded() {
  let cardRows = document.getElementsByClassName("card_row");
  let cardRowCount = cardRows.length;
  if (!cardRowCount) {
    // no rows exist so we need to add one + the new meme
    return true;
  } else {
    // one or more rows exist
    // check if last row is full
    let cardCount = cardRows[cardRowCount - 1].childElementCount;
    if (cardCount < CARDS_PER_ROW) {
      // row is not full so no need to add a new one
      return false;
    } else {
      // row is full, so add a new row + the new meme
    return true;
    }
  }
}

// This is a helper function used by fillGameBoard()
// It adds a new row which will how two or more cards
function addRow(gameBoard) {
  let newRow = document.createElement("div");
  newRow.className = "row card_row";
  gameBoard.appendChild(newRow);
}

// DEPRECATED: Replaced by addCardNew
// This is a helper function used by fillGameBoard()
// It adds a new card to a row
function addCard(color, index) {
  let newCard = document.createElement("div");
  let cardRows = document.getElementsByClassName("card_row");
  // newCard.className = "col card p-1 m-1 " + color;
  newCard.className = "col card p-1 m-1";
  newCard.id = "card-" + index;
  newCard.style.backgroundColor = BG_COLOR;
  // newCard.style.backgroundColor = color;
  newCard.addEventListener("click", handleCardClick);
  cardRows[cardRows.length - 1].appendChild(newCard);
}

// This function adds the cards w/o setting their class color
function addCardNew(index) {
  let newCard = document.createElement("div");
  let cardRows = document.getElementsByClassName("card_row");
  newCard.className = "col card p-1 m-1";
  newCard.id = "card-" + index;
  newCard.style.backgroundColor = BG_COLOR;
  newCard.addEventListener("click", handleCardClick);
  cardRows[cardRows.length - 1].appendChild(newCard);
}

/**
 * ADDITIONAL FUNCTIONS
 */

// This function is called when the Start (or Restart) button is clicked
function startGame() {
  // shuffle the card colors
  colorsShuffled = shuffle(COLORS_STARTING_LIST);
  // stop any active end-game animations
  stopAnimation();
  // reset flipped card trackers
  cardsFlippedTemp = [];
  cardsFlippedMatch = [];
  // reset score
  scoreElement.innerText = "Current Score: 0";
  // reset cards to their BG_COLOR
  let cardElements = document.getElementsByClassName("card");
  for (let i = 0; i < cardElements.length; i++) {
    cardElements[i].style.backgroundColor = BG_COLOR;
  }
  // update game stat
  isGameStarted = true;
  // switch the start button to "restart"
  startButton.innerText = "Restart Game";
  // toggle game button
  toggleGameButtons();
}

// these functions ended up not being necessary as we ultimately relied on ..
// .. referencing the card ID to the index in the shuffled colors array to ..
// .. determine color as opposed to looking through the class values
/*
function setCardColors(colorsShuffled) {
  // iterate through all the shuffled colors
  for (let i = 0; i < colorsShuffled.length; i++) {
    // select the element w/ an ID matching the index of the current color
    let cardToColor = document.getElementById("card-" + i);
    let oldClassName = cardToColor.className;
    // check if the card already has a color assigned (i.e. the game has been restarted)

    cardToColor.className = oldClassName + colorsShuffled[i];
  }
}

function replaceClassColor(classNames) {
  let arrClassNames = classNames.split(" ");
  for (let className of arrClassNames) {
    // if (className.substr(0,6) === "color-")
  }
}
*/

// This function flips a card to its face or backside
// It is passed a card which either:
// a. represents a card's index in the shuffled colors list OR
// b. represents the ID of a card's element on the page in the format 'card-[index]'
// If it is (b), isFullId will be a true
function flipCard(card, isFullId) {
  // check if the card passed is a full element ID or not
  if (isFullId) {
    // we were passed a full card ID value so we need to split and use only the number
    card = card.id.split("-")[1]
  };
  // find out what the card's face color is
  let cardFlippedColor = colorsShuffled[card];
  // establish the element on the page representing that card
  let cardElement = document.getElementById("card-" + card);
  // determine that element's current color
  let cardCurrentColor = cardElement.style.backgroundColor; // <-- note: this will not return styles assigned by CSS sheets
  // check if the element's current color is the same as it's face color
  if (cardFlippedColor === cardCurrentColor) {
    // they do match so the card is flipped to it's front (showing it's color)
    // we need to flip it back over so that it's back color (BG_COLOR) is shown
    cardElement.style.backgroundColor = BG_COLOR;
  } else {
    // they don't match so the card is showing it's back
    // we need to switch it to show it's face color
    cardElement.style.backgroundColor = colorsShuffled[card];
  }
}

// This function flips all temporarily flipped cards so their back show again
// It is intended to be called when two cards have been temp flipped and they did not match
function resetTempCards() {
  for (let card of cardsFlippedTemp) {
    flipCard(card);
  }
  cardsFlippedTemp = [];
}

// This is the function which will be called when any card is clicked
function handleCardClick(event) {
  // if the game hasn't started, ignore card clicks
  if (!isGameStarted) { return; }
  // find out the index of the card that was clicked
  let cardClickedIndex = event.target.id.split("-")[1];
  // establish the color of the card based on its index
  let cardClickedColor = colorsShuffled[cardClickedIndex];
  // check if the card clicked on is already in the list of temp flipped cards or matched cards (check if it's already flipped)
  if (cardsFlippedMatch.indexOf(cardClickedIndex) === -1 && cardsFlippedTemp.indexOf(cardClickedIndex) === -1) {
    // card is not flipped so we can flip it
    // check if flipping is allowed (temp cards flipped < 2)
    if (cardsFlippedTemp.length < 2) {
      // less than 2 cards temp-flipped so we can continue flip logic
      if (cardsFlippedTemp.length === 0) {
        // no temp cards flipped yet so we can flip away
        cardsFlippedTemp.push(cardClickedIndex);
        flipCard(cardClickedIndex);
      } else {
        // one card is flipped, so we need to check for a match
        // compare color of the clicked card against the color value at the index in color list matching ID of card in temp list
        if (cardClickedColor === colorsShuffled[cardsFlippedTemp[0]]) {
          // the colors match, so we have a match
          // move (pop) the temp flipped card to the matched cards
          cardsFlippedMatch.push(cardsFlippedTemp.pop());
          // add the card just clicked to the matched cards
          cardsFlippedMatch.push(cardClickedIndex);
          // flip the card
          flipCard(cardClickedIndex);
          // update the score (with a value of true indicating it was a match)
          updateScore(true);
          // check if the game is finished
          checkForGameOver();
        } else {
          // they were NOT a match
          // add the card just clicked to the matched cards
          cardsFlippedTemp.push(cardClickedIndex);
          // flip the card
          flipCard(cardClickedIndex);
          // update the score (with a value of false indicating it was not a match)
          updateScore(false);
          // start the timeout to reset the cards
          setTimeout(resetTempCards, WAITING_PERIOD);
        }
      }
    } else {
      // two cards already flipped, ignore this click
      return;
    }
  } else {
    // card is already flipped so we can ignore this click
    return;
  }
}

// This function is called whenever a match occurs to see if the final match was made
function checkForGameOver() {
  // check if the total matched cards is equal the total cards
  if (cardsFlippedMatch.length === COLORS_STARTING_LIST.length) {
    // they are equal so game is over
    isGameStarted = false;

    // toggle game buttons
    toggleGameButtons();

    //update the score and let the user know they won
    let scoreStrArray = scoreElement.innerText.split(" ")
    scoreElement.innerText = "YOU WON! - Final Score: " + scoreStrArray[2] + " !";

    // update high score if needed, but only if not in cheat mode
    // if (!isCheatModeEnabled) {
      // check if current score is higher than previous high score
      let currentScore = Number(scoreStrArray[2]);
      let highScore = localStorage.getItem("highscore");
      if (currentScore > highScore) {
        // we have a new high score
        // TODO: Update high score + show message
        setHighScore(currentScore);
        alert("New High Score!");
      }

    // }

    // start the game over animation
    startGameOverAnimation();
  }
}

// This function is called whenever two temp cards are flipped
// An 'isMatch' parameter is passed indicating whether a successful match occurred
function updateScore(isMatch) {
  let scoreStrArray = scoreElement.innerText.split(" ")
  let score = Number(scoreStrArray[2]);
  // increment the score by 100 if it's a match, otherwise decrement by 100
  isMatch ? scoreStrArray[2] = score + 100 : scoreStrArray[2] = score - 100;
  scoreElement.innerText = scoreStrArray.join(" ");
}

// This function starts the animation
function startGameOverAnimation() {
  animationIntervalId = setInterval(animateCards, 500);
  animationTimeoutId = setTimeout(stopAnimation, 8000);
}

// This function flips all the cards
// It is intended to be called on an interval as part of the game over animation
function animateCards() {
  let cards = document.getElementsByClassName("card");
  for (let card of cards) {
    flipCard(card, true);
  }
}

// This function stops the end-game animation
// It is called after a certain time period once the animation starts
// It is also called when a user re-starts the game
function stopAnimation() {
  clearInterval(animationIntervalId);
  animationIntervalId = null;
  clearTimeout(animationTimeoutId);
  animationTimeoutId = null;
}

// This function is called whenever any keys are pushed
function cheatMode(event) {
  // check if the CTRL, SHIFT and '1' keys are pressed
  if (event.ctrlKey && event.shiftKey && event.code === "Digit1") {
    // The key combination was pressed so display cheat mode controls
    isCheatModeEnabled = true;
    displayCheatHtml();
  }
}

// This function forces the game into an end "won" state
// Called when the associated button is clicked
function cheatWinGame() {
  // can't win the game unless it's started
  if (!isGameStarted) { return; }
  let cards = document.getElementsByClassName("card");
  for (let card of cards) {
    flipCard(card, true);
  }
  for (let i = 0; i < COLORS_STARTING_LIST.length; i++) {
    cardsFlippedMatch[i] = "cheat";
  }
  checkForGameOver();
}

// This function resets the high score
// Called when the associated button is clicked
function resetHighScore() {
  localStorage.setItem("highscore", 0);
  setHighScore(0);
}

// This function boosts the high score by 100
// Called when the associated button is clicked
function boostScore() {
  updateScore(true);
}

// This function displays all the cheat control HTML
// It is called when cheat mode is enabled
function displayCheatHtml() {
  let buttonsContainer = document.getElementById("buttons-container");
  let buttonsCol = document.getElementById("buttons-col");

  // create first row and append to cheat container
  let cheatRow = document.createElement("div");
  cheatRow.className = "row";
  buttonsContainer.insertBefore(cheatRow, document.getElementById("buttons-row"));

  // create warning div and add inside first row
  let cheatWarning = document.createElement("div");
  cheatWarning.className = "cheat-warnings col d-flex text-white justify-content-center align-items-center bg-danger";
  cheatWarning.innerText = "CHEAT MODE ENABLED";
  cheatRow.appendChild(cheatWarning);

  // create win button and add inside buttons div
  let cheatWinButton = document.createElement("button");
  cheatWinButton.id = "cheat_win";
  cheatWinButton.type = "button";
  cheatWinButton.className = "btn btn-danger btn-sm mx-2";
  cheatWinButton.innerText = "Win Game";
  cheatWinButton.addEventListener("click", cheatWinGame);
  buttonsCol.appendChild(cheatWinButton);

  // create reset high score button and add inside buttons div
  let resetHighScoreButton = document.createElement("button");
  resetHighScoreButton.id = "cheat_reset_high";
  resetHighScoreButton.type = "button";
  resetHighScoreButton.className = "btn btn-danger btn-sm mx-2";
  resetHighScoreButton.innerText = "Reset High Score";
  resetHighScoreButton.addEventListener("click", resetHighScore);
  buttonsCol.appendChild(resetHighScoreButton);

  // create achieve high score button and add inside buttons div
  let boostScoreButton = document.createElement("button");
  boostScoreButton.id = "cheat_boost_score";
  boostScoreButton.type = "button";
  boostScoreButton.className = "btn btn-danger btn-sm mx-2";
  boostScoreButton.innerText = "Boost Score";
  boostScoreButton.addEventListener("click", boostScore);
  buttonsCol.appendChild(boostScoreButton);

  // initialize the game button state
  toggleGameButtons();

  // create third row and append to cheat container
  cheatRow = document.createElement("div");
  cheatRow.className = "row";
  buttonsContainer.appendChild(cheatRow);

  // create another warning div and add inside third row
  cheatWarning = document.createElement("div");
  cheatWarning.className = "cheat-warnings col d-flex text-white justify-content-center align-items-center bg-danger";
  cheatWarning.innerText = "CHEAT MODE ENABLED";
  cheatRow.appendChild(cheatWarning);
}

// this function toggles enabling / disabling any game buttons based on game stat
function toggleGameButtons() {
  if (isGameStarted) {
    // the game has started and buttons should reflect that
    if (isCheatModeEnabled) {
      // toggle the cheat mode buttons
      let winButton = document.getElementById("cheat_win");
      winButton.removeAttribute("disabled");
      let boostScoreButton = document.getElementById("cheat_boost_score");
      boostScoreButton.removeAttribute("disabled");
    }
  } else {
    // the game has ended and buttons should reflect that]
    if (isCheatModeEnabled) {
      // toggle the cheat mode buttons
      let winButton = document.getElementById("cheat_win");
      winButton.setAttribute("disabled", "");
      let boostScoreButton = document.getElementById("cheat_boost_score");
      boostScoreButton.setAttribute("disabled", "");
    }
  }
}
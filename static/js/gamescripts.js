 /**
   * Update url to reflect current state
   */
 function pushURLState ( newurl ) {
    newurl += '';
 	window.history.replaceState ( {}, 'Hangman Game', newurl );
 }

/**
  * Called when user clicks Letter or Word guess
  * selector: id of desired element to get guess value from
  * guess_type: letter, or word
*/
function guess ( selector, guess_type ) {
    let elem = document.querySelector ( selector );
    let guess = elem.value + '';

    if ( ! guess ) {
        alert ( 'Please enter a one-letter guess!' );
        return;
    }

    // Clear the guess so user doesn't have to backspace etc.
    elem.value = '';

    let game_id = getQueryStringValue ( 'id' );
    let url = '';
    switch ( guess_type ) {
        case 'letter':
            url = 'guessletter?id=' + game_id + '&letter=' + guess;
            break;
        case 'word':
            url = 'guessword?id=' + game_id + '&word=' + guess;
            break;
    }

    callHTTP ( url ).then (
        x => executeGuess ( x ),
        err => console.error ( 'gamescripts::guess', err )
    );
}

/**
  * Called when user clicks Undo
*/
function undo () {
    let game_id = getQueryStringValue ( 'id' );
    let url = 'undomove?id=' + game_id;

    callHTTP ( url ).then (
        x => executeUndo ( x ),
        err => console.error ( 'gamescripts::undo', err )
    );
}

/**
  * Called by Undo
  * data: payload returned from remote http call
*/
function executeUndo ( data ) {
    let blanks = JSON.parse ( data.blanks );
    let wrong = JSON.parse ( data.wrong );

    letters.innerHTML = '';
    wrong_guesses.innerHTML = '';

    refreshLetters ( blanks );
    refreshWrongGuesses ( wrong );
    refreshNumberWrong ( wrong.length );

    let id = getQueryStringValue ( 'id' );
    let new_state = `?id=${id}&mid=${data.movetime}`;
    pushURLState ( new_state );
}

/**
  * Called by guess
  * data: payload returned from remote http call
*/
function executeGuess ( data ) {
    if ( data.hasOwnProperty ( 'gamestatus' ) ) {
        endGame ( data.gamestatus );
    } else if ( data.hasOwnProperty ( 'guesserror' )  && data.guesserror == 2 ) {
        alert ( 'Can only guess whole word once!' );
        return;
     } else if ( data.wordcomplete == 3 ) {
        alert ( 'Whole word guess incorrect!' );
        return;
    } else {
        let blanks = JSON.parse ( data.blanks );
        let wrong = JSON.parse ( data.wrong );

        letters.innerHTML = '';
        wrong_guesses.innerHTML = '';

        refreshLetters ( blanks );
        refreshWrongGuesses ( wrong );
        refreshNumberWrong ( wrong.length );

        // Give user some indication they finished word
        if ( data.wordcomplete == 1 ) {
            alert ( "Word complete!" );
        }
    }
    
    let id = getQueryStringValue ( 'id' );
    let new_state = `?id=${id}&mid=${data.movetime}`;
    pushURLState ( new_state );
}

/**
  * Update visible letters based on return from backend
  * blanks: info to fill in to completed, or missing, letter spaces
*/
function refreshLetters ( blanks ) {
    let frag = document.createDocumentFragment ( );
    let letters = document.querySelector ( '#letters' );

    letters.innerHTML = '';

    blanks.forEach ( x => {
        let cell = document.createElement ( 'div' );
        cell.className = 'cell';
        let letter = document.createElement ( 'div' );
        letter.className = 'letter_blank';
        letter.innerText = x;
        cell.appendChild ( letter );
        frag.appendChild ( cell );
    });

    letters.appendChild ( frag );
}

/**
  * Update wrong guess list
  * guesses: wrong guess list returned from server
*/
function refreshWrongGuesses ( guesses ) {
    let frag = document.createDocumentFragment ( );
    let wrong_guesses = document.querySelector ( '#wrong_guesses' );

    wrong_guesses.innerHTML = '';

    guesses.forEach ( x => {
        let cell = document.createElement ( 'div' );
        cell.className = 'cell';
        let wrong_guess = document.createElement ( 'div' );
        wrong_guess.className = 'wrong_guess';
        wrong_guess.innerText = x;
        cell.appendChild ( wrong_guess );
        frag.appendChild ( cell );
    });

    wrong_guesses.appendChild ( frag );
}

/**
  * Updates wrong guess count
  * num: length of current wrong guess list
*/
function refreshNumberWrong ( num ) {
    let elem = document.querySelector ( '#number_wrong' );
    elem.innerHTML = '<b>' + num + '</b>&nbsp;wrong guesses (max 8)';
}

/**
  * When game data is complete, win or lose, push user to end game page
  * status: user won or lost
*/
function endGame ( status ) {
    window.location.href = 'static/gameover.html?gamestatus=' + status;
}

/**
  * Select and display which message to give user when game ends
  * css_class: style to apply to element (red lose, green win, etc)
  * msg: text to show user based on status.
*/
function loadGameOverMessage ( css_class, msg ) {
    let gamestatus = getQueryStringValue ( "gamestatus" );
    switch ( gamestatus ) {
        case "0":
            css_class ='gameloss';
            msg = 'Too many guesses, game over!';
            break;
        case "1":
            css_class ='gamewon';
            msg = 'All words guessed, you win!';
            break;
        case undefined:
            css_class ='gameloss';
            msg = 'Could not determine game status!';
            break;
    }

    let elem = document.querySelector ( '#game_over_message' );
    let display = document.createElement ( 'div' );
    display.className = css_class;
    display.innerText = msg;
    elem.appendChild ( display );
}
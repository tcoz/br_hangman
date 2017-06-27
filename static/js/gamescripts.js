/**
  * Called when user clicks Letter or Word guess
  * selector: id of desired element to get guess value from
  * guess_type: letter, or word
*/
function guess ( selector, guess_type ) {
    var elem = document.querySelector ( selector );
    var guess = elem.value + '';

    if ( ! guess ) {
        alert ( 'Please enter a one-letter guess!' );
        return;
    }

    // Clear the guess so user doesn't have to backspace etc.
    elem.value = '';

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {

           if (xmlhttp.status == 200) {
                executeGuess ( xmlhttp.responseText );
           }
           else if (xmlhttp.status == 400) {
              alert ( 'There was an error 400' );
           }
           else {
               alert ( 'Something else other than 200 was returned' );
           }
        }
    }.bind ( this );

    var game_id = getQueryStringValue ( 'id' );
    var url = '';
    switch ( guess_type ) {
        case 'letter':
            url = 'guessletter?id=' + game_id + '&letter=' + guess;
            break;
        case 'word':
            url = 'guessword?id=' + game_id + '&word=' + guess;
            break;
    }


    xmlhttp.open ( "GET", url, true );
    xmlhttp.send ();
}

/**
  * Called when user clicks Undo
*/
function undo () {

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {

           if (xmlhttp.status == 200) {
                executeUndo ( xmlhttp.responseText );
           }
           else if (xmlhttp.status == 400) {
              alert ( 'There was an error 400' );
           }
           else {
               alert ( 'Something else other than 200 was returned' );
           }
        }
    }.bind ( this );

    var game_id = getQueryStringValue ( 'id' );
    var url = 'undomove?id=' + game_id;

    xmlhttp.open ( "GET", url, true );
    xmlhttp.send ();
}

/**
  * Called by Undo
  * data: payload returned from remote http call
*/
function executeUndo ( data ) {
    var json = JSON.parse ( data );
    var blanks = JSON.parse ( json.blanks );
    var wrong = JSON.parse ( json.wrong );

    letters.innerHTML = '';
    wrong_guesses.innerHTML = '';

    refreshLetters ( blanks );
    refreshWrongGuesses ( wrong );
    refreshNumberWrong ( wrong.length );
}

/**
  * Called by guess
  * data: payload returned from remote http call
*/
function executeGuess ( data ) {
    var json = JSON.parse ( data );
    if ( json.hasOwnProperty ( 'gamestatus' ) ) {
        endGame ( json.gamestatus );
    } else if ( json.hasOwnProperty ( 'guesserror' )  && json.guesserror == 2 ) {
        alert ( 'Can only guess whole word once!' );
        return;
     } else if ( json.wordcomplete == 3 ) {
        alert ( 'Whole word guess incorrect!' );
        return;
    } else {
        var blanks = JSON.parse ( json.blanks );
        var wrong = JSON.parse ( json.wrong );

        letters.innerHTML = '';
        wrong_guesses.innerHTML = '';

        refreshLetters ( blanks );
        refreshWrongGuesses ( wrong );
        refreshNumberWrong ( wrong.length );

        // Give user some indication they finished word
        if ( json.wordcomplete == 1 ) {
            alert ( "Word complete!" );
        }
    }
}

/**
  * Update visible letters based on return from backend
  * blanks: info to fill in to completed, or missing, letter spaces
*/
function refreshLetters ( blanks ) {
    var frag = document.createDocumentFragment ( );
    var letters = document.querySelector ( '#letters' );

    letters.innerHTML = '';

    for ( var i = 0; i < blanks.length; i++ ) {
        var cell = document.createElement ( 'div' );
        cell.className = 'cell';
        var letter = document.createElement ( 'div' );
        letter.className = 'letter_blank';
        letter.innerText = blanks [ i ];
        cell.appendChild ( letter );
        frag.appendChild ( cell );
    }

    letters.appendChild ( frag );
}

/**
  * Update wrong guess list
  * guesses: wrong guess list returned from server
*/
function refreshWrongGuesses ( guesses ) {
    var frag = document.createDocumentFragment ( );
    var wrong_guesses = document.querySelector ( '#wrong_guesses' );

    wrong_guesses.innerHTML = '';

    for ( var i = 0; i < guesses.length; i++ ) {
        var cell = document.createElement ( 'div' );
        cell.className = 'cell';
        var wrong_guess = document.createElement ( 'div' );
        wrong_guess.className = 'wrong_guess';
        wrong_guess.innerText = guesses [ i ];
        cell.appendChild ( wrong_guess );
        frag.appendChild ( cell );
    }

    wrong_guesses.appendChild ( frag );
}

/**
  * Updates wrong guess count
  * num: length of current wrong guess list
*/
function refreshNumberWrong ( num ) {
    var elem = document.querySelector ( '#number_wrong' );
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
    var gamestatus = getQueryStringValue ( "gamestatus" );
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

    var elem = document.querySelector ( '#game_over_message' );
    var display = document.createElement ( 'div' );
    display.className = css_class;
    display.innerText = msg;
    elem.appendChild ( display );
}
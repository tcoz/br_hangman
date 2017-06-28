import json
import datetime
import random

from copy import copy

from flask import Flask
from flask import render_template
from flask import make_response
from flask import redirect
from flask import request

import gameutils

from gameobjects import HangmanGame
from gameobjects import Move

app = Flask(__name__)


''' Game list and common values '''

games = []

MAX_GUESSES = 8
BLANK_CHAR = "_"
RUNGAME_REDIRECT = "rungame?id="
GAME_TEMPLATE = "game.html"
ERROR_TEMPLATE = "error.html"
GAME_OVER_TEMPLATE = "gameover.html"
ID_FIELD = "id"
WORD_FIELD = "word"
LETTER_FIELD = "letter"
MOVETIME_FIELD = 'mid'
LOSS = 0
WIN = 1
WORD_GUESS_USED = 2
WHOLE_WORD_GUESS_WRONG = 3



''' Service Endpoints '''

''' Show the index page '''
@app.route ('/')
def show_index ():
    return render_template ( "index.html" )


''' Called when a user clicks the Start button on index.html '''
@app.route ( "/newgame" )
def new_game ():
    game_id = gameutils.gen_unique_id ( )
    word_list = gameutils.gen_wordlist ( )
    new_game = HangmanGame ( game_id = game_id, word_list = word_list )
    games.append ( new_game )
    return redirect ( RUNGAME_REDIRECT + game_id )


''' Called after a new game is created, or a user branches an existing game '''
@app.route ( "/rungame" )
def run_game ():
    game_id = 0
    move_time = 0

    try:
        game_id = request.args.get ( ID_FIELD )
    except StandardError:
        return render_template ( ERROR_TEMPLATE, error = "Invalid Game URL" )

    try:
        move_time = int ( str ( request.args.get ( MOVETIME_FIELD ) ) )
    except StandardError:
        print ">>>>>> No move time for game, will not bramch"

    game = get_game ( game_id )

    if game is None:
        return render_template(ERROR_TEMPLATE, error="Could not find game with id" + game_id )

    ''' If the game is already in progress, the user is branching it '''
    if move_time > 0 and game.inprogress:
        branched_id = branch_game ( game, move_time )
        return redirect(RUNGAME_REDIRECT + branched_id)

    if game is None:
        return render_template ( ERROR_TEMPLATE, error = "Could not find game with id " + game_id + "!" )
    else:
        game.inprogress = True
        return ( render_template ( GAME_TEMPLATE,
                                   current_wrong_guesses = game.current_wrong_guesses,
                                   current_blanks = game.current_blanks ) )


''' When a user accesses a URL for an existin game, copy the state and create a new instance '''
def branch_game ( game, move_time ):

    ''' If user starts game from inprogress game, branch it, set new id, etc. '''
    branched_id = gameutils.gen_unique_id ()

    ''' prune the undo stack to the indicated time '''
    undo_stack = filter ( lambda x: x.created <= move_time, game.undo_stack )

    ''' get last move of the stack, use it to set up the game state '''
    last_move = undo_stack [ len ( undo_stack  ) - 1 ]

    word_list = copy ( last_move.word_list )

    ''' Shuffle remaining words, or user can finish branched game by looking at first '''
    random.shuffle ( word_list )

    branched_game = HangmanGame(game_id=branched_id, word_list=word_list)
    branched_game.undo_stack = undo_stack
    branched_game.created = gameutils.gen_timestamp ()
    branched_game.current_word = last_move.current_word
    branched_game.current_blanks = copy ( last_move.current_blanks )
    branched_game.current_wrong_guesses = copy ( last_move.current_wrong_guesses )
    branched_game.complete = last_move.game_complete
    branched_game.inprogress = False
    ''' Give the branched user another word guess '''
    branched_game.word_guess_used = False

    games.append ( branched_game )
    return branched_id


''' Processes user letter guesses sent from the UI '''
@app.route ( "/guessletter" )
def guess_letter ():
    word_complete = LOSS
    game_id = request.args.get ( ID_FIELD )
    guess = str ( request.args.get ( LETTER_FIELD ) ).upper ( )
    game = get_game ( game_id )

    indexes = find_char_indexes(game.current_word, guess)

    if len(indexes) > 0:
        for i in indexes:
            game.current_blanks[i] = guess

        ''' If word is complete, go to next word '''
        iscomplete = find_char_indexes(game.current_blanks, BLANK_CHAR)
        if len(iscomplete) == 0:
            ''' If no more words, game is done, user wins'''
            if len ( game.word_list ) == 0:
                payload = json.dumps ( { "gamestatus": WIN } );
            else:
                word_complete = WIN
                game.nextword()
    else:
        game.current_wrong_guesses.append(guess)

        ''' If eight wrong guesses, game over '''
        if len(game.current_wrong_guesses) == MAX_GUESSES:
            game.complete = True
            payload = json.dumps({"gamestatus": LOSS})

    move = Move(copy(game.word_list),
                game.current_word,
                copy(game.current_blanks),
                copy(game.current_wrong_guesses),
                game.complete)

    game.undo_stack.append(move)

    json_blanks = json.dumps(game.current_blanks)
    json_wrong_guesses = json.dumps(game.current_wrong_guesses)
    payload = json.dumps( {"blanks": json_blanks,
                           "wrong": json_wrong_guesses,
                           "wordcomplete" : word_complete,
                           "movetime" : str ( move.created ) })
    return payload


''' Processes user word guesses sent from the UI '''
@app.route ( "/guessword" )
def guess_word ():
    word_complete = LOSS
    game_id = request.args.get ( ID_FIELD )
    guess = str ( request.args.get ( WORD_FIELD ) ).upper ( )
    game = get_game ( game_id )

    ''' If user already used word guess, send error '''
    if game.word_guess_used:
        return json.dumps({"guesserror": WORD_GUESS_USED});

    ''' Otherwise, flag it and proceed '''
    game.word_guess_used = True

    if guess == game.current_word:
        word_complete = WIN
        game.current_blanks = guess.split ()
    else:
        word_complete = WHOLE_WORD_GUESS_WRONG

    ''' If no more words, game is done, user wins '''
    if len(game.word_list) == 0:
        game.complete = True
        return  json.dumps({"gamestatus": WIN});
    elif word_complete == WIN:
        game.nextword()

    move = Move(copy(game.word_list),
                game.current_word,
                copy(game.current_blanks),
                copy(game.current_wrong_guesses),
                game.complete )

    game.undo_stack.append(move)

    json_blanks = json.dumps(game.current_blanks)
    json_wrong_guesses = json.dumps(game.current_wrong_guesses)
    payload = json.dumps({"blanks": json_blanks,
                          "wrong": json_wrong_guesses,
                          "wordcomplete" : word_complete,
                          "movetime" : str ( move.created ) })
    return payload


''' Processes an undo request sent from the UI '''
@app.route ( "/undomove" )
def undo_move ():
    game_id = request.args.get ( ID_FIELD )
    game = get_game ( game_id )

    if len ( game.undo_stack ) > 1:
        game.undo_stack.pop()
        last_move = game.undo_stack [ ( len ( game.undo_stack ) - 1 ) ]
        game.word_list = copy ( last_move.word_list )
        game.current_word = copy ( last_move.current_word )
        game.current_blanks = copy ( last_move.current_blanks )
        game.current_wrong_guesses = copy ( last_move.current_wrong_guesses )
    else:
        game.reset ()

    json_blanks = json.dumps(game.current_blanks)
    json_wrong_guesses = json.dumps(game.current_wrong_guesses)
    payload = json.dumps ( { "blanks": json_blanks, "wrong": json_wrong_guesses } )

    return payload



''' Helper methods '''

''' Get a game instance by game id'''
def get_game ( game_id ):
    filtered_by_id = filter ( lambda x: x.game_id == game_id, games )
    if len ( filtered_by_id ) == 0:
       return None

    return filtered_by_id [ 0 ]


''' Find all instances of a character in a string (used to check letter guesses) '''
def find_char_indexes ( s, ch ):
    return [ i for i, ltr in enumerate ( s ) if ltr == ch ]



''' Execute App '''
if __name__ == "__main__":
    app.run()
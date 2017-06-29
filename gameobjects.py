import time
import gameutils

''' Class that represents a game and its state '''
class HangmanGame:

    def __init__ ( self, game_id, word_list ):
        self.game_id = game_id
        self.word_list = word_list
        self.undo_stack = []
        self.created = gameutils.gen_timestamp()
        self.current_word = self.select_word ( )
        self.current_blanks = [ "_" ] * len ( self.current_word )
        self.current_wrong_guesses = []
        self.word_guess_used = False
        self.complete = False
        self.inprogress = False

    def select_word ( self ):
        new_word = str ( self.word_list.pop () ).upper ()
        return new_word

    def reset ( self ):
        self.current_blanks = ["_"] * len(self.current_word)
        self.current_wrong_guesses = []

    def nextword ( self ):
        self.reset ( )
        self.current_word = self.select_word ()
        self.current_blanks = ["_"] * len(self.current_word)

''' Populates the undo_stack in a HangmanGame '''
class Move:

    def __init__ ( self, word_list, current_word, current_blanks, current_wrong_guesses, game_complete ):
        self.word_list = word_list
        self.current_word = current_word
        self.current_blanks = current_blanks
        self.current_wrong_guesses = current_wrong_guesses
        self.created = gameutils.gen_timestamp()
        self.game_complete = game_complete

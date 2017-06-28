import random
import uuid
import time


''' Generate and shuffle a word list, used to create new games '''
def gen_wordlist ():
    word_list = [ "RABBIT", "BUNNY", "CARROT", "LETTUCE", "BURROW", "FLUFFY", "FLOPPY", "LITTER", "PELLETS" ]
    random.shuffle ( word_list )
    return word_list


''' Gen a reasonably unique id for game instances '''
def gen_unique_id ( ):
    return uuid.uuid1 ( ).hex


''' Get time in milliseconds'''
def gen_timestamp ( ):
    millis = int ( round ( time.time () * 1000 ) )
    return millis

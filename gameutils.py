import random
import uuid
import time
import json

word_list = None

''' Generate and shuffle a word list, used to create new games '''
def gen_wordlist ():
    word_list = None
    try:
        ''' break the file path (e.g. json/wordsxxx.json) to play an uber bunny knowledge game '''
        if word_list is None:
            word_list = json.loads ( str ( open ( 'json/words.json' ).read () ) )
            ''' make sure no python unicode business '''
            word_list = map ( lambda x: str ( x ), word_list )
    except StandardError as err:
        print ">>>> Could not obtain word list, defaulting to science!"
        word_list = [ "sylvilagus", "floridanus", "leporidae", "lepus", "nesolagus", "brachylagus" ]

    random.shuffle ( word_list )
    return word_list


''' Gen a reasonably unique id for game instances '''
def gen_unique_id ( ):
    return uuid.uuid1 ( ).hex


''' Get time in milliseconds'''
def gen_timestamp ( ):
    millis = int ( round ( time.time () * 1000 ) )
    return millis

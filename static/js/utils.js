
/**
 * Useful function to get query string field value from browser address bar url
 */
function getQueryStringValue ( field ) {
    field = field || '';
    var query_vals = document.location.href.split ( '?' ) [ 1 ].split ( '&' );
    for ( var i = 0; i < query_vals.length; i++ ) {
        var val_split = query_vals [ i ].split ( '=' );
        if ( val_split [ 0 ] === field ) {
            return val_split [ 1 ];
        }
    }

    console.error ( 'No value found for field: ' + field );
}

/**
  * Basic function to make an HTTP call, no JQuery, but does return a standard promise.
  * url: url path including query params, to send.
  * Typically starts with a "/" (e.g. /some_endpoint?id=123)
*/
function callHTTP ( url ) {

    let xmlhttp = new XMLHttpRequest();

    let promise = new Promise ( ( resolve, reject ) => {
    	xmlhttp.onreadystatechange = () => {
        	if ( xmlhttp.readyState == XMLHttpRequest.DONE ) {
           		if ( xmlhttp.status == 200 ) {
                	resolve ( JSON.parse ( xmlhttp.responseText ) );
           		}
           		else if ( xmlhttp.status == 400 ) {
           			let msg = 'There was an error 400';
              		console.error ( msg );
              		reject ( Error ( msg ) )
           		}
           		else {
               		let msg = 'Something other than 200 was returned';
              		console.error ( msg );
              		reject ( Error ( msg ) )
           		}
        	}
    	}
    } );


    xmlhttp.open ( "GET", url, true );
    xmlhttp.send ();

    return promise;
}
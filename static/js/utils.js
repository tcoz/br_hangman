
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
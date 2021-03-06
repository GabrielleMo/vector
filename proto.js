/** ******************************************************************************************************************
 * @file Modifies the Array prototype.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 23-Jul-2017
 *********************************************************************************************************************/

const
    LARGE_ARRAY_SIZE   = 300,
    { isArray: array } = Array,
    ensureArray        = a => Array.isArray( a ) ? a : [ a ],
    noPerms            = a => !array( a ) || !a.some( el => array( el ) ),
    concat             = ( a1, a2 ) => ensureArray( a1 ).concat( a2 ),
    proto              = Array.prototype;

proto.each = [].forEach;
proto.all = [].every;
proto.any = [].some;

proto.append = function( ...args ) {
    const
        lng = args.length | 0;

    let index = -1 | 0;

    while ( ++index < lng )
        this[ this.length ] = args[ index ];

    return this;
};

proto.prepend = function( ...args ) {
    this.unshift( ...args );
    return this;
};

Object.defineProperties( proto, {
    last: {
        get()
        {
            return this.length ? this[ this.length - 1 ] : void 0;
        }
    },
    lastIndex: {
        get()
        {
            return this.length - 1;
        }
    }
} );

proto.clone = function() { return Array.from( this ); };
Array.clone = arr => Array.from( arr );

Array.range = function( start, end, step = 1 ) {
    const result = [];

    if ( !step || arguments.length < 2 ) return result;

    if ( start < end )
        step = step > 0 ? step : -step;
    else if ( start > end )
        step = step < 0 ? step : -step;
    else
        return result;

    for ( let n = start, i = 0; ( step < 0 && n >= end ) || ( step > 0 && n <= end ); n += step, i++ )
        result[ i ] = n;

    return result;
};

proto.pluck = function( ...fields ) {
    let plucker = fields.length === 1 ? val => val : ( val, arr ) => arr.append( val );

    return this.map( el => !el || typeof el !== 'object' || Array.isArray( el ) ? [] : fields.reduce( ( arr, field ) => plucker( el[ field ], arr ), [] ) );
};

proto.uniq = function( comparator ) {
    let index = -1;

    const
        length = this.length,
        result = [];

    if ( length >= LARGE_ARRAY_SIZE && !comparator )
        return Array.from( new Set( this ) );

    let seenIndex;

    skip:
        while ( ++index < length )
        {
            const
                value = this[ index ];

            seenIndex = result.length;

            while ( seenIndex-- )
                if ( comparator ? comparator( result[ seenIndex ], value ) : result[ seenIndex ] === value ) continue skip;

            result[ result.length ] = value;
        }

    return result;
};

proto.flatten = function( deep = true, result = [] ) {
    const
        arr    = this,
        length = arr.length;

    if ( !length ) return result;

    let index = -1;

    while ( ++index < length )
    {
        let value = arr[ index ];

        if ( Array.isArray( value ) )
        {
            if ( deep )
                value.flatten( true, result );
            else
                result.push( ...value );
        }
        else
            result[ result.length ] = value;
    }

    return result;
};


proto.union = function( ...arrs ) {
    return this.concat( ...arrs ).uniq();
};

proto.intersection = function( ...arrs ) {

    arrs = arrs.map( a => Array.isArray( a ) ? a : [ a ] );
    arrs[ arrs.length ] = this;

    let shortest    = arrs.reduce( ( short, a, i ) => Array.isArray( a ) && a.length < arrs[ short ].length ? i : short, 0 ),

        index       = -1,
        resultIndex = 0,
        main        = arrs[ shortest ];

    const
        result = [],
        length = main.length;

    skip:
        while ( ++index < length )
        {
            let j           = -1,
                childLength = arrs.length,
                value       = main[ index ];

            while ( ++j < childLength )
                if ( j !== shortest && !arrs[ j ].includes( value ) ) continue skip;

            result[ resultIndex++ ] = value;
        }

    return result;
};

proto.equals = function( arr ) {
    const
        length = this.length;

    if ( !Array.isArray( arr ) || length !== arr.length ) return false;

    const
        self  = this.sort(),
        other = arr.sort();

    let i = -1;

    while ( ++i < length )
        if ( self[ i ] !== other[ i ] ) return false;

    return true;
};

proto.compact = function( falsey = true, inPlace = false ) {
    const
        result = inPlace ? this : [],
        length = this.length;

    let resultIndex = 0,
        index       = -1;

    while ( ++index < length )
        if ( ( falsey === true && !!this[ index ] ) || ( falsey === false && this[ index ] !== void 0 ) ) result[ resultIndex++ ] = this[ index ];

    if ( inPlace ) result.length = resultIndex;

    return result;
};

proto.drop = function( n = 1 ) {
    return n >= this.length || -n >= this.length ? [] : n < 0 ? this.slice( 0, this.length + n ) : this.slice( n, this.length );
};

proto.head = function( n = 1 ) {

    n = n < 0 ? 0 : n;

    if ( !n ) return [];
    else if ( n >= this.length ) return Array.from( this );

    return this.slice( 0, n );
};

proto.tail = function( n = 1 ) {
    n = n < 0 ? 0 : n;

    if ( !n ) return [];
    else if ( n >= this.length ) return Array.from( this );

    return this.slice( this.length - n );
};

proto.without = function( valOrFunc ) {
    return this.filter( typeof valOrFunc === 'function' ? ( val, i, arr ) => !valOrFunc( val, i, arr ) : val => val !== valOrFunc );
};

Array.random = function( count, min = 0, max = 1, float = false ) {
    const
        a      = new Array( count ),
        length = count | 0;

    let
        _min  = min < max ? min : max,
        range = ( max > min ? max : min ) - _min + 1,
        i     = -1, val;

    // Force SMI if possible
    if ( !float )
    {
        _min = _min | 0;
        range = range | 0;
    }

    while ( ++i < length )
    {
        val = Math.random() * range;
        if ( !float ) val |= 0;
        a[ i ] = val + _min;
    }

    return a;
};

Array.mapper = function( fn ) {
    return ( ...arrs ) => arrs.map( ensureArray ).reduce( ( result, arr ) => result.concat( arr.map( fn ) ), [] );
};

Array.reducer = function( fn, initialValue ) {

    const
        hasInitial = arguments.length < 2,
        _reduction = arr => hasInitial ? arr.reduce( fn, initialValue ) : arr.reduce( fn ),
        reduction  = arr => arr.length ? _reduction( arr ) : hasInitial ? initialValue : undefined;


    return ( ...arrs ) => {

        arrs = arrs.map( ensureArray );

        if ( !arrs.length )
            return void 0;

        else if ( arrs.length === 1 )
            return reduction( arrs[ 0 ] );

        else
            return arrs.reduce( ( res, arr ) => arr.reduce( fn, res ), reduction( arrs.shift() ) );
    };
};

Array.strainer = function( fn ) {
    return ( ...arrs ) => arrs.map( ensureArray ).reduce( ( result, arr ) => result.concat( arr.filter( fn ) ), [] );
};

Array.looper = function( fn ) {
    return ( ...arrs ) => arrs.map( ensureArray ).forEach( arr => arr.forEach( fn ) );
};

proto.permutations = function permutations() {

    /**
     * @param a
     * @return {Array<*>}
     * @private
     */
    function _perms( a )
    {
        let rest;

        return noPerms( a ) ? ensureArray( a ) : _perms( a[ 0 ] ).reduce( ( res, el ) => res.append( ...( rest || ( rest = _perms( a.slice( 1 ) ) ) ).map( r => concat( el, r ) ) ), [] );
    }

    return _perms( this );
};


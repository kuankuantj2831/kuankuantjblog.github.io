/**
 * ES2015+ Polyfills for older browsers (IE11, old Chrome/Firefox)
 * This file should be loaded before other scripts
 */

// Array.prototype.flat polyfill
if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth) {
        var flattened = [];
        (function flat(array, d) {
            for (var i = 0; i < array.length; i++) {
                if (Array.isArray(array[i]) && d > 0) {
                    flat(array[i], d - 1);
                } else {
                    flattened.push(array[i]);
                }
            }
        })(this, depth || 1);
        return flattened;
    };
}

// Array.prototype.flatMap polyfill
if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback) {
        return this.map(callback).flat(1);
    };
}

// String.prototype.trimStart polyfill
if (!String.prototype.trimStart) {
    String.prototype.trimStart = function() {
        return this.replace(/^\s+/, '');
    };
}

// String.prototype.trimEnd polyfill
if (!String.prototype.trimEnd) {
    String.prototype.trimEnd = function() {
        return this.replace(/\s+$/, '');
    };
}

// Optional chaining helper (as a function since we can't polyfill syntax)
// Usage: safeGet(obj, 'a', 'b', 'c') instead of obj?.a?.b?.c
window.safeGet = function(obj) {
    for (var i = 1; i < arguments.length; i++) {
        if (obj == null) return undefined;
        obj = obj[arguments[i]];
    }
    return obj;
};

// Object.entries polyfill
if (!Object.entries) {
    Object.entries = function(obj) {
        var ownProps = Object.keys(obj);
        var i = ownProps.length;
        var resArray = new Array(i);
        while (i--) {
            resArray[i] = [ownProps[i], obj[ownProps[i]]];
        }
        return resArray;
    };
}

// Object.values polyfill
if (!Object.values) {
    Object.values = function(obj) {
        return Object.keys(obj).map(function(key) {
            return obj[key];
        });
    };
}

// Object.assign polyfill
if (!Object.assign) {
    Object.assign = function(target) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Promise.finally polyfill
if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
    Promise.prototype.finally = function(callback) {
        var constructor = this.constructor;
        return this.then(
            function(value) {
                return constructor.resolve(callback()).then(function() {
                    return value;
                });
            },
            function(reason) {
                return constructor.resolve(callback()).then(function() {
                    throw reason;
                });
            }
        );
    };
}

// Array.prototype.includes polyfill
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = parseInt(o.length) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(fromIndex) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) {
                k = 0;
            }
        }
        while (k < len) {
            if (o[k] === searchElement) {
                return true;
            }
            k++;
        }
        return false;
    };
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        }
        return this.indexOf(search, start) !== -1;
    };
}

// Number.isNaN polyfill
if (!Number.isNaN) {
    Number.isNaN = function(value) {
        return typeof value === 'number' && isNaN(value);
    };
}

// Number.isInteger polyfill
if (!Number.isInteger) {
    Number.isInteger = function(value) {
        return typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value;
    };
}

// console polyfill for IE
if (!window.console) {
    window.console = {};
}
if (!console.log) {
    console.log = function() {};
}
if (!console.error) {
    console.error = function() {};
}
if (!console.warn) {
    console.warn = function() {};
}
if (!console.info) {
    console.info = function() {};
}

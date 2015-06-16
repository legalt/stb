/**
 * @module stb/gettext
 * @author Stanislav Kalashnik <sk@infomir.eu>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var Emitter = require('./emitter'),
	gettext = new Emitter(),
	headers = null,
	data    = null;


/**
 * Simple gettext implementation.
 *
 * @param {Object} config options
 * @param {string} config.path relative path to project root
 * @param {string} config.name language name
 * @param {string} config.ext language file extension
 * @param {function} callback hook on ready
 *
 * @example
 * gettext.load({name: 'ru'}, function ( error, data ) {
 *     debug.log(error);
 *     debug.inspect(data);
 * });
 */
gettext.load = function ( config, callback ) {
	var xhr = new XMLHttpRequest();

	if ( DEBUG ) {
		if ( !config.name || typeof config.name !== 'string' ) { throw 'config.name must be a nonempty string'; }
		if ( typeof callback !== 'function' ) { throw 'wrong callback type'; }
	}

	// defaults
	config.ext  = config.ext  || 'js';
	config.path = config.path || 'lang';

	/* todo: get rid of JSON.parse in future
	xhr.overrideMimeType('application/json');
	xhr.responseType = 'json';/**/

	xhr.responseType = 'text';

	xhr.onload = function () {
		var json;

		try {
			json    = JSON.parse(xhr.responseText);
			headers = json.headers;
			data    = json.data;
			callback(null, data);
		} catch ( error ) {
			headers = null;
			data    = null;
			xhr.onerror(error);
		}

		// there are some listeners
		if ( gettext.events['load'] !== undefined ) {
			// notify listeners
			gettext.emit('load');
		}
	};

	xhr.onerror = function ( error ) {
		callback(error);

		// there are some listeners
		if ( gettext.events['error'] !== undefined ) {
			// notify listeners
			gettext.emit('error');
		}
	};

	xhr.open('GET', config.path + '/' + config.name + '.' + config.ext, true);
	xhr.send(null);
};


/**
 * Display the native language translation of a textual message.
 *
 * @param {string} msgId textual message
 *
 * @return {string} translated text
 *
 * @global
 */
window.gettext = function ( msgId ) {
	return data ? data[''][msgId] : msgId;
};


/**
 * The "p" in "pgettext" stands for "particular": fetches a particular translation of the textual message.
 *
 * @param {string} context message context
 * @param {string} msgId textual message
 *
 * @return {string} translated text
 *
 * @global
 */
window.pgettext = function ( context, msgId ) {
	return data ? data[context][msgId] : msgId;
};


/**
 * Display the native language translation of a textual message whose grammatical form depends on a number.
 *
 * @param {string} msgId textual message in a singular form
 * @param {string} plural textual message in a plural form
 * @param {number} value message number
 *
 * @return {string} translated text
 *
 * @global
 */
window.ngettext = function ( msgId, plural, value ) {
	if ( DEBUG ) {
		if ( Number(value) !== value ) { throw 'value must be a number'; }
	}

	if ( data && headers ) {
		// translation
		return data[''][msgId][eval('var n = ' + value + '; ' + headers.plural)];
	}

	// english
	return value === 1 ? msgId : plural;
};


// public
module.exports = gettext;
"use strict";

/**
 * Vasak Storage Utils
 * ===================
 * Utilidades para localStorage con compresión LZ simple.
 *
 * Usa LZString si está disponible (NodeBB lo incluye via vendor.min.js),
 * con fallback transparente a JSON plano si no está disponible.
 *
 * API:
 *   vasak.storage.set(key, value)   — guarda con compresión si el valor > 1KB
 *   vasak.storage.get(key)          — lee y descomprime automáticamente
 *   vasak.storage.remove(key)       — elimina
 *   vasak.storage.size(key)         — tamaño en bytes del valor guardado
 *
 * Usado por: composer-autosave.js, reactions.js, feed-filters.js
 */
define("forum/vasak-storage", [], function () {
	var Storage = {};

	var COMPRESS_THRESHOLD = 512; // bytes — comprimir si el JSON supera este tamaño
	var PREFIX_COMPRESSED = "\x00lz:"; // prefijo para detectar valores comprimidos

	// ── Compresión ─────────────────────────────────────────────────────────
	// Usa LZString si está disponible en el scope global (NodeBB lo incluye).
	// Fallback: sin compresión (transparente para el caller).

	function compress(str) {
		if (typeof LZString !== "undefined" && LZString.compressToUTF16) {
			try {
				return PREFIX_COMPRESSED + LZString.compressToUTF16(str);
			} catch (e) {}
		}
		return str;
	}

	function decompress(str) {
		if (str && str.indexOf(PREFIX_COMPRESSED) === 0) {
			if (typeof LZString !== "undefined" && LZString.decompressFromUTF16) {
				try {
					return LZString.decompressFromUTF16(
						str.slice(PREFIX_COMPRESSED.length),
					);
				} catch (e) {}
			}
			// Si no podemos descomprimir, devolver null para que el caller lo trate como miss
			return null;
		}
		return str;
	}

	// ── API pública ────────────────────────────────────────────────────────

	Storage.set = function (key, value) {
		try {
			var json = JSON.stringify(value);
			var stored = json.length > COMPRESS_THRESHOLD ? compress(json) : json;
			localStorage.setItem(key, stored);
			return true;
		} catch (e) {
			// QuotaExceededError u otro error de storage
			return false;
		}
	};

	Storage.get = function (key) {
		try {
			var raw = localStorage.getItem(key);
			if (raw === null) return null;
			var json = decompress(raw);
			if (json === null) return null;
			return JSON.parse(json);
		} catch (e) {
			return null;
		}
	};

	Storage.remove = function (key) {
		try {
			localStorage.removeItem(key);
		} catch (e) {}
	};

	Storage.size = function (key) {
		try {
			var raw = localStorage.getItem(key);
			return raw ? raw.length * 2 : 0; // UTF-16: 2 bytes por char
		} catch (e) {
			return 0;
		}
	};

	// Limpiar entradas expiradas de un namespace
	Storage.cleanExpired = function (prefix, maxAgeMs) {
		try {
			var now = Date.now();
			Object.keys(localStorage)
				.filter(function (k) {
					return k.indexOf(prefix) === 0;
				})
				.forEach(function (k) {
					var val = Storage.get(k);
					if (val && val.ts && now - val.ts > maxAgeMs) {
						Storage.remove(k);
					}
				});
		} catch (e) {}
	};

	return Storage;
});

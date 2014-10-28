var lib = {}

Array.prototype.random = function () {
	return this[Math.floor(Math.random() * this.length)]
}

Array.prototype.randomRemove = function () {
	return this.splice(Math.floor(Math.random() * this.length), 1)[0];
}

Array.prototype.max = function() {
	return Math.max.apply(null, this)
}
Array.prototype.min = function() {
	return Math.min.apply(null, this)
}
Array.prototype.diff = function(a) {
	return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};
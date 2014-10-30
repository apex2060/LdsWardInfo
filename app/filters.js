app.filter('tags', function () {
	return function (directory, tags, gate) {
		if(!directory)
			return;
		if(!tags || !tags.length)
			return directory;
		var dirLen = directory.length;
		var filtered = [];
		if(!gate || gate == 'and'){
			while(directory.length>0){
				var family = directory.pop();
				var fcats = family.tags;
				var push = true;
				if(!fcats)
					push = false;
				else
					for(var c=0; c<tags.length; c++)
						if(fcats.indexOf(tags[c]) == -1)
							push = false;
				if(push)
					filtered.push(family)
			}
		}else if(gate=='or'){
			for(var f=0; f<directory.length; f++){
				var family = directory[f]
				var fcats = family.tags
				if(fcats)
					for(var c=0; c<tags.length; c++)
						if(fcats.indexOf(tags[c]) != -1)
							if(filtered.indexOf(family) == -1)
								filtered.push(family)
			}
		}
		return filtered;
	};
});
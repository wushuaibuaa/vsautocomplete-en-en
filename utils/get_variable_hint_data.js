#!/usr/bin/env node
require('colors');

const OK = '- ' + 'OK'.green,
	ERROR = '- ' + 'ERROR'.red,
	DONE = '- ' + 'DONE'.green.bold;

const OUTPUT_FILE = `${__dirname}/../hint_data/variables.json`;

let error = reason => console.error(ERROR, '\n', reason) + process.exit(1),
	notEmptyFilter = (arrayOrStr, name) => arrayOrStr.length ? arrayOrStr : error(`${name.bold} is empty!`),
	newVariableObject = () => ({ 
		set: 'setName',
		name: 'varName',
		onlyGAWK: false,
		// link: '...xx.html#xxx', (different page has different link location)
		desc: 'variable description'
	});


let cheerio = require('cheerio'),
	request = require('request'),
	fs = require('fs-extra');

let url = require('./_awk_website_url');

let varSetNames = Object.keys(url.builtInVariables);
let varHintObjects = [];

//Start
getVarSetHint();

function getVarSetHint() {
	if (varSetNames.length === 0) {
		console.log(`total ${String(varHintObjects.length).bold} variables`);
		console.log("Writing variable hint data to file ...");
		fs.writeJSONSync(OUTPUT_FILE, varHintObjects);
		return console.log(DONE);
	}

	let varSetName = varSetNames.pop();
	let varSetURL = url.builtInVariables[varSetName];

	console.log(`Getting variable set ${varSetName.bold} from ${varSetURL.bold} ...`);
	request.get(varSetURL,  {}, (err, res, html) => {
		err && error(err.stack);
		res.statusCode != 200 && error('statusCode != 200');
		!html && error('empty response content');

		console.log(" Got HTML content");

		let $ = cheerio.load(html),
			items = $('dl[compact=compact]').eq(0).children('dt,dd');
		notEmptyFilter(items, 'dt,dd in the dl[compact=compact]');

		let varObjectsQueue = [];
		let count = 0;
		
		items.each(index => {
			let context = items.eq(index);
			if (context.prop('tagName') == 'DT') {
				let name = notEmptyFilter(context.text().trim(), `items[${index}] usage`);
				let onlyGAWK = name.endsWith('#');
				if (onlyGAWK) name = name.slice(0, -1).trim();
				name.split(/\s*,\s*/).forEach(name => {
					let obj = newVariableObject();
					obj.name = name;
					obj.onlyGAWK = onlyGAWK;
					obj.set = varSetName;
					varObjectsQueue.push(obj);
				});
				return;
			} //else if (item.tagName == 'dd') 
			if (!varObjectsQueue.length)
				return console.log(` WARN: empty varObjectsQueue, item[${index}]`);
			// let link = notEmptyFilter(context.find('a[name]'), `<a name></a> of item[${index}]`).eq(0).attr('name');
			let desc = notEmptyFilter(context.find('p'), `<p></p> of item[${index}]`).eq(0).text();
			let obj = null;
			while (obj = varObjectsQueue.pop()) {
				// obj.link = link;
				obj.desc = desc;
				varHintObjects.push(obj);
				count++;
			}
		});

		console.log(` Collected ${String(count).bold} variables in the ${varSetName.bold}`);
		console.log(OK);

		getVarSetHint();
	});
}
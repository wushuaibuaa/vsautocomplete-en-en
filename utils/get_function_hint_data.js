#!/usr/bin/env node
require('colors');

const OK = '- ' + 'OK'.green,
	ERROR = '- ' + 'ERROR'.red,
	DONE = '- ' + 'DONE'.green.bold;

const OUTPUT_FILE = `${__dirname}/../hint_data/functions.json`;

let error = reason => console.error(ERROR, '\n', reason) + process.exit(1),
	notEmptyFilter = (arrayOrStr, name) => arrayOrStr.length ? arrayOrStr : error(`${name.bold} is empty!`),
	newFunctionObject = () => ({ 
		set: 'setName',
		name: 'funcName',
		usage: 'funcName(parameters...)',
		// link: '...xx.html#xxx', (different page has different link location)
		desc: 'function description'
	});


let cheerio = require('cheerio'),
	request = require('request'),
	fs = require('fs-extra');

let url = require('./_awk_website_url');

let funcSetNames = Object.keys(url.builtInFunctions);
let funcHintObjects = [];

//Start
getFuncSetHint();

function getFuncSetHint() {
	if (funcSetNames.length === 0) {
		console.log(`total ${String(funcHintObjects.length).bold} functions`);
		console.log("Writing function hint data to file ...");
		fs.writeJSONSync(OUTPUT_FILE, funcHintObjects);
		return console.log(DONE);
	}

	let funcSetName = funcSetNames.pop();
	let funcSetURL = url.builtInFunctions[funcSetName];

	console.log(`Getting function set ${funcSetName.bold} from ${funcSetURL.bold} ...`);
	request.get(funcSetURL,  {}, (err, res, html) => {
		err && error(err.stack);
		res.statusCode != 200 && error('statusCode != 200');
		!html && error('empty response content');

		console.log(" Got HTML content");

		let $ = cheerio.load(html),
			items = $('dl[compact=compact]').eq(0).children('dt,dd');
		notEmptyFilter(items, 'dt,dd in the dl[compact=compact]');

		let funcObjectsQueue = [];
		let count = 0;
		
		items.each(index => {
			let context = items.eq(index);
			if (context.prop('tagName') == 'DT') {
				let obj = newFunctionObject();
				obj.set = funcSetName;
				obj.usage = notEmptyFilter(context.text(), `items[${index}] usage`);
				obj.name = obj.usage.match(/^(\w+?)\(/) || error(`could not get function name of item[${index}]`);
				obj.name = obj.name[1];
				funcObjectsQueue.push(obj);
				return;
			} //else if (item.tagName == 'dd') 
			if (!funcObjectsQueue.length)
				return console.log(` WARN: empty funcObjectsQueue, item[${index}]`);
			// let link = notEmptyFilter(context.find('a[name]'), `<a name></a> of item[${index}]`).eq(0).attr('name');
			let desc = notEmptyFilter(context.find('p'), `<p></p> of item[${index}]`).eq(0).text();
			let obj = null;
			while (obj = funcObjectsQueue.pop()) {
				// obj.link = link;
				obj.desc = desc;
				funcHintObjects.push(obj);
				count++;
			}
		});

		console.log(` Collected ${String(count).bold} functions in the ${funcSetName.bold}`);
		console.log(OK);

		getFuncSetHint();
	});
}
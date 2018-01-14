/// <reference path="../vscode.d.ts" />
let vscode = require('vscode');

const HINT_DATA_FILES = {
	FUNC: `${__dirname}/../hint_data/functions.json`,
	VAR: `${__dirname}/../hint_data/variables.json`
};

const QUOTES = '\'\"';

const DOCUMENT_SELECTOR = ['md', 'tex'];

const HOVER_INFO_FUNCTION = '**AWK Function**';
const HOVER_INFO_VARIABLE = '**AWK Variable**';
const HOVER_INFO_VARIABLE_GAWK = '**AWK Variable** (**GAWK**)';


let funcCompletionItems = [],
	varCompletionItems = [],
	funcItems = [],
	varItems = [];

function getTextBeforeCursor(document, position) {
	var start = new vscode.Position(position.line, 0);
	var range = new vscode.Range(start, position);
	return document.getText(range);
}
function getTextAroundCursor(document, position) {
	let lineText = document.lineAt(position).text,
		pos = position.character;
	let beforeText = lineText.slice(0, pos),
		afterText = lineText.slice(pos);
	beforeText = (beforeText.match(/\w*$/) || [''])[0];
	afterText = (afterText.match(/^\w*/) || [''])[0];
	return beforeText + afterText;
}
function isCursorInTheString(textBeforeCursor) {
	// TODO 考虑上一行行末是否有 \ 字符, 如果有的话就还要检测上一行
	if (textBeforeCursor.indexOf(QUOTES[0]) == -1 ||
		textBeforeCursor.indexOf(QUOTES[1]) == -1) return false;

	let len = textBeforeCursor.length, i = -1, inStr = false, char, qType;
	while (++i < len) {
		char = textBeforeCursor[i];
		if (char == '\\')
			i++;
		else if ((qType = QUOTES.indexOf(char)) >= 0)
			inStr = inStr == QUOTES[qType] ? false : QUOTES[qType];
	}
	return inStr;
}
function getFuncAndParamsInfoAroundCursor(textBeforeCursor) {
	if (textBeforeCursor.indexOf('(') == -1) return false;
	return textBeforeCursor.match(/.+\b(\w+)\((.*?)$/);
}

function loadHintData() {
	funcCompletionItems = [];
	varCompletionItems = [];
	funcItems = require(HINT_DATA_FILES.FUNC);
	varItems = require(HINT_DATA_FILES.VAR);
	funcItems.forEach(func => {
		let item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);
		item.documentation = func.usage + '\n' + func.desc;
		item.detail = func.set;
		item._filter = func.name;
		funcCompletionItems.push(item);
	});
	varItems.forEach(v => {
		let item = new vscode.CompletionItem(v.name, vscode.CompletionItemKind.Variable);
		item.documentation = v.desc;
		item.detail = v.set + (v.onlyGAWK ? '(GAWK) ' : '');
		item._filter = v.name;
		varCompletionItems.push(item);
	});
}
function searchHintCompletionItems(keyword) {
	return funcCompletionItems.filter(it => it._filter.startsWith(keyword))
		.concat(varCompletionItems.filter(it => it._filter.startsWith(keyword)));
}
function findHintItem(funcOrVarName) {
	let item = funcItems.filter(it => it.name == funcOrVarName);
	item.length || (item = varItems.filter(it => it.name == funcOrVarName));
	return item.length ? item[0] : null;
}
function findHintFunctionItem(funcOrVarName) {
	let item = funcItems.filter(it => it.name == funcOrVarName);
	return item.length ? item[0] : null;
}

function activate(context) {
	var subscriptions = context.subscriptions;
	loadHintData();
	subscriptions.push(
		vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
			provideCompletionItems: (document, position/*, token*/) => {
				let beforeText = getTextBeforeCursor(document, position);
				if (isCursorInTheString(beforeText)) return [];
				let keyword = (beforeText.match(/^.*?\b(\w*)$/) || ['', ''])[1];
				if (!keyword) return funcCompletionItems.concat(varCompletionItems);
				let items = searchHintCompletionItems(keyword);
				return items;
			},
			resolveCompletionItem: (item/*, token*/) => item
		}
		));

	subscriptions.push(
		vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, {
			provideHover: (document, position/*, token*/) => {
				let beforeText = getTextBeforeCursor(document, position);
				if (isCursorInTheString(beforeText)) return [];
				let textAround = getTextAroundCursor(document, position);
				if (!textAround) return null;
				let item = findHintItem(textAround);
				if (!item) return null;
				if (item.usage)//Function
					return new vscode.Hover([
						HOVER_INFO_FUNCTION, `*${item.usage}*`, item.desc
					]);
				//Variable
				return new vscode.Hover([
					item.onlyGAWK ? HOVER_INFO_VARIABLE_GAWK : HOVER_INFO_VARIABLE, item.desc
				]);
			}
		}));

	subscriptions.push(
		vscode.languages.registerSignatureHelpProvider(DOCUMENT_SELECTOR, {
			provideSignatureHelp: (document, position/*, token*/) => {
				let beforeText = getTextBeforeCursor(document, position);
				if (isCursorInTheString(beforeText)) return null;
				//end of the function
				if (beforeText.match(/[);]$/)) return null;
				let info;
				if (!(info = getFuncAndParamsInfoAroundCursor(beforeText))) return null;
				let item = findHintFunctionItem(info[1])//info[1] === funcName;
				if (!item) return null;
				let res = new vscode.SignatureHelp();
				res.activeSignature = 0;
				res.signatures = [new vscode.SignatureInformation(item.usage, item.desc)];
				return res;
			}
		}, '(,'));

}

function deactivate() {

}

exports.activate = activate;
exports.deactivate = deactivate;
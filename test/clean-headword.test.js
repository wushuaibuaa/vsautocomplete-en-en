const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanHeadword } = require('../scripts/lib/clean-headword');

const cases = [
    ['abandon-(also-abandonment)', 'abandon'],
    ['able(-bodied)-seaman', 'able-bodied-seaman'],
    ['about-turn-(US-about-face)', 'about-turn'],
    ["All-Saints'-Day-(also-,All-`Hallows'-Day)", "All-Saints'-Day"],
    ['amortization,--isation', 'amortization'],
    ['anaesthetize,--ise-(US-anesthetize)', 'anaesthetize'],
    ['anemia,-anemic', 'anemia'],
    ['car-boot-sale (US-garage-sale)', 'car-boot-sale'],
    ['jailer (-jailor)', 'jailer'],
    ['concentration-camp-esp-in-Nazi-Germany', 'concentration-camp'],
    ['plain-clothes-esp-of-police-officers', 'plain-clothes'],
    ['knight-errant-pl-knights-errant', 'knight-errant'],
    ['comrade-in-arms-n-pl-comrades-in-arms', 'comrade-in-arms'],
    ['snow-job-infml--esp-US', 'snow-job'],
    ['bottom-line-(infml-)', 'bottom-line'],
    ['come-from...', 'come-from'],
    ['A-road', 'A-road'],
    ['A-OK', 'A-OK'],
    ['able-bodied', 'able-bodied'],
    ['brother-in-law', 'brother-in-law'],
    ['MI5', 'MI5'],
    ['QE2', 'QE2'],
    ['a/c', 'a/c'],
    ['A/S-level', 'A/S-level'],
    ['and/or', 'and/or'],
    ['c/o', 'c/o'],
    ['W/Cdr', 'W/Cdr'],
    ['-able', null],
    ['aero-', null],
    ['a-', null],
    ['derm(a)-', null],
    ['askance-(at-sb/sth)', null],
    ['bring-sb/sth-back', null],
    ['50p', null],
    ['', null],
    [null, null],
    [undefined, null]
];

for (const [input, expected] of cases) {
    test(`cleanHeadword(${JSON.stringify(input)}) -> ${JSON.stringify(expected)}`, () => {
        assert.equal(cleanHeadword(input), expected);
    });
}

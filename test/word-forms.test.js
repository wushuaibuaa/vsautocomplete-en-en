const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFormIndex } = require('../scripts/lib/word-forms');

function flatten(index) {
    return Object.assign({}, ...Object.values(index.byLetter));
}

test('generates regular plural, past and gerund forms', () => {
    const forms = flatten(buildFormIndex(['study', 'make', 'stop', 'box']));
    assert.equal(forms.studies, 'study');
    assert.equal(forms.studied, 'study');
    assert.equal(forms.studying, 'study');
    assert.equal(forms.making, 'make');
    assert.equal(forms.stopped, 'stop');
    assert.equal(forms.boxes, 'box');
});

test('includes irregular forms', () => {
    const forms = flatten(buildFormIndex(['child', 'do', 'good', 'know']));
    assert.equal(forms.children, 'child');
    assert.equal(forms.does, 'do');
    assert.equal(forms.did, 'do');
    assert.equal(forms.done, 'do');
    assert.equal(forms.better, 'good');
    assert.equal(forms.known, 'know');
});

test('includes contractions when the base exists', () => {
    const forms = flatten(buildFormIndex(['do', 'be']));
    assert.equal(forms["don't"], 'do');
    assert.equal(forms["isn't"], 'be');
});

test('maps pronoun forms to their headword', () => {
    const forms = flatten(buildFormIndex(['I', 'we']));
    assert.equal(forms.me, 'I');
    assert.equal(forms.ourselves, 'we');
});

test('omits forms that are already headwords', () => {
    const forms = flatten(buildFormIndex(['study', 'studies']));
    assert.equal(forms.studies, undefined);
});

test('omits ambiguous forms shared by two bases', () => {
    const forms = flatten(buildFormIndex(['try', 'trie']));
    assert.equal(forms.tries, undefined);
});

test('skips hyphenated bases', () => {
    const index = buildFormIndex(['A-road']);
    assert.equal(index.count, 0);
});

test('form keys are grouped by the first letter of the form', () => {
    const index = buildFormIndex(['go']);
    assert.ok(index.byLetter.w.went);
    assert.equal(index.byLetter.w.went, 'go');
});

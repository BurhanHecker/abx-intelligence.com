/**
 * Unit tests for the pure helpers and the handbook data.
 *
 *   npm run test:unit
 *
 * These need no emulator and no network — they check capacity maths, the
 * status colours read off the Clubs screenshots, cost formatting, CSV
 * escaping, and that the nine seeded excursions still match the handbook.
 */
import assert from 'node:assert/strict'
import * as F from '../src/cas/lib/format.js'
import * as C from '../src/cas/lib/csv.js'
import { HANDBOOK_TRIPS } from '../src/cas/seed/trips.js'

const out = []
const t = (n, fn) => { try { fn(); out.push(['ok', n]) } catch (e) { out.push(['FAIL', n, e.message]) } }

// capacity
t('unlimited trip is never full', () => {
  const c = F.capacityOf({ maxStudents: 0, enrolledCount: 99 })
  assert.equal(c.isFull, false); assert.equal(c.unlimited, true); assert.equal(c.ratio, 0)
})
t('full at cap', () => assert.equal(F.capacityOf({maxStudents:12,enrolledCount:12}).isFull, true))
t('over cap clamps remaining to 0', () =>
  assert.equal(F.capacityOf({maxStudents:12,enrolledCount:15}).remaining, 0))
t('missing fields do not crash', () => {
  const c = F.capacityOf(undefined)
  assert.equal(c.enrolled, 0); assert.equal(c.unlimited, true)
})
t('negative / junk enrolledCount floors at 0', () => {
  assert.equal(F.toCount(-5), 0); assert.equal(F.toCount('abc'), 0); assert.equal(F.toCount('7'), 7)
})

// labels — matched against the Clubs screenshots
t('capacityLabel capped', () => assert.equal(F.capacityLabel({maxStudents:16,enrolledCount:5}), '5 / 16'))
t('capacityLabel unlimited', () => assert.equal(F.capacityLabel({maxStudents:0,enrolledCount:10}), '10 joined'))
t('spacesLabel', () => {
  assert.equal(F.spacesLabel({maxStudents:16,enrolledCount:5}), '11 left')
  assert.equal(F.spacesLabel({maxStudents:20,enrolledCount:20}), 'Full')
  assert.equal(F.spacesLabel({maxStudents:0,enrolledCount:3}), 'No limit')
})
t('spacesTone matches the live board colours', () => {
  assert.equal(F.spacesTone({maxStudents:20,enrolledCount:20}), 'full')   // STEM 20/20 red
  assert.equal(F.spacesTone({maxStudents:10,enrolledCount:9}),  'low')    // 1 LEFT orange
  assert.equal(F.spacesTone({maxStudents:20,enrolledCount:17}), 'low')    // 3 LEFT orange
  assert.equal(F.spacesTone({maxStudents:20,enrolledCount:9}),  'ok')     // 11 LEFT grey
  assert.equal(F.spacesTone({maxStudents:16,enrolledCount:5}),  'ok')     // 11 LEFT grey
})

// cost
t('cost single figure', () => assert.equal(F.costLabel({cost:220}), '220 OMR'))
t('cost range', () => assert.equal(F.costLabel({cost:230,costTo:290}), '230–290 OMR'))
t('cost range collapses when equal', () => assert.equal(F.costLabel({cost:220,costTo:220}), '220 OMR'))
t('no cost yields empty string', () => {
  assert.equal(F.costLabel({}), ''); assert.equal(F.costLabel({cost:null}), ''); assert.equal(F.costLabel({cost:0}), '')
})

// sorting
t('sortByFillingFastest ranks capped trips first, fullest first', () => {
  const r = F.sortByFillingFastest([
    {name:'Unlimited', maxStudents:0, enrolledCount:50},
    {name:'Half',      maxStudents:10, enrolledCount:5},
    {name:'Full',      maxStudents:10, enrolledCount:10},
  ]).map(x=>x.name)
  assert.deepEqual(r, ['Full','Half','Unlimited'])
})
t('sortTrips follows handbook order', () =>
  assert.deepEqual(F.sortTrips([{order:3,name:'C'},{order:1,name:'A'},{order:2,name:'B'}]).map(x=>x.name), ['A','B','C']))

// names / time
t('initials', () => {
  assert.equal(F.initialsOf('Burhanuddin Dairkee'), 'BD')
  assert.equal(F.initialsOf('Youssef Mohammed Yehia Ibrahim Assaf'), 'YA')
  assert.equal(F.initialsOf(''), '?')
})
t('displayNameOf falls back to the email local part', () =>
  assert.equal(F.displayNameOf({email:'bdairkee1@abaoman.org'}), 'Bdairkee'))
t('relativeTime', () => {
  assert.equal(F.relativeTime(new Date(Date.now()-2*60*1000)), '2 min ago')
  assert.equal(F.relativeTime(new Date(Date.now()-17*24*3600*1000)), '17d ago')
})

// csv
t('csv escapes quotes, commas and formula injection', () => {
  const csv = C.toCsv([['Name','Trip'],['O"Brien, A','=cmd|calc']])
  assert.ok(csv.startsWith('﻿'), 'BOM present')
  assert.ok(csv.includes('"O""Brien, A"'), 'quote+comma escaped')
  assert.ok(csv.includes("'=cmd|calc"), 'formula neutralised')
})
t('registrations csv includes cost and unselected students', () => {
  const csv = C.buildRegistrationsCsv(
    [{id:'a',name:'Ali',email:'a@abaoman.org',tripId:'kayaking',tripName:'Kayaking'},
     {id:'b',name:'Sara',email:'s@abaoman.org',tripId:null,tripName:''}],
    [{id:'kayaking',name:'Kayaking',leader:'Mr Jim',cost:220}])
  assert.ok(csv.includes('Ali,a@abaoman.org,Kayaking,Mr Jim,220 OMR'))
  assert.ok(csv.includes('Sara'))
})

// handbook data integrity
t('nine excursions, unique ids, valid ranges', () => {
  assert.equal(HANDBOOK_TRIPS.length, 9)
  assert.equal(new Set(HANDBOOK_TRIPS.map(x=>x.id)).size, 9)
  assert.deepEqual(HANDBOOK_TRIPS.map(x=>x.order), [1,2,3,4,5,6,7,8,9])
  for (const x of HANDBOOK_TRIPS) {
    assert.ok(x.name && x.leader, `${x.id} has name+leader`)
    assert.ok(Number.isFinite(x.cost) && x.cost > 0, `${x.id} has a cost`)
    assert.ok(x.maxStudents > 0, `${x.id} has a cap`)
    assert.ok(x.minStudents === 0 || x.minStudents <= x.maxStudents, `${x.id} min<=max`)
  }
})
t('handbook figures match the PDF exactly', () => {
  const by = Object.fromEntries(HANDBOOK_TRIPS.map(x=>[x.id,x]))
  assert.equal(F.costLabel(by['kayaking']), '220 OMR')
  assert.equal(F.costLabel(by['scuba-diving']), '230–290 OMR')
  assert.equal(F.costLabel(by['sailing']), '120 OMR')
  assert.equal(F.costLabel(by['junior-chef']), '115 OMR')
  assert.equal(F.costLabel(by['spain']), '850 OMR')
  assert.equal(F.costLabel(by['egypt']), '730 OMR')
  assert.equal(F.costLabel(by['bali']), '423 OMR')
  assert.equal(F.costLabel(by['artistic-retreat']), '195 OMR')
  assert.equal(F.costLabel(by['flora-field-work']), '60 OMR')
  assert.deepEqual([by['kayaking'].minStudents, by['kayaking'].maxStudents], [15,20])
  assert.deepEqual([by['scuba-diving'].minStudents, by['scuba-diving'].maxStudents], [8,12])
  assert.deepEqual([by['sailing'].minStudents, by['sailing'].maxStudents], [10,15])
  assert.deepEqual([by['junior-chef'].minStudents, by['junior-chef'].maxStudents], [12,15])
  assert.equal(by['spain'].maxStudents, 20)
  assert.equal(by['egypt'].maxStudents, 15)
  assert.deepEqual([by['bali'].minStudents, by['bali'].maxStudents], [10,12])
  assert.deepEqual([by['artistic-retreat'].minStudents, by['artistic-retreat'].maxStudents], [6,10])
  assert.deepEqual([by['flora-field-work'].minStudents, by['flora-field-work'].maxStudents], [5,10])
})

let bad = 0
for (const [s,n,d] of out) { if (s==='FAIL') bad++; console.log(`${s==='ok'?'  ok  ':' FAIL '} ${n}${d?'  — '+d:''}`) }
console.log(`\n${out.length-bad}/${out.length} passed`)
process.exit(bad?1:0)

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  completeQuest,
  createProgress,
  getLevel,
  normalizeProgress,
  questDefinitions,
} from './quests.js'

const events = questDefinitions.map(({ event }) => event)

test('defines the ordered introductory quests and in-app rewards', () => {
  assert.deepEqual(questDefinitions.map(({ id }) => id), [
    'explore-wallet',
    'scan-market',
    'review-opportunity',
    'set-risk-limit',
  ])
  assert.ok(questDefinitions.every(({ xp, coins }) => xp > 0 && coins > 0))
  assert.match(questDefinitions[1].description, /real market data/i)
  assert.match(questDefinitions[1].description, /fake data does not count/i)
})

test('requires the current quest event in sequence and awards its rewards once', () => {
  const empty = createProgress()
  assert.deepEqual(empty, { completed: [], xp: 0, coins: 0 })
  assert.deepEqual(completeQuest(empty, events[1]), empty)

  const first = completeQuest(empty, events[0])
  assert.deepEqual(first, { completed: ['explore-wallet'], xp: 25, coins: 10 })
  assert.deepEqual(completeQuest(first, events[0]), first)

  const second = completeQuest(first, {
    type: events[1],
    success: true,
    live: true,
    source: 'live',
  })
  assert.deepEqual(second, {
    completed: ['explore-wallet', 'scan-market'],
    xp: 50,
    coins: 20,
  })
})

test('does not accept failed, simulated, or non-live structured scan events', () => {
  const beforeScan = completeQuest(createProgress(), events[0])
  for (const event of [
    { type: events[1], success: false, live: true, source: 'live' },
    { type: events[1], success: true, live: false, source: 'live' },
    { type: events[1], success: true, live: true, source: 'simulated' },
  ]) {
    assert.deepEqual(completeQuest(beforeScan, event), beforeScan)
  }
})

test('normalizes corrupt persisted progress and derives totals from recognized quests', () => {
  assert.deepEqual(normalizeProgress(null), createProgress())
  assert.deepEqual(normalizeProgress({ completed: ['unknown', ...events] }), createProgress())
  assert.deepEqual(normalizeProgress({
    completed: ['explore-wallet', 'review-opportunity', 'set-risk-limit'],
    xp: 999999,
    coins: -100,
  }), {
    completed: ['explore-wallet'],
    xp: 25,
    coins: 10,
  })
  assert.deepEqual(normalizeProgress({ completed: [...questDefinitions.map(({ id }) => id), 'unknown'], xp: 1, coins: 1 }), {
    completed: questDefinitions.map(({ id }) => id),
    xp: 100,
    coins: 40,
  })
})

test('advances levels every 100 XP and reports progress within the current level', () => {
  assert.deepEqual(getLevel(createProgress()), {
    level: 1,
    xpIntoLevel: 0,
    xpForNextLevel: 100,
    progressPercent: 0,
  })

  const halfProgress = questDefinitions.slice(0, 2).reduce(
    (progress, quest) => completeQuest(progress, quest.event),
    createProgress(),
  )
  assert.deepEqual(getLevel(halfProgress), {
    level: 1,
    xpIntoLevel: 50,
    xpForNextLevel: 100,
    progressPercent: 50,
  })

  const fullProgress = questDefinitions.reduce(
    (progress, quest) => completeQuest(progress, quest.event),
    createProgress(),
  )
  assert.deepEqual(getLevel(fullProgress), {
    level: 2,
    xpIntoLevel: 0,
    xpForNextLevel: 100,
    progressPercent: 0,
  })
})

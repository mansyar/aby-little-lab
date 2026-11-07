# Phase 1 red run — new save-layer tests against unmodified `src/utils/storage.ts`

Capture time: 2026-11-07 18:20:48 local
Branch: fix/20261107-storage-resilience
Phase base: 57f045ce6d889f3cfe5647cd229cc00fc81210e2
Production files at capture: unmodified (`git status --short` showed only the three test
files and the new test helper)

Command (verbatim):

```
pnpm test -- --run
```

Exit code: 1

```
 RUN  v5.0.5 C:/Users/Ansyar/Documents/Upskilling/games/aby-little-lab

 ❯ src/__tests__/utils/storage.test.ts (126 tests | 13 failed) 775ms
   ❯ when a write cannot be persisted (11)
     × earnSticker returns normally and the sticker is earned in memory 59ms
     × updateSettings applies the toggle in memory and keeps serving it 9ms
     × resetProgress clears the earned stickers in memory 4ms
     × addProfile adds the profile and makes it active 8ms
     × deleteProfile removes the profile 28ms
     × switchProfile switches the active profile 20ms
     × setPlayTimeLimit stores the limit in memory 4ms
     × recordPlayTime accrues the usage in memory 4ms
     × recordGamePlay counts the play in memory 30ms
     × recordGameResult records the win and the taps in memory 5ms
     × recordGameTaps moves the rolling window in memory 9ms
   ❯ when a read cannot be performed (2)
     × serves fresh defaults from every getter and never throws 9ms
     × keeps the session usable when reads and writes are both blocked 4ms
 ❯ src/__tests__/scenes/gameSceneBase.test.ts (45 tests | 1 failed) 2990ms
   ❯ GameSceneBase scaffold (44)
     ❯ completeGame (5)
       × still celebrates and schedules the way home when the store refuses the write 156ms

⎯⎯⎯⎯⎯⎯ Failed Tests 14 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > completeGame > still celebrates and schedules the way home when the store refuses the write
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/scenes/gameSceneBase.test.ts:555:61
    553|       scene.testCreateCornerMascot();
    554|
    555|       expect(() => scene.testCompleteGame("more-less")).not.toThrow();
       |                                                             ^
    556|
    557|       expect(scene.getInputLocked()).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > earnSticker returns normally and the sticker is earned in memory
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1392:51
    1390|     breakStorage(["setItem"], "QuotaExceededError");
    1391|
    1392|     expect(() => earnSticker("shape-sorter")).not.toThrow();
       |                                                   ^
    1393|
    1394|     expect(hasSticker("shape-sorter")).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > updateSettings applies the toggle in memory and keeps serving it
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1402:61
    1400|     breakStorage(["setItem"], "QuotaExceededError");
    1401|
    1402|     expect(() => updateSettings({ bgmEnabled: false })).not.toThrow();
       |                                                             ^
    1403|
    1404|     expect(getSettings().bgmEnabled).toBe(false);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > resetProgress clears the earned stickers in memory
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1412:39
    1410|     breakStorage(["setItem"], "QuotaExceededError");
    1411|
    1412|     expect(() => resetProgress()).not.toThrow();
       |                                       ^
    1413|
    1414|     expect(hasSticker("shape-sorter")).toBe(false);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > addProfile adds the profile and makes it active
QuotaExceededError: simulated QuotaExceededError
 ❯ breakStorage src/__tests__/helpers/throwingStorage.ts:23:17
     21| /** Replaces the chosen methods of `localStorage` with a thrower. */
     22| export function breakStorage(methods: StorageMethod[], failure: Storag…
     23|   const error = new DOMException(`simulated ${failure}`, failure);
       |                 ^
     24|   for (const method of methods) {
     25|     const original = ownDescriptor(method);
 ❯ src/__tests__/utils/storage.test.ts:1421:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > deleteProfile removes the profile
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1434:43
    1432|     breakStorage(["setItem"], "QuotaExceededError");
    1433|
    1434|     expect(() => deleteProfile("p2")).not.toThrow();
       |                                           ^
    1435|
    1436|     expect(getProfiles()).toHaveLength(1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > switchProfile switches the active profile
QuotaExceededError: simulated QuotaExceededError
 ❯ breakStorage src/__tests__/helpers/throwingStorage.ts:23:17
     21| /** Replaces the chosen methods of `localStorage` with a thrower. */
     22| export function breakStorage(methods: StorageMethod[], failure: Storag…
     23|   const error = new DOMException(`simulated ${failure}`, failure);
       |                 ^
     24|   for (const method of methods) {
     25|     const original = ownDescriptor(method);
 ❯ src/__tests__/utils/storage.test.ts:1442:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > setPlayTimeLimit stores the limit in memory
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1452:50
    1450|     breakStorage(["setItem"], "QuotaExceededError");
    1451|
    1452|     expect(() => setPlayTimeLimit("p1", 30)).not.toThrow();
       |                                                  ^
    1453|
    1454|     expect(getPlayTime("p1").limitMinutes).toBe(30);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > recordPlayTime accrues the usage in memory
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1460:48
    1458|     breakStorage(["setItem"], "QuotaExceededError");
    1459|
    1460|     expect(() => recordPlayTime("p1", 12)).not.toThrow();
       |                                                ^
    1461|
    1462|     expect(getPlayTime("p1").usedMinutes).toBe(12);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > recordGamePlay counts the play in memory
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1468:54
    1466|     breakStorage(["setItem"], "QuotaExceededError");
    1467|
    1468|     expect(() => recordGamePlay("shape-sorter")).not.toThrow();
       |                                                      ^
    1469|
    1470|     expect(getProgress()["shape-sorter"].plays).toBe(1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > recordGameResult records the win and the taps in memory
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1476:62
    1474|     breakStorage(["setItem"], "QuotaExceededError");
    1475|
    1476|     expect(() => recordGameResult("shape-sorter", 5, 1)).not.toThrow();
       |                                                              ^
    1477|
    1478|     const progress = getProgress()["shape-sorter"];

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a write cannot be persisted > recordGameTaps moves the rolling window in memory
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1487:60
    1485|     breakStorage(["setItem"], "QuotaExceededError");
    1486|
    1487|     expect(() => recordGameTaps("shape-sorter", 3, 1)).not.toThrow();
       |                                                            ^
    1488|
    1489|     expect(getProgress()["shape-sorter"].recent).toEqual([true, true, …

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a read cannot be performed > serves fresh defaults from every getter and never throws
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1511:37
    1509|     breakStorage(["getItem"], "SecurityError");
    1510|
    1511|     expect(() => getProfiles()).not.toThrow();
       |                                     ^
    1512|     expect(getProfiles()).toHaveLength(1);
    1513|     expect(getActiveProfile()).toMatchObject({ id: "p1", avatarId: "ca…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/14]⎯

 FAIL  src/__tests__/utils/storage.test.ts > when a read cannot be performed > keeps the session usable when reads and writes are both blocked
AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown

- Expected:
undefined

+ Received:
"DOMException"

 ❯ src/__tests__/utils/storage.test.ts:1536:37
    1534|     breakStorage(["getItem", "setItem"], "SecurityError");
    1535|
    1536|     expect(() => getProfiles()).not.toThrow();
       |                                     ^
    1537|     expect(getProfiles()[0].id).toBe("p1");
    1538|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/14]⎯


 Test Files  2 failed | 131 passed (133)
      Tests  14 failed | 2881 passed (2895)
   Start at  18:20:48
   Duration  42.25s (tests 58%, transform 12%, environment 12%, import 10%, worker 9%)

[ELIFECYCLE] Test failed. See above for more details.
```

Every failure is the defect itself: the `DOMException` thrown out of
`localStorage.setItem` (quota) or `localStorage.getItem` (blocked access)
escapes the save layer. Nothing else in the 2895-test suite failed.

/** Render a tap summary without logging, I/O, measurement, or input mutation. */
export function renderFirstTapReport(taps, format = "text") {
  if (format === "json") return JSON.stringify(taps, null, 2);

  const cold = taps.warmAware === true;
  const lines = [
    `${cold ? "First tap per game (fresh context each run, service worker blocked)" : "Cold first tap per game (fresh context each run, service worker blocked)"}`,
    "",
    "  A = tap -> chunk responseReceived (headers)",
    "  B = tap -> chunk loadingFinished (body downloaded)",
    "  C = tap -> first frame after the chunk settled (budgeted; NOT fully rendered)",
    "  D = post-tap main-thread blockage over 2.5 s (art-half diagnostic; lower is better)",
  ];
  if (cold) {
    lines.push(
      "  A warm tap pays neither A nor B: the Hub's idle prewarm imported the chunk, so C is\n" +
        "  tap -> first frame after the Hub's play record (a different quantity from a cold C).",
    );
  }
  lines.push(
    "",
    `  game              scene chunk                     A ms    B ms    C ms    D ms${cold ? "  kind" : ""}`,
  );
  for (const run of taps.runs) {
    lines.push(
      `  ${run.game.padEnd(16)}  ${String(run.chunk).padEnd(28)}  ` +
        `${run.responseMs.toFixed(1).padStart(5)}  ` +
        `${run.finishedMs.toFixed(1).padStart(6)}  ` +
        `${run.totalMs.toFixed(1).padStart(6)}  ` +
        `${run.blockedMs.toFixed(1).padStart(6)}` +
        (cold ? `  ${run.tapKind}` : ""),
    );
  }
  if (taps.medians.totalMs !== null) {
    lines.push(
      "",
      `  cold median       ${"".padEnd(28)}  ${taps.medians.responseMs.toFixed(1).padStart(5)}` +
        `  ${taps.medians.finishedMs.toFixed(1).padStart(6)}` +
        `  ${taps.medians.totalMs.toFixed(1).padStart(6)}`,
    );
  }
  if (taps.cold.p95Ms.totalMs !== null) {
    lines.push(
      `  cold p95          ${"".padEnd(28)}  ${taps.cold.p95Ms.responseMs.toFixed(1).padStart(5)}` +
        `  ${taps.cold.p95Ms.finishedMs.toFixed(1).padStart(6)}` +
        `  ${taps.cold.p95Ms.totalMs.toFixed(1).padStart(6)}`,
    );
    lines.push("", "  cold p95 by game (samples)");
    for (const row of taps.cold.perGameP95Ms) {
      const response = row.responseMs === null ? "-" : row.responseMs.toFixed(1);
      const finished = row.finishedMs === null ? "-" : row.finishedMs.toFixed(1);
      const total = row.totalMs === null ? "-" : row.totalMs.toFixed(1);
      lines.push(
        `  ${row.game.padEnd(20)} ${String(row.samples).padStart(3)}  ${response.padStart(6)}` +
          `  ${finished.padStart(7)}  ${total.padStart(7)}`,
      );
    }
  }
  if (taps.warmMedians !== null && taps.warmMedians !== undefined) {
    lines.push(
      `  warm median       ${"".padEnd(28)}  ${"—".padStart(5)}  ${"—".padStart(6)}` +
        `  ${taps.warmMedians.totalMs.toFixed(1).padStart(6)}`,
    );
  }
  if (taps.worst !== null) {
    lines.push(`\n  worst cold game: ${taps.worst.game} at ${taps.worst.totalMs.toFixed(1)} ms (C)`);
  } else {
    lines.push("\n  no cold tap in this run: every tapped chunk was already imported");
  }
  if (cold) {
    lines.push(`  tap kinds: ${taps.coldCount} cold / ${taps.warmCount} warm`);
  }
  lines.push(`  budget: worst cold game C <= ${taps.budgetMs} ms`);
  return lines.join("\n");
}

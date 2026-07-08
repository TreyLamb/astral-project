// Scriptable widget — PGO-DEX (matches design-1-pokedex-terminal)
// Hardcoded demo data. To use:
// 1. Install "Scriptable" from the App Store (iOS).
// 2. Open Scriptable, create a new script, paste this file's contents in.
// 3. Tap the play button to preview (small/medium/large).
// 4. Long-press your home screen -> Add Widget -> Scriptable -> pick a size ->
//    edit the widget -> set "Script" to this script's name.

// ---- hardcoded data (swap this out later for real data) ----
const account = {
  name: "ASH",
  stops: 34,
  raids: 3,
  caught: 21,
  megas: 1,
  transferred: 12,
  research: true,
};

// ---- design-1 palette ----
const COLORS = {
  shellRed: "#d4342c",
  shellRedDark: "#a8241d",
  cream: "#f2ede1",
  screenBg: "#9bbf6b",
  screenBgDark: "#7fa855",
  screenLine: "#4a6b32",
  ink: "#1f2a17",
  amber: "#e8a33d",
  blueBtn: "#3a6ea5",
};

function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color(COLORS.shellRed);
  w.setPadding(10, 10, 10, 10);

  // top brand row
  const brandStack = w.addStack();
  brandStack.centerAlignContent();
  const dot = brandStack.addText("●");
  dot.font = Font.systemFont(10);
  dot.textColor = new Color("#7fd8ff");
  brandStack.addSpacer(6);
  const brand = brandStack.addText("PGO-DEX");
  brand.font = Font.boldSystemFont(11);
  brand.textColor = new Color(COLORS.cream);
  brandStack.addSpacer();

  w.addSpacer(6);

  // "screen" panel
  const bezel = w.addStack();
  bezel.backgroundColor = new Color("#2b2b2b");
  bezel.cornerRadius = 10;
  bezel.setPadding(6, 6, 6, 6);
  bezel.layoutVertically();

  const screen = bezel.addStack();
  screen.backgroundColor = new Color(COLORS.screenBg);
  screen.cornerRadius = 6;
  screen.setPadding(8, 8, 8, 8);
  screen.layoutVertically();

  // trainer label row
  const labelRow = screen.addStack();
  const trainerLabel = labelRow.addText("TRAINER: " + account.name);
  trainerLabel.font = new Font("Menlo-Bold", 11);
  trainerLabel.textColor = new Color(COLORS.ink);
  labelRow.addSpacer();
  const dayLabel = labelRow.addText("DAY LOG");
  dayLabel.font = new Font("Menlo", 9);
  dayLabel.textColor = new Color(COLORS.screenLine);

  screen.addSpacer(6);

  // stat rows
  const stats = [
    { label: "STOPS SPUN", value: account.stops },
    { label: "RAID PASSES", value: account.raids },
    { label: "CAUGHT", value: account.caught },
    { label: "MEGAS", value: account.megas },
    { label: "TRANSFERRED", value: account.transferred },
  ];

  for (const s of stats) {
    const row = screen.addStack();
    row.centerAlignContent();
    const label = row.addText(s.label);
    label.font = new Font("Menlo", 9);
    label.textColor = new Color(COLORS.ink);
    row.addSpacer();
    const valueBadge = row.addStack();
    valueBadge.backgroundColor = new Color(COLORS.ink);
    valueBadge.cornerRadius = 3;
    valueBadge.setPadding(2, 5, 2, 5);
    const value = valueBadge.addText(String(s.value));
    value.font = new Font("Menlo-Bold", 11);
    value.textColor = new Color(COLORS.screenBg);
    screen.addSpacer(3);
  }

  screen.addSpacer(4);

  // research toggle row
  const researchRow = screen.addStack();
  researchRow.centerAlignContent();
  const researchLabel = researchRow.addText("DAILY RESEARCH");
  researchLabel.font = new Font("Menlo", 9);
  researchLabel.textColor = new Color(COLORS.ink);
  researchRow.addSpacer();
  const researchBadge = researchRow.addStack();
  researchBadge.backgroundColor = account.research
    ? new Color(COLORS.amber)
    : new Color(COLORS.screenLine);
  researchBadge.cornerRadius = 3;
  researchBadge.setPadding(2, 6, 2, 6);
  const researchText = researchBadge.addText(account.research ? "DONE" : "TODO");
  researchText.font = new Font("Menlo-Bold", 9);
  researchText.textColor = account.research ? new Color("#3a2400") : new Color(COLORS.screenBg);

  w.addSpacer(6);
  const footer = w.addText("MOCKUP — HARDCODED DATA");
  footer.font = Font.systemFont(7);
  footer.textColor = new Color(COLORS.cream, 0.7);
  footer.centerAlignText();

  return w;
}

const widget = buildWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else {
  // preview in-app when you tap the play button
  widget.presentMedium();
}

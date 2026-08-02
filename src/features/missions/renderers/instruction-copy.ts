/**
 * FE-000A — instruction copy rules (presentation only, JSX-free so it can be
 * unit tested).
 *
 * The drawer shows two catalog strings above the picker: the required-selection
 * prompt as a mono section label, and the mission description as the display
 * instruction. For several catalog entries those two say the same thing
 * ("Choose one fighter to win by submission" vs "Choose one fighter to win by
 * submission."), and printing both is the duplication Jose keeps flagging.
 */

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[.,;:!?"'()—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** True when the two strings carry the same instruction, ignoring wording noise. */
export function saysTheSameThing(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y) || y.startsWith(x);
}

/**
 * Which of the two lines the drawer should render. The display instruction
 * always wins, because it is the one that states the rule in full.
 */
export function instructionLabelFor(
  selectionPrompt: string | undefined,
  description: string
): string | null {
  if (!selectionPrompt) return 'HOW IT IS TRACKED';
  return saysTheSameThing(selectionPrompt, description) ? null : selectionPrompt;
}

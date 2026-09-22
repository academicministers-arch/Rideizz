/**
 * Formats a number as Ugandan Shillings, e.g. 12500 -> "UGX 12,500".
 * UGX isn't normally quoted with decimal places, so this always rounds
 * to the nearest whole shilling.
 */
export function formatUGX(amount: number | null | undefined): string {
    if (amount == null) return "—";
    return `UGX ${Math.round(amount).toLocaleString("en-UG")}`;
  }
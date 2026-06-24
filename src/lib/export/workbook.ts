import ExcelJS from "exceljs";
import type { Asset, Snapshot } from "../types";
import { isLiability } from "../types";
import { ASSET_META, PILLAR_META } from "../asset-meta";

export interface WorkbookInput {
  assets: Asset[];
  snapshots: Snapshot[];
  /** RON per 1 EUR. */
  eurRate: number;
  generatedAt?: Date;
}

const MONEY = "#,##0";
const MONEY2 = "#,##0.00";

/**
 * Build an .xlsx report of the portfolio and return the raw bytes.
 * Returns a `Uint8Array` so this works both server-side (email) and in the
 * browser (client-side download).
 */
export async function buildWorkbook(input: WorkbookInput): Promise<Uint8Array> {
  const { assets, snapshots, eurRate } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const toRON = (value: number, currency: string) =>
    currency === "EUR" ? value * eurRate : value;

  let assetTotal = 0;
  let liabilityTotal = 0;
  for (const a of assets) {
    const ron = toRON(a.value, a.currency);
    if (isLiability(a.type)) liabilityTotal += ron;
    else assetTotal += ron;
  }
  const netWorth = assetTotal - liabilityTotal;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Capital";
  wb.created = generatedAt;

  // ---- Summary ----
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { key: "k", width: 26 },
    { key: "v", width: 22 },
  ];
  summary.addRow({ k: "Capital report" }).font = { bold: true, size: 16 };
  const genRow = summary.addRow({ k: "Generated", v: generatedAt });
  genRow.getCell(2).numFmt = "yyyy-mm-dd hh:mm";
  summary.addRow({ k: "EUR → RON rate", v: eurRate }).getCell(2).numFmt = MONEY2;
  summary.addRow({});
  const summaryRows: Array<[string, number, boolean]> = [
    ["Total assets (RON)", assetTotal, false],
    ["Total liabilities (RON)", liabilityTotal, false],
    ["Net worth (RON)", netWorth, true],
  ];
  for (const [k, v, bold] of summaryRows) {
    const row = summary.addRow({ k, v });
    row.getCell(2).numFmt = MONEY;
    if (bold) row.font = { bold: true };
  }

  // ---- Holdings ----
  const holdings = wb.addWorksheet("Holdings");
  holdings.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Category", key: "category", width: 12 },
    { header: "Pillar", key: "pillar", width: 14 },
    { header: "Institution", key: "institution", width: 20 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Value", key: "value", width: 14 },
    { header: "Value (RON)", key: "valueRon", width: 16 },
    { header: "Units", key: "quantity", width: 10 },
    { header: "Interest %", key: "interest", width: 11 },
    { header: "Updated", key: "updated", width: 14 },
  ];
  holdings.getRow(1).font = { bold: true };
  holdings.views = [{ state: "frozen", ySplit: 1 }];
  for (const a of assets) {
    holdings.addRow({
      name: a.name,
      category: ASSET_META[a.type]?.label ?? a.type,
      pillar: a.pillar ? PILLAR_META[a.pillar].short : "",
      institution: a.institution ?? "",
      currency: a.currency,
      value: a.value,
      valueRon: Math.round(toRON(a.value, a.currency)),
      quantity: a.quantity ?? "",
      interest: a.interestRate ?? "",
      updated: a.updatedAt ? new Date(a.updatedAt) : "",
    });
  }
  holdings.getColumn("value").numFmt = MONEY2;
  holdings.getColumn("valueRon").numFmt = MONEY;
  holdings.getColumn("updated").numFmt = "yyyy-mm-dd";

  // ---- Net worth history ----
  const nw = wb.addWorksheet("Net worth history");
  nw.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Net worth (RON)", key: "net", width: 18 },
  ];
  nw.getRow(1).font = { bold: true };
  for (const s of [...snapshots].sort((a, b) => a.date.localeCompare(b.date))) {
    nw.addRow({ date: s.date, net: Math.round(s.netWorth) });
  }
  nw.getColumn("net").numFmt = MONEY;

  // ---- Asset value history ----
  const hist = wb.addWorksheet("Asset history");
  hist.columns = [
    { header: "Asset", key: "asset", width: 30 },
    { header: "Category", key: "category", width: 12 },
    { header: "Date", key: "date", width: 14 },
    { header: "Value", key: "value", width: 14 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Value (RON)", key: "valueRon", width: 16 },
  ];
  hist.getRow(1).font = { bold: true };
  for (const a of assets) {
    for (const p of a.history ?? []) {
      hist.addRow({
        asset: a.name,
        category: ASSET_META[a.type]?.label ?? a.type,
        date: p.date,
        value: p.value,
        currency: a.currency,
        valueRon: Math.round(toRON(p.value, a.currency)),
      });
    }
  }
  hist.getColumn("value").numFmt = MONEY2;
  hist.getColumn("valueRon").numFmt = MONEY;

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

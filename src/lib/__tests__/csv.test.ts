import { describe, expect, it } from "vitest";
import { aCsv } from "@/lib/csv";

describe("aCsv", () => {
  it("usa ; y BOM, y escapa comillas, ; y saltos de línea", () => {
    const csv = aCsv(["a", "b"], [["hola; chau", 'dijo "sí"'], ["línea\nnueva", null]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe('﻿a;b\r\n"hola; chau";"dijo ""sí"""\r\n"línea\nnueva";\r\n');
  });
});

describe("aCsv contra fórmulas", () => {
  it("neutraliza textos que Excel ejecutaría", () => {
    expect(aCsv(["x"], [["=HYPERLINK(1)"], ["@SUM(1)"], [-3]])).toBe("﻿x\r\n'=HYPERLINK(1)\r\n'@SUM(1)\r\n-3\r\n");
  });
});

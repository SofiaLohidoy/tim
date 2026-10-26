import { describe, expect, it } from "vitest";
import { aCsv } from "@/lib/csv";

describe("aCsv", () => {
  it("usa ; y BOM, y escapa comillas, ; y saltos de línea", () => {
    const csv = aCsv(["a", "b"], [["hola; chau", 'dijo "sí"'], ["línea\nnueva", null]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe('﻿a;b\r\n"hola; chau";"dijo ""sí"""\r\n"línea\nnueva";\r\n');
  });
});

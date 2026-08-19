import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { issueCertificateIfEligible, sortPublicRanking } from "./learning";

function createCertificateDb(completedModules: number, existingCertificateCode?: string) {
  const insertedValues = vi.fn().mockResolvedValue(undefined);
  const db = {
    select: vi.fn()
      .mockImplementationOnce(() => ({
        from: () => ({ where: async () => Array.from({ length: completedModules }, () => ({ completedAt: new Date() })) }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({ where: () => ({ limit: async () => existingCertificateCode ? [{ certificateCode: existingCertificateCode }] : [] }) }),
      })),
    insert: vi.fn(() => ({ values: insertedValues })),
  };

  return { db, insertedValues };
}

describe("certificate issuance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not issue a certificate before all 50 unique solved nodes are recorded", async () => {
    const { db } = createCertificateDb(49);
    dbMocks.getDb.mockResolvedValue(db);

    await expect(issueCertificateIfEligible(10)).resolves.toEqual({ issued: false, remaining: { modules: 1 } });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns the original verification code instead of issuing a duplicate certificate", async () => {
    const { db } = createCertificateDb(50, "HG-WSF-2026-EXISTINGCODE123456");
    dbMocks.getDb.mockResolvedValue(db);

    await expect(issueCertificateIfEligible(10)).resolves.toEqual({ issued: true, certificateCode: "HG-WSF-2026-EXISTINGCODE123456" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("issues one random-format code only after all 50 solved nodes are present", async () => {
    const { db, insertedValues } = createCertificateDb(50);
    dbMocks.getDb.mockResolvedValue(db);

    const result = await issueCertificateIfEligible(10);

    expect(result).toMatchObject({ issued: true });
    expect(result.certificateCode).toMatch(/^HG-WSF-\d{4}-[A-F0-9]{18}$/);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(insertedValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 10, completedModules: 50, certificateCode: result.certificateCode }));
  });

  it("keeps a completed operator eligible for one certificate and ahead of lower solve counts in public ranking", async () => {
    const { db } = createCertificateDb(50);
    dbMocks.getDb.mockResolvedValue(db);

    const certificate = await issueCertificateIfEligible(10);
    const ranking = sortPublicRanking([
      { userId: 10, name: "Completed operator", solvedCount: 50, lastSolvedAt: new Date("2026-08-19T01:00:00.000Z") },
      { userId: 11, name: "Almost complete", solvedCount: 49, lastSolvedAt: new Date("2026-08-19T00:00:00.000Z") },
    ]);

    expect(certificate).toMatchObject({ issued: true });
    expect(ranking.map(entry => entry.userId)).toEqual([10, 11]);
  });
});

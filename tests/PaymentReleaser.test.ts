import { describe, it, expect, beforeEach } from "vitest";
import { uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_PROJECT_ID = 101;
const ERR_INVALID_MILESTONE_ID = 102;
const ERR_INVALID_AMOUNT = 103;
const ERR_MILESTONE_NOT_VERIFIED = 104;
const ERR_FUNDS_NOT_ESCROWED = 105;
const ERR_ALREADY_RELEASED = 106;
const ERR_INVALID_RECIPIENT = 107;
const ERR_INVALID_TIMESTAMP = 108;
const ERR_AUTHORITY_NOT_SET = 109;
const ERR_INVALID_PENALTY = 110;
const ERR_INVALID_INTEREST = 111;
const ERR_PROJECT_NOT_ACTIVE = 112;
const ERR_INVALID_STATUS = 113;
const ERR_MAX_RELEASES_EXCEEDED = 114;
const ERR_INVALID_CONTRACT = 115;
const ERR_INVALID_SIGNATURE = 116;
const ERR_INVALID_GRACE_PERIOD = 117;
const ERR_INVALID_LOCATION = 118;
const ERR_INVALID_CURRENCY = 119;
const ERR_INVALID_FEE = 120;
const ERR_INVALID_THRESHOLD = 121;
const ERR_INVALID_VOTING = 122;
const ERR_INVALID_UPDATE = 123;
const ERR_INVALID_CREATOR = 124;
const ERR_INVALID_INSPECTOR = 125;

interface Release {
  projectId: number;
  milestoneId: number;
  amount: number;
  recipient: string;
  timestamp: number;
  status: boolean;
  penaltyRate: number;
  interestRate: number;
  gracePeriod: number;
  location: string;
  currency: string;
  verified: boolean;
  released: boolean;
}

interface ReleaseUpdate {
  updateAmount: number;
  updateRecipient: string;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class PaymentReleaserMock {
  state: {
    nextReleaseId: number;
    maxReleases: number;
    releaseFee: number;
    authorityContract: string | null;
    escrowContract: string;
    oracleContract: string;
    loggerContract: string;
    releases: Map<number, Release>;
    releasesByProject: Map<number, number[]>;
    releaseUpdates: Map<number, ReleaseUpdate>;
  } = {
    nextReleaseId: 0,
    maxReleases: 10000,
    releaseFee: 500,
    authorityContract: null,
    escrowContract: "SP000000000000000000002Q6VF78",
    oracleContract: "SP000000000000000000002Q6VF78",
    loggerContract: "SP000000000000000000002Q6VF78",
    releases: new Map(),
    releasesByProject: new Map(),
    releaseUpdates: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];
  contractCalls: Array<{ contract: string; method: string; args: any[] }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextReleaseId: 0,
      maxReleases: 10000,
      releaseFee: 500,
      authorityContract: null,
      escrowContract: "SP000000000000000000002Q6VF78",
      oracleContract: "SP000000000000000000002Q6VF78",
      loggerContract: "SP000000000000000000002Q6VF78",
      releases: new Map(),
      releasesByProject: new Map(),
      releaseUpdates: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
    this.contractCalls = [];
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: ERR_INVALID_RECIPIENT };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: ERR_AUTHORITY_NOT_SET };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setReleaseFee(newFee: number): Result<boolean> {
    if (newFee < 0) return { ok: false, value: ERR_INVALID_FEE };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_SET };
    if (this.caller !== this.state.authorityContract) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.releaseFee = newFee;
    return { ok: true, value: true };
  }

  requestRelease(
    projectId: number,
    milestoneId: number,
    amount: number,
    recipient: string,
    penaltyRate: number,
    interestRate: number,
    gracePeriod: number,
    location: string,
    currency: string
  ): Result<number> {
    if (this.state.nextReleaseId >= this.state.maxReleases) return { ok: false, value: ERR_MAX_RELEASES_EXCEEDED };
    if (projectId <= 0) return { ok: false, value: ERR_INVALID_PROJECT_ID };
    if (milestoneId <= 0) return { ok: false, value: ERR_INVALID_MILESTONE_ID };
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (recipient === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_RECIPIENT };
    if (penaltyRate > 100) return { ok: false, value: ERR_INVALID_PENALTY };
    if (interestRate > 20) return { ok: false, value: ERR_INVALID_INTEREST };
    if (gracePeriod > 30) return { ok: false, value: ERR_INVALID_GRACE_PERIOD };
    if (!location || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!["STX", "USD", "BTC"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_SET };

    const id = this.state.nextReleaseId;
    const release: Release = {
      projectId,
      milestoneId,
      amount,
      recipient,
      timestamp: this.blockHeight,
      status: true,
      penaltyRate,
      interestRate,
      gracePeriod,
      location,
      currency,
      verified: false,
      released: false,
    };
    this.state.releases.set(id, release);
    const projectReleases = this.state.releasesByProject.get(projectId) || [];
    projectReleases.push(id);
    this.state.releasesByProject.set(projectId, projectReleases);
    this.state.nextReleaseId++;
    return { ok: true, value: id };
  }

  getRelease(id: number): Release | null {
    return this.state.releases.get(id) || null;
  }

  updateRelease(id: number, newAmount: number, newRecipient: string): Result<boolean> {
    const release = this.state.releases.get(id);
    if (!release) return { ok: false, value: ERR_INVALID_UPDATE };
    if (this.caller !== release.recipient) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newAmount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (newRecipient === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_RECIPIENT };
    if (release.released) return { ok: false, value: ERR_ALREADY_RELEASED };

    const updated: Release = {
      ...release,
      amount: newAmount,
      recipient: newRecipient,
      timestamp: this.blockHeight,
    };
    this.state.releases.set(id, updated);
    this.state.releaseUpdates.set(id, {
      updateAmount: newAmount,
      updateRecipient: newRecipient,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  verifyAndRelease(id: number, signature: Uint8Array): Result<boolean> {
    const release = this.state.releases.get(id);
    if (!release) return { ok: false, value: ERR_INVALID_UPDATE };
    if (signature.length !== 65) return { ok: false, value: ERR_INVALID_SIGNATURE };
    if (this.caller !== this.state.oracleContract) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (release.verified) return { ok: false, value: ERR_MILESTONE_NOT_VERIFIED };
    if (release.released) return { ok: false, value: ERR_ALREADY_RELEASED };
    if (!release.status) return { ok: false, value: ERR_INVALID_STATUS };

    this.contractCalls.push({ contract: ".escrow-fund", method: "transfer", args: [release.amount, this.caller, release.recipient] });
    this.stxTransfers.push({ amount: this.state.releaseFee, from: this.caller, to: this.state.authorityContract });
    const updated: Release = { ...release, verified: true, released: true, timestamp: this.blockHeight };
    this.state.releases.set(id, updated);
    this.contractCalls.push({ contract: ".audit-logger", method: "log-release", args: [id] });
    return { ok: true, value: true };
  }

  cancelRelease(id: number): Result<boolean> {
    const release = this.state.releases.get(id);
    if (!release) return { ok: false, value: ERR_INVALID_UPDATE };
    if (this.caller !== release.recipient) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (release.released) return { ok: false, value: ERR_ALREADY_RELEASED };
    if (release.verified) return { ok: false, value: ERR_MILESTONE_NOT_VERIFIED };

    const updated: Release = { ...release, status: false };
    this.state.releases.set(id, updated);
    return { ok: true, value: true };
  }

  getReleaseCount(): Result<number> {
    return { ok: true, value: this.state.nextReleaseId };
  }
}

describe("PaymentReleaser", () => {
  let contract: PaymentReleaserMock;

  beforeEach(() => {
    contract = new PaymentReleaserMock();
    contract.reset();
  });

  it("requests a release successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const release = contract.getRelease(0);
    expect(release?.projectId).toBe(1);
    expect(release?.milestoneId).toBe(1);
    expect(release?.amount).toBe(1000);
    expect(release?.recipient).toBe("ST3RECIP");
    expect(release?.penaltyRate).toBe(5);
    expect(release?.interestRate).toBe(10);
    expect(release?.gracePeriod).toBe(7);
    expect(release?.location).toBe("SiteA");
    expect(release?.currency).toBe("STX");
    expect(release?.verified).toBe(false);
    expect(release?.released).toBe(false);
  });

  it("rejects invalid amount in request", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.requestRelease(
      1,
      1,
      0,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_AMOUNT);
  });

  it("updates a release successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.caller = "ST3RECIP";
    const result = contract.updateRelease(0, 1500, "ST4NEWRECIP");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const release = contract.getRelease(0);
    expect(release?.amount).toBe(1500);
    expect(release?.recipient).toBe("ST4NEWRECIP");
    const update = contract.state.releaseUpdates.get(0);
    expect(update?.updateAmount).toBe(1500);
    expect(update?.updateRecipient).toBe("ST4NEWRECIP");
    expect(update?.updater).toBe("ST3RECIP");
  });

  it("rejects update by non-recipient", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.caller = "ST5FAKE";
    const result = contract.updateRelease(0, 1500, "ST4NEWRECIP");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("verifies and releases successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.caller = contract.state.oracleContract;
    const sig = new Uint8Array(65);
    const result = contract.verifyAndRelease(0, sig);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const release = contract.getRelease(0);
    expect(release?.verified).toBe(true);
    expect(release?.released).toBe(true);
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: contract.state.oracleContract, to: "ST2TEST" }]);
    expect(contract.contractCalls).toHaveLength(2);
    expect(contract.contractCalls[0].method).toBe("transfer");
    expect(contract.contractCalls[1].method).toBe("log-release");
  });

  it("rejects verify by non-oracle", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.caller = "ST5FAKE";
    const sig = new Uint8Array(65);
    const result = contract.verifyAndRelease(0, sig);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("cancels a release successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.caller = "ST3RECIP";
    const result = contract.cancelRelease(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const release = contract.getRelease(0);
    expect(release?.status).toBe(false);
  });

  it("rejects cancel after release", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.caller = contract.state.oracleContract;
    const sig = new Uint8Array(65);
    contract.verifyAndRelease(0, sig);
    contract.caller = "ST3RECIP";
    const result = contract.cancelRelease(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ALREADY_RELEASED);
  });

  it("sets release fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.caller = "ST2TEST";
    const result = contract.setReleaseFee(1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.releaseFee).toBe(1000);
  });

  it("rejects invalid signature in verify", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.caller = contract.state.oracleContract;
    const sig = new Uint8Array(64);
    const result = contract.verifyAndRelease(0, sig);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_SIGNATURE);
  });

  it("returns correct release count", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    contract.requestRelease(
      2,
      2,
      2000,
      "ST4RECIP",
      10,
      15,
      14,
      "SiteB",
      "USD"
    );
    const result = contract.getReleaseCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("parses release parameters with Clarity types", () => {
    const projectId = uintCV(1);
    const amount = uintCV(1000);
    expect(projectId.value).toEqual(BigInt(1));
    expect(amount.value).toEqual(BigInt(1000));
  });

  it("rejects request without authority", () => {
    const result = contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_SET);
  });

  it("rejects max releases exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxReleases = 1;
    contract.requestRelease(
      1,
      1,
      1000,
      "ST3RECIP",
      5,
      10,
      7,
      "SiteA",
      "STX"
    );
    const result = contract.requestRelease(
      2,
      2,
      2000,
      "ST4RECIP",
      10,
      15,
      14,
      "SiteB",
      "USD"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_RELEASES_EXCEEDED);
  });
});
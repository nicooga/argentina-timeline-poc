import { afterEach, describe, expect, it, vi } from "vitest";
import type { Timeline } from "../../types";
import { LocalStorageTimelineRepo } from "./LocalStorageTimelineRepo";

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
  };
}

function timelineFixture(): Timeline {
  return {
    periods: [
      {
        title: "Período",
        start: new Date("1900-01-01T12:00:00.000Z"),
        end: new Date("1900-12-31T12:00:00.000Z"),
        color: "#fff",
        items: ["Periodo"],
      },
    ],
    events: [
      {
        id: "evento",
        title: "Evento",
        date: new Date("1900-02-01T12:00:00.000Z"),
        lanes: ["politico"],
        items: ["Evento"],
      },
    ],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LocalStorageTimelineRepo", () => {
  it("loads seed timeline when storage is empty", async () => {
    const storage = fakeStorage();
    vi.stubGlobal("window", { localStorage: storage });
    const repo = new LocalStorageTimelineRepo("test", timelineFixture());

    const loaded = await repo.get();

    expect(loaded.events[0]?.id).toBe("evento");
    expect(storage.getItem).toHaveBeenCalledWith("test");
  });

  it("saves and reloads edited timeline with Date values revived", async () => {
    const storage = fakeStorage();
    vi.stubGlobal("window", { localStorage: storage });
    const repo = new LocalStorageTimelineRepo("test", timelineFixture());
    const edited = timelineFixture();
    edited.events[0]!.title = "Editado";

    await repo.save(edited);
    const loaded = await repo.get();

    expect(loaded.events[0]?.title).toBe("Editado");
    expect(loaded.events[0]?.date).toBeInstanceOf(Date);
    expect(loaded.periods[0]?.start).toBeInstanceOf(Date);
  });

  it("falls back to seed timeline when stored JSON is invalid", async () => {
    const storage = fakeStorage();
    storage.setItem("test", "not json");
    vi.stubGlobal("window", { localStorage: storage });
    const repo = new LocalStorageTimelineRepo("test", timelineFixture());

    const loaded = await repo.get();

    expect(loaded.events[0]?.title).toBe("Evento");
  });
});

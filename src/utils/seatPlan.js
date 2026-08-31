function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function normalizeExitRows(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  }

  return [...new Set(
    String(value || "")
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isInteger(n) && n > 0),
  )];
}

function positionFor(index, total) {
  if (index === 0 || index === total - 1) return "Window";
  if (total <= 4) return "Aisle";
  if (index === 2 || index === 3) return "Aisle";
  return "Middle";
}

function busPlan(config = {}) {
  const busType = ["HD", "LD", "DD"].includes(config.busType) ? config.busType : "HD";
  const layout = ["2x2", "2x1", "sleeper"].includes(config.busLayout) ? config.busLayout : "2x2";
  const rows = clampInt(config.busRows, 1, 25, 10);
  const letters = layout === "2x2" ? ["A", "B", "C", "D"] : layout === "2x1" ? ["A", "B", "C"] : ["A", "B"];
  const splitAt = layout === "2x2" ? 2 : layout === "2x1" ? 2 : 1;
  const decks = busType === "DD"
    ? [
        { key: "L", name: "Lower Deck" },
        { key: "U", name: "Upper Deck" },
      ]
    : [{ key: "", name: busType === "HD" ? "High Deck" : "Low Deck" }];

  const units = [];

  for (const deck of decks) {
    for (let row = 1; row <= rows; row += 1) {
      letters.forEach((letter, index) => {
        const id = `${deck.key}${row}${letter}`;
        units.push({
          id,
          label: id,
          kind: layout === "sleeper" ? "berth" : "seat",
          section: deck.name,
          row,
          side: index < splitAt ? "left" : "right",
          order: index,
          position: layout === "sleeper" ? "Sleeper" : positionFor(index, letters.length),
          category: `${busType} ${layout}`,
          capacity: 1,
        });
      });
    }
  }

  return {
    config: { busType, busLayout: layout, busRows: rows },
    units,
  };
}

function planePlan(config = {}) {
  const layout = ["3x3", "2x2"].includes(config.planeLayout) ? config.planeLayout : "3x3";
  const rows = clampInt(config.planeRows, 1, 40, 10);
  const businessRows = clampInt(config.planeBusinessRows, 0, Math.min(rows, 8), 0);
  const exitRows = normalizeExitRows(config.planeExitRows).filter((row) => row <= rows);
  const economyLetters = layout === "3x3" ? ["A", "B", "C", "D", "E", "F"] : ["A", "B", "C", "D"];
  const businessLetters = ["A", "B", "C", "D"];
  const units = [];

  for (let row = 1; row <= rows; row += 1) {
    const isBusiness = row <= businessRows;
    const letters = isBusiness ? businessLetters : economyLetters;
    const splitAt = letters.length / 2;
    const section = isBusiness ? "Business Class" : "Economy Class";

    letters.forEach((letter, index) => {
      units.push({
        id: `${row}${letter}`,
        label: `${row}${letter}`,
        kind: "seat",
        section,
        row,
        side: index < splitAt ? "left" : "right",
        order: index,
        position: positionFor(index, letters.length),
        category: isBusiness ? "Business" : "Economy",
        exitRow: exitRows.includes(row),
        extraLegroom: exitRows.includes(row),
        capacity: 1,
      });
    });
  }

  return {
    config: {
      planeLayout: layout,
      planeRows: rows,
      planeBusinessRows: businessRows,
      planeExitRows: exitRows,
    },
    units,
  };
}

function trainPlan(config = {}) {
  const layout = ["2x2", "2x1", "berth"].includes(config.trainLayout) ? config.trainLayout : "2x2";
  const coaches = clampInt(config.trainCoaches, 1, 10, 3);
  const rowsPerCoach = clampInt(config.trainRowsPerCoach, 1, 30, 8);
  const trainClass = String(config.trainClass || "Snigdha").trim() || "Snigdha";
  const coachLetters = "ABCDEFGHIJ".split("");
  const units = [];

  for (let coachIndex = 0; coachIndex < coaches; coachIndex += 1) {
    const coach = coachLetters[coachIndex];
    const section = `Coach ${coach} • ${trainClass}`;

    for (let row = 1; row <= rowsPerCoach; row += 1) {
      if (layout === "berth") {
        const berths = [
          { code: "L1", side: "left", position: "Lower Berth" },
          { code: "U1", side: "left", position: "Upper Berth" },
          { code: "L2", side: "right", position: "Lower Berth" },
          { code: "U2", side: "right", position: "Upper Berth" },
        ];

        berths.forEach((berth, index) => {
          const id = `${coach}-${row}${berth.code}`;
          units.push({
            id,
            label: `${row}${berth.code}`,
            kind: "berth",
            section,
            coach,
            row,
            side: berth.side,
            order: index,
            position: berth.position,
            category: trainClass,
            capacity: 1,
          });
        });
      } else {
        const letters = layout === "2x2" ? ["A", "B", "C", "D"] : ["A", "B", "C"];
        const splitAt = layout === "2x2" ? 2 : 2;

        letters.forEach((letter, index) => {
          const id = `${coach}-${row}${letter}`;
          units.push({
            id,
            label: `${row}${letter}`,
            kind: "seat",
            section,
            coach,
            row,
            side: index < splitAt ? "left" : "right",
            order: index,
            position: positionFor(index, letters.length),
            category: trainClass,
            capacity: 1,
          });
        });
      }
    }
  }

  return {
    config: {
      trainLayout: layout,
      trainCoaches: coaches,
      trainRowsPerCoach: rowsPerCoach,
      trainClass,
    },
    units,
  };
}

function launchPlan(config = {}) {
  const singleCabins = clampInt(config.launchSingleCabins, 0, 100, 4);
  const doubleCabins = clampInt(config.launchDoubleCabins, 0, 100, 4);
  const familyCabins = clampInt(config.launchFamilyCabins, 0, 100, 2);
  const chairSeats = clampInt(config.launchChairSeats, 0, 500, 20);
  const deckSeats = clampInt(config.launchDeckSeats, 0, 500, 20);
  const units = [];

  function addRange(count, prefix, section, kind, capacity, digits = 2) {
    for (let i = 1; i <= count; i += 1) {
      const number = String(i).padStart(digits, "0");
      const id = `${prefix}-${number}`;
      units.push({
        id,
        label: id,
        kind,
        section,
        category: section,
        capacity,
      });
    }
  }

  addRange(singleCabins, "SC", "Single Cabin", "cabin", 1);
  addRange(doubleCabins, "DC", "Double Cabin", "cabin", 2);
  addRange(familyCabins, "FC", "Family Cabin", "cabin", 4);
  addRange(chairSeats, "CH", "Chair Seats", "seat", 1, 3);
  addRange(deckSeats, "DK", "Deck Seats", "deck", 1, 3);

  return {
    config: {
      launchSingleCabins: singleCabins,
      launchDoubleCabins: doubleCabins,
      launchFamilyCabins: familyCabins,
      launchChairSeats: chairSeats,
      launchDeckSeats: deckSeats,
    },
    units,
  };
}

function buildSeatPlan(transportType, config = {}) {
  if (transportType === "Plane") return planePlan(config);
  if (transportType === "Train") return trainPlan(config);
  if (transportType === "Launch") return launchPlan(config);
  return busPlan(config);
}

function buildFallbackSeatPlan(transportType, quantity) {
  const total = Math.max(1, Number(quantity) || 1);
  let plan;

  if (transportType === "Plane") {
    plan = planePlan({ planeLayout: "3x3", planeRows: Math.ceil(total / 6) });
  } else if (transportType === "Train") {
    plan = trainPlan({ trainLayout: "2x2", trainCoaches: 1, trainRowsPerCoach: Math.ceil(total / 4), trainClass: "Standard" });
  } else if (transportType === "Launch") {
    plan = launchPlan({ launchSingleCabins: 0, launchDoubleCabins: 0, launchFamilyCabins: 0, launchChairSeats: total, launchDeckSeats: 0 });
  } else {
    plan = busPlan({ busType: "HD", busLayout: "2x2", busRows: Math.ceil(total / 4) });
  }

  plan.units = plan.units.slice(0, total);
  return plan;
}

function selectionIds(booking) {
  if (Array.isArray(booking.selectedUnits) && booking.selectedUnits.length) return booking.selectedUnits.map(String);
  if (Array.isArray(booking.seats) && booking.seats.length) return booking.seats.map(String);
  return [];
}

function buildAvailability(ticket, bookings = []) {
  const totalStored = Number(ticket.totalUnits || ticket.totalSeats || 0);
  const fallbackTotal = totalStored || Math.max(1, Number(ticket.quantity || 0) + Number(ticket.sold || 0));
  const plan = Array.isArray(ticket.seatPlan) && ticket.seatPlan.length
    ? ticket.seatPlan
    : buildFallbackSeatPlan(ticket.transportType, fallbackTotal).units;

  const booked = new Set();
  const reserved = new Set();
  let legacyBookedCount = 0;
  let legacyReservedCount = 0;

  for (const booking of bookings) {
    const ids = selectionIds(booking);
    const quantity = Math.max(0, Number(booking.quantity) || 0);

    if (ids.length) {
      const target = booking.status === "paid" ? booked : reserved;
      ids.forEach((id) => target.add(id));
    } else if (booking.status === "paid") {
      legacyBookedCount += quantity;
    } else if (["pending", "accepted"].includes(booking.status)) {
      legacyReservedCount += quantity;
    }
  }

  const explicitUnavailable = new Set([...booked, ...reserved]);
  const unassignedIds = plan.map((unit) => unit.id).filter((id) => !explicitUnavailable.has(id));

  for (let i = 0; i < legacyBookedCount && unassignedIds.length; i += 1) {
    booked.add(unassignedIds.shift());
  }

  for (let i = 0; i < legacyReservedCount && unassignedIds.length; i += 1) {
    reserved.add(unassignedIds.shift());
  }

  const units = plan.map((unit) => ({
    ...unit,
    status: booked.has(unit.id) ? "booked" : reserved.has(unit.id) ? "reserved" : "available",
  }));

  const bookedCount = units.filter((unit) => unit.status === "booked").length;
  const reservedCount = units.filter((unit) => unit.status === "reserved").length;
  const availableCount = units.length - bookedCount - reservedCount;

  return {
    units,
    totalUnits: units.length,
    totalCapacity: units.reduce((sum, unit) => sum + Number(unit.capacity || 1), 0),
    availableCount,
    reservedCount,
    bookedCount,
  };
}

module.exports = {
  buildSeatPlan,
  buildFallbackSeatPlan,
  buildAvailability,
};

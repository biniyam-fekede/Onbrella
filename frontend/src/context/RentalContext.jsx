/**
 * Rental and session state. Open/closed: add new state/actions without breaking existing consumers.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStationDetails, getStationDisplayName } from "../utils/stationNames";
import * as api from "../api/client";
import { config } from "../config";

const RentalContext = createContext(null);

function loadStoredRental() {
  try {
    const raw = localStorage.getItem(config.rentalStorageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRental(rental) {
  try {
    if (rental) {
      localStorage.setItem(config.rentalStorageKey, JSON.stringify(rental));
    } else {
      localStorage.removeItem(config.rentalStorageKey);
    }
  } catch (_) {}
}

function loadLastReturnSummary() {
  try {
    const raw = localStorage.getItem(config.lastReturnStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastReturn(summary) {
  try {
    if (summary) {
      localStorage.setItem(config.lastReturnStorageKey, JSON.stringify(summary));
    } else {
      localStorage.removeItem(config.lastReturnStorageKey);
    }
  } catch (_) {}
}

export function RentalProvider({ children }) {
  const [activeRental, setActiveRental] = useState(() => loadStoredRental());
  const [lastReturnSummary, setLastReturnSummary] = useState(() => loadLastReturnSummary());

  const startRental = useCallback(async (stationId) => {
    const result = await api.startRental(stationId);
    const rental = {
      rentalId: result.rentalId,
      umbrellaId: result.umbrellaId,
      startTime: result.startTime,
      stationId,
    };
    setActiveRental(rental);
    saveRental(rental);
    return result;
  }, []);

  const endRental = useCallback(
    async (stationId) => {
      if (!activeRental) throw new Error("No active rental");

      const result = await api.endRental(
        activeRental.rentalId,
        stationId,
        activeRental.umbrellaId
      );

      const [pickUpStation, returnStation] = await Promise.all([
        getStationDetails(activeRental.stationId).catch(() => null),
        getStationDetails(stationId).catch(() => null),
      ]);

      const summary = {
        rentalId: activeRental.rentalId,
        endTime: result.endTime,
        durationMs: result.durationMs,
        costCents: result.costCents,
        pickUpStationId: activeRental.stationId,
        returnStationId: stationId,
        pickUpStationName:
          pickUpStation?.name || getStationDisplayName(activeRental.stationId),
        returnStationName:
          returnStation?.name || getStationDisplayName(stationId),
      };

      setActiveRental(null);
      setLastReturnSummary(summary);
      saveRental(null);
      saveLastReturn(summary);

      return { ...result, summary };
    },
    [activeRental]
  );

  const clearRentalState = useCallback(() => {
    setActiveRental(null);
    setLastReturnSummary(null);
    saveRental(null);
    saveLastReturn(null);
  }, []);

  const value = useMemo(
    () => ({
      activeRental,
      lastReturnSummary,
      clearLastReturnSummary: () => {
        setLastReturnSummary(null);
        saveLastReturn(null);
      },
      clearRentalState,
      startRental,
      endRental,
    }),
    [activeRental, lastReturnSummary, clearRentalState, startRental, endRental]
  );

  return <RentalContext.Provider value={value}>{children}</RentalContext.Provider>;
}

export function useRental() {
  const ctx = useContext(RentalContext);
  if (!ctx) throw new Error("useRental must be used within RentalProvider");
  return ctx;
}
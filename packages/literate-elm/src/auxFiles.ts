import fs from "fs-extra";
import sleep from "sleep-promise";

const CHECK_INTERVAL = 100;
const DEFAULT_LOCK_TIMEOUT = 5000;

export const touch = async (path: string) => {
  await fs.writeFile(`${path}.touchfile`, "");
};

export const getLastTouchedAt = async (path: string): Promise<number> => {
  try {
    return (await fs.stat(`${path}.touchfile`)).mtimeMs;
  } catch (e) {
    return 0;
  }
};

export const hasBeenTouchedWithin = async (
  path: string,
  intervalInMs: number,
): Promise<boolean> => {
  return +new Date() - (await getLastTouchedAt(path)) < intervalInMs;
};

export const isLocked = async (path: string): Promise<boolean> => {
  return !!(await fs.pathExists(`${path}.lockfile`));
};

export const ensureUnlocked = async (
  path: string,
  timeout: number = DEFAULT_LOCK_TIMEOUT,
) => {
  const timeToGiveUp = +new Date() + timeout;
  do {
    if (!(await isLocked(path))) {
      return;
    }
    sleep(CHECK_INTERVAL);
  } while (+new Date() < timeToGiveUp);
  throw new Error("Unlock failed");
};

export const lock = async (path: string, identifier?: string) => {
  await fs.writeFile(`${path}.lockfile`, identifier || "");
};

export const unlock = async (path: string) => {
  await fs.remove(`${path}.lockfile`);
};

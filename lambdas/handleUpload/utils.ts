import { ContinentCode } from "./types/continentCode";
import { v4 as uuidv4 } from "uuid";

export const getUuid = (): string => uuidv4();

const continentMapping: Record<string, string> = {
  Asia: "AS",
  Africa: "AF",
  "North America": "NA",
  "South America": "SA",
  Antarctica: "AN",
  Europe: "EU",
  Australia: "AU",
};

/**
 * Function to get the continent code from the continent name.
 *
 * @param continentName Name of the continent
 * @returns Corresponding continent code or null if not found
 */
export const getContinentCode = (
  continentName: string
): ContinentCode | null => {
  const code = continentMapping[continentName];

  return (
    {
      code,
      name: continentName,
    } || null
  );
};

/**
 * Function to get the continent object from the continent code.
 *
 * @param continentCode Code of the continent
 * @returns Corresponding continent object or null if not found
 */
export const getContinentObjectFromCode = (
  continentCode: string
): ContinentCode | null => {
  const continentName = Object.keys(continentMapping).find(
    (key) => continentMapping[key] === continentCode
  );

  return (
    {
      code: continentCode,
      name: continentName || "",
    } || null
  );
};

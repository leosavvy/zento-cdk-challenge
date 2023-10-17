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
export const getContinentCode = (continentName: string): string | null => {
  return continentMapping[continentName] || null;
};

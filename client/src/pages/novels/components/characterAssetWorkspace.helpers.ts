import type { Character, CharacterCastRole, CharacterGender } from "@ai-novel/shared/types/novel";

// Locale-aware: values are `novelsEditA` namespace translation keys. The getters
// below RETURN a translation key; resolve it with t()/i18n.t at the call site
// (module-load i18n.t would freeze the locale).
const CAST_ROLE_LABEL_KEYS: Record<CharacterCastRole, string> = {
  protagonist: "shared.castRoleProtagonist",
  antagonist: "shared.castRoleAntagonist",
  ally: "shared.castRoleAlly",
  foil: "shared.castRoleFoil",
  mentor: "shared.castRoleMentor",
  love_interest: "shared.castRoleLoveInterest",
  pressure_source: "shared.castRolePressureSource",
  catalyst: "shared.castRoleCatalyst",
};

const CHARACTER_GENDER_LABEL_KEYS: Record<CharacterGender, string> = {
  male: "shared.characterGenderMale",
  female: "shared.characterGenderFemale",
  other: "shared.characterGenderOther",
  unknown: "shared.characterGenderUnknown",
};

export function getCastRoleLabel(castRole?: CharacterCastRole | null): string {
  if (!castRole) {
    return "shared.castRoleUndefined";
  }
  return CAST_ROLE_LABEL_KEYS[castRole] ?? castRole;
}

export function getCharacterGenderLabel(gender?: CharacterGender | null): string {
  if (!gender) {
    return "shared.characterGenderUnknown";
  }
  return CHARACTER_GENDER_LABEL_KEYS[gender] ?? gender;
}

export function isProtagonistCharacter(character?: Character | null): boolean {
  if (!character) {
    return false;
  }
  if (character.castRole === "protagonist") {
    return true;
  }
  const roleText = `${character.role ?? ""} ${character.castRole ?? ""}`;
  return /主角|男主|女主|主人公/.test(roleText);
}

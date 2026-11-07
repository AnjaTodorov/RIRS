import { z } from "zod";

const requiredText = (label: string, max = 100) =>
  z
    .string({ error: `${label} je obvezno polje.` })
    .trim()
    .min(1, `${label} je obvezno polje.`)
    .max(max, `Največ ${max} znakov.`);

export const registrationSchema = z
  .object({
    firstName: requiredText("Ime"),
    lastName: requiredText("Priimek"),
    username: requiredText("Uporabniško ime", 64),
    phoneNumber: requiredText("Telefonska številka", 40),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: "Vnesite veljaven e-poštni naslov." })),
    password: z
      .string()
      .min(8, "Geslo mora vsebovati vsaj 8 znakov.")
      .max(128, "Geslo je predolgo."),
    role: z.enum(["SEEKER", "ADVERTISER"], {
      error: "Izberite iskalca ali oglaševalca.",
    }),
  })
  .strict();

export type RegistrationInput = z.infer<typeof registrationSchema>;

export class RegistrationError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export interface RegistrationDependencies {
  emailExists(email: string): Promise<boolean>;
  usernameExists(username: string): Promise<boolean>;
  signUp(input: RegistrationInput): Promise<{
    userId: string | null;
    requiresEmailConfirmation: boolean;
    duplicate?: boolean;
    errorCode?: string;
  }>;
  profileExists(userId: string): Promise<boolean>;
}

export function createRegistrationService(deps: RegistrationDependencies) {
  return async (body: unknown) => {
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        fields[String(issue.path[0] ?? "form")] ??= issue.message;
      throw new RegistrationError(400, "Preverite vnesene podatke.", fields);
    }
    const input = parsed.data;
    const [emailTaken, usernameTaken] = await Promise.all([
      deps.emailExists(input.email),
      deps.usernameExists(input.username),
    ]);
    if (emailTaken)
      throw new RegistrationError(
        409,
        "Račun s tem e-poštnim naslovom že obstaja.",
        { email: "E-poštni naslov je že uporabljen." },
      );
    if (usernameTaken)
      throw new RegistrationError(409, "Uporabniško ime je že uporabljeno.", {
        username: "Izberite drugo uporabniško ime.",
      });

    const result = await deps.signUp(input);
    if (result.duplicate || result.errorCode === "user_already_exists") {
      throw new RegistrationError(
        409,
        "Račun s tem e-poštnim naslovom že obstaja.",
        { email: "E-poštni naslov je že uporabljen." },
      );
    }
    if (result.errorCode) {
      // A concurrent registration may have taken the username after the precheck.
      if (await deps.usernameExists(input.username)) {
        throw new RegistrationError(409, "Uporabniško ime je že uporabljeno.", {
          username: "Izberite drugo uporabniško ime.",
        });
      }
      if (
        ["over_email_send_rate_limit", "over_request_rate_limit"].includes(
          result.errorCode,
        )
      ) {
        throw new RegistrationError(
          429,
          "Preveč poskusov. Počakajte nekaj minut in poskusite znova.",
        );
      }
      if (result.errorCode === "weak_password")
        throw new RegistrationError(400, "Geslo ne ustreza pravilom.", {
          password: "Izberite močnejše geslo.",
        });
      if (
        result.errorCode === "email_address_invalid" ||
        result.errorCode === "email_address_not_authorized"
      ) {
        throw new RegistrationError(
          400,
          "Registracija s tem naslovom ni dovoljena.",
          {
            email:
              "Preverite e-poštni naslov in nastavitve pošiljanja Supabase.",
          },
        );
      }
      throw new RegistrationError(
        503,
        "Registracija trenutno ni na voljo. Poskusite znova pozneje.",
      );
    }
    if (!result.userId || !(await deps.profileExists(result.userId))) {
      throw new RegistrationError(
        503,
        "Profila ni bilo mogoče ustvariti. Poskusite znova pozneje.",
      );
    }
    return {
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      message: result.requiresEmailConfirmation
        ? "Račun je ustvarjen. Preverite e-pošto in potrdite svoj naslov."
        : "Račun je uspešno ustvarjen.",
    };
  };
}

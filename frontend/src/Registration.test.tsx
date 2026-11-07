import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Registration } from "./Registration";

async function fill() {
  const user = userEvent.setup();
  for (const [label, value] of [
    ["Ime", "Ana"],
    ["Priimek", "Novak"],
    ["Uporabniško ime", "ana"],
    ["Telefonska številka", "040123456"],
    ["E-poštni naslov", "ana@example.com"],
    ["Geslo", "LongPassword123!"],
  ]) {
    await user.type(screen.getByLabelText(label, { exact: true }), value);
  }
  return user;
}
describe("US-01 registration form", () => {
  it("handles the signup confirmation callback without keeping tokens in the URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/#type=signup&access_token=test-token",
    );
    render(<Registration />);
    expect(await screen.findByText(/E-poštni naslov je potrjen/)).toBeVisible();
    expect(window.location.hash).toBe("");
  });
  it("offers only seeker and advertiser roles with required fields", () => {
    render(<Registration />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(
      screen.getByRole("radio", { name: /Iščem nepremičnino/ }),
    ).toBeChecked();
    expect(screen.getByLabelText("Ime", { exact: true })).toBeRequired();
    expect(screen.getByLabelText("Geslo", { exact: true })).toHaveAttribute(
      "minlength",
      "8",
    );
  });
  it("submits the advertiser role and displays email confirmation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Preverite e-pošto.",
          requiresEmailConfirmation: true,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<Registration />);
    const user = await fill();
    await user.click(
      screen.getByRole("radio", { name: /Oglašujem nepremičnino/ }),
    );
    await user.click(screen.getByRole("button", { name: /Ustvari račun/ }));
    expect(
      await screen.findByRole("heading", {
        name: /Preverite svoj e-poštni nabiralnik/,
      }),
    ).toBeVisible();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).role).toBe("ADVERTISER");
    expect(
      screen.queryByLabelText("Geslo", { exact: true }),
    ).not.toBeInTheDocument();
  });
  it("shows duplicate-email errors next to the field and retains input", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({
            message: "Račun že obstaja.",
            fields: { email: "E-poštni naslov je že uporabljen." },
          }),
        }),
    );
    render(<Registration />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: /Ustvari račun/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Račun že obstaja.",
    );
    expect(screen.getByLabelText("E-poštni naslov")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Ime", { exact: true })).toHaveValue("Ana");
  });
  it("allows retry after a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    render(<Registration />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: /Ustvari račun/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Povezava s strežnikom ni uspela.",
    );
    expect(screen.getByRole("button", { name: /Ustvari račun/ })).toBeEnabled();
  });
  it("prevents a second submission while a request is pending", async () => {
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    render(<Registration />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: /Ustvari račun/ }));
    expect(
      screen.getByRole("button", { name: /Ustvarjanje računa/ }),
    ).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

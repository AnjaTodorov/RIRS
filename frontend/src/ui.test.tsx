import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PasswordInput } from "./ui";

it("shows and hides a password without clearing it or submitting the form", async () => {
  render(
    <form>
      <label htmlFor="secret">Geslo</label>
      <PasswordInput id="secret" name="password" defaultValue="zasebno-geslo" />
    </form>,
  );
  const user = userEvent.setup();
  const input = screen.getByLabelText("Geslo");
  expect(input).toHaveAttribute("type", "password");
  await user.click(screen.getByRole("button", { name: "Prikaži geslo" }));
  expect(input).toHaveAttribute("type", "text");
  expect(input).toHaveValue("zasebno-geslo");
  await user.click(screen.getByRole("button", { name: "Skrij geslo" }));
  expect(input).toHaveAttribute("type", "password");
  expect(input).toHaveValue("zasebno-geslo");
});

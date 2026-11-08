import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { it, expect, vi } from "vitest";
import { Login } from "./App";
import { useSession } from "./session";
vi.mock("./session", () => ({ useSession: vi.fn(), request: vi.fn() }));
for (const successful of [false, true])
  it(`US-02 login ${successful ? "success" : "invalid credentials"}`, async () => {
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({
        error: successful ? null : { code: "invalid_credentials" },
      });
    vi.mocked(useSession).mockReturnValue({
      client: { auth: { signInWithPassword } },
      profile: null,
      loading: false,
      error: "",
    } as any);
    render(
      <MemoryRouter initialEntries={["/prijava"]}>
        <Routes>
          <Route path="/prijava" element={<Login />} />
          <Route path="/" element={<p>Dobrodošli doma</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("E-poštni naslov"),
      "ana@example.com",
    );
    await user.type(screen.getByLabelText("Geslo"), "password123");
    await user.click(screen.getByRole("button", { name: "Prijava" }));
    if (successful)
      expect(await screen.findByText("Dobrodošli doma")).toBeVisible();
    else
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Prijava ni uspela",
      );
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "password123",
    });
  });

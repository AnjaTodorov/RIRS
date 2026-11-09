import { it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { slovenianTimeToISO, MyViewings } from "./Viewings";
import { request } from "./session";
vi.mock("./session", () => ({
  useSession: () => ({
    session: { access_token: "test" },
    profile: { id: "a", role: "SEEKER" },
    loading: false,
  }),
  request: vi.fn(),
  ApiError: class extends Error {},
}));
it("US-12 converts Ljubljana summer and winter times and rejects a spring gap", () => {
  expect(slovenianTimeToISO("2027-01-15T10:00")).toBe(
    "2027-01-15T09:00:00.000Z",
  );
  expect(slovenianTimeToISO("2027-07-15T10:00")).toBe(
    "2027-07-15T08:00:00.000Z",
  );
  expect(() => slovenianTimeToISO("2027-03-28T02:30")).toThrow("ne obstaja");
});
it("US-18 shows the private address only when supplied by the authorized API", async () => {
  vi.mocked(request).mockResolvedValue([
    {
      id: "r",
      status: "CONFIRMED",
      slot: { startsAt: "2027-01-15T10:00Z", endsAt: "2027-01-15T11:00Z" },
      property: {
        id: "p",
        title: "Stanovanje",
        publicLocation: "Maribor",
        status: "PUBLISHED",
        exactAddress: "Zasebni naslov 1",
      },
    },
  ]);
  render(
    <MemoryRouter>
      <MyViewings />
    </MemoryRouter>,
  );
  expect(await screen.findByText("Zasebni naslov 1")).toBeVisible();
});
for (const [requestStatus, propertyStatus] of [
  ["PENDING", "PUBLISHED"],
  ["REJECTED", "PUBLISHED"],
  ["CANCELLED", "PUBLISHED"],
  ["CONFIRMED", "INACTIVE"],
  ["CONFIRMED", "SOLD"],
  ["CONFIRMED", "RENTED"],
]) {
  it(`US-18 hides the exact address for ${requestStatus} requests on ${propertyStatus} listings`, async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: "private",
        status: requestStatus,
        slot: { startsAt: "2027-01-15T10:00Z", endsAt: "2027-01-15T11:00Z" },
        property: {
          id: "p",
          title: "Zasebnost ogleda",
          publicLocation: "Maribor",
          status: propertyStatus,
          exactAddress: "Naslov, ki mora ostati zaseben",
        },
      },
    ]);
    render(
      <MemoryRouter>
        <MyViewings />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Zasebnost ogleda" }),
    ).toBeVisible();
    expect(
      screen.queryByText("Naslov, ki mora ostati zaseben"),
    ).not.toBeInTheDocument();
  });
}

import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";
import {it,expect,vi} from "vitest";
import {Catalog} from "./Listings";
import {request} from "./session";
vi.mock("./session",()=>({useSession:()=>({session:null}),request:vi.fn(),ApiError:class extends Error{}}));
it("US-10: renders published listing data and empty results",async()=>{
 vi.mocked(request).mockResolvedValue([{id:"test",title:"Stanovanje v Mariboru",city:"Maribor",propertyType:"Stanovanje",listingType:"SALE",price:"120000",areaM2:"60",status:"PUBLISHED",photos:[]}]);
 render(<MemoryRouter><Catalog/></MemoryRouter>);
 expect(await screen.findByRole("heading",{name:"Stanovanje v Mariboru"})).toBeVisible();
});
it("US-11: rejects reversed ranges and removes one filter while preserving others",async()=>{
 vi.mocked(request).mockResolvedValue([]);
 render(<MemoryRouter initialEntries={["/?city=Maribor&minPrice=100"]}><Catalog/></MemoryRouter>);
 const user=userEvent.setup();
 await user.click(await screen.findByRole("button",{name:"100 ×"}));
 await waitFor(()=>expect(vi.mocked(request).mock.calls.at(-1)?.[0]).toBe("/properties?city=Maribor"));
 const count=vi.mocked(request).mock.calls.length;
 await user.type(screen.getByLabelText("Cena od (€)"),"200");await user.type(screen.getByLabelText("Cena do (€)"),"100");await user.click(screen.getByRole("button",{name:"Išči"}));
 expect(await screen.findByRole("alert")).toHaveTextContent("Najmanjša vrednost");expect(vi.mocked(request).mock.calls.length).toBe(count);
});

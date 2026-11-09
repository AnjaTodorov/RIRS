import { useEffect, useState } from "react";
import { useSession, request } from "./session";
export type Listing = {
  id: string;
  title: string;
  description: string;
  city: string;
  publicLocation: string;
  exactAddress?: string;
  advertiserId?: string;
  propertyType: string;
  listingType: "SALE" | "RENT" | null;
  price: string | null;
  areaM2: string | null;
  status: string;
  reviewReason?: string | null;
  photos: { id: string; position: number }[];
};
export type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
};
export type PersonalRequest = {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  decidedAt: string | null;
  slot: { id: string; startsAt: string; endsAt: string };
  property: Listing;
};
export type ReceivedRequest = {
  id: string;
  status: string;
  message?: string | null;
  slot: { startsAt: string; endsAt: string };
  seeker: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
  };
};
export function useResource<T>(path: string | null) {
  const { session } = useSession();
  const identity = path + "|" + (session?.access_token || "public");
  const [state, setState] = useState<{
    key: string;
    value: T | null;
    error: string;
    loading: boolean;
  }>({ key: "", value: null, error: "", loading: !!path });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    if (!path) {
      setState({ key: identity, value: null, error: "", loading: false });
      return;
    }
    setState((p) =>
      p.key === identity
        ? { ...p, loading: true, error: "" }
        : { key: identity, value: null, error: "", loading: true },
    );
    request<T>(path, session?.access_token)
      .then((value) => {
        if (active)
          setState({ key: identity, value, error: "", loading: false });
      })
      .catch((e) => {
        if (active)
          setState({
            key: identity,
            value: null,
            error: e.message,
            loading: false,
          });
      });
    return () => {
      active = false;
    };
  }, [path, session?.access_token, version]);
  return {
    ...(state.key === identity
      ? state
      : { value: null, error: "", loading: !!path }),
    reload: () => setVersion((v) => v + 1),
  };
}

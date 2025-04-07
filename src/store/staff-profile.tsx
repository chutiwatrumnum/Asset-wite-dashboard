import { create } from 'zustand'

export type TStaffRole = "master" | "staff" | "n/a";
export type THouse = {
  house_id: {
    address: string,
      area: string
  }
}

type TStaffProfile = {
  email: string;
  role: TStaffRole;
  house: string;
  setEmail: (email: string) => void;
  setRole: (role: TStaffRole) => void;
  setHouse: (id: string) => void;
};

export const useStaffProfile = create<TStaffProfile>((set) => ({
  email: "",
  role: "n/a" as TStaffRole,
  house: "n/a",
  setEmail: (email: string) => set(() => ({ email })),
  setRole: (role: TStaffRole) => set(() => ({ role })),
  setHouse: (houseId: string) => set(() => ({ house: houseId })),
}));
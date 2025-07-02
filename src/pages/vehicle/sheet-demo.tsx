import Pb from "@/api/pocketbase.tsx";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SelectContent, SelectGroup, SelectItem, SelectLabel, SelectValue } from "@/components/ui/select";
import { Select, SelectTrigger } from "@radix-ui/react-select";
import { MailOpen } from "lucide-react";
import { useStaffProfile } from "@/store/staff-profile.tsx";
import { useQuery } from "@tanstack/react-query";

export function SheetDemo() {
  const { email, role, house } = useStaffProfile();
  const { data: houseList } = useQuery({
    queryKey: ["house"],
    queryFn: async () => await Pb.collection('house').getFullList(),
  });

  console.log(houseList);

  return (
    <SheetContent className={"p-4"}>
      <SheetHeader>
        <SheetTitle className="font-anuphan font-semibold text-md mb-1.5">Edit profile</SheetTitle>
        <SheetDescription>
          Make changes to the user profile and click "save changes" when you're done.
        </SheetDescription>
      </SheetHeader>

      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="grid gap-4">
          <Label htmlFor="role" className="text-right">
            Email
          </Label>
        </div>
        <Input value={email} className="col-span-3 text-sm p-1.5 text-center" readOnly disabled/>

        <div className="grid gap-4">
          <Label htmlFor="role" className="text-right">
            Role
          </Label>
        </div>
        <Select>
          <SelectTrigger className="col-span-3 font-anuphan border rounded-sm p-1.5 text-sm capitalize">
            <SelectValue placeholder={role}/>
          </SelectTrigger>
          <SelectContent className="col-span-2 font-anuphan">
            <SelectGroup>
              <SelectLabel>Authority Level</SelectLabel>
              <SelectItem value="master">master</SelectItem>
              <SelectItem value="staff">staff</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="grid gap-4 col-start-1">
          <Label htmlFor="house" className="text-right col-span-1">
            House
          </Label>
        </div>
        <Input
          className="col-span-3 text-sm p-1.5 text-center"
          value={house || "n/a"}
          onChange={() => {}}/>
      </div>

      <SheetFooter>
        <SheetClose asChild>
          <Button className="h-12" type="submit">
            <MailOpen className="m-1" /> Save changes
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  )
}

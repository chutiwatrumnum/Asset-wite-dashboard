import { Button } from "@/components/ui/button.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu.tsx";
import { EllipsisIcon, LucideTrash, SquarePen } from "lucide-react";
import { SheetTrigger } from "@/components/ui/sheet.tsx";
import { Cell } from "@tanstack/react-table";
import { THouse, TStaffRole, useStaffProfile } from "@/store/staff-profile.tsx";
import { saffItem } from "@/api/auth/auth";
// import { useMutation } from "@tanstack/react-query";

function DataTableActionButton({ info }: { info: Cell<saffItem, any> }) {
    const { setEmail, setRole, setHouse } = useStaffProfile();

    // const {data} = useMutation({
    //   mutationKey: ["update-profile", id],
    //   mutationFn: async () => {
    //     return Pb.collection("admin").update(id);
    //   },
    // })

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                    <EllipsisIcon />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[160px]">
                <SheetTrigger asChild>
                    <DropdownMenuItem
                        className={"w-[150px] font-anuphan"}
                        onClick={() => {
                            const email = info.row.getValue("email") as string;
                            const role = info.row.getValue("role") as TStaffRole;
                            const expand: THouse = info.row.getValue("expand");
                            const house = expand?.house_id.address;

                            // const rowId = info.row.getValue("id");
                            // console.log(rowId);

                            setEmail(email);
                            setRole(role);
                            setHouse(house);
                        }}
                    >
                        <SquarePen className="w-8 h-8 mr-1" />
                        Edit
                    </DropdownMenuItem>
                </SheetTrigger>
                <DropdownMenuSeparator />
                <DropdownMenuItem className={"w-[150px] font-anuphan"} onClick={() => {}}>
                    <LucideTrash className="w-8 h-8 mr-1" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default DataTableActionButton;

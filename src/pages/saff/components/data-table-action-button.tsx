import { Button } from "@/components/ui/button.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu.tsx";
import { EllipsisIcon, LucideTrash, SquarePen } from "lucide-react";
import { SheetTrigger } from "@/components/ui/sheet.tsx";
import { Cell } from "@tanstack/react-table";
import { THouse, TStaffRole, useStaffProfile } from "@/store/staff-profile.tsx";
import { saffItem } from "@/api/auth/auth";
import { useDeleteSaffMutation } from "@/react-query/manage/auth/auth";
import { MessageDialog } from "@/components/modal";
import { useState } from "react";
// import { useMutation } from "@tanstack/react-query";

function DataTableActionButton({ info }: { info: Cell<saffItem, any> }) {
    const { setEmail, setRole, setHouse } = useStaffProfile();
    const { mutateAsync } = useDeleteSaffMutation();
    const [MessageLoginFaild, setMessageLoginFaild] = useState<{
        title: string;
        description: string;
    }>({
        title: "",
        description: "",
    });
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
                        onClick={async () => {
                            const email = info.row.getValue("email") as string;
                            const role = info.row.getValue("role") as TStaffRole;
                            const expand: THouse = info.row.getValue("expand");
                            const house = expand?.house_id.address;

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
                <DropdownMenuItem
                    className={"w-[150px] font-anuphan"}
                    onClick={async () => {
                        const rowId = info.row.getValue("id");
                        console.log(rowId);
                        await mutateAsync(rowId as string);
                        setMessageLoginFaild({
                            title: "Delete Success",
                            description: "Delete Success",
                        })
                    }}
                >
                    <LucideTrash className="w-8 h-8 mr-1" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
            <MessageDialog Message={MessageLoginFaild} />
        </DropdownMenu>
    );
}

export default DataTableActionButton;

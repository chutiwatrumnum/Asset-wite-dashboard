import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";

export type MessageDialogProps = {
    Message: {
        title: string;
        description: string | string[];
    };
    time?: number;
};
const renderTitle = (title: string) => (title ? <DialogTitle>{title}</DialogTitle> : null);
const rederDescription = (description: string | string[]) => (Array.isArray(description) ? description.map((item) => <DialogDescription key={item}>{item}</DialogDescription>) : <DialogDescription>{description}</DialogDescription>);
export function MessageDialog({ Message, time }: MessageDialogProps) {
    const [IsDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    useEffect(() => {
        if (Message.title) {
            setIsDialogOpen(true);
        }
    }, [Message]);

    setTimeout(
        () => {
            setIsDialogOpen(false);
        },
        time ? (time > 0 ? time : 5000) : 5000
    );
    return (
        <Dialog open={IsDialogOpen}>
            <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
                <DialogHeader>
                    {renderTitle(Message.title)}

                    {rederDescription(Message.description)}
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}

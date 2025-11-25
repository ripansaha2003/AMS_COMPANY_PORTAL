import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogTrigger,
} from "@/components/ui/dialog";

const ViewLogs = ({ children, log }) => {
    // Example log data if not provided
    const exampleLog = {
        date: "16/02/2025",
        time: "9:30 PM",
        activity: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium perspiciatis unde omnis iste natus error sit voluptatem accusantiumperspiciatis unde omnis iste natus error sit voluptatem accusantiumperspiciatis unde omnis iste natus error sit voluptatem accusantiumperspiciatis unde omnis iste natus error sit voluptatem accusantiumperspiciatis unde omnis iste natus error sit voluptatem accusantium`,
    };

    const data = log || exampleLog;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>View Log</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                    <div>
                        <span className="font-semibold">Date:</span> {data.date}
                    </div>
                    <div>
                        <span className="font-semibold">Time:</span> {data.time}
                    </div>
                    <div>
                        <span className="font-semibold">Activity:</span>
                    </div>
                    <div className="text-muted-foreground mt-1" style={{whiteSpace: "pre-line"}}>
                        {data.activity}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewLogs;
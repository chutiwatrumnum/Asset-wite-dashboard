import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
    component: PrifleComponent,
});

function PrifleComponent() {
    return <div>Hello "/profile"!</div>;
}

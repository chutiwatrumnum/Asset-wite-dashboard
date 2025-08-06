// src/pages/external_vehicle/components/data-table-column-header.tsx
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";

function DataTableColumnHeader({
  className,
  ...props
}: {
  className?: ClassValue;
  title: string;
}) {
  const { title } = props;
  return (
    <div className={cn("font-light capitalize text-md", className)}>
      {title}
    </div>
  );
}

export default DataTableColumnHeader;

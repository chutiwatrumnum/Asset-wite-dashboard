import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { flexRender } from "@tanstack/react-table";
import { Table as ReactTable } from "@tanstack/react-table";

function DataTableBody<T>(props: {
  table: ReactTable<T>,
}) {
  const { table } = props;
  return (
    <div className="[&>div]:border [&>div]:rounded-md">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="sticky top-0 bg-secondary hover:bg-muted after:content-[''] after:inset-x-0 after:h-px after:bg-border after:absolute after:bottom-0"
            >
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    }
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="overflow-hidden">
          {table.getRowModel().rows?.length
            ? (table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    className={"font-anuphan font-light text-xm"}
                    key={cell.id}
                    onClick={() => {
                      //   toast("Event has been created", {
                      //     description: "Sunday, December 03, 2023 at 9:00 AM",
                      //     duration: Infinity,
                      //     action: {
                      //       label: "Undo",
                      //       onClick: () => console.log("Undo"),
                      //     },
                      //   })
                    }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )))
            : (<TableRow className="overflow-hidden">
                <TableCell/>
                <TableCell
                  className="h-48 w-full text-center"
                  colSpan={table.getAllColumns().length}
                >
                  No results.
                </TableCell>
                <TableCell/>
              </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTableBody;
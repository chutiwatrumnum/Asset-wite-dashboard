import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination.tsx";
import { PaginationState, Table } from "@tanstack/react-table";

function DataTablePagination<T>(props: { table: Table<T>, totalRows: number, pgState: PaginationState }) {
  const { table, totalRows, pgState } = props;
  const totalPages = Math.ceil(totalRows / pgState.pageSize);
  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "} {totalRows} row(s) selected.
      </div>
      <div>
        <Pagination className="mt-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={"font-anuphan font-light text-xm"}
               onClick={async () => table.previousPage()}/>
            </PaginationItem>

            <span className={"font-anuphan font-light text-xm"}> {pgState.pageIndex + 1} of {totalPages} </span>

            <PaginationItem>
              <PaginationNext
                className={"font-anuphan font-light text-xm"}
                 onClick={async () => {
                if (pgState.pageIndex < totalPages - 1) {
                  table.nextPage();
                }
              }}/>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export default DataTablePagination;
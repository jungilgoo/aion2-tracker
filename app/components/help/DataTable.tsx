interface DataTableProps {
  headers: string[];
  rows: string[][];
}

export default function DataTable({ headers, rows }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-700 rounded text-sm">
        <thead className="bg-gray-700">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-2 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-700">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

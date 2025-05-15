"use client";

import { useState, ChangeEvent, useEffect, useRef } from 'react';

interface TableData {
  [key: string]: any;
}

interface ColumnMetadata {
  name: string;
  type: string;
}

interface ApiResponse {
  data: TableData[];
  columns: ColumnMetadata[];
  error?: string;
}

const ROWS_PER_PAGE = 20;

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTableScroll = () => {
      if (topScrollRef.current && tableWrapperRef.current) {
        topScrollRef.current.scrollLeft = tableWrapperRef.current.scrollLeft;
      }
    };
    const handleTopScroll = () => {
      if (topScrollRef.current && tableWrapperRef.current) {
        tableWrapperRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
    };

    const tableWrapper = tableWrapperRef.current;
    const topScroller = topScrollRef.current;

    if (tableWrapper) {
      tableWrapper.addEventListener('scroll', handleTableScroll);
    }
    if (topScroller) {
      topScroller.addEventListener('scroll', handleTopScroll);
    }

    return () => {
      if (tableWrapper) {
        tableWrapper.removeEventListener('scroll', handleTableScroll);
      }
      if (topScroller) {
        topScroller.removeEventListener('scroll', handleTopScroll);
      }
    };
  }, [columns, tableData]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setTableData([]);
      setColumns([]);
      setVisibleColumns({});
      setError(null);
      setInfoMessage(null);
      setCurrentPage(1);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a Parquet file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    setTableData([]);
    setColumns([]);
    setVisibleColumns({});
    setCurrentPage(1);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const textError = await response.text();
          throw new Error(`Server error: ${response.status} ${response.statusText}. Response: ${textError}`);
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.error) {
        setError(result.error);
      } else if (result.data && result.columns) {
        setTableData(result.data);
        setColumns(result.columns);
        const initialVisibility: Record<string, boolean> = {};
        result.columns.forEach(col => {
          initialVisibility[col.name] = true;
        });
        setVisibleColumns(initialVisibility);
        setInfoMessage(`Successfully loaded ${result.data.length} records with ${result.columns.length} columns.`);
        setError(null);
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnVisibilityChange = (columnName: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName],
    }));
  };

  const handleSelectAllColumns = () => {
    const newVisibility: Record<string, boolean> = {};
    columns.forEach(col => {
      newVisibility[col.name] = true;
    });
    setVisibleColumns(newVisibility);
  };

  const handleDeselectAllColumns = () => {
    const newVisibility: Record<string, boolean> = {};
    columns.forEach(col => {
      newVisibility[col.name] = false;
    });
    setVisibleColumns(newVisibility);
  };

  const getDisplayedHeaders = () => {
    return columns.filter(col => visibleColumns[col.name]);
  };

  const totalPages = Math.ceil(tableData.length / ROWS_PER_PAGE);
  const currentTableData = tableData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };
  
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  }

  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons && totalPages >= maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        buttons.push(
            <button key="1" onClick={() => goToPage(1)} className={`px-3 py-1 mx-1 rounded-md text-sm font-medium ${1 === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>1</button>
        );
        if (startPage > 2) {
            buttons.push(<span key="start-ellipsis" className="px-3 py-1 mx-1">...</span>);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        buttons.push(
            <button key={i} onClick={() => goToPage(i)} className={`px-3 py-1 mx-1 rounded-md text-sm font-medium ${i === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{i}</button>
        );
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            buttons.push(<span key="end-ellipsis" className="px-3 py-1 mx-1">...</span>);
        }
        buttons.push(
            <button key={totalPages} onClick={() => goToPage(totalPages)} className={`px-3 py-1 mx-1 rounded-md text-sm font-medium ${totalPages === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{totalPages}</button>
        );
    }
    return buttons;
  };


  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-10">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Parquet File Viewer (UI Enhanced)
          </h1>
        </header>

        <div className="bg-white shadow-xl rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Parquet File</h2>
          <div className="space-y-5">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".parquet"
              className="block w-full text-base text-gray-600 file:mr-5 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-base file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors duration-150 cursor-pointer"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-150 text-lg"
            >
              {isLoading ? (
                <svg className="animate-spin h-6 w-6 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "View Data"}
            </button>
          </div>
          {infoMessage && <p className="mt-5 text-base text-green-700 bg-green-100 p-4 rounded-md">Info: {infoMessage}</p>}
          {error && <p className="mt-5 text-base text-red-700 bg-red-100 p-4 rounded-md">Error: {error}</p>}
        </div>

        {columns.length > 0 && (
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-2xl font-semibold text-gray-800">Column Visibility & Info</h3>
                <div className="flex space-x-3">
                    <button 
                        onClick={handleSelectAllColumns}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-150 shadow-sm"
                    >
                        Select All
                    </button>
                    <button 
                        onClick={handleDeselectAllColumns}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-150 shadow-sm"
                    >
                        Deselect All
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-4">
              {columns.map((col) => (
                <div key={col.name} className="flex items-center space-x-3 bg-gray-100 p-3 rounded-lg shadow-sm">
                  <input
                    type="checkbox"
                    id={`col-${col.name}`}
                    checked={visibleColumns[col.name] || false}
                    onChange={() => handleColumnVisibilityChange(col.name)}
                    className="h-5 w-5 text-blue-600 border-gray-400 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor={`col-${col.name}`} className="text-base font-medium text-gray-800 truncate cursor-pointer" title={`${col.name} (${col.type})`}>
                    {col.name} <span className="text-sm text-gray-600">({col.type})</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {tableData.length > 0 && getDisplayedHeaders().length > 0 && (
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <h2 className="text-2xl font-semibold text-gray-800 p-8 pb-4">File Content</h2>
            
            <div ref={topScrollRef} className="overflow-x-auto mx-8 mb-1" style={{ height: '20px' }}>
              <div style={{ height: '1px', width: tableWrapperRef.current?.scrollWidth ? `${tableWrapperRef.current.scrollWidth}px` : '100%' }}></div>
            </div>

            <div ref={tableWrapperRef} className="overflow-x-auto px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    {getDisplayedHeaders().map((header) => (
                      <th
                        key={header.name}
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-100 z-10 whitespace-nowrap"
                      >
                        {header.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTableData.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors duration-100'}>
                      {getDisplayedHeaders().map((header) => (
                        <td 
                          key={`${rowIndex}-${header.name}`} 
                          className="px-6 py-4 text-sm text-gray-800 align-top"
                          style={{
                            maxWidth: '350px', 
                            minWidth: '150px',
                            maxHeight: '120px', 
                            overflow: 'auto',   
                            display: 'table-cell',   
                            whiteSpace: 'pre-wrap', 
                            wordBreak: 'break-word' 
                          }}
                        >
                          {typeof row[header.name] === 'object' && row[header.name] !== null
                            ? JSON.stringify(row[header.name], null, 2)
                            : row[header.name]?.toString() ?? <span className="text-gray-400 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                  onClick={goToPreviousPage} 
                  disabled={currentPage === 1}
                  className="px-5 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
                >
                  Previous
                </button>
                <div className="flex items-center flex-wrap justify-center gap-1">
                    {getPaginationButtons()}
                </div>
                <button 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages}
                  className="px-5 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
            {currentTableData.length === 0 && tableData.length > 0 && <p className="p-8 text-gray-600 text-center">No data to display for the current page.</p>}
          </div>
        )}
        {tableData.length > 0 && getDisplayedHeaders().length === 0 && (
             <div className="bg-white shadow-xl rounded-lg p-8">
                <p className="text-center text-gray-700 text-lg">All columns are hidden. Please select columns to display from the 'Column Visibility & Info' panel above.</p>
            </div>
        )}
      </div>
    </div>
  );
}


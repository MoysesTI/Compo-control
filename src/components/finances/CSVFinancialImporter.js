import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload } from 'lucide-react';

const CSVFinancialImporter = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [importType, setImportType] = useState('orcamentos');
  const [importStatus, setImportStatus] = useState('idle'); // idle, parsing, mapping, importing, success, error
  const [error, setError] = useState(null);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [importResult, setImportResult] = useState(null);

  // Reset state when a new file is selected
  useEffect(() => {
    if (file) {
      setImportStatus('parsing');
      parseFile();
    } else {
      setHeaders([]);
      setFileData([]);
      setMappings({});
      setImportStatus('idle');
      setError(null);
    }
  }, [file]);

  // Parse the CSV file
  const parseFile = () => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        Papa.parse(e.target.result, {
          header: hasHeaders,
          skipEmptyLines: true,
          complete: function(results) {
            if (results.errors.length > 0) {
              setError(`Erro ao processar o arquivo: ${results.errors[0].message}`);
              setImportStatus('error');
              return;
            }
            
            // Set data and headers
            setFileData(results.data);
            
            if (hasHeaders) {
              setHeaders(results.meta.fields);
              
              // Try to automatically map columns
              autoMapColumns(results.meta.fields, results.data[0]);
            } else {
              // Generate column names (Col1, Col2, etc.)
              const generatedHeaders = Object.keys(results.data[0]).map((_, index) => `Coluna ${index + 1}`);
              setHeaders(generatedHeaders);
            }
            
            setImportStatus('mapping');
          },
          error: function(error) {
            setError(`Erro ao ler o arquivo: ${error.message}`);
            setImportStatus('error');
          }
        });
      } catch (error) {
        setError(`Erro ao processar o arquivo: ${error.message}`);
        setImportStatus('error');
      }
    };
    
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
      setImportStatus('error');
    };
    
    reader.readAsText(file);
  };

  // Attempt to automatically map columns based on their names
  const autoMapColumns = (columnNames, sampleData) => {
    const newMappings = {};
    
    columnNames.forEach(column => {
      const columnLower = column.toLowerCase();
      
      // Map basic fields based on common naming patterns
      if (columnLower.includes('cliente') || columnLower.includes('client') || columnLower.includes('empresa')) {
        newMappings.cliente = column;
      } else if (columnLower.includes('serviço') || columnLower.includes('servico') || columnLower.includes('service')) {
        newMappings.servico = column;
      } else if (columnLower.includes('valor') || columnLower.includes('price') || columnLower.includes('total') || columnLower.includes('preço') || columnLower.includes('preco')) {
        newMappings.valor = column;
      } else if (columnLower.includes('data') || columnLower.includes('date') || columnLower.includes('emissão') || columnLower.includes('emissao')) {
        newMappings.data = column;
      } else if (columnLower.includes('descrição') || columnLower.includes('descricao') || columnLower.includes('description')) {
        newMappings.descricao = column;
      } else if (columnLower.includes('status') || columnLower.includes('situação') || columnLower.includes('situacao')) {
        newMappings.status = column;
      } else if (columnLower.includes('número') || columnLower.includes('numero') || columnLower.includes('num') || columnLower.includes('nf')) {
        newMappings.numero = column;
      }
    });
    
    setMappings(newMappings);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file extension
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'txt') {
      setError('Formato de arquivo não suportado. Por favor, selecione um arquivo CSV ou TXT.');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  // Handle import type change
  const handleImportTypeChange = (e) => {
    setImportType(e.target.value);
  };

  // Handle mapping change
  const handleMappingChange = (field, column) => {
    setMappings({
      ...mappings,
      [field]: column
    });
  };

  // Toggle header setting
  const toggleHasHeaders = () => {
    setHasHeaders(!hasHeaders);
    
    // Re-parse the file with new header setting
    if (file) {
      parseFile();
    }
  };

  // Start import process
  const startImport = () => {
    // Validate minimum required mappings
    if (!mappings.cliente || !mappings.valor) {
      setError('No mínimo os campos Cliente e Valor devem ser mapeados.');
      return;
    }
    
    setImportStatus('importing');
    
    // Process data based on mappings
    try {
      // In a real implementation, this would:
      // 1. Convert data to the right format
      // 2. Send to Firebase or your backend
      // 3. Handle success/error responses
      
      // Simulating a successful import
      setTimeout(() => {
        setImportStatus('success');
        setImportResult({
          type: importType,
          count: fileData.length,
          timestamp: new Date().toISOString()
        });
        
        // Notify parent component
        if (onImportComplete) {
          onImportComplete({
            success: true,
            count: fileData.length,
            type: importType
          });
        }
      }, 1500);
    } catch (error) {
      setError(`Erro ao importar dados: ${error.message}`);
      setImportStatus('error');
    }
  };

  // Reset the importer
  const resetImporter = () => {
    setFile(null);
    setFileData([]);
    setHeaders([]);
    setMappings({});
    setImportStatus('idle');
    setError(null);
    setImportResult(null);
  };

  // Render a preview of the data
  const renderPreview = () => {
    if (fileData.length === 0) return null;
    
    // Show only the first 5 rows
    const previewData = fileData.slice(0, 5);
    
    return (
      <div className="mt-4">
        <h3 className="font-medium text-gray-700 mb-2">Prévia dos Dados</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th 
                    key={index}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <td 
                      key={colIndex}
                      className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                    >
                      {hasHeaders ? row[header] : row[colIndex]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {fileData.length > 5 && (
          <p className="text-gray-500 text-xs mt-1">
            Exibindo 5 de {fileData.length} registros.
          </p>
        )}
      </div>
    );
  };

  // Render column mapping section
  const renderMappingSection = () => {
    if (headers.length === 0) return null;
    
    const requiredFields = [
      { key: 'cliente', label: 'Cliente', required: true },
      { key: 'valor', label: 'Valor', required: true },
      { key: 'servico', label: 'Serviço', required: false },
      { key: 'data', label: 'Data', required: false },
      { key: 'descricao', label: 'Descrição', required: false },
      { key: 'status', label: 'Status', required: false }
    ];
    
    // Add numero field only for nota fiscal
    if (importType === 'notasFiscais') {
      requiredFields.push({ key: 'numero', label: 'Número da NF', required: false });
    }
    
    return (
      <div className="mt-6">
        <h3 className="font-medium text-gray-700 mb-2">Mapeamento de Colunas</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredFields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={mappings[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Selecione uma coluna</option>
                  {headers.map((header, index) => (
                    <option key={index} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Importador de Dados Financeiros</h2>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Success message */}
      {importStatus === 'success' && importResult && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
          <p className="font-medium">Importação concluída com sucesso!</p>
          <p className="text-sm mt-1">
            Foram importados {importResult.count} registros para {importResult.type === 'orcamentos' ? 'orçamentos' : 'notas fiscais'}.
          </p>
          <button 
            onClick={resetImporter}
            className="mt-3 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-md text-sm transition"
          >
            Importar novos dados
          </button>
        </div>
      )}
      
      {importStatus !== 'success' && (
        <>
          {/* File selection */}
          <div className="mb-6">
            <div className="flex justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Importação
                </label>
                <select
                  value={importType}
                  onChange={handleImportTypeChange}
                  className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={importStatus !== 'idle' && importStatus !== 'mapping'}
                >
                  <option value="orcamentos">Orçamentos</option>
                  <option value="notasFiscais">Notas Fiscais</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="text-sm text-gray-700 mr-2">Arquivo tem cabeçalho</label>
                <button
                  type="button"
                  onClick={toggleHasHeaders}
                  className={`px-3 py-1 text-sm rounded-md ${hasHeaders 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'}`}
                  disabled={importStatus !== 'idle' && importStatus !== 'mapping'}
                >
                  {hasHeaders ? 'Sim' : 'Não'}
                </button>
              </div>
            </div>
            
            {importStatus === 'idle' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  id="file-upload"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-gray-700 font-medium">Clique para selecionar um arquivo</span>
                  <span className="text-gray-500 text-sm mt-1">CSV ou TXT</span>
                </label>
              </div>
            )}
            
            {file && importStatus !== 'idle' && (
              <div className={`mt-4 p-3 rounded-md ${importStatus === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {importStatus === 'parsing' && (
                      <div className="h-4 w-4 rounded-full border-2 border-t-blue-600 border-b-blue-300 border-l-blue-300 border-r-blue-300 animate-spin"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {importStatus === 'parsing' && 'Processando arquivo...'}
                      {importStatus === 'mapping' && `Arquivo: ${file.name} (${fileData.length} registros)`}
                      {importStatus === 'importing' && 'Importando dados...'}
                      {importStatus === 'error' && 'Erro ao processar arquivo.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {importStatus === 'parsing' && (
            <div className="flex justify-center">
              <div className="h-6 w-6 border-4 border-t-blue-600 border-blue-300 rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Mapping and Preview */}
          {importStatus === 'mapping' && (
            <>
              {renderMappingSection()}
              {renderPreview()}
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={resetImporter}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md mr-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={startImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                  disabled={!mappings.cliente || !mappings.valor}
                >
                  Iniciar Importação
                </button>
              </div>
            </>
          )}
          
          {/* Importing status */}
          {importStatus === 'importing' && (
            <div className="mt-6 text-center">
              <div className="inline-block h-8 w-8 border-4 border-t-blue-600 border-blue-300 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Importando dados para {importType === 'orcamentos' ? 'Orçamentos' : 'Notas Fiscais'}...</p>
              <p className="text-sm text-gray-500 mt-1">Por favor, aguarde enquanto processamos seus dados.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CSVFinancialImporter;
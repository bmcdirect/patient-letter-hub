import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Image, Mail } from "lucide-react";

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  type: string;
}

interface FileUploadSectionProps {
  title: string;
  description: string;
  file: UploadedFile | null;
  setFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>;
  accept: string;
  icon: any;
  required?: boolean;
  isDataFile?: boolean;
  onFileProcessed?: (recipientCount: number) => void;
}

const FileUploadSection = ({ 
  title, 
  description, 
  file, 
  setFile, 
  accept, 
  icon: Icon,
  required = false,
  isDataFile = false,
  onFileProcessed
}: FileUploadSectionProps) => {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const uploadedFile: UploadedFile = {
      file: selectedFile,
      name: selectedFile.name,
      size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      type: selectedFile.type,
    };

    setFile(uploadedFile);

    // Handle CSV parsing for data files
    if (isDataFile && selectedFile.type.includes('csv')) {
      // Use setTimeout to prevent FileReader interference with other uploads
      setTimeout(() => {
        try {
          const reader = new FileReader();
          
          reader.onload = (readerEvent) => {
            try {
              const text = readerEvent.target?.result as string;
              if (!text) return;
              
              const lines = text.split('\n').filter(line => line.trim());
              const recipientCount = Math.max(0, lines.length - 1); // Subtract header row
              
              // Use setTimeout to defer callback and prevent interference
              setTimeout(() => {
                if (onFileProcessed) {
                  onFileProcessed(recipientCount);
                }
                
                toast({
                  title: "Data File Processed",
                  description: `Found ${recipientCount} recipients in the data file`,
                });
              }, 100);
              
            } catch (parseError) {
              toast({
                title: "Parsing Error", 
                description: "Error processing CSV file",
                variant: "destructive"
              });
            }
          };
          
          reader.onerror = () => {
            toast({
              title: "File Error",
              description: "Error reading CSV file",
              variant: "destructive"
            });
          };
          
          reader.readAsText(selectedFile);
          
        } catch (readerSetupError) {
          toast({
            title: "File Error",
            description: "Error setting up file reader",
            variant: "destructive"
          });
        }
      }, 50); // Small delay to prevent immediate interference
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-gray-400 mt-1" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {title} {required && <span className="text-red-500">*</span>}
          </h4>
          <p className="text-xs text-gray-500 mb-3">{description}</p>

          {file ? (
            <div className="flex items-center justify-between bg-gray-50 rounded p-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{file.size}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept={accept}
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Choose file</span>
              </div>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

interface FileUploadComponentProps {
  onRecipientCountChange?: (count: number) => void;
  onFilesChange?: (files: Record<string, UploadedFile | null>) => void;
  showAllFileTypes?: boolean;
  requiredFiles?: string[]; // Array of required file keys like ['dataFile', 'letterFile']
  formControl?: {
    register: any;
    watch: any;
    setValue: any;
  };
}

export default function FileUploadComponent({ 
  onRecipientCountChange,
  onFilesChange,
  showAllFileTypes = true,
  requiredFiles = ['dataFile', 'letterFile'],
  formControl
}: FileUploadComponentProps) {
  // File upload states
  const [dataFile, setDataFile] = useState<UploadedFile | null>(null);
  const [letterFile, setLetterFile] = useState<UploadedFile | null>(null);
  const [letterheadFile, setLetterheadFile] = useState<UploadedFile | null>(null);
  const [logoFile, setLogoFile] = useState<UploadedFile | null>(null);
  const [envelopeFile, setEnvelopeFile] = useState<UploadedFile | null>(null);
  const [signatureFile, setSignatureFile] = useState<UploadedFile | null>(null);
  const [zipFile, setZipFile] = useState<UploadedFile | null>(null);

  // Notify parent component of file changes
  React.useEffect(() => {
    if (onFilesChange) {
      onFilesChange({
        dataFile,
        letterFile,
        letterheadFile,
        logoFile,
        envelopeFile,
        signatureFile,
        zipFile
      });
    }
  }, [dataFile, letterFile, letterheadFile, logoFile, envelopeFile, signatureFile, zipFile]);

  const handleDataFileProcessed = (recipientCount: number) => {
    if (onRecipientCountChange) {
      onRecipientCountChange(recipientCount);
    }
  };

  return (
    <div className="space-y-6">
      {/* Required Files */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Files</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(requiredFiles.includes('dataFile') || showAllFileTypes) && (
            <FileUploadSection
              title="Data File"
              description="CSV or Excel file containing recipient addresses"
              file={dataFile}
              setFile={setDataFile}
              accept=".csv,.xlsx,.xls"
              icon={FileText}
              required={requiredFiles.includes('dataFile')}
              isDataFile
              onFileProcessed={handleDataFileProcessed}
            />
          )}

          {(requiredFiles.includes('letterFile') || showAllFileTypes) && (
            <FileUploadSection
              title="Letter File"
              description="DOC, DOCX, or PDF containing letter content"
              file={letterFile}
              setFile={setLetterFile}
              accept=".doc,.docx,.pdf"
              icon={FileText}
              required={requiredFiles.includes('letterFile')}
            />
          )}
        </div>
      </div>

      {/* Auto-Delete Data File Checkbox */}
      {formControl && (
        <div className="py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="autoDeleteDataFile"
              {...formControl.register("autoDeleteDataFile")}
              defaultChecked={true}
              className="mt-1"
            />
            <div className="flex flex-col">
              <Label 
                htmlFor="autoDeleteDataFile" 
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Automatically Delete Data File Upon Completion of Mailing.
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                This is set to auto delete as the default. It can be changed here and set in account preferences.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Optional Files */}
      {showAllFileTypes && (
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-4">Optional Files</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadSection
              title="Practice Letterhead"
              description="PDF or image file of practice letterhead"
              file={letterheadFile}
              setFile={setLetterheadFile}
              accept=".pdf,.jpg,.jpeg,.png"
              icon={FileText}
            />

            <FileUploadSection
              title="Logo"
              description="Practice logo image file"
              file={logoFile}
              setFile={setLogoFile}
              accept=".jpg,.jpeg,.png,.svg"
              icon={Image}
            />

            <FileUploadSection
              title="Envelope Design"
              description="Custom envelope design file"
              file={envelopeFile}
              setFile={setEnvelopeFile}
              accept=".pdf,.jpg,.jpeg,.png"
              icon={Mail}
            />

            <FileUploadSection
              title="Signature"
              description="Doctor signature image file"
              file={signatureFile}
              setFile={setSignatureFile}
              accept=".jpg,.jpeg,.png"
              icon={Image}
            />
          </div>

          <div className="mt-6">
            <FileUploadSection
              title="ZIP File (All Files Except Data)"
              description="Optional: Upload all files except data file as a single ZIP"
              file={zipFile}
              setFile={setZipFile}
              accept=".zip"
              icon={FileText}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { FileUploadSection };
export type { UploadedFile, FileUploadComponentProps };
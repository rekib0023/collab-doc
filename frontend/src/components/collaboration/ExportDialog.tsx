import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ExportDialogProps {
  documentId: string;
  documentTitle: string;
}

type ExportFormat = 'pdf' | 'docx' | 'txt' | 'html';

const ExportDialog: React.FC<ExportDialogProps> = ({ documentId, documentTitle }) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { success, error } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // In a real app, this would be an API call to the backend
      console.log(`Exporting document ${documentId} in ${format} format`);
      // const response = await exportDocument(documentId, format);
      
      // Mock successful export with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock download by creating a dummy file and triggering download
      // In a real app, you'd use the actual file from the API response
      const dummyContent = `This is a mock export of "${documentTitle}" in ${format.toUpperCase()} format.`;
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      success('Export Complete', `Document exported as ${format.toUpperCase()}`);
      setIsOpen(false);
    } catch (err) {
      error('Export Failed', 'Could not export document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          <span>Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Export "{documentTitle}" in your preferred format
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <RadioGroup
            value={format}
            onValueChange={(value: string) => setFormat(value as ExportFormat)}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf">PDF Document (.pdf)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="docx" id="docx" />
              <Label htmlFor="docx">Microsoft Word (.docx)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="txt" id="txt" />
              <Label htmlFor="txt">Plain Text (.txt)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="html" id="html" />
              <Label htmlFor="html">Web Page (.html)</Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";


interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: (file: any) => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 5,
  maxFileSize = 10485760,
  allowedFileTypes = ["image/*"],
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes,
      },
      autoProceed: false,
    }).use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters: onGetUploadParameters,
    })
  );

  useEffect(() => {
    const handleUploadStart = () => setIsUploading(true);
    const handleComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      setIsUploading(false);
      onComplete?.(result);
      uppy.cancelAll();
      setShowDialog(false);
    };
    const handleError = () => setIsUploading(false);

    uppy.on("upload", handleUploadStart);
    uppy.on("complete", handleComplete);
    uppy.on("error", handleError);
    uppy.on("upload-error", handleError);

    return () => {
      uppy.off("upload", handleUploadStart);
      uppy.off("complete", handleComplete);
      uppy.off("error", handleError);
      uppy.off("upload-error", handleError);
    };
  }, [uppy, onComplete]);

  const handleOpenDialog = () => {
    uppy.cancelAll();
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    if (!isUploading) {
      uppy.cancelAll();
      setShowDialog(false);
    }
  };

  const handleUploadClick = () => {
    const files = uppy.getFiles();
    if (files.length > 0) {
      uppy.upload();
    }
  };

  return (
    <div>
      <Button 
        onClick={handleOpenDialog} 
        className={buttonClassName} 
        type="button"
        data-testid="button-upload-images"
      >
        {children}
      </Button>

      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Carica Immagini</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[50vh]">
            <Dashboard
              uppy={uppy}
              hideUploadButton={true}
              proudlyDisplayPoweredByUppy={false}
              height={400}
              locale={{
                strings: {
                  dropPasteFiles: "Trascina qui le immagini o %{browseFiles}",
                  browseFiles: "sfoglia",
                },
              }}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isUploading}
              data-testid="button-cancel-upload"
            >
              {isUploading ? "Attendere..." : "Chiudi"}
            </Button>
            <Button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading || uppy.getFiles().length === 0}
              data-testid="button-confirm-upload"
            >
              {isUploading ? "Caricamento..." : "Carica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

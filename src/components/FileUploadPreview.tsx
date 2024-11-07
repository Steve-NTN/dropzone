import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

const DocumentDropViewer: React.FC = () => {
  const [files, setFiles] = useState<{ uri: string }[]>([]);
  const [abortControllers, setAbortControllers] = useState<AbortController[]>(
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Abort any ongoing file reads
      abortControllers.forEach((controller) => controller.abort());
      setAbortControllers([]);

      const newAbortControllers: AbortController[] = [];
      const readFiles = acceptedFiles.map((file) => {
        return new Promise<{ uri: string }>((resolve, reject) => {
          const reader = new FileReader();
          const controller = new AbortController();
          const signal = controller.signal;

          // Add this controller to the new list
          newAbortControllers.push(controller);

          // Abort the FileReader if the signal is triggered
          signal.addEventListener("abort", () => reader.abort());

          reader.onload = () => resolve({ uri: reader.result as string });
          reader.onerror = reject;
          reader.onabort = () => reject(new Error("File reading was aborted"));

          reader.readAsDataURL(file);
        });
      });

      // Update the state with the new abort controllers
      setAbortControllers(newAbortControllers);

      Promise.all(readFiles)
        .then(setFiles)
        .catch((error) => {
          if (error.message !== "File reading was aborted") {
            console.error("Error reading files:", error);
          }
        });
    },
    [abortControllers]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc", ".docx"],
      "application/vnd.ms-excel": [".xls", ".xlsx"],
      "application/vnd.ms-powerpoint": [".ppt", ".pptx"],
      "text/plain": [".txt"],
    },
  });

  useEffect(() => {
    // Clean up all abort controllers on unmount
    return () => {
      abortControllers.forEach((controller) => controller.abort());
    };
  }, [abortControllers]);

  console.log("object");

  return (
    <div className="container mx-auto p-4">
      <div
        {...getRootProps()}
        className="border-dashed border-2 border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400"
      >
        <input {...getInputProps()} />
        <p>Drag & drop a file here, or click to select a file</p>
        <p className="text-sm text-gray-500">
          (Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT)
        </p>
      </div>

      <div className="mt-4">
        {files.length > 0 && (
          <DocViewer documents={files} pluginRenderers={DocViewerRenderers} />
        )}
      </div>
    </div>
  );
};

export default DocumentDropViewer;

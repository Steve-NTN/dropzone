import { useEffect, useState } from 'react';

interface UseDocumentLoaderResult {
  data: string | null;
  error: Error | null;
}

const useDocumentLoader = (url: string): UseDocumentLoaderResult => {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadDocument = async () => {
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error("Failed to load document");

        const result = await response.text(); // or use `await response.blob()` if it's binary data
        setData(result);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          setError(error as Error);
          console.error("Error loading document:", error);
        }
      }
    };

    loadDocument();

    return () => {
      controller.abort(); // Abort the fetch request if the component unmounts
    };
  }, [url]);

  return { data, error };
};

export default useDocumentLoader;

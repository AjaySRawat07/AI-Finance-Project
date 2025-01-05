import { useState } from "react";
import { toast } from "sonner";

type Callback<T> = (data: any) => Promise<T>;

type UseFetchReturn<T> = {
  data: T | undefined;
  error: Error | string | null;
  fn: (...args: unknown[]) => Promise<void>;
  loading: boolean;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
};

const useFetch = <T>(cb: Callback<T>): UseFetchReturn<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fn = async (...args: unknown[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;

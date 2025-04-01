import { useEffect, useState, useCallback } from "react";
import { Storage } from "@ionic/storage";

export function useStorage() {
  const [storage, setStorage] = useState<Storage>();
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    const initStorage = async () => {
      const newStorage = new Storage();
      const storage = await newStorage.create();
      setStorage(storage);
      setReady(true);
    };

    initStorage();
  }, []);

  const get = useCallback(
    async (key: string) => {
      if (!ready) return null;
      return storage?.get(key);
    },
    [ready, storage]
  );

  const set = useCallback(
    async <T>(key: string, value: T) => {
      if (!ready) return;
      return storage?.set(key, value);
    },
    [ready, storage]
  );

  const remove = useCallback(
    async (key: string) => {
      if (!ready) return;
      await storage?.remove(key);
    },
    [ready, storage]
  );

  return { get, set, remove, ready };
}

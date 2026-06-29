import { createContext, useContext, useState } from "react";

const Ctx = createContext(null);

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);

  const playOne = (r, list) => {
    const q = list && list.length ? list : [r];
    const i = q.findIndex((x) => x.id === r.id);
    setQueue(q); setIndex(i < 0 ? 0 : i);
  };
  const next = () => setIndex((i) => (queue.length ? (i + 1) % queue.length : -1));
  const prev = () => setIndex((i) => (queue.length ? (i - 1 + queue.length) % queue.length : -1));
  const close = () => setIndex(-1);
  const current = index >= 0 ? queue[index] : null;

  return <Ctx.Provider value={{ current, index, queue, playOne, next, prev, close }}>{children}</Ctx.Provider>;
}

export const usePlayer = () => useContext(Ctx);

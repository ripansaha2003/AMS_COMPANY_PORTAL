import { useRef, useEffect } from "react";
import { useArray } from "@/context/LocationContext";

/**
 * Utility hook to set the location array only once.
 * @param {Array} items - The array to set in the context.
 */
export function useSetLocationArray(items) {
    const { setArray } = useArray();
    const didRun = useRef(false);
    console.log(items)
    useEffect(() => {
        if (didRun.current) return;
        setArray(() => items);
        didRun.current = true;
        // eslint-disable-next-line
    }, [setArray, items]);
}
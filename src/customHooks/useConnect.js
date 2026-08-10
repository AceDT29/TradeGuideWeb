import { useContext } from "react";
import { ConectionContext } from "../context/conectionContext";

export function useConnect() {
    const context = useContext(ConectionContext);
    if (!context) {
        throw new Error("useConnect must be used within a ConnectProvider");
    }
    return context;
}
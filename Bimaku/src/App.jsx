import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./Context/AppContext";
import Router from "./Routes/Router";
import { useEffect } from "react";
import { TAMPILAN, terapkanKeHalaman } from "./Utils/Tampilan";
export default function App() {
  useEffect(() => { terapkanKeHalaman(TAMPILAN); }, []);
  return (<BrowserRouter><AppProvider><Router /></AppProvider></BrowserRouter>);
}

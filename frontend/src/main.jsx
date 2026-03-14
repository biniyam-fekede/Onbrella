import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RentalProvider } from "./context/RentalContext";
import { UserProvider } from "./context/UserContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <UserProvider>
        <RentalProvider>
          <App />
        </RentalProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);

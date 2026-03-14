import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "../src/App";

describe("App", () => {
  it("renders without crashing", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Smoke test: assert that the app shell renders (main content area)
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});

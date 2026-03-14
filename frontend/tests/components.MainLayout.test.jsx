import { render, screen } from "@testing-library/react";
import { MainLayout } from "../src/components/MainLayout";

describe("MainLayout", () => {
  it("renders children correctly", () => {
    render(
      <MainLayout>
        <div>Test Child</div>
      </MainLayout>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });
});

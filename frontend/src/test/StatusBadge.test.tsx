import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge Component", () => {
  it("renders Provisional Automated when isProvisional is true", () => {
    render(<StatusBadge isProvisional={true} evaluationMethod="automated_provisional" />);
    expect(screen.getByText("Provisional Automated")).toBeInTheDocument();
  });

  it("renders Human Verified when evaluationMethod is human_validated", () => {
    render(<StatusBadge isProvisional={false} evaluationMethod="human_validated" />);
    expect(screen.getByText("Human Verified")).toBeInTheDocument();
  });

  it("renders Illustrative Demo Fixture when isMock is true", () => {
    render(<StatusBadge isMock={true} />);
    expect(screen.getByText("Illustrative Demo Fixture")).toBeInTheDocument();
  });
});

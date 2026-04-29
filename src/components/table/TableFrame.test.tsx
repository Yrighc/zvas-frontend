import { render, screen } from "@testing-library/react";

import { TableFrame } from "./TableFrame";

describe("TableFrame", () => {
  it("renders shared frame shell and footer slot", () => {
    render(
      <TableFrame footer={<div>footer</div>}>
        <div>body</div>
      </TableFrame>,
    );

    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByText("footer")).toBeInTheDocument();
  });
});

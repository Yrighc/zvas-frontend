import { render, screen } from "@testing-library/react";

import { TableFrame } from "./TableFrame";

describe("TableFrame", () => {
  it("renders shared frame shell and footer slot", () => {
    const { container } = render(
      <TableFrame footer={<div>footer</div>}>
        <div>body</div>
      </TableFrame>,
    );

    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByText("footer")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("overflow-x-auto");
    expect(container.firstChild).toHaveClass("rounded-[32px]");
  });

  it("omits the footer section when no footer is provided", () => {
    const { container } = render(
      <TableFrame>
        <div>body</div>
      </TableFrame>,
    );

    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.queryByText("footer")).not.toBeInTheDocument();
    expect(container.querySelector(".border-t")).toBeNull();
  });
});

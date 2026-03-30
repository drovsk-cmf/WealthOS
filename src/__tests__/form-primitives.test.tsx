import { render, screen, fireEvent } from "@testing-library/react";
import { FormError, FormInput, FormSelect, parseMonetaryAmount } from "@/components/ui/form-primitives";

describe("FormError", () => {
  it("renders nothing when message is null", () => {
    const { container } = render(<FormError message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders alert with message", () => {
    render(<FormError message="Informe um valor positivo." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Informe um valor positivo.");
    expect(alert.className).toContain("destructive");
  });
});

describe("FormInput", () => {
  it("renders label and input", () => {
    const onChange = jest.fn();
    render(<FormInput id="test-name" label="Nome" value="Conta" onChange={onChange} />);
    expect(screen.getByLabelText("Nome")).toHaveValue("Conta");
  });

  it("calls onChange with new value", () => {
    const onChange = jest.fn();
    render(<FormInput id="test" label="Valor" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "123" } });
    expect(onChange).toHaveBeenCalledWith("123");
  });

  it("supports disabled state", () => {
    render(<FormInput id="d" label="Disabled" value="" onChange={jest.fn()} disabled />);
    expect(screen.getByLabelText("Disabled")).toBeDisabled();
  });
});

describe("FormSelect", () => {
  it("renders label and options", () => {
    const onChange = jest.fn();
    render(
      <FormSelect id="sel" label="Tipo" value="expense" onChange={onChange}>
        <option value="income">Receita</option>
        <option value="expense">Despesa</option>
      </FormSelect>
    );
    expect(screen.getByLabelText("Tipo")).toHaveValue("expense");
  });

  it("calls onChange on selection", () => {
    const onChange = jest.fn();
    render(
      <FormSelect id="sel" label="Tipo" value="expense" onChange={onChange}>
        <option value="income">Receita</option>
        <option value="expense">Despesa</option>
      </FormSelect>
    );
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "income" } });
    expect(onChange).toHaveBeenCalledWith("income");
  });
});

describe("parseMonetaryAmount", () => {
  it("parses BR format 1.234,56", () => {
    expect(parseMonetaryAmount("1.234,56")).toBe(1234.56);
  });

  it("parses simple comma decimal", () => {
    expect(parseMonetaryAmount("99,90")).toBe(99.9);
  });

  it("parses integer", () => {
    expect(parseMonetaryAmount("500")).toBe(500);
  });

  it("returns NaN for empty string", () => {
    expect(parseMonetaryAmount("")).toBeNaN();
  });

  it("returns NaN for non-numeric", () => {
    expect(parseMonetaryAmount("abc")).toBeNaN();
  });

  it("handles large values", () => {
    expect(parseMonetaryAmount("1.000.000,00")).toBe(1000000);
  });
});
